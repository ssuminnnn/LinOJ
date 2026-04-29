import { useState } from "react";
import { formatId } from "../data/problems";

const chapters = [
  {
    id: 1, title: "기본 탐색", icon: "📁",
    commands: [
      {
        cmd: "pwd", desc: "현재 작업 디렉토리 경로 출력",
        example: "$ pwd\n/home/user",
        tip: "Print Working Directory의 약자입니다. 내가 어디에 있는지 확인할 때 사용합니다.",
        problemId: 1, problemTitle: "현재 디렉토리 출력",
      },
      {
        cmd: "ls", desc: "디렉토리 내 파일·폴더 목록 출력",
        example: "$ ls\ndocuments  downloads  readme.txt",
        tip: "가장 많이 쓰는 명령어 중 하나입니다. 옵션에 따라 다양한 정보를 볼 수 있습니다.",
        problemId: 2, problemTitle: "파일 목록 출력",
      },
      {
        cmd: "ls -l", desc: "상세 목록 출력 (권한, 소유자, 크기 포함)",
        example: "$ ls -l\ndrwxr-xr-x 2 user user 4096 Apr 29 documents\n-rw-r--r-- 1 user user  256 Apr 29 readme.txt",
        tip: "-l 은 long format의 약자입니다. 권한, 소유자, 크기, 날짜를 모두 볼 수 있습니다.",
        problemId: 3, problemTitle: "상세 목록 출력",
      },
      {
        cmd: "ls -a", desc: "숨김 파일(.으로 시작)을 포함한 전체 목록 출력",
        example: "$ ls -a\n.  ..  .bashrc  documents  readme.txt",
        tip: "리눅스에서 .으로 시작하는 파일은 숨김 파일입니다. ls -a로만 볼 수 있습니다.",
        problemId: 4, problemTitle: "숨김 파일 포함 출력",
      },
    ],
  },
  {
    id: 2, title: "파일 읽기", icon: "📄",
    commands: [
      {
        cmd: "cat", desc: "파일 내용 전체 출력",
        example: "$ cat file.txt\nHello, Linux!\nWelcome to the world of commands.",
        tip: "짧은 파일을 빠르게 볼 때 사용합니다. 긴 파일은 less를 사용하세요.",
        problemId: 5, problemTitle: "파일 내용 출력",
      },
      {
        cmd: "head", desc: "파일의 앞부분 출력",
        example: "$ head -n 5 file.txt\nline1\nline2\nline3\nline4\nline5",
        tip: "-n 숫자 옵션으로 몇 줄을 볼지 지정합니다. 기본값은 10줄입니다.",
        problemId: 6, problemTitle: "파일 앞 5줄 출력",
      },
      {
        cmd: "tail", desc: "파일의 뒷부분 출력",
        example: "$ tail -n 5 file.txt\nline6\nline7\nline8\nline9\nline10",
        tip: "tail -f 옵션으로 파일이 실시간으로 추가될 때 계속 볼 수 있습니다. 로그 모니터링에 유용합니다.",
        problemId: 7, problemTitle: "파일 뒤 5줄 출력",
      },
    ],
  },
  {
    id: 3, title: "파이프(|) 활용", icon: "🔗",
    commands: [
      {
        cmd: "| (파이프)", desc: "앞 명령어의 출력을 뒤 명령어의 입력으로 전달",
        example: "$ ls | wc -l\n5\n\n$ grep error file.txt | wc -l\n3",
        tip: "파이프는 리눅스의 핵심 개념입니다. 여러 명령어를 연결해 강력한 작업을 수행할 수 있습니다.",
        problemId: 8, problemTitle: "파일 개수 세기",
      },
      {
        cmd: "wc -l", desc: "입력받은 내용의 줄 수 출력",
        example: "$ wc -l file.txt\n10 file.txt\n\n$ ls | wc -l\n5",
        tip: "wc는 Word Count의 약자입니다. -l은 줄 수, -w는 단어 수, -c는 바이트 수를 셉니다.",
        problemId: null,
      },
    ],
  },
  {
    id: 4, title: "검색 (grep)", icon: "🔍",
    commands: [
      {
        cmd: "grep", desc: "파일에서 특정 문자열이 포함된 줄 출력",
        example: "$ grep error file.txt\nerror: file not found\nerror: permission denied",
        tip: "grep은 Global Regular Expression Print의 약자입니다. 로그 분석 시 매우 자주 사용합니다.",
        problemId: 9, problemTitle: "특정 단어 포함 줄 찾기",
      },
      {
        cmd: "grep + 파이프", desc: "grep 결과를 파이프로 연결해 개수 세기",
        example: "$ grep error file.txt | wc -l\n3",
        tip: "grep과 wc -l 의 조합은 특정 패턴이 몇 번 나오는지 셀 때 자주 사용합니다.",
        problemId: 10, problemTitle: "특정 단어 개수 세기",
      },
    ],
  },
  {
    id: 5, title: "파일 조작", icon: "🗂️",
    commands: [
      {
        cmd: "cp", desc: "파일·디렉토리 복사",
        example: "$ cp a.txt b.txt\n$ cp -r myfolder/ backup/",
        tip: "디렉토리를 복사할 때는 -r (recursive) 옵션이 필요합니다.",
        problemId: 11, problemTitle: "파일 복사",
      },
      {
        cmd: "mv", desc: "파일·디렉토리 이동 또는 이름 변경",
        example: "$ mv a.txt b.txt       # 이름 변경\n$ mv a.txt ~/documents/ # 이동",
        tip: "이동과 이름 변경 모두 mv 하나로 처리합니다.",
        problemId: 12, problemTitle: "파일 이동(이름 변경)",
      },
      {
        cmd: "rm", desc: "파일·디렉토리 삭제",
        example: "$ rm file.txt\n$ rm -r dir/   # 디렉토리 삭제",
        tip: "⚠️ rm으로 삭제한 파일은 복구가 불가능합니다. 신중하게 사용하세요!",
        problemId: 13, problemTitle: "디렉토리 삭제",
      },
      {
        cmd: "mkdir", desc: "새 디렉토리 생성",
        example: "$ mkdir myproject\n$ mkdir -p a/b/c   # 중첩 디렉토리 생성",
        tip: "-p 옵션으로 중첩된 디렉토리를 한 번에 만들 수 있습니다.",
        problemId: 101, problemTitle: "디렉토리 생성",
      },
    ],
  },
  {
    id: 6, title: "프로세스 관리", icon: "⚙️",
    commands: [
      {
        cmd: "ps aux", desc: "실행 중인 전체 프로세스 상세 출력",
        example: "$ ps aux\nUSER  PID %CPU %MEM  COMMAND\nroot    1  0.0  0.1  /sbin/init",
        tip: "ps aux | grep 프로세스명 으로 특정 프로세스를 찾을 수 있습니다.",
        problemId: 201, problemTitle: "실행 중인 프로세스 목록",
      },
      {
        cmd: "kill", desc: "프로세스 종료",
        example: "$ kill 1234      # 일반 종료\n$ kill -9 1234   # 강제 종료",
        tip: "-9 옵션은 강제 종료로, 응답 없는 프로세스를 죽일 때 사용합니다.",
        problemId: null,
      },
    ],
  },
  {
    id: 7, title: "권한 관리", icon: "🔐",
    commands: [
      {
        cmd: "chmod", desc: "파일·디렉토리 권한 변경",
        example: "$ chmod 755 script.sh\n$ chmod +x script.sh",
        tip: "7=rwx, 5=r-x, 4=r-- 처럼 숫자로 권한을 표현합니다.",
        problemId: null,
      },
      {
        cmd: "sudo", desc: "관리자 권한으로 명령어 실행",
        example: "$ sudo apt install vim",
        tip: "⚠️ sudo는 강력한 권한이므로 신중하게 사용해야 합니다.",
        problemId: null,
      },
    ],
  },
];

