export function Header({ currentUser, currentRole, onLogin, onLogout, onNavigate, currentPage }) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1
            onClick={() => onNavigate("problems")}
            className="text-2xl font-bold text-blue-600 cursor-pointer"
          >
            LinOJ
          </h1>
          <nav className="flex gap-6">
            <button
              onClick={() => onNavigate("problems")}
              className={`transition-colors ${
                currentPage === "problems"
                  ? "text-blue-600 font-semibold"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              문제
            </button>

            {currentUser && (
              <button
                onClick={() => onNavigate("myproblems")}
                className={`transition-colors ${
                  currentPage === "myproblems"
                    ? "text-blue-600 font-semibold"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                내 문제
              </button>
            )}

            <button
              onClick={() => onNavigate("learn")}
              className={`transition-colors ${
                currentPage === "learn"
                  ? "text-blue-600 font-semibold"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              학습
            </button>

            <button
              onClick={() => onNavigate("ranking")}
              className={`transition-colors ${
                currentPage === "ranking"
                  ? "text-blue-600 font-semibold"
                  : "text-gray-600 hover:text-blue-600"
              }`}
            >
              랭킹
            </button>

            {(currentRole === "admin" || currentRole === "super_admin") && (
              <button
                onClick={() => onNavigate("inquiries")}
                className={`transition-colors ${
                  currentPage === "inquiries"
                    ? "text-blue-600 font-semibold"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                문의
              </button>
            )}
          </nav>
        </div>

        <div>
          {currentUser ? (
            <div className="flex items-center gap-4">
              <span className="text-gray-700 font-medium">{currentUser}님</span>
              <button
                onClick={onLogout}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              로그인
            </button>
          )}
        </div>
      </div>
    </header>
  );
}