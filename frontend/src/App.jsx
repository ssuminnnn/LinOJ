import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProblemListPage from "./pages/ProblemListPage";
import ProblemSolvePage from "./pages/ProblemSolvePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProblemListPage />} />
        <Route path="/problem/:id" element={<ProblemSolvePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;