export function Learn({ onSelectProblem }) {
  const [selectedChapter, setSelectedChapter] = useState(chapters[0]);
  const [expandedCmd, setExpandedCmd] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="px-4 py-5 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">리눅스 기초 학습</h2>
          <p className="text-xs text-gray-500 mt-1">문제 풀기 전에 먼저 학습하세요</p>
        </div>
        <nav className="py-4">
          {chapters.map((chapter) => (
            <button
              key={chapter.id}
              onClick={() => { setSelectedChapter(chapter); setExpandedCmd(null); }}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                selectedChapter.id === chapter.id
                  ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600 font-semibold"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <span className="text-xl">{chapter.icon}</span>
              <span className="text-sm">{chapter.title}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <span className="text-4xl">{selectedChapter.icon}</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedChapter.title}</h1>
              <p className="text-gray-500 text-sm mt-1">{selectedChapter.commands.length}개의 명령어</p>
            </div>
          </div>

          <div className="space-y-4">
            {selectedChapter.commands.map((item) => (
              <div key={item.cmd} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setExpandedCmd(expandedCmd === item.cmd ? null : item.cmd)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <code className="bg-gray-900 text-green-400 px-3 py-1 rounded font-mono text-sm font-bold">
                      {item.cmd}
                    </code>
                    <span className="text-gray-700 text-sm">{item.desc}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.problemId && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        연습문제 있음
                      </span>
                    )}
                    <span className="text-gray-400">{expandedCmd === item.cmd ? "▲" : "▼"}</span>
                  </div>
                </button>

                {expandedCmd === item.cmd && (
                  <div className="border-t border-gray-100 px-6 py-5 space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">예시</p>
                      <pre className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm whitespace-pre-wrap">
                        {item.example}
                      </pre>
                    </div>
                    <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded p-3">
                      <span className="text-sm">💡</span>
                      <p className="text-blue-700 text-sm">{item.tip}</p>
                    </div>
                    {item.problemId && (
                      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded p-4">
                        <div>
                          <p className="text-sm font-semibold text-green-800">연습문제</p>
                          <p className="text-sm text-green-700 mt-0.5">
                            {formatId(item.problemId)} · {item.problemTitle}
                          </p>
                        </div>
                        <button
                          onClick={() => onSelectProblem(item.problemId)}
                          className="bg-green-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-green-700 transition-colors"
                        >
                          문제 풀기 →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
