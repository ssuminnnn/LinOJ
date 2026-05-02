import { useState, useEffect, useRef } from "react";
import { Header } from "./components/Header";
import { Signup } from "./components/Signup";
import { Login } from "./components/Login";
import { ProblemList } from "./components/ProblemList";
import { MyProblems } from "./components/MyProblems";
import { Ranking } from "./components/Ranking";
import { Learn } from "./components/Learn";
import { ProblemSolve } from "./components/ProblemSolve";
import { InquiryBoard } from "./components/InquiryBoard";
import { NoticePage } from "./components/NoticePage";
import { API_URL } from "./config/api";

const API = API_URL;

export default function App() {
  const [currentPage, setCurrentPage]       = useState("loading");
  const [currentUser, setCurrentUser]       = useState(null);
  const [currentRole, setCurrentRole]       = useState("user");
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [selectedLearnChapter, setSelectedLearnChapter] = useState(null);
  // solvedProblems[id] = { isCorrect, hintUsed, answerViewed, pointsEarned }
  const [solvedProblems, setSolvedProblems] = useState({});
  // 알림
  const [notifications, setNotifications]   = useState([]);
  const [unreadCount, setUnreadCount]       = useState(0);
  const notifIntervalRef                    = useRef(null);

  // ── 새로고침 시 JWT 토큰으로 로그인 상태 복원 ─────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setCurrentPage("login"); return; }
    try {
      // JWT는 base64url 인코딩 사용 (- / _ 문자) → atob 전에 표준 base64로 변환 필요
      const base64url = token.split(".")[1];
      const base64    = base64url.replace(/-/g, "+").replace(/_/g, "/");
      const payload   = JSON.parse(atob(base64));
      if (payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        setCurrentPage("login");
        return;
      }
      setCurrentUser(payload.nickname);
      setCurrentRole(payload.role || "user");
      fetchSolvedProblems().then(() => setCurrentPage("problems"));
    } catch {
      localStorage.removeItem("token");
      setCurrentPage("login");
    }
  }, []); // eslint-disable-line

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {}
  };

  // 로그인 상태일 때 알림 폴링 (30초마다)
  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      notifIntervalRef.current = setInterval(fetchNotifications, 30000);
    }
    return () => {
      if (notifIntervalRef.current) clearInterval(notifIntervalRef.current);
    };
  }, [currentUser]); // eslint-disable-line

  const fetchSolvedProblems = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API}/problems/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setSolvedProblems(await res.json());
    } catch {}
  };

  const handleLogin = async ({ nickname, role }) => {
    setCurrentUser(nickname);
    setCurrentRole(role || "user");
    await fetchSolvedProblems();
    setCurrentPage("problems");
  };

  const handleSignup = async ({ nickname, role }) => {
    setCurrentUser(nickname);
    setCurrentRole(role || "user");
    await fetchSolvedProblems();
    setCurrentPage("problems");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setCurrentUser(null);
    setCurrentRole("user");
    setCurrentPage("login");
    setSolvedProblems({});
    setNotifications([]);
    setUnreadCount(0);
    if (notifIntervalRef.current) clearInterval(notifIntervalRef.current);
  };

  // ── 알림 읽음 처리 ────────────────────────────────────────────────────────
  const handleMarkRead = async (id) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch(`${API}/notifications/read/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch(`${API}/notifications/read-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {}
  };

  // 알림 갱신 (문의 페이지에서 호출용)
  const refreshNotifications = () => fetchNotifications();

  const handleSelectProblem = (id) => {
    setSelectedProblem(id);
    setCurrentPage("solve");
  };

  const handleBackFromSolve = () => {
    setSelectedProblem(null);
    setCurrentPage("problems");
  };

  // ── 풀이 저장 ─────────────────────────────────────────────────────────────
  const handleSolve = async (problemId, isCorrect, hintUsed = false, answerViewed = false) => {
    const prev = solvedProblems[problemId] || {};

    // 정답 보기를 했고 아직 못 푼 상태 → 목록 상태 변경 없음
    if (prev.answerViewed && !prev.isCorrect) return;

    // 이미 맞힌 문제는 오답으로 안 내려감
    if (prev.isCorrect && !isCorrect && !answerViewed) return;

    // 목록 표시: 정답 보기 후 맞춰도 ❌, 힌트 사용 후 맞추면 ✅
    const newIsCorrect = prev.isCorrect
      ? true
      : (answerViewed ? false : isCorrect);

    setSolvedProblems((p) => ({
      ...p,
      [problemId]: {
        ...p[problemId],
        isCorrect:    newIsCorrect,
        hintUsed:     hintUsed || p[problemId]?.hintUsed || false,
        answerViewed: answerViewed || p[problemId]?.answerViewed || false,
      },
    }));

    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API}/problems/solve`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ problemId, isCorrect, hintUsed, answerViewed }),
      });
      if (res.ok) {
        const data = await res.json();
        // 서버에서 실제 획득 점수를 받아서 상태 업데이트
        if (data.pointsEarned > 0) {
          setSolvedProblems((p) => ({
            ...p,
            [problemId]: { ...p[problemId], pointsEarned: data.pointsEarned },
          }));
        }
      }
    } catch {}
  };

  // ── 힌트 사용 기록 ────────────────────────────────────────────────────────
  const handleHintUsed = async (problemId) => {
    setSolvedProblems((p) => ({
      ...p,
      [problemId]: { ...p[problemId], hintUsed: true },
    }));
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch(`${API}/problems/hint`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ problemId }),
      });
    } catch {}
  };

  // ── 정답 보기 기록 ────────────────────────────────────────────────────────
  const handleAnswerViewed = async (problemId) => {
    setSolvedProblems((p) => ({
      ...p,
      [problemId]: {
        ...p[problemId],
        answerViewed: true,
        // 이미 맞힌 문제는 isCorrect 유지, 아직 못 푼 문제만 false
        isCorrect: p[problemId]?.isCorrect || false,
      },
    }));
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch(`${API}/problems/answer-viewed`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ problemId }),
      });
    } catch {}
  };

  // ── 힌트에서 학습으로 이동 ────────────────────────────────────────────────
  const handleGoToLearn = (chapterId) => {
    setSelectedLearnChapter(chapterId);
    setSelectedProblem(null);
    setCurrentPage("learn");
  };

  const handleNavigate = (page) => {
    if (["problems", "learn", "myproblems", "ranking", "notices"].includes(page)) {
      setCurrentPage(page);
    } else if (page === "inquiries" && currentUser) {
      setCurrentPage(page);
    }
  };

  // ── 로딩 화면 ─────────────────────────────────────────────────────────────
  if (currentPage === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">불러오는 중...</div>
      </div>
    );
  }

  if (currentPage === "login") {
    return <Login onLogin={handleLogin} onSwitchToSignup={() => setCurrentPage("signup")} />;
  }

  if (currentPage === "signup") {
    return <Signup onSignup={handleSignup} onSwitchToLogin={() => setCurrentPage("login")} />;
  }

  return (
    <div className="size-full flex flex-col">
      <Header
        currentUser={currentUser}
        currentRole={currentRole}
        onLogin={() => setCurrentPage("login")}
        onLogout={handleLogout}
        onNavigate={handleNavigate}
        currentPage={currentPage}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkRead={handleMarkRead}
        onMarkAllRead={handleMarkAllRead}
      />

      {currentPage === "problems" && (
        <ProblemList onSelectProblem={handleSelectProblem} solvedProblems={solvedProblems} />
      )}

      {currentPage === "myproblems" && (
        <MyProblems onSelectProblem={handleSelectProblem} solvedProblems={solvedProblems} />
      )}

      {currentPage === "learn" && (
        <Learn
          onSelectProblem={handleSelectProblem}
          initialChapterId={selectedLearnChapter}
          onChapterOpened={() => setSelectedLearnChapter(null)}
          solvedProblems={solvedProblems}
        />
      )}

      {currentPage === "ranking" && <Ranking />}

      {currentPage === "notices" && (
        <NoticePage currentRole={currentRole} />
      )}

      {currentPage === "inquiries" && (
        <InquiryBoard
          currentRole={currentRole}
          onNotificationUpdate={refreshNotifications}
        />
      )}

      {currentPage === "solve" && selectedProblem !== null && (
        <ProblemSolve
          problemId={selectedProblem}
          onBack={handleBackFromSolve}
          onSolve={handleSolve}
          onHintUsed={handleHintUsed}
          onAnswerViewed={handleAnswerViewed}
          onGoToLearn={handleGoToLearn}
          solvedProblems={solvedProblems}
        />
      )}
    </div>
  );
}
