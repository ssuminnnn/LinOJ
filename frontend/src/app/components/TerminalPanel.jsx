import { useState } from "react";

export function TerminalPanel({ onExecute, history }) {
  const [command, setCommand] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (command.trim()) {
      onExecute(command);
      setCommand("");
    }
  };

  return (
    <div className="h-full bg-black text-white flex flex-col">
      <div className="flex-1 p-4 overflow-y-auto font-mono text-sm">
        {history.map((line, index) => (
          <div key={index} className="mb-1">
            {line}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="border-t border-gray-700 p-4">
        <div className="flex items-center gap-2">
          <span className="text-green-400">$</span>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            className="flex-1 bg-transparent outline-none text-white font-mono"
            placeholder="리눅스 명령어를 입력하세요..."
            autoFocus
          />
        </div>
      </form>
    </div>
  );
}