require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const pool = require("./db");

const app = express();

// 미들웨어
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://linoj.vercel.app",
  "https://linoj.online",
  "https://www.linoj.online",
  ...(process.env.ALLOWED_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean),
];
app.use(cors({
  origin: (origin, callback) => {
    // origin이 없으면 Render Health Check 등 서버 간 요청
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));
app.use(express.json());

// 업로드 이미지 정적 서빙
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 라우터 연결
app.use("/api/auth", require("./routes/authRoutes"));
// 호환 라우트: /api/login, /api/register 등으로도 접근 가능하게 유지
app.use("/api", require("./routes/authRoutes"));
app.use("/api/problems", require("./routes/problemRoutes"));
app.use("/api/execute", require("./routes/executeRoutes"));
app.use("/api/inquiries", require("./routes/inquiryRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/notices", require("./routes/noticeRoutes"));

// 상태 확인: DB까지 조회해서 무료 DB가 정지되지 않도록 keep-alive에서도 사용
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
});

// 기본 테스트 라우트 (선택)
app.get("/", (req, res) => {
  res.send("LinOJ Backend Running");
});

// 서버 실행 (핵심🔥)
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});