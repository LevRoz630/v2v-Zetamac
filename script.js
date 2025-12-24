document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const views = {
    settings: document.getElementById("settings-view"),
    game: document.getElementById("game-view"),
    results: document.getElementById("results-view"),
  };
  const startBtn = document.getElementById("start-btn");
  const timerDisplay = document.getElementById("timer");
  const scoreDisplay = document.getElementById("score");
  const problemText = document.getElementById("problem-text");
  const answerInput = document.getElementById("answer-input");
  const paceDisplay = document.getElementById("pace-tracker");

  const finalScoreVal = document.getElementById("final-score-val");
  const totalTimeVal = document.getElementById("total-time-val");
  const avgTimeVal = document.getElementById("avg-time-val");
  const targetPaceVal = document.getElementById("target-pace-val");
  const tryAgainBtn = document.getElementById("try-again-btn");
  const changeSettingsBtn = document.getElementById("change-settings-btn");
  const analysisTableBody = document.querySelector("#analysis-table tbody");
  const analysisSummary = document.getElementById("analysis-summary");
  const practiceProblemText = document.getElementById("practice-problem-text");
  const practiceAnswerInput = document.getElementById("practice-answer-input");

  let gameSettings = {};
  let score = 0;
  let timerInterval = null;
  let currentProblem = null;
  let problemHistory = [];
  let questionStartTime = 0;
  let currentAttempts = [];
  let gameStartTime = 0;
  let gameDuration = 0;
  let practiceCategory = null;
  let currentSort = { key: "index", direction: "asc" };

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
    targetScore: parseInt(document.getElementById("target-score").value) || 0,
    allowDecimals: document.getElementById("allow-decimals")?.checked || false,
    decimalPlaces: parseInt(document.getElementById("decimal-places")?.value || "2"),
    useFractionOperands: document.getElementById("use-fraction-operands")?.checked || false,
    fractionRange: parseInt(document.getElementById("fraction-range")?.value || "10"),
  });

  const getRandomInt = (min, max) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

  const roundToPlaces = (num, places) => {
    return Math.round(num * Math.pow(10, places)) / Math.pow(10, places);
  };

  // Fraction utility functions
  const gcd = (a, b) => {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
      let temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  };

  const simplifyFraction = (num, den) => {
    if (den === 0) return { num: 0, den: 1 };
    const divisor = gcd(num, den);
    return {
      num: num / divisor,
      den: den / divisor
    };
  };

  const parseFraction = (input) => {
    input = input.trim();

    // Handle mixed numbers like "2 1/3" or "2_1/3"
    const mixedMatch = input.match(/^(-?\d+)[_\s]+(\d+)\/(\d+)$/);
    if (mixedMatch) {
      const whole = parseInt(mixedMatch[1]);
      const num = parseInt(mixedMatch[2]);
      const den = parseInt(mixedMatch[3]);
      const sign = whole < 0 ? -1 : 1;
      const totalNum = Math.abs(whole) * den + num;
      return simplifyFraction(sign * totalNum, den);
    }

    // Handle simple fractions like "3/4"
    const fractionMatch = input.match(/^(-?\d+)\/(\d+)$/);
    if (fractionMatch) {
      return simplifyFraction(parseInt(fractionMatch[1]), parseInt(fractionMatch[2]));
    }

    // Handle whole numbers
    const wholeMatch = input.match(/^(-?\d+)$/);
    if (wholeMatch) {
      return { num: parseInt(wholeMatch[1]), den: 1 };
    }

    return null;
  };

  const fractionsEqual = (frac1, frac2) => {
    const f1 = simplifyFraction(frac1.num, frac1.den);
    const f2 = simplifyFraction(frac2.num, frac2.den);
    return f1.num === f2.num && f1.den === f2.den;
  };

  const fractionToString = (num, den) => {
    const simplified = simplifyFraction(num, den);
    if (simplified.den === 1) {
      return simplified.num.toString();
    }
    return `${simplified.num}/${simplified.den}`;
  };

  const fractionToMixed = (num, den) => {
    const simplified = simplifyFraction(num, den);
    const whole = Math.floor(Math.abs(simplified.num) / simplified.den);
    const remainder = Math.abs(simplified.num) % simplified.den;
    const sign = simplified.num < 0 ? "-" : "";

    if (whole === 0) {
      return `${sign}${Math.abs(simplified.num)}/${simplified.den}`;
    } else if (remainder === 0) {
      return `${sign}${whole}`;
    } else {
      return `${sign}${whole} ${remainder}/${simplified.den}`;
    }
  };

  const addFractions = (f1, f2) => {
    const num = f1.num * f2.den + f2.num * f1.den;
    const den = f1.den * f2.den;
    return simplifyFraction(num, den);
  };

  const subtractFractions = (f1, f2) => {
    const num = f1.num * f2.den - f2.num * f1.den;
    const den = f1.den * f2.den;
    return simplifyFraction(num, den);
  };

  const multiplyFractions = (f1, f2) => {
    return simplifyFraction(f1.num * f2.num, f1.den * f2.den);
  };

  const divideFractions = (f1, f2) => {
    return simplifyFraction(f1.num * f2.den, f1.den * f2.num);
  };

  const generateRandomFraction = (maxValue) => {
    // Generate fractions with denominators from 2-12 and numerators that make sense
    const den = getRandomInt(2, Math.min(12, maxValue));
    const num = getRandomInt(1, den * 2); // Allow improper fractions
    return simplifyFraction(num, den);
  };

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

    // Fraction arithmetic mode
    if (gameSettings.useFractionOperands) {
      const f1 = generateRandomFraction(gameSettings.fractionRange);
      const f2 = generateRandomFraction(gameSettings.fractionRange);
      let fractionAnswer, text;

      switch (op) {
        case "add":
          fractionAnswer = addFractions(f1, f2);
          text = `${fractionToString(f1.num, f1.den)} + ${fractionToString(f2.num, f2.den)} = `;
          break;
        case "sub":
          fractionAnswer = subtractFractions(f1, f2);
          text = `${fractionToString(f1.num, f1.den)} − ${fractionToString(f2.num, f2.den)} = `;
          break;
        case "mul":
          fractionAnswer = multiplyFractions(f1, f2);
          text = `${fractionToString(f1.num, f1.den)} × ${fractionToString(f2.num, f2.den)} = `;
          break;
        case "div":
          fractionAnswer = divideFractions(f1, f2);
          text = `${fractionToString(f1.num, f1.den)} ÷ ${fractionToString(f2.num, f2.den)} = `;
          break;
      }

      return {
        text,
        answer: fractionAnswer.num / fractionAnswer.den,
        type: op,
        isFraction: true,
        fractionAnswer
      };
    }

    // Standard integer arithmetic
    let n1, n2, text, answer, isDecimal = false;

    switch (op) {
      case "add":
        n1 = getRandomInt(gameSettings.ranges.add[0], gameSettings.ranges.add[1]);
        n2 = getRandomInt(gameSettings.ranges.add[2], gameSettings.ranges.add[3]);
        text = `${n1} + ${n2} = `;
        answer = n1 + n2;
        break;

      case "sub":
        n1 = getRandomInt(gameSettings.ranges.add[0], gameSettings.ranges.add[1]);
        n2 = getRandomInt(gameSettings.ranges.add[2], gameSettings.ranges.add[3]);
        let sum = n1 + n2;
        text = `${sum} − ${n1} = `;
        answer = n2;
        break;

      case "mul":
        n1 = getRandomInt(gameSettings.ranges.mul[0], gameSettings.ranges.mul[1]);
        n2 = getRandomInt(gameSettings.ranges.mul[2], gameSettings.ranges.mul[3]);
        text = `${n1} × ${n2} = `;
        answer = n1 * n2;
        break;

      case "div":
        n1 = getRandomInt(gameSettings.ranges.mul[0], gameSettings.ranges.mul[1]);
        n2 = getRandomInt(gameSettings.ranges.mul[2], gameSettings.ranges.mul[3]);

        if (gameSettings.allowDecimals && Math.random() > 0.5) {
          let dividend = getRandomInt(n1 * n2, n1 * n2 + n1 - 1);
          text = `${dividend} ÷ ${n1} = `;
          answer = roundToPlaces(dividend / n1, gameSettings.decimalPlaces);
          isDecimal = true;
        } else {
          let product = n1 * n2;
          text = `${product} ÷ ${n1} = `;
          answer = n2;
        }
        break;
    }

    return { text, answer, type: op, isDecimal, isFraction: false };
  };

  const nextProblem = () => {
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
    const userAnswer = inputElement.value.trim();
    if (userAnswer === "") return;

    currentAttempts.push(userAnswer);
    let isCorrect = false;

    if (currentProblem.isFraction) {
      // ONLY accept fraction answers for fraction problems
      const userFraction = parseFraction(userAnswer);
      if (userFraction && currentProblem.fractionAnswer) {
        isCorrect = fractionsEqual(userFraction, currentProblem.fractionAnswer);
      }
    } else {
      // Standard numeric check for integer/decimal problems
      const userNumeric = parseFloat(userAnswer);
      if (isNaN(userNumeric)) return;

      if (currentProblem.isDecimal) {
        const tolerance = 0.01;
        isCorrect = Math.abs(userNumeric - currentProblem.answer) < tolerance;
      } else {
        isCorrect = Math.abs(userNumeric - currentProblem.answer) < 0.001;
      }
    }

    if (isCorrect) {
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
          originalIndex: problemHistory.length + 1,
          isDecimal: currentProblem.isDecimal,
          isFraction: currentProblem.isFraction,
          fractionAnswer: currentProblem.fractionAnswer,
        });

        updateTimerAndPace();
      }
      nextProblem();
    }
  };

  const startGame = () => {
    gameSettings = getSettingsFromForm();
    score = 0;
    gameDuration = gameSettings.duration;
    problemHistory = [];
    practiceCategory = null;

    scoreDisplay.textContent = `Score: 0`;
    timerDisplay.textContent = `Time: ${gameDuration}`;
    timerDisplay.classList.remove("timer-goal-met");

    if (gameSettings.targetScore > 0) {
      paceDisplay.classList.remove("hidden");
      paceDisplay.textContent = "±0.0";
      paceDisplay.className = "pace-neutral";
    } else {
      paceDisplay.classList.add("hidden");
    }

    showView("game");
    nextProblem();

    gameStartTime = Date.now();
    timerInterval = setInterval(updateTimerAndPace, 100);
  };

  const updateTimerAndPace = () => {
    const now = Date.now();
    const elapsedTime = (now - gameStartTime) / 1000;
    const timeLeft = Math.ceil(gameDuration - elapsedTime);

    timerDisplay.textContent = `Time: ${Math.max(0, timeLeft)}`;
    timerDisplay.classList.remove("timer-goal-met");

    if (gameSettings.targetScore > 0) {
      if (score >= gameSettings.targetScore) {
        paceDisplay.textContent = "GOAL MET!";
        paceDisplay.className = "";
        paceDisplay.classList.add("pace-ahead");
        paceDisplay.style.fontWeight = "900";
        paceDisplay.style.fontSize = "1.6rem";
      } else {
        const targetPacePerQuestion = gameDuration / gameSettings.targetScore;
        const expectedTimeForScore = score * targetPacePerQuestion;
        const diff = elapsedTime - expectedTimeForScore;

        const sign = diff > 0 ? "+" : "";
        paceDisplay.textContent = `${sign}${diff.toFixed(1)}`;

        paceDisplay.style.fontWeight = "";
        paceDisplay.style.fontSize = "";
        paceDisplay.classList.remove("pace-ahead", "pace-behind", "pace-neutral");

        if (diff <= 0) {
          paceDisplay.classList.add("pace-ahead");
        } else {
          paceDisplay.classList.add("pace-behind");
        }
      }
    }

    if (elapsedTime >= gameDuration) {
      endGame();
    }
  };

  const endGame = () => {
    clearInterval(timerInterval);
    showView("results");
    displayAnalysis();
    nextProblem();
  };

  const displayAnalysis = () => {
    const answeredCount = problemHistory.length;
    const avgTime = answeredCount > 0 ? gameDuration / answeredCount : 0;

    let targetPace = 0;
    if (gameSettings.targetScore > 0) {
      targetPace = gameDuration / gameSettings.targetScore;
      targetPaceVal.textContent = `${targetPace.toFixed(2)}s`;
    } else {
      targetPaceVal.textContent = "--";
    }

    finalScoreVal.textContent = score;
    totalTimeVal.textContent = `${gameDuration}s`;
    avgTimeVal.textContent = `${avgTime.toFixed(2)}s`;

    analysisTableBody.innerHTML = "";
    if (answeredCount === 0) {
      analysisSummary.innerHTML = "You didn't answer any questions correctly. Try again!";
      practiceCategory = null;
      return;
    }

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

    practiceCategory = slowestCategory;
    renderAnalysisTable();
  };

  const renderAnalysisTable = () => {
    const sortedHistory = [...problemHistory].sort((a, b) => {
      let valA = a[currentSort.key];
      let valB = b[currentSort.key];

      if (currentSort.key === "index") {
        valA = a.originalIndex;
        valB = b.originalIndex;
      } else if (currentSort.key === "attempts") {
        valA = a.attempts.length;
        valB = b.attempts.length;
      }

      if (valA < valB) return currentSort.direction === "asc" ? -1 : 1;
      if (valA > valB) return currentSort.direction === "asc" ? 1 : -1;
      return 0;
    });

    let targetPace = 0;
    if (gameSettings.targetScore > 0) {
      targetPace = gameDuration / gameSettings.targetScore;
    }

    analysisTableBody.innerHTML = "";
    sortedHistory.forEach((p) => {
      const row = document.createElement("tr");

      let timeClass = "";
      if (targetPace > 0) {
        if (p.time <= targetPace) {
          timeClass = "time-success";
        } else {
          timeClass = "time-fail";
        }
      }

      let formattedAnswer;
      if (p.isFraction && p.fractionAnswer) {
        formattedAnswer = fractionToString(p.fractionAnswer.num, p.fractionAnswer.den);
        const mixed = fractionToMixed(p.fractionAnswer.num, p.fractionAnswer.den);
        if (mixed !== formattedAnswer) {
          formattedAnswer += ` = ${mixed}`;
        }
      } else if (p.isDecimal) {
        formattedAnswer = p.answer.toFixed(gameSettings.decimalPlaces);
      } else {
        formattedAnswer = p.answer;
      }

      row.innerHTML = `
        <td>${p.originalIndex}</td>
        <td>${p.problem} <strong>${formattedAnswer}</strong></td>
        <td class="${timeClass}">${p.time.toFixed(2)}</td>
        <td>${p.attempts.length}</td>
        <td>${p.attempts.join(", ")}</td>
      `;
      analysisTableBody.appendChild(row);
    });

    document.querySelectorAll("#analysis-table th.sortable").forEach((th) => {
      th.classList.remove("sort-asc", "sort-desc");
      if (th.dataset.sort === currentSort.key) {
        th.classList.add(currentSort.direction === "asc" ? "sort-asc" : "sort-desc");
      }
    });
  };

  const handleSort = (key) => {
    if (currentSort.key === key) {
      currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
    } else {
      currentSort.key = key;
      currentSort.direction = "asc";
    }
    renderAnalysisTable();
  };

  startBtn.addEventListener("click", startGame);
  answerInput.addEventListener("input", () => checkAnswer(answerInput));
  practiceAnswerInput.addEventListener("input", () =>
    checkAnswer(practiceAnswerInput)
  );
  tryAgainBtn.addEventListener("click", startGame);
  changeSettingsBtn.addEventListener("click", () => showView("settings"));

  document.querySelectorAll("#analysis-table th.sortable").forEach((th) => {
    th.addEventListener("click", () => {
      handleSort(th.dataset.sort);
    });
  });

  showView("settings");
});
