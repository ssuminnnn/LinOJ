import { useState } from "react";
import { ProblemPanel } from "./ProblemPanel";
import { TerminalPanel } from "./TerminalPanel";
import { ResultPanel } from "./ResultPanel";

export function ProblemSolve({ problemId, onBack, onSolve }) {
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState("");
  const [isCorrect, setIsCorrect] = useState(null);

  const problems = {
    1: {
      id: 1,
      title: "현재 디렉토리 출력",
      description:
        "현재 작업 중인 디렉토리의 전체 경로를 출력하는 명령어를 입력하세요.\n\n이 명령어는 시스템에서 현재 위치를 확인할 때 사용됩니다.",
      example: "/home/user",
    },
    2: {
      id: 2,
      title: "파일 목록 보기",
      description:
        "현재 디렉토리에 있는 모든 파일과 폴더의 목록을 자세히 출력하는 명령어를 입력하세요.\n\n긴 형식으로 출력하여 권한, 소유자, 크기 등의 정보를 포함해야 합니다.",
      example:
        "drwxr-xr-x 2 user user 4096 Apr 29 10:00 documents\n-rw-r--r-- 1 user user  256 Apr 29 09:30 readme.txt",
    },
    3: {
      id: 3,
      title: "새 디렉토리 만들기",
      description:
        "'myproject'라는 이름의 새 디렉토리를 생성하는 명령어를 입력하세요.\n\n디렉토리 생성 후 확인할 수 있어야 합니다.",
      example: "디렉토리 'myproject'가 생성되었습니다.",
    },
  };

  const currentProblem = problems[problemId] || problems[1];

  const handleExecute = async (command) => {
    const newHistory = [...history, `$ ${command}`];
    setHistory(newHistory);

    try {
      const res = await fetch("http://localhost:3001/api/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          command: command,
          problemId: problemId,
        }),
      });

      const data = await res.json();

      setResult(data.output);

      const correct = data.result === "정답입니다.";
      setIsCorrect(correct);

      if (onSolve) {
        onSolve(problemId, correct);
      }
    } catch (err) {
      console.error("에러:", err);
      setResult("서버 연결 실패");
      setIsCorrect(false);
    }
  };

  return (
    <div className="flex flex-1">
      <div className="w-[60%] border-r border-gray-200">
        <ProblemPanel problem={currentProblem} />
      </div>

      <div className="w-[40%] flex flex-col">
        <div className="h-[70%] border-b border-gray-700">
          <TerminalPanel onExecute={handleExecute} history={history} />
        </div>
        <div className="h-[30%]">
          <ResultPanel result={result} isCorrect={isCorrect} />
        </div>
      </div>
    </div>
  );
}