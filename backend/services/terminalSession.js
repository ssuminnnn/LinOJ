const fs = require("fs");
const path = require("path");

const SESSIONS = new Map();
const BASE_DIR = "/tmp/linoj";
const IDLE_TIMEOUT = 30 * 60 * 1000; // 30분

// ── 문제별 초기 파일 세팅 ──────────────────────────────────────────────────
function setupProblemFiles(homeDir) {
  return (problemId) => {
    const id = Number(problemId);

    // 1-4번: 기본 탐색
    if ([1, 2, 3, 4].includes(id)) {
      fs.mkdirSync(path.join(homeDir, "documents"), { recursive: true });
      fs.mkdirSync(path.join(homeDir, "downloads"), { recursive: true });
      fs.writeFileSync(path.join(homeDir, "readme.txt"), "Welcome to LinOJ!\n");
      fs.writeFileSync(path.join(homeDir, ".bashrc"), "# .bashrc\n");
    }

    // 5번: cat file.txt
    if (id === 5) {
      fs.writeFileSync(
        path.join(homeDir, "file.txt"),
        "Hello, Linux!\nWelcome to the world of commands.\n"
      );
    }

    // 6번: head -n 5 file.txt
    if (id === 6) {
      fs.writeFileSync(
        path.join(homeDir, "file.txt"),
        "line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10\n"
      );
    }

    // 7번: tail -n 5 file.txt
    if (id === 7) {
      fs.writeFileSync(
        path.join(homeDir, "file.txt"),
        "line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10\n"
      );
    }

    // 8번: ls | wc -l → 정확히 5개
    if (id === 8) {
      fs.mkdirSync(path.join(homeDir, "documents"), { recursive: true });
      fs.mkdirSync(path.join(homeDir, "downloads"), { recursive: true });
      fs.writeFileSync(path.join(homeDir, "readme.txt"), "readme\n");
      fs.mkdirSync(path.join(homeDir, "notes"), { recursive: true });
      fs.writeFileSync(path.join(homeDir, "image.png"), "fake image\n");
    }

    // 9번: grep error file.txt
    if (id === 9) {
      fs.writeFileSync(
        path.join(homeDir, "file.txt"),
        "error: file not found\ninfo: starting up\nerror: permission denied\nwarning: disk space low\n"
      );
    }

    // 10번: grep error file.txt | wc -l (error 줄 3개 필요)
    if (id === 10) {
      fs.writeFileSync(
        path.join(homeDir, "file.txt"),
        "error: file not found\ninfo: starting up\nerror: permission denied\nwarning: disk low\nerror: timeout\n"
      );
    }

    // 11번: cp a.txt b.txt
    if (id === 11) {
      fs.writeFileSync(path.join(homeDir, "a.txt"), "This is a.txt content\n");
    }

    // 12번: mv a.txt b.txt
    if (id === 12) {
      fs.writeFileSync(path.join(homeDir, "a.txt"), "This is a.txt content\n");
    }

    // 13번: rm -r dir
    if (id === 13) {
      fs.mkdirSync(path.join(homeDir, "dir"), { recursive: true });
      fs.writeFileSync(path.join(homeDir, "dir", "file1.txt"), "content1\n");
      fs.writeFileSync(path.join(homeDir, "dir", "file2.txt"), "content2\n");
    }

    // 102번: find . -name '*.txt'
    if (id === 102) {
      fs.mkdirSync(path.join(homeDir, "notes"), { recursive: true });
      fs.writeFileSync(path.join(homeDir, "readme.txt"), "readme content\n");
      fs.writeFileSync(path.join(homeDir, "notes", "todo.txt"), "todo content\n");
      fs.writeFileSync(path.join(homeDir, "image.png"), "fake image\n");
    }

    // 301번: chmod +x script.sh
    if (id === 301) {
      fs.writeFileSync(
        path.join(homeDir, "script.sh"),
        "#!/bin/bash\necho 'Hello World'\n"
      );
    }

    // 202번: kill -9 1234 (no files needed, just process env)
    // (no file setup needed)

    // 203번: wc -l file.txt (10 lines)
    if (id === 203) {
      fs.writeFileSync(path.join(homeDir, "file.txt"),
        "line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10\n");
    }

    // 204번: wc -w file.txt
    if (id === 204) {
      fs.writeFileSync(path.join(homeDir, "file.txt"),
        "hello world foo\nbar baz qux\n");
    }

    // 205번: sort fruits.txt
    if (id === 205) {
      fs.writeFileSync(path.join(homeDir, "fruits.txt"),
        "cherry\napple\ndate\nbanana\n");
    }

    // 206번: sort file.txt | uniq
    if (id === 206) {
      fs.writeFileSync(path.join(homeDir, "file.txt"),
        "apple\nbanana\napple\ncherry\nbanana\napple\n");
    }

    // 207번: sort file.txt | uniq | wc -l
    if (id === 207) {
      fs.writeFileSync(path.join(homeDir, "file.txt"),
        "apple\nbanana\napple\ncherry\nbanana\napple\n");
    }

    // 208번: grep -n "error" file.txt
    if (id === 208) {
      fs.writeFileSync(path.join(homeDir, "file.txt"),
        "INFO: server starting\nerror: connection refused\nWARNING: high cpu\nERROR: out of memory\ninfo: backup done\nerror: file not found\nINFO: shutdown\n");
    }

    // 209번: grep -c "error" file.txt
    if (id === 209) {
      fs.writeFileSync(path.join(homeDir, "file.txt"),
        "INFO: server starting\nerror: connection refused\nWARNING: high cpu\nERROR: out of memory\ninfo: backup done\nerror: file not found\nINFO: shutdown\n");
    }

    // 210번: grep -i "error" file.txt
    if (id === 210) {
      fs.writeFileSync(path.join(homeDir, "file.txt"),
        "INFO: server starting\nerror: connection refused\nWARNING: high cpu\nERROR: out of memory\ninfo: backup done\nerror: file not found\nINFO: shutdown\n");
    }

    // 211번: grep -r "TODO" .
    if (id === 211) {
      fs.mkdirSync(path.join(homeDir, "src"), { recursive: true });
      fs.writeFileSync(path.join(homeDir, "src", "main.js"), "// TODO: fix login bug\nconsole.log('hello');\n");
      fs.writeFileSync(path.join(homeDir, "src", "utils.js"), "// TODO: add error handling\nfunction helper() {}\n");
      fs.writeFileSync(path.join(homeDir, "README.md"), "# Project\nNo TODOs here.\n");
    }

    // 212번: sed 's/hello/world/g' file.txt
    if (id === 212) {
      fs.writeFileSync(path.join(homeDir, "file.txt"),
        "hello world\nhello everyone\nsay hello\n");
    }

    // 213번: sed -n '3p' file.txt
    if (id === 213) {
      fs.writeFileSync(path.join(homeDir, "file.txt"),
        "first line\nsecond line\nthird line\nfourth line\nfifth line\n");
    }

    // 214번: awk '{print $1}' data.txt
    if (id === 214) {
      fs.writeFileSync(path.join(homeDir, "data.txt"),
        "Alice 25 Engineer\nBob 30 Manager\nCharlie 22 Designer\n");
    }

    // 215번: cut -d: -f1 users.txt
    if (id === 215) {
      fs.writeFileSync(path.join(homeDir, "users.txt"),
        "root:x:0:0\nuser:x:1000:1000\nadmin:x:1001:1001\n");
    }

    // 216번: sort -n numbers.txt
    if (id === 216) {
      fs.writeFileSync(path.join(homeDir, "numbers.txt"),
        "42\n7\n100\n3\n55\n18\n");
    }

    // 217번: sort -r file.txt
    if (id === 217) {
      fs.writeFileSync(path.join(homeDir, "file.txt"),
        "banana\napple\ndate\ncherry\n");
    }

    // 218번: find . -name "*.txt"
    if (id === 218) {
      fs.mkdirSync(path.join(homeDir, "notes"), { recursive: true });
      fs.mkdirSync(path.join(homeDir, "docs"), { recursive: true });
      fs.writeFileSync(path.join(homeDir, "readme.txt"), "readme\n");
      fs.writeFileSync(path.join(homeDir, "notes", "todo.txt"), "todo\n");
      fs.writeFileSync(path.join(homeDir, "docs", "guide.txt"), "guide\n");
      fs.writeFileSync(path.join(homeDir, "script.js"), "console.log('hi');\n");
    }

    // 219번: cat -n file.txt
    if (id === 219) {
      fs.writeFileSync(path.join(homeDir, "file.txt"),
        "first line\nsecond line\nthird line\n");
    }

    // 220번: ln -s file.txt link.txt
    if (id === 220) {
      fs.writeFileSync(path.join(homeDir, "file.txt"), "original content\n");
    }

    // 221번: diff file1.txt file2.txt
    if (id === 221) {
      fs.writeFileSync(path.join(homeDir, "file1.txt"), "apple\nbanana\ncherry\n");
      fs.writeFileSync(path.join(homeDir, "file2.txt"), "apple\nblueberry\ncherry\n");
    }

    // 222번: cat file.txt | tr 'a-z' 'A-Z'
    if (id === 222) {
      fs.writeFileSync(path.join(homeDir, "file.txt"), "hello world\nlinux commands\n");
    }

    // 223번: ls -lh (basic files)
    if (id === 223) {
      fs.writeFileSync(path.join(homeDir, "readme.txt"), "readme content\n");
      fs.writeFileSync(path.join(homeDir, "script.sh"), "#!/bin/bash\n");
      fs.mkdirSync(path.join(homeDir, "docs"), { recursive: true });
    }

    // 224번: chmod 755 script.sh
    if (id === 224) {
      fs.writeFileSync(path.join(homeDir, "script.sh"), "#!/bin/bash\necho 'hello'\n");
      fs.chmodSync(path.join(homeDir, "script.sh"), 0o644);
    }

    // 225번: find . -name "*.txt" | wc -l (4 txt files)
    if (id === 225) {
      fs.mkdirSync(path.join(homeDir, "notes"), { recursive: true });
      fs.mkdirSync(path.join(homeDir, "docs"), { recursive: true });
      fs.writeFileSync(path.join(homeDir, "readme.txt"), "readme\n");
      fs.writeFileSync(path.join(homeDir, "notes", "todo.txt"), "todo\n");
      fs.writeFileSync(path.join(homeDir, "notes", "ideas.txt"), "ideas\n");
      fs.writeFileSync(path.join(homeDir, "docs", "guide.txt"), "guide\n");
      fs.writeFileSync(path.join(homeDir, "script.js"), "code\n");
    }

    // 226번: awk '{sum+=$1} END{print sum}' numbers.txt → 150
    if (id === 226) {
      fs.writeFileSync(path.join(homeDir, "numbers.txt"), "10\n20\n30\n40\n50\n");
    }

    // 227번: cut -d, -f2 data.csv
    if (id === 227) {
      fs.writeFileSync(path.join(homeDir, "data.csv"), "name,age,city\nAlice,25,Seoul\nBob,30,Busan\n");
    }

    // 228번: grep -v "^$" file.txt (remove empty lines)
    if (id === 228) {
      fs.writeFileSync(path.join(homeDir, "file.txt"),
        "line one\n\nline two\n\nline three\n");
    }

    // 229번: sort -k2 data.txt
    if (id === 229) {
      fs.writeFileSync(path.join(homeDir, "data.txt"),
        "Charlie 3\nAlice 1\nBob 2\n");
    }

    // 230번: du -sh .
    if (id === 230) {
      fs.writeFileSync(path.join(homeDir, "file.txt"), "some content\n");
      fs.writeFileSync(path.join(homeDir, "readme.txt"), "readme\n");
    }

    // 302번: tar -czf archive.tar.gz files/
    if (id === 302) {
      fs.mkdirSync(path.join(homeDir, "files"), { recursive: true });
      fs.writeFileSync(path.join(homeDir, "files", "data.txt"), "data content\n");
      fs.writeFileSync(path.join(homeDir, "files", "config.txt"), "config content\n");
    }

    // 303번: awk -F, '{sum+=$2} END{print sum}' scores.csv → 255
    if (id === 303) {
      fs.writeFileSync(path.join(homeDir, "scores.csv"), "Alice,85\nBob,92\nCharlie,78\n");
    }

    // 304번: find . -name '.*' -type f | wc -l → 3
    if (id === 304) {
      fs.writeFileSync(path.join(homeDir, ".env"), "SECRET=abc\n");
      fs.writeFileSync(path.join(homeDir, ".gitignore"), "node_modules\n");
      fs.writeFileSync(path.join(homeDir, ".bashrc"), "# bashrc\n");
      fs.writeFileSync(path.join(homeDir, "readme.txt"), "readme\n");
    }

    // 305번: sed '/^$/d' file.txt
    if (id === 305) {
      fs.writeFileSync(path.join(homeDir, "file.txt"),
        "first line\n\nsecond line\n\nthird line\n");
    }

    // 306번: grep -v "^#" config.txt
    if (id === 306) {
      fs.writeFileSync(path.join(homeDir, "config.txt"),
        "# Database settings\nhost=localhost\n# Port config\nport=3306\nname=mydb\n");
    }

    // 307번: find . -name "*.log" | xargs grep "ERROR"
    if (id === 307) {
      fs.mkdirSync(path.join(homeDir, "logs"), { recursive: true });
      fs.writeFileSync(path.join(homeDir, "logs", "app.log"),
        "INFO: started\nERROR: disk full\nINFO: running\n");
      fs.writeFileSync(path.join(homeDir, "logs", "access.log"),
        "GET /api 200\nERROR: timeout\nPOST /login 401\n");
    }

    // 308번: sort -t, -k2 -n data.csv
    if (id === 308) {
      fs.writeFileSync(path.join(homeDir, "data.csv"),
        "Alice,30\nBob,10\nCharlie,20\n");
    }

    // 309번: awk '$2 > 80 {print $1}' scores.txt
    if (id === 309) {
      fs.writeFileSync(path.join(homeDir, "scores.txt"),
        "Alice 85\nBob 72\nCharlie 90\nDave 65\n");
    }

    // 310번: cat file.txt | tr ' ' '\n' | sort | uniq | wc -l
    if (id === 310) {
      fs.writeFileSync(path.join(homeDir, "file.txt"),
        "apple banana apple cherry banana apple\n");
    }
  };
}

