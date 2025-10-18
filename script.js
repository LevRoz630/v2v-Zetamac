document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const views = {
    settings: document.getElementById("settings-view"),
    game: document.getElementById("game-view"),
    results: document.getElementById("results-view"),
  };
  // Game View Elements
  const startBtn = document.getElementById("start-btn");
  const timerDisplay = document.getElementById("timer");
  const scoreDisplay = document.getElementById("score");
  const problemText = document.getElementById("problem-text");
  const answerInput = document.getElementById("answer-input");

  // Results View Elements
  const finalScoreVal = document.getElementById("final-score-val");
  const totalTimeVal = document.getElementById("total-time-val");
  const avgTimeVal = document.getElementById("avg-time-val");
  const tryAgainBtn = document.getElementById("try-again-btn");
  const changeSettingsBtn = document.getElementById("change-settings-btn");
  const analysisTableBody = document.querySelector("#analysis-table tbody");
  const analysisSummary = document.getElementById("analysis-summary");
  const practiceProblemText = document.getElementById("practice-problem-text");
  const practiceAnswerInput = document.getElementById("practice-answer-input");

  // Game State
  let gameSettings = {};
  let score = 0;
  let timeLeft = 0;
  let timerInterval = null;
  let currentProblem = null;
  let problemHistory = [];
  let questionStartTime = 0;
  let currentAttempts = [];

  // NEW: State for endless practice mode
  let practiceCategory = null;

  const showView = (viewName) => {
    Object.values(views).forEach((view) => view.classList.add("hidden"));
    views[viewName].classList.remove("hidden");
  };

  const getSettingsFromForm = () => ({
    ops: {
      add: document.getElementById("addition").checked,
      sub: document.getElementById("subtraction").checked,
      mul: document.getElementById("multiplication").checked,
      div: document.getElementById("division").checked,
    },
    ranges: {
      add: [
        parseInt(document.getElementById("add-min").value),
        parseInt(document.getElementById("add-max").value),
        parseInt(document.getElementById("add-min-2").value),
        parseInt(document.getElementById("add-max-2").value),
      ],
      mul: [
        parseInt(document.getElementById("mul-min").value),
        parseInt(document.getElementById("mul-max").value),
        parseInt(document.getElementById("mul-min-2").value),
        parseInt(document.getElementById("mul-max-2").value),
      ],
    },
    duration: parseInt(document.getElementById("duration").value),
  });

  const getRandomInt = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  // MODIFIED: Can now be forced to generate a problem from a specific category
  const generateProblem = (forcedCategory = null) => {
    const enabledOps = Object.keys(gameSettings.ops).filter(
      (op) => gameSettings.ops[op]
    );
    if (enabledOps.length === 0)
      return { text: "Enable an operation!", answer: null };

    const op =
      forcedCategory && enabledOps.includes(forcedCategory)
        ? forcedCategory
        : enabledOps[getRandomInt(0, enabledOps.length - 1)];

    let n1, n2, text, answer;
    switch (op) {
      case "add":
        n1 = getRandomInt(
          gameSettings.ranges.add[0],
          gameSettings.ranges.add[1]
        );
        n2 = getRandomInt(
          gameSettings.ranges.add[2],
          gameSettings.ranges.add[3]
        );
        text = `${n1} + ${n2} = `;
        answer = n1 + n2;
        break;
      case "sub":
        n1 = getRandomInt(
          gameSettings.ranges.add[0],
          gameSettings.ranges.add[1]
        );
        n2 = getRandomInt(
          gameSettings.ranges.add[2],
          gameSettings.ranges.add[3]
        );
        let sum = n1 + n2;
        text = `${sum} - ${n1} = `;
        answer = n2;
        break;
      case "mul":
        n1 = getRandomInt(
          gameSettings.ranges.mul[0],
          gameSettings.ranges.mul[1]
        );
        n2 = getRandomInt(
          gameSettings.ranges.mul[2],
          gameSettings.ranges.mul[3]
        );
        text = `${n1} × ${n2} = `;
        answer = n1 * n2;
        break;
      case "div":
        n1 = getRandomInt(
          gameSettings.ranges.mul[0],
          gameSettings.ranges.mul[1]
        );
        n2 = getRandomInt(
          gameSettings.ranges.mul[2],
          gameSettings.ranges.mul[3]
        );
        let product = n1 * n2;
        text = `${product} ÷ ${n1} = `;
        answer = n2;
        break;
    }
    return { text, answer, type: op };
  };

  const nextProblem = () => {
    // MODIFIED: Handles both game and practice modes
    currentProblem = generateProblem(practiceCategory);
    currentAttempts = [];
    questionStartTime = Date.now();

    if (practiceCategory) {
      practiceProblemText.textContent = currentProblem.text;
      practiceAnswerInput.value = "";
      practiceAnswerInput.focus();
    } else {
      problemText.textContent = currentProblem.text;
      answerInput.value = "";
      answerInput.focus();
    }
  };

  const checkAnswer = (inputElement) => {
    const userAnswer = inputElement.value;
    if (userAnswer === "" || isNaN(parseInt(userAnswer))) return;

    currentAttempts.push(userAnswer);

    if (parseInt(userAnswer) === currentProblem.answer) {
      // MODIFIED: Only update score and history if not in practice mode
      if (!practiceCategory) {
        score++;
        scoreDisplay.textContent = `Score: ${score}`;
        const timeTaken = (Date.now() - questionStartTime) / 1000;
        problemHistory.push({
          problem: currentProblem.text,
          answer: currentProblem.answer,
          type: currentProblem.type,
          time: timeTaken,
          attempts: [...currentAttempts],
        });
      }
      nextProblem();
    }
  };

  const startGame = () => {
    gameSettings = getSettingsFromForm();
    score = 0;
    timeLeft = gameSettings.duration;
    problemHistory = [];
    practiceCategory = null; // NEW: Reset practice mode on new game

    scoreDisplay.textContent = `Score: 0`;
    timerDisplay.textContent = `Time left: ${timeLeft}`;
    showView("game");
    nextProblem();

    timerInterval = setInterval(() => {
      timeLeft--;
      timerDisplay.textContent = `Time left: ${timeLeft}`;
      if (timeLeft <= 0) {
        endGame();
      }
    }, 1000);
  };

  const endGame = () => {
    clearInterval(timerInterval);
    showView("results");
    displayAnalysis();
    nextProblem(); // Kick off the first practice problem
  };

  const displayAnalysis = () => {
    // NEW: Populate stat cards
    const answeredCount = problemHistory.length;
    const avgTime =
      answeredCount > 0 ? gameSettings.duration / answeredCount : 0;

    finalScoreVal.textContent = score;
    totalTimeVal.textContent = `${gameSettings.duration}s`;
    avgTimeVal.textContent = `${avgTime.toFixed(2)}s`;

    analysisTableBody.innerHTML = "";
    if (answeredCount === 0) {
      analysisSummary.innerHTML =
        "You didn't answer any questions correctly. Try again!";
      practiceCategory = null; // No data to base practice on
      return;
    }

    problemHistory.forEach((p, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${index + 1}</td><td>${p.problem} <strong>${
        p.answer
      }</strong></td><td>${p.time.toFixed(2)}</td><td>${
        p.attempts.length
      }</td><td>${p.attempts.join(", ")}</td>`;
      analysisTableBody.appendChild(row);
    });

    // Calculate summary stats
    const slowestProblem = problemHistory.reduce(
      (max, p) => (p.time > max.time ? p : max),
      problemHistory[0]
    );
    const categoryStats = {};
    problemHistory.forEach((p) => {
      if (!categoryStats[p.type])
        categoryStats[p.type] = { totalTime: 0, count: 0 };
      categoryStats[p.type].totalTime += p.time;
      categoryStats[p.type].count++;
    });

    let slowestCategory = "";
    let maxAvgTime = 0;
    for (const cat in categoryStats) {
      const avg = categoryStats[cat].totalTime / categoryStats[cat].count;
      if (avg > maxAvgTime) {
        maxAvgTime = avg;
        slowestCategory = cat;
      }
    }

    analysisSummary.innerHTML = `You answered <strong>${answeredCount}</strong> questions correctly.<br> Your slowest category was <span class="highlight">${slowestCategory.toUpperCase()}</span>. Now entering practice mode for this category.`;

    // NEW: Set the category for endless practice mode
    practiceCategory = slowestCategory;
  };

  // Event Listeners
  startBtn.addEventListener("click", startGame);
  answerInput.addEventListener("input", () => checkAnswer(answerInput));
  practiceAnswerInput.addEventListener("input", () =>
    checkAnswer(practiceAnswerInput)
  ); // NEW
  tryAgainBtn.addEventListener("click", startGame);
  changeSettingsBtn.addEventListener("click", () => showView("settings"));

  showView("settings");
});
