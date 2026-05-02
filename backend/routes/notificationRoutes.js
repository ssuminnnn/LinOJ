const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// ── 알림 목록 조회 ─────────────────────────────────────────────────────────
router.get("/", auth, async (req, res) => {
  try {
    const [users] = await pool.execute(
      "SELECT id FROM users WHERE username = ?",
      [req.user.username]
    );
    if (users.length === 0) return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });

    const [notifications] = await pool.execute(
      `SELECT id, type, title, message, is_read, related_id, created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [users[0].id]
    );

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    res.json({ notifications, unreadCount });
  } catch (e) {
    console.error("알림 조회 오류:", e.message);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// ── 특정 알림 읽음 처리 ────────────────────────────────────────────────────
router.post("/read/:id", auth, async (req, res) => {
  try {
    const [users] = await pool.execute(
      "SELECT id FROM users WHERE username = ?",
      [req.user.username]
    );
    if (users.length === 0) return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });

    await pool.execute(
      "UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?",
      [req.params.id, users[0].id]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// ── 전체 읽음 처리 ─────────────────────────────────────────────────────────
router.post("/read-all", auth, async (req, res) => {
  try {
    const [users] = await pool.execute(
      "SELECT id FROM users WHERE username = ?",
      [req.user.username]
    );
    if (users.length === 0) return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });

    await pool.execute(
      "UPDATE notifications SET is_read = TRUE WHERE user_id = ?",
      [users[0].id]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

// ── 알림 보내기 (운영자 전용) ──────────────────────────────────────────────
// body: { title, message, targetNickname? }
// targetNickname 없으면 전체 공지
router.post("/send", auth, requireAdmin, async (req, res) => {
  try {
    const { title, message, targetNickname } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: "제목을 입력하세요." });

    if (targetNickname?.trim()) {
      // 특정 사용자에게 보내기
      const [users] = await pool.execute(
        "SELECT id FROM users WHERE nickname = ? OR username = ?",
        [targetNickname.trim(), targetNickname.trim()]
      );
      if (users.length === 0) return res.status(404).json({ error: "해당 사용자를 찾을 수 없습니다." });

      await pool.execute(
        "INSERT INTO notifications (user_id, type, title, message) VALUES (?, 'announcement', ?, ?)",
        [users[0].id, title.trim(), message?.trim() || ""]
      );
      res.json({ ok: true, sent: 1 });
    } else {
      // 전체 공지
      const [users] = await pool.execute("SELECT id FROM users");
      for (const user of users) {
        await pool.execute(
          "INSERT INTO notifications (user_id, type, title, message) VALUES (?, 'announcement', ?, ?)",
          [user.id, title.trim(), message?.trim() || ""]
        );
      }
      res.json({ ok: true, sent: users.length });
    }
  } catch (e) {
    console.error("알림 발송 오류:", e.message);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
});

module.exports = router;
