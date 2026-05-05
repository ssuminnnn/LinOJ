const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// ── MySQL2 호환 shim ───────────────────────────────────────────────────────
// ? 플레이스홀더를 $1, $2, ... 로 자동 변환
// 반환값: [rows] — mysql2의 const [rows] = await pool.execute(...) 패턴 호환
pool.execute = async function (sql, params = []) {
  let i = 0;
  const pgSql = sql.replace(/\?/g, () => `$${++i}`);
  const result = await this.query(pgSql, params);
  return [result.rows];
};

// ── PostgreSQL용 tryAlter (중복 컬럼/인덱스 오류 무시) ───────────────────
async function tryAlter(sql) {
  try {
    await pool.query(sql);
  } catch (e) {
    // 42701: duplicate_column  42P07: duplicate_table  42710: duplicate_object
    if (!["42701", "42P07", "42710"].includes(e.code)) throw e;
  }
}

async function initDB() {
  // ── users 테이블 ─────────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id         SERIAL PRIMARY KEY,
      username   VARCHAR(50) UNIQUE NOT NULL,
      nickname   VARCHAR(50) UNIQUE NOT NULL,
      password   VARCHAR(255) NOT NULL,
      role       VARCHAR(20) NOT NULL DEFAULT 'user'
                 CHECK (role IN ('user', 'admin', 'super_admin')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await tryAlter("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin','super_admin'))");

  // ── user_problems 테이블 ──────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_problems (
      id            SERIAL PRIMARY KEY,
      user_id       INT NOT NULL REFERENCES users(id),
      problem_id    INT NOT NULL,
      is_correct    BOOLEAN NOT NULL DEFAULT FALSE,
      hint_used     BOOLEAN NOT NULL DEFAULT FALSE,
      answer_viewed BOOLEAN NOT NULL DEFAULT FALSE,
      points_earned INT NOT NULL DEFAULT 0,
      clean_solve   BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, problem_id)
    )
  `);
  await tryAlter("ALTER TABLE user_problems ADD COLUMN IF NOT EXISTS hint_used BOOLEAN NOT NULL DEFAULT FALSE");
  await tryAlter("ALTER TABLE user_problems ADD COLUMN IF NOT EXISTS answer_viewed BOOLEAN NOT NULL DEFAULT FALSE");
  await tryAlter("ALTER TABLE user_problems ADD COLUMN IF NOT EXISTS points_earned INT NOT NULL DEFAULT 0");
  await tryAlter("ALTER TABLE user_problems ADD COLUMN IF NOT EXISTS clean_solve BOOLEAN NOT NULL DEFAULT FALSE");

  // ── inquiries 테이블 ──────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id         SERIAL PRIMARY KEY,
      user_id    INT NOT NULL REFERENCES users(id),
      title      VARCHAR(200) NOT NULL,
      content    TEXT NOT NULL,
      images     JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await tryAlter("ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS images JSONB");

  // ── notices 테이블 ────────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notices (
      id         SERIAL PRIMARY KEY,
      user_id    INT NOT NULL REFERENCES users(id),
      title      VARCHAR(200) NOT NULL,
      content    TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ── inquiry_comments 테이블 ───────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inquiry_comments (
      id         SERIAL PRIMARY KEY,
      inquiry_id INT NOT NULL REFERENCES inquiries(id) ON DELETE CASCADE,
      user_id    INT NOT NULL REFERENCES users(id),
      content    TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ── notifications 테이블 ──────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id         SERIAL PRIMARY KEY,
      user_id    INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type       VARCHAR(20) NOT NULL DEFAULT 'announcement'
                 CHECK (type IN ('new_inquiry', 'new_reply', 'announcement')),
      title      VARCHAR(200) NOT NULL,
      message    TEXT,
      is_read    BOOLEAN NOT NULL DEFAULT FALSE,
      related_id INT DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ── 첫 번째 가입자를 super_admin으로 승격 ────────────────────────────────
  const admins = await pool.query(
    "SELECT id FROM users WHERE role IN ('admin', 'super_admin') LIMIT 1"
  );
  if (admins.rows.length === 0) {
    await pool.query(
      "UPDATE users SET role = 'super_admin' WHERE id = (SELECT id FROM users ORDER BY id ASC LIMIT 1)"
    );
  }

  console.log("DB 연결 및 테이블 초기화 완료");
}

initDB().catch(console.error);

module.exports = pool;
