const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

const PROBLEM_POINTS = {
  // 쉬움 (001-013) 1점
  1:1, 2:1, 3:1, 4:1, 5:1, 6:1, 7:1, 8:1, 9:1, 10:1, 11:1, 12:1, 13:1,
  // 보통 (101+) 2점
  101:2, 102:2, 103:2,
  // 어려움 (201+) 3점
  201:3, 202:3,
  // 매우 어려움 (301+) 5점
  301:5, 302:5,
};

// 내 풀이 목록 조회
router.get("/my", auth, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT up.problem_id, up.is_correct
     FROM user_problems up
     JOIN users u ON u.id = up.user_id
     WHERE u.username = ?`,
    [req.user.username]
  );

  const solvedProblems = {};
  rows.forEach((r) => {
    solvedProblems[r.problem_id] = r.is_correct === 1;
  });

  res.json(solvedProblems);
});

// 풀이 저장
router.post("/solve", auth, async (req, res) => {
  const { problemId, isCorrect } = req.body;

  const [users] = await pool.execute("SELECT id FROM users WHERE username = ?", [req.user.username]);
  if (users.length === 0) return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });

  const userId = users[0].id;

  await pool.execute(
    `INSERT INTO user_problems (user_id, problem_id, is_correct)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE is_correct = VALUES(is_correct), updated_at = CURRENT_TIMESTAMP`,
    [userId, problemId, isCorrect]
  );

  res.json({ ok: true });
});

// 랭킹 조회
router.get("/ranking", async (req, res) => {
  const [users] = await pool.execute("SELECT id, nickname FROM users");

  const [solved] = await pool.execute(
    "SELECT user_id, problem_id FROM user_problems WHERE is_correct = true"
  );

  const pointsMap = {};
  const countMap = {};

  solved.forEach(({ user_id, problem_id }) => {
    const pts = PROBLEM_POINTS[problem_id] || 0;
    pointsMap[user_id] = (pointsMap[user_id] || 0) + pts;
    countMap[user_id] = (countMap[user_id] || 0) + 1;
  });

  const ranking = users
    .map((u) => ({
      username: u.nickname,
      totalPoints: pointsMap[u.id] || 0,
      solvedCount: countMap[u.id] || 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || b.solvedCount - a.solvedCount)
    .map((u, i) => ({ rank: i + 1, ...u }));

  res.json(ranking);
});

module.exports = router;
