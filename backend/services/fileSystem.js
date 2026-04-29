function createInitialState() {
    return {
      currentPath: "/home/user",
      fileSystem: {
        "/": {
          home: {
            user: {}
          },
          tmp: {},
          etc: {}
        }
      }
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
    getCurrentDir
  };