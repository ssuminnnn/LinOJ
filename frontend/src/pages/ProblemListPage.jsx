import { Link } from "react-router-dom";

function ProblemListPage() {
  const problems = [
    { id: 1, title: "현재 디렉토리 출력" },
    { id: 2, title: "파일 생성" }
  ];

  return (
    <div>
      <h1>문제 목록</h1>
      {problems.map(p => (
        <div key={p.id}>
          <Link to={`/problem/${p.id}`}>
            {p.id}. {p.title}
          </Link>
        </div>
      ))}
    </div>
  );
}

export default ProblemListPage;