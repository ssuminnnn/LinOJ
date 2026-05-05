import { useState } from "react";

export function ProblemPanel({
  problem,
  hintUsed,
  answerViewed,
  onHintUsed,
  onAnswerViewed,
  onGoToLearn,
}) {
  const [showHint, setShowHint]           = useState(hintUsed || false);
  const [showAnswer, setShowAnswer]       = useState(answerViewed || false);
  const [confirmAnswer, setConfirmAnswer] = useState(false);

  const handleHintClick = () => {
    setShowHint(true);
    if (!hintUsed) onHintUsed?.();
  };

  const handleAnswerClick = () => {
    if (!confirmAnswer) { setConfirmAnswer(true); return; }
    setShowAnswer(true);
    setConfirmAnswer(false);
    if (!answerViewed) onAnswerViewed?.();
  };

  const halfPoints = Math.floor((problem.points || 0) / 2);

  return (
    <div className="h-full bg-gray-50 p-6 overflow-y-auto">
      {/* 문제 헤더 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-blue-600 font-semibold">문제 {problem.id}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            problem.difficulty === "쉬움"   ? "bg-green-100 text-green-700"  :
            problem.difficulty === "보통"   ? "bg-yellow-100 text-yellow-700":
            problem.difficulty === "어려움" ? "bg-orange-100 text-orange-700":
            "bg-red-100 text-red-700"
          }`}>
            {problem.difficulty}
          </span>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
            {problem.points}점
          </span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{problem.title}</h2>
      </div>

      {/* 문제 설명 */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">문제 설명</h3>
        <p className="text-gray-800 leading-relaxed whitespace-pre-line">{problem.description}</p>
      </div>

      {/* 실습 환경 */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">실습 환경</h3>
        <div className="bg-white border border-gray-200 rounded p-4">
          <p className="text-sm text-gray-800">
            현재 디렉토리:{" "}
            <code className="font-mono bg-gray-100 px-1 rounded">
              {problem.environment?.cwd || "/home/user"}
            </code>
          </p>
          <p className="text-sm text-gray-800 mt-1">
            초기 파일/디렉토리: {(problem.environment?.items || []).join(", ") || "(기본 환경)"}
          </p>
          <p className="text-xs text-gray-400 mt-2">각 문제는 독립 환경에서 실행됩니다.</p>
        </div>
      </div>

      {/* 출력 예시 */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">출력 예시</h3>
        <pre className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm whitespace-pre-wrap">
          {problem.example}
        </pre>
      </div>

      {/* 힌트 영역 */}
      {problem.hint && (
        <div className="mb-3">
          {!showHint ? (
            <button
              onClick={handleHintClick}
              className="w-full flex items-center justify-between px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <span>💡</span>
                <div>
                  <p className="text-sm font-semibold text-yellow-800">힌트 보기</p>
                  {!hintUsed ? (
                    <p className="text-xs text-yellow-600">
                      힌트 사용 시 정답 획득 점수가 {problem.points}점 → {halfPoints}점으로 줄어듭니다
                    </p>
                  ) : (
                    <p className="text-xs text-yellow-600">이미 힌트를 사용한 문제입니다</p>
                  )}
                </div>
              </div>
              <span className="text-yellow-500">▼</span>
            </button>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2 mb-3">
                <span>💡</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-yellow-800 mb-1">힌트</p>
                  <p className="text-sm text-yellow-900">{problem.hint}</p>
                </div>
              </div>
              {problem.learnChapterId && (
                <button
                  onClick={() => onGoToLearn?.(problem.learnChapterId)}
                  className="text-xs bg-yellow-600 text-white px-3 py-1.5 rounded hover:bg-yellow-700 transition-colors"
                >
                  📚 학습 페이지에서 더 보기 →
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 정답 보기 영역 */}
      {!showAnswer && !answerViewed && (
        <div className="mb-3">
          {!confirmAnswer ? (
            <button
              onClick={handleAnswerClick}
              className="w-full flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-left"
            >
              <span>🔓</span>
              <div>
                <p className="text-sm font-semibold text-red-700">정답 보기</p>
                <p className="text-xs text-red-500">정답을 보면 이후 맞춰도 점수가 없습니다</p>
              </div>
            </button>
          ) : (
            <div className="bg-red-50 border border-red-300 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-800 mb-2">⚠️ 정말 정답을 보시겠습니까?</p>
              <p className="text-xs text-red-600 mb-3">
                정답 확인 후 이 문제는 영구적으로 오답 처리되며, 나중에 다시 풀어도 점수가 부여되지 않습니다.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleAnswerClick}
                  className="px-4 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                >
                  확인, 정답 보기
                </button>
                <button
                  onClick={() => setConfirmAnswer(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 정답 표시 */}
      {(showAnswer || answerViewed) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
          <p className="text-sm font-semibold text-red-700 mb-2">🔓 정답</p>
          <code className="font-mono text-sm bg-red-100 text-red-900 px-3 py-2 rounded block">
            {problem.answer}
          </code>
          <p className="text-xs text-red-400 mt-2">정답을 확인한 문제는 점수가 부여되지 않습니다.</p>
        </div>
      )}
    </div>
  );
}