// ── 세션 가져오기 또는 생성 ────────────────────────────────────────────────
function getOrCreateSession(sessionId, problemId) {
  if (SESSIONS.has(sessionId)) {
    const session = SESSIONS.get(sessionId);
    clearTimeout(session.timeout);
    session.timeout = setTimeout(() => cleanupSession(sessionId), IDLE_TIMEOUT);
    return session;
  }

  // ┌─────────────────────────────────────────────────────┐
  // │  가상 파일시스템 구조:                               │
  // │  /tmp/linoj/{uuid}/          ← virtual root (/)     │
  // │  /tmp/linoj/{uuid}/home/     ← /home                │
  // │  /tmp/linoj/{uuid}/home/user ← /home/user (시작위치) │
  // └─────────────────────────────────────────────────────┘
  const baseDir = path.join(BASE_DIR, sessionId);
  const homeUserDir = path.join(baseDir, "home", "user");
  fs.mkdirSync(homeUserDir, { recursive: true });

  // macOS의 /tmp → /private/tmp 심볼릭 링크를 실제 경로로 해석
  const rootDir = fs.realpathSync(baseDir);
  const tempDir = path.join(rootDir, "home", "user");

  // 문제별 초기 파일 생성
  setupProblemFiles(tempDir)(problemId);

  const timeout = setTimeout(() => cleanupSession(sessionId), IDLE_TIMEOUT);
  const session = {
    rootDir,       // 가상 루트(/) 의 실제 경로
    tempDir,       // /home/user 의 실제 경로
    currentDir: tempDir, // 현재 작업 디렉토리
    problemId: Number(problemId),
    timeout,
    baseDir,       // 정리 시 사용
  };
  SESSIONS.set(sessionId, session);
  return session;
}

// ── 세션 정리 ─────────────────────────────────────────────────────────────
function cleanupSession(sessionId) {
  const session = SESSIONS.get(sessionId);
  if (!session) return;

  clearTimeout(session.timeout);
  try {
    fs.rmSync(session.rootDir, { recursive: true, force: true });
  } catch (_) {}
  SESSIONS.delete(sessionId);
}

module.exports = { getOrCreateSession, cleanupSession };
