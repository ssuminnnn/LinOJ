const express = require("express");
const pool = require("../db");
const auth = require("../middleware/auth");

const router = express.Router();

// 새 점수 체계: 쉬움 2점 / 보통 4점 / 어려움 6점 / 매우 어려움 10점
const PROBLEM_POINTS = {
  1:2, 2:2, 3:2, 4:2, 5:2, 6:2, 7:2, 8:2, 9:2, 10:2, 11:2, 12:2, 13:2,
  14:2, 15:2, 16:2, 17:2, 18:2, 19:2, 20:2,
  101:4, 102:4, 103:4,
  104:4, 105:4, 106:4, 107:4, 108:4, 109:4, 110:4,
  111:4, 112:4, 113:4, 114:4, 115:4, 116:4, 117:4, 118:4, 119:4, 120:4,
  201:6, 202:6, 203:6, 204:6, 205:6, 206:6, 207:6, 208:6, 209:6, 210:6,
  211:6, 212:6, 213:6, 214:6, 215:6, 216:6, 217:6, 218:6, 219:6, 220:6,
  221:6, 222:6, 223:6, 224:6, 225:6, 226:6, 227:6, 228:6, 229:6, 230:6,
  301:10, 302:10, 303:10, 304:10, 305:10, 306:10, 307:10, 308:10, 309:10, 310:10,
};

// ── 내 풀이 목록 조회 ──────────────────────────────────────────────────────
router.get("/my", auth, async (req, res) => {
  const [rows] = await pool.execute(
    `SELECT up.problem_id, up.is_correct, up.hint_used, up.answer_viewed, up.points_earned, up.clean_solve
     FROM user_problems up
     JOIN users u ON u.id = up.user_id
     WHERE u.username = ?`,
    [req.user.username]
  );

  const solvedProblems = {};
  rows.forEach((r) => {
    const isCorrect    = r.is_correct === 1;
    const hintUsed     = r.hint_used === 1;
    const answerViewed = r.answer_viewed === 1;

    // 이미 맞혔는데 점수가 0이면 소급 계산 (점수 체계 도입 전 데이터 보정)
    let pointsEarned = r.points_earned;
    if (isCorrect && pointsEarned === 0 && !answerViewed) {
      const base = PROBLEM_POINTS[r.problem_id] || 0;
      pointsEarned = hintUsed ? Math.floor(base / 2) : base;
    }

    solvedProblems[r.problem_id] = {
      isCorrect,
      hintUsed,
      answerViewed,
      pointsEarned,
      cleanSolve: r.clean_solve === 1,
    };
  });

  res.json(solvedProblems);
});

