export const formatId = (id) => String(id).padStart(3, "0");

export const PROBLEMS = [
  // ────────────── 쉬움 001-013 (1점) ──────────────
  {
    id: 1, title: "현재 디렉토리 출력", difficulty: "쉬움", points: 1, category: "기본 탐색",
    description: "현재 작업 중인 디렉토리의 전체 경로를 출력하세요.",
    example: "/home/user",
    answer: "pwd",
  },
  {
    id: 2, title: "파일 목록 출력", difficulty: "쉬움", points: 1, category: "기본 탐색",
    description: "현재 디렉토리에 있는 파일과 폴더의 목록을 출력하세요.",
    example: "documents  downloads  readme.txt",
    answer: "ls",
  },
  {
    id: 3, title: "상세 목록 출력", difficulty: "쉬움", points: 1, category: "기본 탐색",
    description: "현재 디렉토리의 파일 목록을 권한, 소유자, 크기 등 상세 정보와 함께 출력하세요.",
    example: "drwxr-xr-x 2 user user 4096 Apr 29 documents\n-rw-r--r-- 1 user user  256 Apr 29 readme.txt",
    answer: "ls -l",
  },
  {
    id: 4, title: "숨김 파일 포함 출력", difficulty: "쉬움", points: 1, category: "기본 탐색",
    description: "현재 디렉토리의 숨김 파일(.으로 시작하는 파일)을 포함한 모든 파일 목록을 출력하세요.",
    example: ".  ..  .bashrc  documents  readme.txt",
    answer: "ls -a",
  },
  {
    id: 5, title: "파일 내용 출력", difficulty: "쉬움", points: 1, category: "파일 읽기",
    description: "file.txt 파일의 전체 내용을 출력하세요.",
    example: "Hello, Linux!\nWelcome to the world of commands.",
    answer: "cat file.txt",
  },
  {
    id: 6, title: "파일 앞 5줄 출력", difficulty: "쉬움", points: 1, category: "파일 읽기",
    description: "file.txt 파일의 앞 5줄을 출력하세요.",
    example: "line1\nline2\nline3\nline4\nline5",
    answer: "head -n 5 file.txt",
  },
  {
    id: 7, title: "파일 뒤 5줄 출력", difficulty: "쉬움", points: 1, category: "파일 읽기",
    description: "file.txt 파일의 뒤 5줄을 출력하세요.",
    example: "line6\nline7\nline8\nline9\nline10",
    answer: "tail -n 5 file.txt",
  },
  {
    id: 8, title: "파일 개수 세기", difficulty: "쉬움", points: 1, category: "파이프",
    description: "현재 디렉토리에 있는 파일과 폴더의 개수를 출력하세요.\n\n힌트: 파이프(|)를 활용하세요.",
    example: "5",
    answer: "ls | wc -l",
  },
  {
    id: 9, title: "특정 단어 포함 줄 찾기", difficulty: "쉬움", points: 1, category: "검색",
    description: "file.txt에서 'error'가 포함된 줄을 모두 출력하세요.",
    example: "error: file not found\nerror: permission denied",
    answer: "grep error file.txt",
  },
  {
    id: 10, title: "특정 단어 개수 세기", difficulty: "쉬움", points: 1, category: "검색",
    description: "file.txt에서 'error'가 포함된 줄의 수를 출력하세요.\n\n힌트: 파이프(|)를 활용하세요.",
    example: "3",
    answer: "grep error file.txt | wc -l",
  },
  {
    id: 11, title: "파일 복사", difficulty: "쉬움", points: 1, category: "파일 조작",
    description: "a.txt 파일을 b.txt로 복사하세요.",
    example: "(출력 없음 - 복사 성공 시 아무것도 출력되지 않습니다)",
    answer: "cp a.txt b.txt",
  },
  {
    id: 12, title: "파일 이동(이름 변경)", difficulty: "쉬움", points: 1, category: "파일 조작",
    description: "a.txt 파일을 b.txt로 이동(이름 변경)하세요.",
    example: "(출력 없음 - 이동 성공 시 아무것도 출력되지 않습니다)",
    answer: "mv a.txt b.txt",
  },
  {
    id: 13, title: "디렉토리 삭제", difficulty: "쉬움", points: 1, category: "파일 조작",
    description: "dir 디렉토리를 내부 파일까지 포함하여 모두 삭제하세요.",
    example: "(출력 없음 - 삭제 성공 시 아무것도 출력되지 않습니다)",
    answer: "rm -r dir",
  },

  // ────────────── 보통 101+ (2점) ──────────────
  {
    id: 101, title: "디렉토리 생성", difficulty: "보통", points: 2, category: "파일 조작",
    description: "'myproject'라는 이름의 새 디렉토리를 생성하세요.",
    example: "(출력 없음 - 생성 성공 시 아무것도 출력되지 않습니다)",
    answer: "mkdir myproject",
  },
  {
    id: 102, title: "파일 검색하기", difficulty: "보통", points: 2, category: "검색",
    description: "현재 디렉토리에서 확장자가 .txt인 파일을 모두 찾아 출력하세요.",
    example: "./readme.txt\n./notes/todo.txt",
    answer: "find . -name '*.txt'",
  },

  // ────────────── 어려움 201+ (3점) ──────────────
  {
    id: 201, title: "실행 중인 프로세스 목록", difficulty: "어려움", points: 3, category: "프로세스",
    description: "현재 실행 중인 모든 프로세스를 상세 정보와 함께 출력하세요.",
    example: "USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\nroot         1  0.0  0.1  16952  1076 ?        Ss   10:00   0:00 /sbin/init",
    answer: "ps aux",
  },
];

export const PROBLEM_MAP = Object.fromEntries(PROBLEMS.map((p) => [p.id, p]));
