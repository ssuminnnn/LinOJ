import { useEffect, useState } from "react";

export function Ranking() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://linoj-backend.onrender.com/api/problems/ranking")
      .then((res) => res.json())
      .then((data) => setRankings(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">랭킹</h2>
            <p className="text-sm text-gray-600 mt-1">
              총 점수 기준으로 순위가 결정됩니다
            </p>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="px-6 py-12 text-center text-gray-500">불러오는 중...</div>
            ) : rankings.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">아직 등록된 사용자가 없습니다.</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-24">
                      순위
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      닉네임
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                      해결한 문제
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">
                      총 점수
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rankings.map((user) => (
                    <tr
                      key={user.rank}
                      className={`${user.rank <= 3 ? "bg-blue-50" : ""} hover:bg-gray-50 transition-colors`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          {user.rank === 1 && <span className="text-2xl">🥇</span>}
                          {user.rank === 2 && <span className="text-2xl">🥈</span>}
                          {user.rank === 3 && <span className="text-2xl">🥉</span>}
                          {user.rank > 3 && (
                            <span className="text-lg font-semibold text-gray-600">{user.rank}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{user.username}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700">
                        {user.solvedCount}개
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-lg font-bold text-blue-600">{user.totalPoints}점</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
