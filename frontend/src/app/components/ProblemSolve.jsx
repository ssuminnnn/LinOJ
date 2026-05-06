import { useState, useEffect, useRef, useCallback } from "react";
import { PROBLEM_MAP, formatId } from "../data/problems";
import { ProblemPanel } from "./ProblemPanel";
import { TerminalPanel } from "./TerminalPanel";
import { ResultPanel } from "./ResultPanel";
import { API_URL } from "../config/api";

function generateSessionId() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function ProblemSolve({
  problemId, onBack, onSolve,
  onHintUsed, onAnswerViewed, onGoToLearn,
  onNextProblem, hasNextProblem,
  onPrevProblem, hasPrevProblem,
  solvedProblems = {},
}) {
  const [result, setResult]       = useState("");
  const [isCorrect, setIsCorrect] = useState(null);
  const sessionIdRef              = useRef(generateSessionId());

  const currentProblem = PROBLEM_MAP[problemId] || PROBLEM_MAP[1];
  const problemInfo    = solvedProblems[problemId] || {};

  // 힌트/정답 상태 (DB에서 불러온 값으로 초기화)
  const [hintUsed,     setHintUsed]     = useState(problemInfo.hintUsed     || false);
  const [answerViewed, setAnswerViewed] = useState(problemInfo.answerViewed || false);

  // ── 맥북 트랙패드 두 손가락 스와이프 뒤로가기 ──────────────────────────
  // pushState에 #solving 해시를 붙여 두 히스토리 엔트리 URL이 달라야 Chrome이 스와이프 완료
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    const base = window.location.href.split("#")[0];
    // React StrictMode에서 effect 두 번 실행 → 이미 #solving이면 replaceState로 중복 방지
    if (window.location.hash === "#solving") {
      window.history.replaceState({ page: "solve" }, "", base + "#solving");
    } else {
      window.history.pushState({ page: "solve" }, "", base + "#solving");
    }
    const handlePop = () => onBackRef.current();
    window.addEventListener("popstate", handlePop);
    return () => {
      window.removeEventListener("popstate", handlePop);
      // 컴포넌트 언마운트 시 해시 제거
      if (window.location.hash === "#solving") {
        window.history.replaceState({}, "", window.location.href.split("#")[0]);
      }
    };
  }, []); // eslint-disable-line

  // 문제가 바뀌면 상태 리셋
  useEffect(() => {
    const prev = solvedProblems[problemId] || {};
    setHintUsed(prev.hintUsed     || false);
    setAnswerViewed(prev.answerViewed || false);
    setResult("");
    setIsCorrect(null);

    // 이전 세션 정리 + 새 세션
    const prevId = sessionIdRef.current;
    fetch(`${API_URL}/execute/cleanup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: prevId }),
    }).catch(() => {});
    sessionIdRef.current = generateSessionId();
  }, [problemId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 언마운트 시 세션 정리
  useEffect(() => {
    const sessionId = sessionIdRef.current;
    return () => {
      fetch(`${API_URL}/execute/cleanup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      }).catch(() => {});
    };
  }, []);

  // 힌트 클릭
  const handleHintUsed = useCallback(() => {
    setHintUsed(true);
    onHintUsed(problemId);
  }, [problemId, onHintUsed]);

  // 정답 보기 클릭
  const handleAnswerViewed = useCallback(() => {
    setAnswerViewed(true);
    setIsCorrect(null);
    onAnswerViewed(problemId);
  }, [problemId, onAnswerViewed]);

  // 명령어 실행
  const handleExecute = useCallback(async (command) => {
    try {
      const res = await fetch(`${API_URL}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          command: command.trim(),
          problemId,
          sessionId: sessionIdRef.current,
        }),
      });
      const data = await res.json();

      if (data.blocked) {
        setIsCorrect(null);
        setResult(data.output);
        return { blocked: true, output: data.output };
      }

      // 터미널에선 실제 명령어 정오 여부 그대로 표시 (예외 없음)
      setIsCorrect(data.isCorrect);
      setResult(
        data.output ||
        (data.isCorrect ? currentProblem.example : `'${command}': 명령어를 확인하세요.`)
      );

      onSolve(problemId, data.isCorrect, hintUsed, answerViewed);

      return { blocked: false, output: data.output, isCorrect: data.isCorrect };
    } catch {
      const correct = command.trim() === currentProblem.answer;
      setIsCorrect(correct);
      setResult(correct ? currentProblem.example : `'${command}': 명령어를 확인하세요.`);
      onSolve(problemId, correct, hintUsed, answerViewed);
      return { blocked: false, output: "", isCorrect: correct };
    }
  }, [problemId, currentProblem, onSolve, hintUsed, answerViewed]);

  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4">
        <button onClick={onBack} className="text-gray-600 hover:text-blue-600 transition-colors">
          ← 문제 목록
        </button>
        <span className="text-gray-300">|</span>
        <span className="font-mono text-sm text-gray-500">{formatId(currentProblem.id)}</span>
        <span className="font-semibold text-gray-900">{currentProblem.title}</span>
        {hintUsed && !answerViewed && (
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">힌트 사용</span>
        )}
        {answerViewed && (
          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">정답 확인 (점수 없음)</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {hasPrevProblem && (
            <button
              onClick={onPrevProblem}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-full hover:bg-gray-200 transition-colors"
            >
              ← 이전 문제
            </button>
          )}
          {hasNextProblem && (
            <button
              onClick={onNextProblem}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 transition-colors"
            >
              다음 문제 →
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[60%] border-r border-gray-200">
          <ProblemPanel
            problem={currentProblem}
            hintUsed={hintUsed}
            answerViewed={answerViewed}
            onHintUsed={handleHintUsed}
            onAnswerViewed={handleAnswerViewed}
            onGoToLearn={onGoToLearn}
          />
        </div>
        <div className="w-[40%] flex flex-col">
          <div className="h-[70%] border-b border-gray-700">
            <TerminalPanel onExecute={handleExecute} />
          </div>
          <div className="h-[30%]">
            <ResultPanel
              result={result}
              isCorrect={isCorrect}
              hintUsed={hintUsed}
              answerViewed={answerViewed}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
