export function ResultPanel({ result, isCorrect, hintUsed, answerViewed }) {
  return (
    <div className="h-full bg-gray-900 text-white p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">실행 결과</h3>

        {isCorrect !== null && (
          <div className="flex items-center gap-2">
            {isCorrect && answerViewed && (
              <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                정답 확인됨 · 점수 없음
              </span>
            )}
            {isCorrect && !answerViewed && hintUsed && (
              <span className="text-xs bg-yellow-900/50 text-yellow-300 px-2 py-0.5 rounded-full">
                힌트 사용 · ½점
              </span>
            )}
            <span className={`text-sm font-semibold ${isCorrect ? "text-green-400" : "text-red-400"}`}>
              {isCorrect ? "✓ 정답입니다!" : "✗ 오답입니다."}
            </span>
          </div>
        )}
      </div>

      <div className="font-mono text-sm text-gray-300 whitespace-pre-line">
        {result || "명령어를 실행하면 결과가 여기에 표시됩니다."}
      </div>
    </div>
  );
}
