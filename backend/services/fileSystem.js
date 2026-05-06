function createInitialState(problemId) {
  const scenarios = {
    basic: {
      "/home/user": [
        { name: "documents", type: "dir" },
        { name: "downloads", type: "dir" },
        { name: "readme.txt", type: "file", size: 256 },
        { name: ".bashrc", type: "file", hidden: true, size: 128 },
      ],
      "/home/user/documents": [],
      "/home/user/downloads": [],
    },
    fileTxt: {
      "/home/user": [{ name: "file.txt", type: "file", size: 320 }],
    },
    fileOps: {
      "/home/user": [
        { name: "a.txt", type: "file", size: 120 },
        { name: "dir", type: "dir" },
      ],
      "/home/user/dir": [],
    },
    searchTxt: {
      "/home/user": [
        { name: "readme.txt", type: "file", size: 256 },
        { name: "notes", type: "dir" },
      ],
      "/home/user/notes": [{ name: "todo.txt", type: "file", size: 80 }],
    },
    permission: {
      "/home/user": [{ name: "script.sh", type: "file", size: 90 }],
    },
  };

  const scenarioByProblem = {
    5: "fileTxt",
    6: "fileTxt",
    7: "fileTxt",
    9: "fileTxt",
    10: "fileTxt",
    11: "fileOps",
    12: "fileOps",
    13: "fileOps",
    102: "searchTxt",
    301: "permission",
    302: "permission",
  };

  const scenarioName = scenarioByProblem[problemId] || "basic";
  const tree = {};
  Object.entries(scenarios[scenarioName]).forEach(([path, entries]) => {
    tree[path] = entries.map((entry) => ({ ...entry }));
  });

  return {
    currentPath: "/home/user",
    tree,
    fileSystem: {
      "/": {
        home: {
          user: {},
        },
        tmp: {},
        etc: {},
      },
    },
  };
}
  
  // 현재 디렉토리 가져오기
  function getCurrentDir(state) {
    const paths = state.currentPath.split("/").filter(Boolean);
  
    let current = state.fileSystem["/"];
  
    for (const p of paths) {
      current = current[p];
    }
  
    return current;
  }
  
module.exports = {
  createInitialState,
  getCurrentDir,
};