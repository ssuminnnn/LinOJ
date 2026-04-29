// 허용된 기본 명령어 화이트리스트
const ALLOWED_COMMANDS = new Set([
  "pwd", "ls", "cat", "head", "tail", "grep", "wc",
  "echo", "mkdir", "cp", "mv", "rm", "find", "ps",
  "date", "whoami", "uname", "sort", "uniq", "diff",
  "touch", "stat", "file", "which", "basename", "dirname",
]);

// 위험 패턴 목록 (정규식 + 설명)
const DANGEROUS_PATTERNS = [
  // 파일시스템 파괴
  {
    pattern: /rm\s+.*-[a-z]*r[a-z]*f[a-z]*\s+\/(\s|$|\*)/i,
    message: "🚨 시스템 루트를 삭제하는 명령어는 허용되지 않습니다. (rm -rf /)",
  },
  {
    pattern: /rm\s+.*-[a-z]*f[a-z]*r[a-z]*\s+\/(\s|$|\*)/i,
    message: "🚨 시스템 루트를 삭제하는 명령어는 허용되지 않습니다. (rm -rf /)",
  },
  {
    pattern: /\bdd\b.*of=\/dev\//i,
    message: "🚨 디스크 장치에 직접 쓰기는 허용되지 않습니다. (dd of=/dev/...)",
  },
  {
    pattern: /\b(mkfs|fdisk|parted|blkid)\b/i,
    message: "🚨 파일시스템 포맷/디스크 파티션 명령어는 허용되지 않습니다.",
  },

  // 포크 폭탄
  {
    pattern: /:\(\)\s*\{.*:\|.*:\s*&.*\}/,
    message: "🚨 포크 폭탄(Fork Bomb)이 감지되었습니다. 시스템 자원을 고갈시키는 코드입니다.",
  },
  {
    pattern: /while\s*true|while\s*1|for\s*\(\s*;\s*;\s*\)/,
    message: "🚨 무한 루프 명령어는 허용되지 않습니다.",
  },

  // 역방향 쉘 (Reverse Shell)
  {
    pattern: /\bnc\b.*-e.*\/(ba)?sh/i,
    message: "🚨 역방향 쉘(Reverse Shell) 시도가 감지되었습니다.",
  },
  {
    pattern: /bash\s+-i\s*>&\s*\/dev\/tcp/i,
    message: "🚨 역방향 쉘(Reverse Shell) 시도가 감지되었습니다.",
  },
  {
    pattern: /\/dev\/tcp|\/dev\/udp/i,
    message: "🚨 네트워크 장치를 통한 연결 시도는 허용되지 않습니다.",
  },

  // 시스템 종료
  {
    pattern: /\b(shutdown|reboot|halt|poweroff|init\s+0|systemctl\s+(poweroff|reboot|halt))\b/i,
    message: "🚨 시스템 종료/재시작 명령어는 허용되지 않습니다.",
  },

  // 권한 에스컬레이션
  {
    pattern: /\b(sudo|su)\b/i,
    message: "🚨 관리자 권한 명령어(sudo/su)는 허용되지 않습니다.",
  },
  {
    pattern: /chmod\s+.*777\s+\//i,
    message: "🚨 루트 디렉토리의 권한 변경은 허용되지 않습니다.",
  },
  {
    pattern: /chmod\s+-R\s+.*\//i,
    message: "🚨 재귀적 권한 변경은 허용되지 않습니다.",
  },

  // 시스템 파일 덮어쓰기
  {
    pattern: />\s*\/etc\/(passwd|shadow|sudoers|hosts|crontab|fstab)/i,
    message: "🚨 시스템 설정 파일 덮어쓰기는 허용되지 않습니다.",
  },
  {
    pattern: />\s*\/(boot|proc|sys)\//i,
    message: "🚨 시스템 핵심 경로에 쓰기는 허용되지 않습니다.",
  },

  // 환경변수 조작
  {
    pattern: /export\s+PATH\s*=\s*["']?["']?$/i,
    message: "🚨 PATH 환경변수를 비우는 것은 허용되지 않습니다.",
  },

  // 코드 인젝션
  {
    pattern: /\b(python|python3|perl|ruby|php|node)\s+-[ce]/i,
    message: "🚨 스크립트 언어를 통한 코드 실행은 허용되지 않습니다.",
  },
  {
    pattern: /\$\(.*\)|`[^`]*`/,
    message: "🚨 명령어 치환(Command Substitution)은 허용되지 않습니다.",
  },

  // 네트워크 공격
  {
    pattern: /\b(wget|curl)\b.*(\|.*sh|>.*\/bin|bash)/i,
    message: "🚨 원격 스크립트 다운로드 및 실행은 허용되지 않습니다.",
  },
  {
    pattern: /\b(nmap|masscan)\b/i,
    message: "🚨 포트 스캔 도구는 허용되지 않습니다.",
  },
];

/**
 * 명령어 보안 검사
 * @returns {{ safe: boolean, warning: string | null }}
 */
function checkCommand(command) {
  const cmd = command.trim();

  // 1. 위험 패턴 검사 (화이트리스트보다 먼저)
  for (const { pattern, message } of DANGEROUS_PATTERNS) {
    if (pattern.test(cmd)) {
      return { safe: false, warning: message };
    }
  }

  // 2. 기본 명령어(파이프 포함) 화이트리스트 검사
  const baseCommands = cmd
    .split("|")
    .map((part) => part.trim().split(/\s+/)[0]);

  for (const base of baseCommands) {
    if (base && !ALLOWED_COMMANDS.has(base)) {
      return {
        safe: false,
        warning: `⚠️ '${base}' 명령어는 허용되지 않습니다. 허용된 명령어만 사용해주세요.`,
      };
    }
  }

  return { safe: true, warning: null };
}

module.exports = { checkCommand, ALLOWED_COMMANDS };
