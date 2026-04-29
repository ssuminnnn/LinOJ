const { getCurrentDir } = require("./fileSystem");

function handlePwd(state) {
  return state.currentPath;
}

function execute(command, state) {
  const cmd = command.trim();

  if (cmd === "pwd") {
    return {
      output: handlePwd(state),
      state
    };
  }

  return {
    output: "command not found",
    state
  };
}

module.exports = {
  execute
};