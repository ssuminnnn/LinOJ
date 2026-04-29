export function ProblemPanel({ problem }) {
  return (
    <div className="h-full bg-gray-50 p-6 overflow-y-auto">
      <div className="mb-6">
        <div className="text-blue-600 font-semibold mb-2">
          문제 {problem.id}
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          {problem.title}
        </h2>
      </div>

      <div className="mb-8">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          문제 설명
        </h3>
        <p className="text-gray-800 leading-relaxed whitespace-pre-line">
          {problem.description}
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          출력 예시
        </h3>
        <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm">
          {problem.example}
        </div>
      </div>
    </div>
  );
}