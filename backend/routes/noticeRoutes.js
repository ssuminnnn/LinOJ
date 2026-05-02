const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// ── 공지 목록 (로그인 사용자 전체) ────────────────────────────────────────
router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT n.id, n.title, n.content, n.created_at, u.nickname AS author
      FROM notices n
      JOIN users u ON u.id = n.user_id
      ORDER BY n.created_at DESC
    `);
    res.json(rows);
  } catch (e) {
    console.error("공지 조회 오류:", e.message);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// ── 공지 작성 (운영자 전용) ───────────────────────────────────────────────
router.post("/", auth, requireAdmin, async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ error: "제목과 내용을 입력하세요." });
    }

    const [users] = await pool.execute(
      "SELECT id FROM users WHERE username = ?",
      [req.user.username]
    );
    if (users.length === 0) return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });

    const [result] = await pool.execute(
      "INSERT INTO notices (user_id, title, content) VALUES (?, ?, ?)",
      [users[0].id, title.trim(), content.trim()]
    );
    const noticeId = result.insertId;

    // 모든 사용자에게 알림 발송
    const [allUsers] = await pool.execute("SELECT id FROM users");
    for (const user of allUsers) {
      await pool.execute(
        "INSERT INTO notifications (user_id, type, title, message, related_id) VALUES (?, 'announcement', ?, ?, ?)",
        [user.id, `[공지] ${title.trim()}`, "새 공지사항이 등록되었습니다. 공지게시판에서 확인하세요.", noticeId]
      );
    }

    res.json({ ok: true, id: noticeId });
  } catch (e) {
    console.error("공지 작성 오류:", e.message);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// ── 공지 삭제 (운영자 전용) ───────────────────────────────────────────────
router.delete("/:id", auth, requireAdmin, async (req, res) => {
  try {
    await pool.execute("DELETE FROM notices WHERE id = ?", [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

module.exports = router;
