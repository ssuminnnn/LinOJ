const express = require("express");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const pool = require("../db");
const auth = require("../middleware/auth");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// ── 업로드 디렉토리 자동 생성 ─────────────────────────────────────────────
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ── 이미지 업로드 설정 ────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.random().toString(36).slice(2);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("이미지 파일만 업로드할 수 있습니다."));
    }
    cb(null, true);
  },
});

// ── 알림 생성 헬퍼 ────────────────────────────────────────────────────────
async function notify(userId, type, title, message, relatedId = null) {
  try {
    await pool.execute(
      "INSERT INTO notifications (user_id, type, title, message, related_id) VALUES (?, ?, ?, ?, ?)",
      [userId, type, title, message || "", relatedId]
    );
  } catch (e) {
    console.error("알림 생성 오류:", e.message);
  }
}

// ── 문의 등록 (로그인 사용자) ─────────────────────────────────────────────
router.post("/", auth, (req, res, next) => {
  upload.array("images", 5)(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message || "파일 업로드 오류" });
    next();
  });
}, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ error: "제목과 내용을 모두 입력하세요." });
    }

    const [users] = await pool.execute(
      "SELECT id, nickname FROM users WHERE username = ?",
      [req.user.username]
    );
    if (users.length === 0) return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    const { id: userId, nickname } = users[0];

    const imageUrls = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];

    const [result] = await pool.execute(
      "INSERT INTO inquiries (user_id, title, content, images) VALUES (?, ?, ?, ?)",
      [userId, title.trim(), content.trim(), JSON.stringify(imageUrls)]
    );
    const inquiryId = result.insertId;

    // 모든 운영자에게 알림
    const [admins] = await pool.execute(
      "SELECT id FROM users WHERE role IN ('admin', 'super_admin')"
    );
    for (const admin of admins) {
      await notify(admin.id, "new_inquiry", `새 문의: ${title.trim()}`, `${nickname}님이 문의를 남겼습니다.`, inquiryId);
    }

    res.json({ ok: true, id: inquiryId });
  } catch (e) {
    console.error("문의 등록 오류:", e);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// ── 전체 문의 목록 (운영자 전용) ──────────────────────────────────────────
router.get("/", auth, requireAdmin, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT i.id, i.title, i.content, i.images, i.created_at,
             u.nickname AS author,
             COUNT(ic.id) AS comment_count
      FROM inquiries i
      JOIN users u ON u.id = i.user_id
      LEFT JOIN inquiry_comments ic ON ic.inquiry_id = i.id
      GROUP BY i.id
      ORDER BY i.created_at DESC
    `);

    const result = rows.map((r) => ({
      ...r,
      images: Array.isArray(r.images) ? r.images : [],
      comment_count: Number(r.comment_count),
    }));

    res.json(result);
  } catch (e) {
    console.error("문의 조회 오류:", e.message);
    res.status(500).json({ error: `서버 오류: ${e.message}` });
  }
});

// ── 내 문의 목록 (일반 사용자) ────────────────────────────────────────────
router.get("/my", auth, async (req, res) => {
  try {
    const [users] = await pool.execute(
      "SELECT id FROM users WHERE username = ?",
      [req.user.username]
    );
    if (users.length === 0) return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    const userId = users[0].id;

    const [rows] = await pool.execute(`
      SELECT i.id, i.title, i.created_at,
             COUNT(ic.id) AS comment_count
      FROM inquiries i
      LEFT JOIN inquiry_comments ic ON ic.inquiry_id = i.id
      WHERE i.user_id = ?
      GROUP BY i.id
      ORDER BY i.created_at DESC
    `, [userId]);

    res.json(rows.map((r) => ({ ...r, comment_count: Number(r.comment_count) })));
  } catch (e) {
    console.error("내 문의 조회 오류:", e.message);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// ── 문의 상세 (단건 + 댓글 목록) ─────────────────────────────────────────
router.get("/:id", auth, async (req, res) => {
  try {
    const inquiryId = Number(req.params.id);

    const [users] = await pool.execute(
      "SELECT id, role FROM users WHERE username = ?",
      [req.user.username]
    );
    if (users.length === 0) return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    const { id: userId, role } = users[0];
    const isAdmin = ["admin", "super_admin"].includes(role);

    const [inquiries] = await pool.execute(
      `SELECT i.*, u.nickname AS author
       FROM inquiries i JOIN users u ON u.id = i.user_id
       WHERE i.id = ?`,
      [inquiryId]
    );
    if (inquiries.length === 0) return res.status(404).json({ error: "문의를 찾을 수 없습니다." });
    const inquiry = inquiries[0];

    if (!isAdmin && inquiry.user_id !== userId) {
      return res.status(403).json({ error: "권한이 없습니다." });
    }

    const [comments] = await pool.execute(`
      SELECT ic.id, ic.content, ic.created_at, u.nickname, u.role
      FROM inquiry_comments ic
      JOIN users u ON u.id = ic.user_id
      WHERE ic.inquiry_id = ?
      ORDER BY ic.created_at ASC
    `, [inquiryId]);

    // 문의를 열면 이 문의 관련 알림 자동 읽음 처리
    await pool.execute(
      "UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND related_id = ?",
      [userId, inquiryId]
    );

    res.json({
      ...inquiry,
      images: Array.isArray(inquiry.images) ? inquiry.images : [],
      comments,
    });
  } catch (e) {
    console.error("문의 상세 조회 오류:", e.message);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// ── 댓글 등록 ─────────────────────────────────────────────────────────────
router.post("/:id/comments", auth, async (req, res) => {
  try {
    const inquiryId = Number(req.params.id);
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: "내용을 입력하세요." });

    const [users] = await pool.execute(
      "SELECT id, nickname, role FROM users WHERE username = ?",
      [req.user.username]
    );
    if (users.length === 0) return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
    const { id: userId, nickname, role } = users[0];
    const isAdmin = ["admin", "super_admin"].includes(role);

    const [inquiries] = await pool.execute(
      "SELECT user_id, title FROM inquiries WHERE id = ?",
      [inquiryId]
    );
    if (inquiries.length === 0) return res.status(404).json({ error: "문의를 찾을 수 없습니다." });
    const { user_id: ownerId, title } = inquiries[0];

    // 소유자 또는 관리자만 댓글 가능
    if (!isAdmin && userId !== ownerId) {
      return res.status(403).json({ error: "권한이 없습니다." });
    }

    await pool.execute(
      "INSERT INTO inquiry_comments (inquiry_id, user_id, content) VALUES (?, ?, ?)",
      [inquiryId, userId, content.trim()]
    );

    // 알림 발송
    if (isAdmin) {
      // 운영자 답변 → 문의 작성자에게 알림
      await notify(ownerId, "new_reply", `답변 도착: ${title}`, `운영자가 답변을 남겼습니다.`, inquiryId);
    } else {
      // 사용자 추가 댓글 → 모든 운영자에게 알림
      const [admins] = await pool.execute(
        "SELECT id FROM users WHERE role IN ('admin', 'super_admin')"
      );
      for (const admin of admins) {
        await notify(admin.id, "new_reply", `추가 댓글: ${title}`, `${nickname}님이 댓글을 남겼습니다.`, inquiryId);
      }
    }

    res.json({ ok: true });
  } catch (e) {
    console.error("댓글 등록 오류:", e.message);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

module.exports = router;
