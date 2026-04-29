import { useParams } from "react-router-dom";
import Terminal from "../components/Terminal";

function ProblemSolvePage() {
  const { id } = useParams();

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      
      {/* 왼쪽 */}
      <div style={{ width: "50%", padding: "20px" }}>
        <h2>문제 {id}</h2>
        <p>문제 설명</p>
        <p>출력 예시</p>
      </div>

      {/* 오른쪽 */}
      <div style={{ width: "50%" }}>
        <Terminal problemId={Number(id)} />
      </div>

    </div>
  );
}

export default ProblemSolvePage;