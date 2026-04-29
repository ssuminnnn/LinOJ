export function ResultPanel({ result, isCorrect }) {
  return (
    <div className="h-full bg-gray-900 text-white p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">실행 결과</h3>

        {isCorrect !== null && (
          <span
            className={`text-sm font-semibold ${
              isCorrect ? "text-green-400" : "text-red-400"
            }`}
          >
            {isCorrect ? "✓ 정답입니다!" : "✗ 오답입니다."}
          </span>
        )}
      </div>

      <div className="font-mono text-sm text-gray-300 whitespace-pre-line">
        {result || "명령어를 실행하면 결과가 여기에 표시됩니다."}
      </div>
    </div>
  );
}