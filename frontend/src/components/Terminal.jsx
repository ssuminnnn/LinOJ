import { useState } from "react";

function Terminal() {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);

  const handleExecute = async () => {
    if (!input.trim()) return;
  
    try {
      const res = await fetch("http://localhost:3001/api/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          command: input.trim(),
          problemId: 1
        })
      });
  
      const text = await res.text(); // 👈 먼저 text로 받기
      console.log("RAW 응답:", text);
  
      const data = JSON.parse(text); // 👈 그 다음 파싱
      console.log("응답:", data);
  
      setHistory(prev => [
        ...prev,
        `$ ${input}`,
        data.output || "",
        data.result || data.error
      ]);
  
      setInput("");
    } catch (err) {
      console.error("에러:", err);
    }
  };

  return (
    <div
      style={{
        background: "black",
        color: "white",
        height: "100%",
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* 출력 영역 */}
      <div style={{ flex: 1, padding: "10px", overflowY: "auto" }}>
        {history.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>

      {/* 입력 영역 */}
      <input
  style={{
    width: "100%",
    padding: "10px",
    background: "black",
    color: "white",
    border: "none",
    outline: "none"
  }}
  value={input}
  placeholder="명령어 입력 (예: pwd)"
  onChange={(e) => setInput(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      console.log("엔터 눌림"); // 👈 추가
      handleExecute();
    }
  }}
/>
    </div>
  );
}

export default Terminal;