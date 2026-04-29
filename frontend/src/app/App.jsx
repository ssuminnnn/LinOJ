import { useState } from "react";
import { Header } from "./components/Header";
import { Signup } from "./components/Signup";
import { Login } from "./components/Login";
import { ProblemList } from "./components/ProblemList";
import { MyProblems } from "./components/MyProblems";
import { Ranking } from "./components/Ranking";
import { Learn } from "./components/Learn";
import { ProblemSolve } from "./components/ProblemSolve";

const API = "http://localhost:3001/api";

export default function App() {
  const [currentPage, setCurrentPage] = useState("login");
  const [currentUser, setCurrentUser] = useState(null);
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

  const handleLogin = async (nickname) => {
    setCurrentUser(nickname);
    await fetchSolvedProblems();
    setCurrentPage("problems");
  };

  const handleSignup = async (nickname) => {
    setCurrentUser(nickname);
    await fetchSolvedProblems();
    setCurrentPage("problems");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setCurrentUser(null);
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
    if (["problems", "learn", "myproblems", "ranking"].includes(page)) {
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
