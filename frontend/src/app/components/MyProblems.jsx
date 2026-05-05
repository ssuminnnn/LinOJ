import { PROBLEMS, formatId } from "../data/problems";

const difficultyStyle = {
  쉬움: "bg-green-100 text-green-700",
  보통: "bg-yellow-100 text-yellow-700",
  어려움: "bg-red-100 text-red-700",
  "매우 어려움": "bg-purple-100 text-purple-700",
};

export function MyProblems({ onSelectProblem, solvedProblems = {} }) {
  const attempted     = PROBLEMS.filter((p) => solvedProblems[p.id] !== undefined);
  const correctCount  = attempted.filter((p) => solvedProblems[p.id]?.isCorrect === true).length;
  const totalPoints   = attempted.reduce((sum, p) => sum + (solvedProblems[p.id]?.pointsEarned || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">총 시도</div>
            <div className="text-3xl font-bold text-gray-900">{attempted.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">정답</div>
            <div className="text-3xl font-bold text-green-600">{correctCount}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-1">총 점수</div>
            <div className="text-3xl font-bold text-blue-600">{totalPoints}점</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">내가 푼 문제</h2>
          </div>
          {attempted.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">아직 시도한 문제가 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">결과</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">번호</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">제목</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">난이도</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">획득 점수</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">비고</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attempted.map((problem) => {
                    const info = solvedProblems[problem.id] || {};
                    return (
                      <tr
                        key={problem.id}
                        onClick={() => onSelectProblem(problem.id)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          {info.isCorrect ? (
                            <span className="text-green-600 text-xl font-bold">✓</span>
                          ) : (
                            <span className="text-red-600 text-xl font-bold">✗</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-mono text-sm text-gray-500">{formatId(problem.id)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">{problem.title}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${difficultyStyle[problem.difficulty]}`}>
                            {problem.difficulty}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                          {info.pointsEarned || 0}점
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                          {info.answerViewed && <span className="text-red-500">정답 확인</span>}
                          {!info.answerViewed && info.hintUsed && <span className="text-yellow-600">힌트 사용</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