// ── 풀이 저장 ─────────────────────────────────────────────────────────────
router.post("/solve", auth, async (req, res) => {
  const { problemId, isCorrect, hintUsed = false, answerViewed = false } = req.body;

  const [users] = await pool.execute("SELECT id FROM users WHERE username = ?", [req.user.username]);
  if (users.length === 0) return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
  const userId = users[0].id;

  const [existing] = await pool.execute(
    "SELECT is_correct, hint_used, answer_viewed, points_earned FROM user_problems WHERE user_id = ? AND problem_id = ?",
    [userId, problemId]
  );

  const basePoints = PROBLEM_POINTS[problemId] || 0;

  if (existing.length === 0) {
    let pointsEarned = 0;
    if (isCorrect && !answerViewed) {
      pointsEarned = hintUsed ? Math.floor(basePoints / 2) : basePoints;
    }
    const finalIsCorrect = answerViewed ? false : isCorrect;
    const cleanSolve = isCorrect && !answerViewed && !hintUsed;
    await pool.execute(
      `INSERT INTO user_problems (user_id, problem_id, is_correct, hint_used, answer_viewed, points_earned, clean_solve)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, problemId, finalIsCorrect, hintUsed, answerViewed, pointsEarned, cleanSolve]
    );
    return res.json({ ok: true, pointsEarned, cleanSolve });
  }

  const prev           = existing[0];
  const wasAnswerViewed = prev.answer_viewed === 1;
  const wasCorrect      = prev.is_correct === 1;

  // 정답 보기를 했던 문제 → 이미 맞혔으면 correct 유지, 아니면 추가 점수 없음
  if (wasAnswerViewed) {
    // 이미 맞힌 상태면 correct 그대로 (is_correct는 DB에 TRUE로 저장됨)
    return res.json({ ok: true, pointsEarned: 0, wasCorrect });
  }

  // 이번에 정답 보기 클릭
  if (answerViewed) {
    // 이미 맞힌 문제면 is_correct 유지, 아직 못 풀었으면 FALSE
    await pool.execute(
      `UPDATE user_problems
       SET answer_viewed=TRUE,
           is_correct = is_correct,
           points_earned = points_earned,
           updated_at=CURRENT_TIMESTAMP
       WHERE user_id=? AND problem_id=?`,
      [userId, problemId]
    );
    return res.json({ ok: true, pointsEarned: 0, wasCorrect });
  }

  // 이미 맞힌 문제 → 오답으로 내려가지 않음
  if (wasCorrect) {
    // 점수가 0점인 기존 기록은 소급 적용 (예: 점수 체계 도입 전 데이터)
    if (prev.points_earned === 0) {
      const prevHintUsed = prev.hint_used === 1;
      const retroPoints = prevHintUsed ? Math.floor(basePoints / 2) : basePoints;
      await pool.execute(
        "UPDATE user_problems SET points_earned=? WHERE user_id=? AND problem_id=?",
        [retroPoints, userId, problemId]
      );
      return res.json({ ok: true, pointsEarned: retroPoints });
    }
    if (hintUsed && prev.hint_used === 0) {
      await pool.execute("UPDATE user_problems SET hint_used=TRUE WHERE user_id=? AND problem_id=?", [userId, problemId]);
    }
    return res.json({ ok: true, pointsEarned: 0 });
  }

  // 처음으로 맞힌 경우
  if (isCorrect) {
    const newHintUsed  = hintUsed || prev.hint_used === 1;
    const pointsEarned = newHintUsed ? Math.floor(basePoints / 2) : basePoints;
    // clean_solve: 힌트 없이, 정답 보기 없이 처음 맞힌 경우만 TRUE
    const cleanSolve = !newHintUsed; // answerViewed=false & wasAnswerViewed=false 보장됨
    await pool.execute(
      `UPDATE user_problems SET is_correct=TRUE, hint_used=?, points_earned=?, clean_solve=?, updated_at=CURRENT_TIMESTAMP
       WHERE user_id=? AND problem_id=?`,
      [newHintUsed, pointsEarned, cleanSolve, userId, problemId]
    );
    return res.json({ ok: true, pointsEarned, cleanSolve });
  }

  // 틀린 경우: 힌트 플래그만 업데이트
  if (hintUsed && prev.hint_used === 0) {
    await pool.execute("UPDATE user_problems SET hint_used=TRUE WHERE user_id=? AND problem_id=?", [userId, problemId]);
  }
  res.json({ ok: true, pointsEarned: 0 });
});

// ── 힌트 사용 기록 ────────────────────────────────────────────────────────
// 기존 기록이 있으면 hint_used=TRUE, 없으면 아무것도 안 함 (목록에 미시도 유지)
// hint_used는 첫 명령어 제출 시 /solve POST에 포함되어 함께 저장됨
router.post("/hint", auth, async (req, res) => {
  const { problemId } = req.body;
  const [users] = await pool.execute("SELECT id FROM users WHERE username = ?", [req.user.username]);
  if (users.length === 0) return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
  await pool.execute(
    "UPDATE user_problems SET hint_used=TRUE WHERE user_id=? AND problem_id=?",
    [users[0].id, problemId]
  );
  res.json({ ok: true });
});

// ── 정답 보기 기록 ────────────────────────────────────────────────────────
router.post("/answer-viewed", auth, async (req, res) => {
  const { problemId } = req.body;
  const [users] = await pool.execute("SELECT id FROM users WHERE username = ?", [req.user.username]);
  if (users.length === 0) return res.status(404).json({ error: "사용자를 찾을 수 없습니다." });
  // 이미 맞힌 문제는 is_correct를 TRUE로 유지, 점수도 유지
  // 아직 못 푼 문제만 is_correct=FALSE, points_earned=0
  await pool.execute(
    `INSERT INTO user_problems (user_id, problem_id, is_correct, answer_viewed, points_earned)
     VALUES (?, ?, FALSE, TRUE, 0)
     ON DUPLICATE KEY UPDATE
       answer_viewed = TRUE,
       is_correct    = is_correct,
       points_earned = points_earned`,
    [users[0].id, problemId]
  );
  res.json({ ok: true });
});

// ── 랭킹 조회 ─────────────────────────────────────────────────────────────
router.get("/ranking", async (req, res) => {
  const [users] = await pool.execute("SELECT id, nickname FROM users");
  const [solved] = await pool.execute(
    "SELECT user_id, points_earned FROM user_problems WHERE is_correct=TRUE"
  );

  const pointsMap = {};
  const countMap  = {};
  solved.forEach(({ user_id, points_earned }) => {
    pointsMap[user_id] = (pointsMap[user_id] || 0) + (points_earned || 0);
    countMap[user_id]  = (countMap[user_id]  || 0) + 1;
  });

  const ranking = users
    .map((u) => ({
      username:    u.nickname,
      totalPoints: pointsMap[u.id] || 0,
      solvedCount: countMap[u.id]  || 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || b.solvedCount - a.solvedCount)
    .map((u, i) => ({ rank: i + 1, ...u }));

  res.json(ranking);
});

module.exports = router;
