import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

function makePrompt(cwd) {
  // /home/user → ~  /home/user/docs → ~/docs
  const display = cwd === "/home/user"
    ? "~"
    : cwd.startsWith("/home/user/")
    ? "~" + cwd.slice("/home/user".length)
    : cwd;
  return `\x1b[32muser@linoj\x1b[0m:\x1b[34m${display}\x1b[0m$ `;
}

export function TerminalPanel({ onExecute }) {
  const containerRef = useRef(null);
  const termRef = useRef(null);
  const inputRef = useRef("");
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const isLoadingRef = useRef(false);
  const cwdRef = useRef("/home/user");        // 현재 가상 경로
  const onExecuteRef = useRef(onExecute);
  const [loadingVisible, setLoadingVisible] = useState(false);

  useEffect(() => {
    onExecuteRef.current = onExecute;
  }, [onExecute]);

  useEffect(() => {
    if (!containerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: '"JetBrains Mono", "Fira Code", "Consolas", monospace',
      theme: {
        background: "#0d1117",
        foreground: "#c9d1d9",
        cursor: "#58a6ff",
        green: "#3fb950",
        brightGreen: "#3fb950",
        blue: "#58a6ff",
        brightBlue: "#58a6ff",
      },
      scrollback: 1000,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    fitAddon.fit();
    termRef.current = term;

    // 환영 메시지
    term.write("\x1b[90mLinOJ Terminal — 리눅스 명령어를 입력하세요\x1b[0m\r\n");
    term.write("\x1b[90m────────────────────────────────────────\x1b[0m\r\n");
    term.write(makePrompt(cwdRef.current));

    // 명령어 실행
    const runCommand = async (cmd) => {
      if (!cmd.trim()) {
        term.write("\r\n" + makePrompt(cwdRef.current));
        return;
      }

      // 히스토리
      historyRef.current.unshift(cmd);
      if (historyRef.current.length > 100) historyRef.current.pop();
      historyIndexRef.current = -1;

      isLoadingRef.current = true;
      setLoadingVisible(true);
      term.write("\r\n");

      try {
        const result = await onExecuteRef.current(cmd);

        if (result?.blocked) {
          term.write("\x1b[31m" + (result.output || "") + "\x1b[0m");
        } else if (result?.output !== undefined && result.output !== "") {
          term.write(result.output);
        }

        // cwd 업데이트
        if (result?.cwd) cwdRef.current = result.cwd;

      } catch {
        term.write("\x1b[31m연결 오류가 발생했습니다.\x1b[0m");
      } finally {
        isLoadingRef.current = false;
        setLoadingVisible(false);
        term.write("\r\n" + makePrompt(cwdRef.current));
      }
    };

    // 키 입력
    term.onKey(({ key, domEvent }) => {
      if (isLoadingRef.current) return;

      const keyCode = domEvent.keyCode;
      const ctrl = domEvent.ctrlKey;

      if (ctrl && keyCode === 67) {   // Ctrl+C
        inputRef.current = "";
        term.write("^C\r\n" + makePrompt(cwdRef.current));
        return;
      }
      if (ctrl && keyCode === 76) {   // Ctrl+L
        term.clear();
        term.write(makePrompt(cwdRef.current) + inputRef.current);
        return;
      }
      if (keyCode === 13) {           // Enter
        const cmd = inputRef.current;
        inputRef.current = "";
        runCommand(cmd);
        return;
      }
      if (keyCode === 8) {            // Backspace
        if (inputRef.current.length > 0) {
          inputRef.current = inputRef.current.slice(0, -1);
          term.write("\b \b");
        }
        return;
      }
      if (keyCode === 38) {           // ↑ 히스토리
        const hist = historyRef.current;
        if (historyIndexRef.current < hist.length - 1) {
          historyIndexRef.current++;
          const entry = hist[historyIndexRef.current];
          term.write("\b \b".repeat(inputRef.current.length));
          inputRef.current = entry;
          term.write(entry);
        }
        return;
      }
      if (keyCode === 40) {           // ↓ 히스토리
        if (historyIndexRef.current > 0) {
          historyIndexRef.current--;
          const entry = historyRef.current[historyIndexRef.current];
          term.write("\b \b".repeat(inputRef.current.length));
          inputRef.current = entry;
          term.write(entry);
        } else if (historyIndexRef.current === 0) {
          historyIndexRef.current = -1;
          term.write("\b \b".repeat(inputRef.current.length));
          inputRef.current = "";
        }
        return;
      }

      // 일반 문자
      const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;
      if (printable && key.length === 1) {
        inputRef.current += key;
        term.write(key);
      }
    });

    // ── 붙여넣기 핸들러 ──────────────────────────────────────────────────────
    const doPaste = (text) => {
      if (!text || isLoadingRef.current) return;
      const clean = text.replace(/\r?\n|\r/g, " "); // 줄바꿈 → 공백
      inputRef.current += clean;
      term.write(clean);
    };

    // Cmd+V / Ctrl+V 처리 중 플래그 (paste 이벤트 중복 방지)
    let keyboardPasteInProgress = false;

    // Ctrl+V / Cmd+V — xterm 기본 처리 전에 가로채기
    term.attachCustomKeyEventHandler((e) => {
      if (e.type !== "keydown") return true;
      if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        keyboardPasteInProgress = true;
        navigator.clipboard.readText()
          .then(doPaste)
          .catch(() => {})
          .finally(() => { keyboardPasteInProgress = false; });
        return false; // xterm이 이 키를 처리하지 않도록 막음
      }
      return true;
    });

    // paste 이벤트 (우클릭 → 붙여넣기 — Ctrl+V/Cmd+V 경로와 중복 방지)
    const handlePaste = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (keyboardPasteInProgress) return; // Ctrl+V/Cmd+V가 이미 처리 중이면 무시
      const text = e.clipboardData?.getData("text") || "";
      doPaste(text);
    };

    // xterm 내부 textarea에 직접 붙임 (xterm이 포커스를 가져가도 동작)
    if (term.textarea) term.textarea.addEventListener("paste", handlePaste);
    containerRef.current.addEventListener("paste", handlePaste);

    // 리사이즈
    const observer = new ResizeObserver(() => {
      try { fitAddon.fit(); } catch (_) {}
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      if (containerRef.current) {
        containerRef.current.removeEventListener("paste", handlePaste);
      }
      if (term.textarea) term.textarea.removeEventListener("paste", handlePaste);
      term.dispose();
      termRef.current = null;
    };
  }, []);

  return (
    <div className="h-full bg-[#0d1117] flex flex-col">
      {loadingVisible && (
        <div className="px-3 py-1 bg-blue-900/30 text-blue-300 text-xs font-mono border-b border-blue-800/50">
          ⏳ 실행 중...
        </div>
      )}
      <div ref={containerRef} className="flex-1 p-2 overflow-hidden" />
    </div>
  );
}
