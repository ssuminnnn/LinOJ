const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");
const { requireAdmin } = require("../middleware/auth");

const router = express.Router();

// 문의 등록 (로그인 사용자)
router.post("/", auth, async (req, res) => {
  const { title, content } = req.body;

  if (!title?.trim() || !content?.trim()) {
    return res.status(400).json({ error: "제목과 내용을 모두 입력하세요." });
  }

  const [users] = await pool.execute("SELECT id FROM users WHERE username = ?", [req.user.username]);
  if (users.length === 0) {
    return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
  }

  await pool.execute("INSERT INTO inquiries (user_id, title, content) VALUES (?, ?, ?)", [
    users[0].id,
    title.trim(),
    content.trim(),
  ]);

  res.json({ ok: true });
});

// 문의 목록 조회 (운영자 전용)
router.get("/", auth, requireAdmin, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT i.id, i.title, i.content, i.created_at, u.nickname AS author
     FROM inquiries i
     JOIN users u ON u.id = i.user_id
     ORDER BY i.created_at DESC`
  );

  res.json(rows);
});

module.exports = router;
