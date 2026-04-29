module.exports = {
    id: 1,
    description: "현재 디렉토리를 출력하세요",
    check: (command, result) => {
      return result.output === "/home/user";
    }
  };