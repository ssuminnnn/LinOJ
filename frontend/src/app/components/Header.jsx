import { useState, useEffect, useRef } from "react";

export function Header({
  currentUser, currentRole, onLogin, onLogout, onNavigate, currentPage,
  notifications = [], unreadCount = 0, onMarkRead, onMarkAllRead,
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleNotifClick = (notif) => {
    if (!notif.is_read) onMarkRead?.(notif.id);
    if (notif.type === "announcement" && notif.related_id) {
      onNavigate?.("notices");
    } else if (notif.type === "new_inquiry" || notif.type === "new_reply") {
      onNavigate?.("inquiries");
    }
    setNotifOpen(false);
  };

  const typeLabel = (type) => {
    if (type === "new_inquiry") return "📩";
    if (type === "new_reply")   return "💬";
    return "📢";
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* 로고 + 내비게이션 */}
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
                currentPage === "problems" ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-blue-600"
              }`}
            >
              문제
            </button>

            {currentUser && (
              <button
                onClick={() => onNavigate("myproblems")}
                className={`transition-colors ${
                  currentPage === "myproblems" ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-blue-600"
                }`}
              >
                내 문제
              </button>
            )}

            <button
              onClick={() => onNavigate("learn")}
              className={`transition-colors ${
                currentPage === "learn" ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-blue-600"
              }`}
            >
              학습
            </button>

            <button
              onClick={() => onNavigate("ranking")}
              className={`transition-colors ${
                currentPage === "ranking" ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-blue-600"
              }`}
            >
              랭킹
            </button>

            {currentUser && (
              <button
                onClick={() => onNavigate("notices")}
                className={`transition-colors ${
                  currentPage === "notices" ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-blue-600"
                }`}
              >
                공지
              </button>
            )}

            {currentUser && (
              <button
                onClick={() => onNavigate("inquiries")}
                className={`transition-colors ${
                  currentPage === "inquiries" ? "text-blue-600 font-semibold" : "text-gray-600 hover:text-blue-600"
                }`}
              >
                문의
              </button>
            )}
          </nav>
        </div>

        {/* 알림 벨 + 사용자 영역 */}
        <div className="flex items-center gap-3">

          {/* 알림 벨 (로그인 시) */}
          {currentUser && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen((o) => !o)}
                className="relative p-2 text-gray-500 hover:text-blue-600 transition-colors"
                aria-label="알림"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* 알림 드롭다운 */}
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white shadow-xl rounded-xl border border-gray-200 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <span className="font-semibold text-gray-900 text-sm">알림</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => { onMarkAllRead?.(); }}
                        className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        모두 읽음
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-gray-400 text-sm">
                        알림이 없습니다.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => handleNotifClick(n)}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                            !n.is_read ? "bg-blue-50" : ""
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-base mt-0.5">{typeLabel(n.type)}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate ${!n.is_read ? "text-blue-900" : "text-gray-800"}`}>
                                {n.title}
                              </p>
                              {n.message && (
                                <p className="text-xs text-gray-500 mt-0.5 truncate">{n.message}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(n.created_at).toLocaleString("ko-KR")}
                              </p>
                            </div>
                            {!n.is_read && (
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 사용자 영역 */}
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
