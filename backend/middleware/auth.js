const jwt = require("jsonwebtoken");

function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "인증이 필요합니다." });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "유효하지 않은 토큰입니다." });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "인증이 필요합니다." });
  if (!["admin", "super_admin"].includes(req.user.role)) {
    return res.status(403).json({ error: "관리자 권한이 필요합니다." });
  }
  next();
}

module.exports = auth;
module.exports.requireAdmin = requireAdmin;
