import { useState } from "react";
import { Header } from "./components/Header";
import { Signup } from "./components/Signup";
import { Login } from "./components/Login";
import { ProblemList } from "./components/ProblemList";
import { MyProblems } from "./components/MyProblems";
import { Ranking } from "./components/Ranking";
import { Learn } from "./components/Learn";
import { ProblemSolve } from "./components/ProblemSolve";
import { InquiryBoard } from "./components/InquiryBoard";
import { API_URL } from "./config/api";

const API = API_URL;

export default function App() {
  const [currentPage, setCurrentPage] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRole, setCurrentRole] = useState("user");
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [solvedProblems, setSolvedProblems] = useState({});

  const fetchSolvedProblems = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`${API}/problems/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSolvedProblems(data);
      }
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
  };

  const handleSelectProblem = (id) => {
    setSelectedProblem(id);
    setCurrentPage("solve");
  };

  const handleBackFromSolve = () => {
    setSelectedProblem(null);
    setCurrentPage("problems");
  };

  const handleSolve = async (problemId, isCorrect) => {
    setSolvedProblems((prev) => ({ ...prev, [problemId]: isCorrect }));

    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      await fetch(`${API}/problems/solve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ problemId, isCorrect }),
      });
    } catch {}
  };

  const handleNavigate = (page) => {
    const canAccessInquiries = currentRole === "admin" || currentRole === "super_admin";
    if (["problems", "learn", "myproblems", "ranking"].includes(page)) {
      setCurrentPage(page);
      return;
    }
    if (page === "inquiries" && canAccessInquiries) {
      setCurrentPage(page);
    }
  };

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
      />

      {currentPage === "problems" && (
        <ProblemList onSelectProblem={handleSelectProblem} solvedProblems={solvedProblems} />
      )}

      {currentPage === "myproblems" && (
        <MyProblems onSelectProblem={handleSelectProblem} solvedProblems={solvedProblems} />
      )}

      {currentPage === "learn" && <Learn onSelectProblem={handleSelectProblem} />}

      {currentPage === "ranking" && <Ranking />}

      {currentPage === "inquiries" && <InquiryBoard />}

      {currentPage === "solve" && selectedProblem !== null && (
        <ProblemSolve
          problemId={selectedProblem}
          onBack={handleBackFromSolve}
          onSolve={handleSolve}
        />
      )}
    </div>
  );
}
