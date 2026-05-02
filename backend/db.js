const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

async function tryAlter(sql) {
  try { await pool.execute(sql); } catch (e) {
    if (e.code !== "ER_DUP_FIELDNAME" && e.code !== "ER_DUP_KEYNAME") throw e;
  }
}

async function initDB() {
  // ── users 테이블 ─────────────────────────────────────────────────────────
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      nickname VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('user', 'admin', 'super_admin') NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await tryAlter("ALTER TABLE users ADD COLUMN role ENUM('user','admin','super_admin') NOT NULL DEFAULT 'user'");

  // ── user_problems 테이블 ──────────────────────────────────────────────────
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS user_problems (
      id           INT AUTO_INCREMENT PRIMARY KEY,
      user_id      INT NOT NULL,
      problem_id   INT NOT NULL,
      is_correct   BOOLEAN NOT NULL DEFAULT FALSE,
      hint_used    BOOLEAN NOT NULL DEFAULT FALSE,
      answer_viewed BOOLEAN NOT NULL DEFAULT FALSE,
      points_earned INT NOT NULL DEFAULT 0,
      updated_at   DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_problem (user_id, problem_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  // 기존 테이블 마이그레이션
  await tryAlter("ALTER TABLE user_problems ADD COLUMN hint_used BOOLEAN NOT NULL DEFAULT FALSE");
  await tryAlter("ALTER TABLE user_problems ADD COLUMN answer_viewed BOOLEAN NOT NULL DEFAULT FALSE");
  await tryAlter("ALTER TABLE user_problems ADD COLUMN points_earned INT NOT NULL DEFAULT 0");
  await tryAlter("ALTER TABLE user_problems ADD COLUMN clean_solve BOOLEAN NOT NULL DEFAULT FALSE");

  // ── inquiries 테이블 ──────────────────────────────────────────────────────
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      user_id    INT NOT NULL,
      title      VARCHAR(200) NOT NULL,
      content    TEXT NOT NULL,
      images     JSON,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  await tryAlter("ALTER TABLE inquiries ADD COLUMN images JSON");

  // ── inquiry_comments 테이블 ───────────────────────────────────────────────
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS inquiry_comments (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      inquiry_id INT NOT NULL,
      user_id    INT NOT NULL,
      content    TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id)    REFERENCES users(id)
    )
  `);

  // ── notifications 테이블 ──────────────────────────────────────────────────
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS notifications (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      user_id    INT NOT NULL,
      type       ENUM('new_inquiry','new_reply','announcement') NOT NULL DEFAULT 'announcement',
      title      VARCHAR(200) NOT NULL,
      message    TEXT,
      is_read    BOOLEAN NOT NULL DEFAULT FALSE,
      related_id INT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // ── 운영자 계정 승격 ──────────────────────────────────────────────────────
  const [admins] = await pool.execute(
    "SELECT id FROM users WHERE role IN ('admin', 'super_admin') LIMIT 1"
  );
  if (admins.length === 0) {
    await pool.execute(
      "UPDATE users SET role = 'super_admin' WHERE id = (SELECT id FROM (SELECT id FROM users ORDER BY id ASC LIMIT 1) AS t)"
    );
  }

  console.log("DB 연결 및 테이블 초기화 완료");
}

initDB().catch(console.error);

module.exports = pool;
