import { useState } from "react";
import { PROBLEM_MAP, formatId } from "../data/problems";
import { ProblemPanel } from "./ProblemPanel";
import { TerminalPanel } from "./TerminalPanel";
import { ResultPanel } from "./ResultPanel";
import { API_URL } from "../config/api";

export function ProblemSolve({ problemId, onBack, onSolve }) {
  const [history, setHistory] = useState([]);
  const [result, setResult] = useState("");
  const [isCorrect, setIsCorrect] = useState(null);

  const currentProblem = PROBLEM_MAP[problemId] || PROBLEM_MAP[1];

  const handleExecute = async (command) => {
    setHistory((prev) => [...prev, `$ ${command}`]);

    try {
      const res = await fetch(`${API_URL}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: command.trim(), problemId }),
      });
      const data = await res.json();
      const output = data.output || data.error || "";
      setHistory((prev) => [...prev, output]);

      const correct = command.trim() === currentProblem.answer;
      setIsCorrect(correct);
      setResult(output || (correct ? currentProblem.example : `'${command}': 명령어를 확인하세요.`));
      onSolve(problemId, correct);
    } catch {
      const correct = command.trim() === currentProblem.answer;
      setIsCorrect(correct);
      setResult(correct ? currentProblem.example : `'${command}': 명령어를 확인하세요.`);
      onSolve(problemId, correct);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button onClick={onBack} className="text-gray-600 hover:text-blue-600 transition-colors">
          ← 문제 목록
        </button>
        <span className="text-gray-300">|</span>
        <span className="font-mono text-sm text-gray-500">{formatId(currentProblem.id)}</span>
        <span className="font-semibold text-gray-900">{currentProblem.title}</span>
      </header>

      <div className="flex-1 flex overflow-hidden">
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
    </div>
  );
}
