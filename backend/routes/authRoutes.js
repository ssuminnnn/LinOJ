const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const pool = require("../db");

const router = express.Router();
const SALT_ROUNDS = 10;
const googleClient = new OAuth2Client();

// 닉네임 중복 확인
router.post("/check-nickname", async (req, res) => {
  const { nickname } = req.body;
  if (!nickname) return res.status(400).json({ error: "닉네임을 입력하세요." });

  const [existing] = await pool.execute("SELECT id FROM users WHERE nickname = ?", [nickname]);
  if (existing.length > 0) {
    return res.status(409).json({ error: "이미 사용 중인 닉네임입니다." });
  }
  res.json({ ok: true });
});

// 회원가입
router.post("/register", async (req, res) => {
  const { username, nickname, password } = req.body;

  if (!username || !nickname || !password) {
    return res.status(400).json({ error: "모든 항목을 입력하세요." });
  }

  if (!/^[a-zA-Z0-9]+$/.test(username)) {
    return res.status(400).json({ error: "아이디는 영문과 숫자만 사용할 수 있습니다." });
  }

  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ error: "비밀번호는 영문, 숫자, 특수문자를 포함한 8자 이상이어야 합니다." });
  }

  const [existingUser] = await pool.execute("SELECT id FROM users WHERE username = ?", [username]);
  if (existingUser.length > 0) {
    return res.status(409).json({ error: "이미 사용 중인 아이디입니다." });
  }

  const [existingNick] = await pool.execute("SELECT id FROM users WHERE nickname = ?", [nickname]);
  if (existingNick.length > 0) {
    return res.status(409).json({ error: "이미 사용 중인 닉네임입니다." });
  }

  const [userCountRows] = await pool.execute("SELECT COUNT(*) AS count FROM users");
  const role = parseInt(userCountRows[0].count, 10) === 0 ? "super_admin" : "user";

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  await pool.execute(
    "INSERT INTO users (username, nickname, password, role) VALUES (?, ?, ?, ?)",
    [username, nickname, hashed, role]
  );

  const token = jwt.sign({ username, nickname, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, username, nickname, role });
});

// 로그인
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "아이디와 비밀번호를 입력하세요." });
  }

  const [rows] = await pool.execute("SELECT * FROM users WHERE username = ?", [username]);
  if (rows.length === 0) {
    return res.status(401).json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." });
  }

  const user = rows[0];
  // 구글 계정은 비밀번호가 없으므로 아이디/비밀번호 로그인 불가
  const valid = user.password ? await bcrypt.compare(password, user.password) : false;
  if (!valid) {
    return res.status(401).json({ error: "아이디 또는 비밀번호가 올바르지 않습니다." });
  }

  const token = jwt.sign(
    { username, nickname: user.nickname, role: user.role || "user" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  res.json({ token, username, nickname: user.nickname, role: user.role || "user" });
});

// 구글 로그인: 구글이 발급한 ID 토큰을 검증
router.post("/google", async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: "구글 인증 정보가 없습니다." });
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(500).json({ error: "구글 로그인이 설정되지 않았습니다." });
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ error: "구글 인증에 실패했습니다." });
  }

  const googleId = payload.sub;
  const [rows] = await pool.execute("SELECT * FROM users WHERE google_id = ?", [googleId]);

  // 이미 가입한 구글 계정이면 바로 로그인
  if (rows.length > 0) {
    const user = rows[0];
    const role = user.role || "user";
    const token = jwt.sign(
      { username: user.username, nickname: user.nickname, role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    return res.json({ token, username: user.username, nickname: user.nickname, role });
  }

  // 처음이면 닉네임을 입력받아야 하므로 가입용 임시 토큰만 발급
  const signupToken = jwt.sign(
    { purpose: "google-signup", googleId, email: payload.email || null },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
  res.json({ needNickname: true, signupToken });
});

// 구글 첫 로그인: 닉네임을 정해 가입 완료 (항상 일반 사용자로 생성)
router.post("/google/complete", async (req, res) => {
  const { signupToken } = req.body;
  const nickname = (req.body.nickname || "").trim();

  let signup;
  try {
    signup = jwt.verify(signupToken || "", process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: "가입 시간이 만료되었습니다. 다시 로그인해 주세요." });
  }
  if (signup.purpose !== "google-signup") {
    return res.status(401).json({ error: "유효하지 않은 요청입니다." });
  }

  if (nickname.length < 2 || nickname.length > 20) {
    return res.status(400).json({ error: "닉네임은 2~20자로 입력하세요." });
  }

  const [existingNick] = await pool.execute("SELECT id FROM users WHERE nickname = ?", [nickname]);
  if (existingNick.length > 0) {
    return res.status(409).json({ error: "이미 사용 중인 닉네임입니다." });
  }

  // 이미 같은 구글 계정으로 가입돼 있으면 중복 생성 방지
  const [existingGoogle] = await pool.execute("SELECT id FROM users WHERE google_id = ?", [signup.googleId]);
  if (existingGoogle.length > 0) {
    return res.status(409).json({ error: "이미 가입된 구글 계정입니다. 다시 로그인해 주세요." });
  }

  const username = `google_${signup.googleId}`;
  try {
    await pool.execute(
      "INSERT INTO users (username, nickname, password, role, google_id, email) VALUES (?, ?, NULL, 'user', ?, ?)",
      [username, nickname, signup.googleId, signup.email]
    );
  } catch (e) {
    if (e.code === "23505") {
      return res.status(409).json({ error: "이미 사용 중인 닉네임입니다." });
    }
    throw e;
  }

  const token = jwt.sign({ username, nickname, role: "user" }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.json({ token, username, nickname, role: "user" });
});

module.exports = router;
