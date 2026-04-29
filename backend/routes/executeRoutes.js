const express = require("express");
const router = express.Router();

const { execute } = require("../services/commandExecutor");
const { createInitialState } = require("../services/fileSystem");
const problems = require("../data/problems");

router.post("/", (req, res) => {
  // 👇 여기 추가 (제일 먼저)
  console.log("BODY:", req.body);

  const { command, problemId } = req.body;

  console.log("DEBUG:", command, problemId);

  const state = createInitialState();
  const result = execute(command, state);

  const problem = problems.find(p => p.id === Number(problemId));

  if (!problem) {
    return res.status(400).json({
      error: "문제를 찾을 수 없습니다"
    });
  }

  const isCorrect = problem.check(command, result);

  res.json({
    output: result.output,
    result: isCorrect ? "정답입니다." : "오답입니다."
  });
});

module.exports = router;