const express = require("express");
const router = express.Router();
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { getOrCreateSession, cleanupSession } = require("../services/terminalSession");
const problems = require("../data/problems");
const { checkCommand } = require("../security");

const VIRTUAL_HOME = "/home/user";

// ── 경로 변환 헬퍼 ────────────────────────────────────────────────────────

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// 실제 경로 → 가상 경로 (/home/user, /home, / 등)
function toVirtual(realPath, rootDir) {
  if (realPath === rootDir) return "/";
  if (realPath.startsWith(rootDir + "/")) return realPath.slice(rootDir.length);
  return realPath;
}

// 가상 경로 → 실제 경로
function toReal(virtualPath, rootDir, tempDir) {
  if (!virtualPath || virtualPath === "~" || virtualPath === VIRTUAL_HOME) return tempDir;
  if (virtualPath === "/") return rootDir;
  if (virtualPath.startsWith("/")) return path.join(rootDir, virtualPath);
  return virtualPath; // 상대경로는 그대로 (cwd 기준으로 해석됨)
}

// 출력에서 실제 경로를 가상 경로로 교체 (macOS /private/tmp 포함)
function sanitizeOutput(output, rootDir) {
  // rootDir/ → / 로 먼저 교체 (서브경로)
  let result = output.replace(new RegExp(escapeRegex(rootDir + "/"), "g"), "/");
  // 남은 bare rootDir → / 로 교체
  result = result.replace(new RegExp(escapeRegex(rootDir), "g"), "/");
  return result;
}

// ── cd 처리 (Node.js에서 직접 경로 해석) ─────────────────────────────────
function handleCd(rawTarget, session) {
  const { rootDir, tempDir, currentDir } = session;
  const target = rawTarget ? rawTarget.trim() : "";

  // cd 또는 cd ~ → 홈으로
  if (!target || target === "~") {
    session.currentDir = tempDir;
    return { output: "", cwd: VIRTUAL_HOME };
  }

  // 가상 경로를 실제 경로로 변환
  const realTarget = toReal(target, rootDir, tempDir);

  // 절대경로면 그대로, 상대경로면 currentDir 기준 resolve
  const resolved = path.isAbsolute(realTarget)
    ? path.resolve(realTarget)
    : path.resolve(currentDir, realTarget);

  // 반드시 rootDir 아래여야 함 (가상 루트 밖으로 탈출 차단)
  if (resolved !== rootDir && !resolved.startsWith(rootDir + "/")) {
    return {
      output: `bash: cd: ${target}: 해당 경로를 벗어날 수 없습니다`,
      cwd: null,
    };
  }

  // 실제 디렉토리 존재 여부 확인
  try {
    const stat = fs.statSync(resolved);
    if (!stat.isDirectory()) {
      return { output: `bash: cd: ${target}: 디렉토리가 아닙니다`, cwd: null };
    }
  } catch {
    return { output: `bash: cd: ${target}: 해당 파일이나 디렉토리가 없습니다`, cwd: null };
  }

  session.currentDir = resolved;
  return { output: "", cwd: toVirtual(resolved, rootDir) };
}

// ── 명령어 실행 ───────────────────────────────────────────────────────────
router.post("/", (req, res) => {
  const { command, problemId, sessionId } = req.body;

  if (!command || !sessionId) {
    return res.status(400).json({ error: "command와 sessionId가 필요합니다." });
  }

  // 1. 보안 검사
  const security = checkCommand(command);
  if (!security.safe) {
    return res.json({ output: security.warning, blocked: true, isCorrect: false });
  }

  // 2. 문제 확인
  const problem = problems.find((p) => p.id === Number(problemId));
  if (!problem) {
    return res.status(400).json({ error: "문제를 찾을 수 없습니다." });
  }

  // 3. 세션 가져오기/생성
  const session = getOrCreateSession(sessionId, problemId);

  // 4. cd는 Node.js에서 직접 처리
  const trimmed = command.trim();
  if (trimmed === "cd" || /^cd(\s|$)/.test(trimmed)) {
    const target = trimmed.slice(2).trim();
    const cdResult = handleCd(target, session);
    return res.json({
      output: cdResult.output,
      isCorrect: problem.check(command),
      blocked: false,
      cwd: cdResult.cwd || toVirtual(session.currentDir, session.rootDir),
    });
  }

  // 5. 명령어에서 가상 경로를 실제 경로로 치환
  const translatedCmd = command.replace(
    new RegExp(escapeRegex(VIRTUAL_HOME), "g"),
    session.tempDir
  );

  // 6. 실제 명령어 실행
  exec(translatedCmd, {
    cwd: session.currentDir,
    timeout: 5000,
    env: {
      PATH: "/usr/local/bin:/usr/bin:/bin",
      HOME: session.tempDir,
      TERM: "xterm-256color",
      LANG: "ko_KR.UTF-8",
    },
    maxBuffer: 1024 * 512,
  }, (error, stdout, stderr) => {
    let output = "";
    if (stdout) output += stdout;
    if (stderr) output += stderr;
    if (!output && error) output = `오류: ${error.message.split("\n")[0]}`;

    // 실제 경로 → 가상 경로로 교체
    output = sanitizeOutput(output.trimEnd(), session.rootDir);

    const isCorrect = problem.check(command);
    res.json({
      output,
      isCorrect,
      blocked: false,
      cwd: toVirtual(session.currentDir, session.rootDir),
    });
  });
});

// ── 세션 정리 ─────────────────────────────────────────────────────────────
router.post("/cleanup", (req, res) => {
  const { sessionId } = req.body;
  if (sessionId) cleanupSession(sessionId);
  res.json({ ok: true });
});

module.exports = router;
