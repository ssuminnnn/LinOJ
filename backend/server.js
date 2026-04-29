require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

// 미들웨어
app.use(cors());
app.use(express.json());

// 라우터 연결
app.use("/api/execute", require("./routes/executeRoutes"));

// 기본 테스트 라우트 (선택)
app.get("/", (req, res) => {
  res.send("LinOJ Backend Running");
});

// 서버 실행 (핵심🔥)
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});