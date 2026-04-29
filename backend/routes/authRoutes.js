const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();
const SALT_ROUNDS = 10;

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
  const role = userCountRows[0].count === 0 ? "super_admin" : "user";

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
  const valid = await bcrypt.compare(password, user.password);
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

module.exports = router;
