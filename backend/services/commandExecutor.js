function execute(command, state) {
  const cmd = command.trim();
  const tree = state.tree || {};
  const currentPath = state.currentPath || "/home/user";
  const entries = tree[currentPath] || [];

  const visibleEntries = entries.filter((entry) => !entry.hidden);
  const formatLs = () => visibleEntries.map((entry) => entry.name).join("  ");
  const formatLsA = () => [".", "..", ...entries.map((entry) => entry.name)].join("  ");
  const formatLsL = () =>
    visibleEntries
      .map((entry) => {
        if (entry.type === "dir") {
          return `drwxr-xr-x 2 user user 4096 Apr 29 ${entry.name}`;
        }
        return `-rw-r--r-- 1 user user ${String(entry.size || 256).padStart(4, " ")} Apr 29 ${entry.name}`;
      })
      .join("\n");

  const resolvePath = (base, target) => {
    if (!target || target === "~") return "/home/user";
    const initial = target.startsWith("/") ? [] : base.split("/").filter(Boolean);
    target.split("/").forEach((part) => {
      if (!part || part === ".") return;
      if (part === "..") {
        if (initial.length > 0) initial.pop();
        return;
      }
      initial.push(part);
    });
    return `/${initial.join("/")}` || "/";
  };

  if (cmd.startsWith("cd")) {
    const [, rawTarget] = cmd.split(/\s+/, 2);
    const nextPath = resolvePath(currentPath, rawTarget);
    if (!Object.prototype.hasOwnProperty.call(tree, nextPath)) {
      return { output: `cd: no such file or directory: ${rawTarget || "~"}`, state };
    }
    state.currentPath = nextPath;
    return { output: "", state };
  }

  const outputs = {
    pwd: currentPath,
    ls: formatLs(),
    "ls -l": formatLsL(),
    "ls -a": formatLsA(),
    "cat file.txt": "Hello, Linux!\nWelcome to the world of commands.",
    "head -n 5 file.txt": "line1\nline2\nline3\nline4\nline5",
    "tail -n 5 file.txt": "line6\nline7\nline8\nline9\nline10",
    "ls | wc -l": String(visibleEntries.length),
    "grep error file.txt": "error: file not found\nerror: permission denied",
    "grep error file.txt | wc -l": "3",
    "cp a.txt b.txt": "",
    "mv a.txt b.txt": "",
    "rm -r dir": "",
    "mkdir myproject": "",
    "find . -name '*.txt'": "./readme.txt\n./notes/todo.txt",
    "kill 1234": "",
    "chmod +x script.sh": "",
    "sudo apt update": "",
    "ps aux":
      "USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\nroot         1  0.0  0.1  16952  1076 ?        Ss   10:00   0:00 /sbin/init",
  };

  if (Object.prototype.hasOwnProperty.call(outputs, cmd)) {
    return { output: outputs[cmd], state };
  }

  return {
    output: "command not found",
    state,
  };
}

module.exports = {
  execute,
};