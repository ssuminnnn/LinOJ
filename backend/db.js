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

async function initDB() {
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
  // 기존 테이블(users)에 role 컬럼이 없던 경우를 대비한 마이그레이션
  try {
    await pool.execute(`
      ALTER TABLE users
      ADD COLUMN role ENUM('user', 'admin', 'super_admin') NOT NULL DEFAULT 'user'
    `);
  } catch (error) {
    if (error.code !== "ER_DUP_FIELDNAME") {
      throw error;
    }
  }
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS user_problems (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      problem_id INT NOT NULL,
      is_correct BOOLEAN NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_problem (user_id, problem_id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS inquiries (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      title VARCHAR(100) NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);
  // 운영자 계정이 아직 없는 경우, 가장 먼저 가입한 계정 1명을 super_admin으로 승격
  const [admins] = await pool.execute(
    "SELECT id FROM users WHERE role IN ('admin', 'super_admin') LIMIT 1"
  );
  if (admins.length === 0) {
    await pool.execute(
      "UPDATE users SET role = 'super_admin' WHERE id = (SELECT id FROM (SELECT id FROM users ORDER BY id ASC LIMIT 1) AS first_user)"
    );
  }
  console.log("DB 연결 및 테이블 초기화 완료");
}

initDB().catch(console.error);

module.exports = pool;
