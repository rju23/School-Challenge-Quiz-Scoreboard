// ========================
// Quiz Scoreboard Script
// ========================

// ------------------------
// 1. Round Definitions
// ------------------------
const rounds = {
  ALTERNATE: { name: "ALTERNATE", duration: 240, pointsCorrect: 1, pointsWrong: 0 },
  SPEED:     { name: "SPEED", duration: 60, pointsCorrect: 1, pointsWrong: 0 },
  BUZZER:    { name: "BUZZER", duration: 240, pointsCorrect: 2, pointsWrong: -2 }
};

// ------------------------
// 2. Initial State
// ------------------------
let currentRound = rounds.ALTERNATE;
let scoreA = parseInt(localStorage.getItem("scoreA")) || 0;
let scoreB = parseInt(localStorage.getItem("scoreB")) || 0;
let timeRemaining = parseInt(localStorage.getItem("timeRemaining")) || currentRound.duration;
let timerInterval = null;
let currentSpeedMinute = 1;

let questionTimeRemaining = 0;
let questionTimerInterval = null;

// Tracker: correct/wrong marks per team per round
let tracker = JSON.parse(localStorage.getItem("tracker")) || {
  ALTERNATE: { A: "", B: "" },
  SPEED: { 
    A: { 1: "", 2: "", 3: "" }, 
    B: { 1: "", 2: "", 3: "" } 
  },
  BUZZER: { A: "", B: "" }
};

// Event log (optional)
let eventLog = JSON.parse(localStorage.getItem("eventLog")) || [];

// Save initial round
localStorage.setItem("currentRound", currentRound.name);

// ------------------------
// 3. Display Update Functions
// ------------------------
function updateDisplay() {
  // Update Team Names
  const displayA = document.getElementById("teamAName");
  const displayB = document.getElementById("teamBName");
  const nameA = localStorage.getItem("teamAName") || "Team A";
  const nameB = localStorage.getItem("teamBName") || "Team B";

  if (displayA) displayA.innerText = nameA;
  if (displayB) displayB.innerText = nameB;

  // Update Scores
  const scoreElA = document.getElementById("scoreA");
  const scoreElB = document.getElementById("scoreB");
  if (scoreElA) scoreElA.innerText = scoreA;
  if (scoreElB) scoreElB.innerText = scoreB;

  // Update Timer
  const timerEl = document.getElementById("timer");
  if (timerEl)
    timerEl.innerText = `${String(Math.floor(timeRemaining / 60)).padStart(2, "0")}:${String(timeRemaining % 60).padStart(2, "0")}`;

  // Update Round
  const roundEl = document.getElementById("round");
  if (roundEl) roundEl.innerText = currentRound.name;
}

function updateTrackerDisplay() {
  for (let round in tracker) {
    if (round === "SPEED") {
      for (let m = 1; m <= 3; m++) {
        if (document.getElementById(`trackA_SPEED_${m}`)) 
          document.getElementById(`trackA_SPEED_${m}`).innerText = tracker[round][`A_${m}`] || "";
        if (document.getElementById(`trackB_SPEED_${m}`)) 
          document.getElementById(`trackB_SPEED_${m}`).innerText = tracker[round][`B_${m}`] || "";
      }
    } else {
      if (document.getElementById(`trackA_${round}`)) 
        document.getElementById(`trackA_${round}`).innerText = tracker[round].A;
      if (document.getElementById(`trackB_${round}`)) 
        document.getElementById(`trackB_${round}`).innerText = tracker[round].B;
    }
  }
}

// ------------------------
// 4. Score Management
// ------------------------
function teamACorrect() { updateScore("A", "correct"); }
function teamAWrong() { updateScore("A", "wrong"); }
function teamBCorrect() { updateScore("B", "correct"); }
function teamBWrong() { updateScore("B", "wrong"); }

function updateScore(team, result) {
  const points = result === "correct" ? currentRound.pointsCorrect : currentRound.pointsWrong;
  if (team === "A") scoreA += points;
  else scoreB += points;

  // Save scores
  localStorage.setItem("scoreA", scoreA);
  localStorage.setItem("scoreB", scoreB);

  // Log to tracker
  logAnswer(team, result);
}

// ------------------------
// 5. Tracker Logging
// ------------------------
function logAnswer(team, result) {
  const roundName = currentRound.name;

  if (roundName === "SPEED") {
    const minute = currentSpeedMinute;
    tracker[roundName][`${team}_${minute}`] = (tracker[roundName][`${team}_${minute}`] || "") + (result === "correct" ? "✓" : "✗");
  } else {
    tracker[roundName][team] = (tracker[roundName][team] || "") + (result === "correct" ? "✓" : "✗");
  }

  localStorage.setItem("tracker", JSON.stringify(tracker));
  updateTrackerDisplay();
}

// ------------------------
// 6. Timer Functions
// ------------------------
function startTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    if (timeRemaining <= 0) { pauseTimer(); playBell(); return; }
    timeRemaining--;
    localStorage.setItem("timeRemaining", timeRemaining);
  }, 1000);
}

function pauseTimer() { clearInterval(timerInterval); timerInterval = null; }
function resetTimer() { pauseTimer(); timeRemaining = currentRound.duration; localStorage.setItem("timeRemaining", timeRemaining); }

// ------------------------
// 7. Question Timer
// ------------------------
function startQuestionTimer() {
  if (currentRound.name === "ALTERNATE") questionTimeRemaining = 10;
  else if (currentRound.name === "BUZZER") questionTimeRemaining = 5;
  else return;

  if (questionTimerInterval) clearInterval(questionTimerInterval);

  const timerEl = document.getElementById("questionTimer");
  timerEl.style.color = "black";
  timerEl.innerText = questionTimeRemaining;

  questionTimerInterval = setInterval(() => {
    questionTimeRemaining--;
    timerEl.innerText = questionTimeRemaining;
    timerEl.style.color = questionTimeRemaining <= 3 && questionTimeRemaining > 0 ? "red" : "black";
    if (questionTimeRemaining <= 0) {
      clearInterval(questionTimerInterval);
      questionTimerInterval = null;
      playQuestionBell();
    }
  }, 1000);
}

function pauseQuestionTimer() {
  if (questionTimerInterval) { clearInterval(questionTimerInterval); questionTimerInterval = null; }
}

// ------------------------
// 8. Round Selection
// ------------------------
function setRound(roundName) {
  if (!rounds[roundName]) return alert("Invalid round selected!");

  pauseTimer();
  currentRound = rounds[roundName];
  localStorage.setItem("currentRound", currentRound.name);

  timeRemaining = currentRound.duration;
  localStorage.setItem("timeRemaining", timeRemaining);
  updateDisplay();
}

function setSpeedMinute(minute) {
  if (minute < 1 || minute > 3) return;
  currentSpeedMinute = minute;
  currentRound = { ...rounds.SPEED };
  localStorage.setItem("currentRound", "SPEED");
  timeRemaining = currentRound.duration;
  localStorage.setItem("timeRemaining", timeRemaining);
  resetQuestionTimerDisplay();
  updateDisplay();
}

function setCustomRound(roundName) {
  if (!rounds[roundName]) return alert("Invalid section.");
  const input = prompt(`Enter custom time in seconds for ${roundName} section:`);
  if (input === null) return;
  const customSeconds = parseInt(input);
  if (isNaN(customSeconds) || customSeconds <= 0) return alert("Please enter a valid number of seconds.");

  pauseTimer();
  pauseQuestionTimer();

  currentRound = { ...rounds[roundName], duration: customSeconds };
  localStorage.setItem("currentRound", currentRound.name);

  timeRemaining = customSeconds;
  localStorage.setItem("timeRemaining", timeRemaining);

  resetQuestionTimerDisplay();
  updateDisplay();
}

function resetQuestionTimerDisplay() {
  const qt = document.getElementById("questionTimer");
  if (qt) { qt.innerText = "--"; qt.style.color = "white"; }
}

// ------------------------
// 9. Query Deduction
// ------------------------
function queryDeduct(team) {
  if (!["ALTERNATE","SPEED"].includes(currentRound.name)) return alert("Query deduction only in ALTERNATE or SPEED.");
  if (!confirm(`Deduct 1 point from Team ${team}?`)) return;

  if (team === "A") scoreA = Math.max(0, scoreA - 1);
  else scoreB = Math.max(0, scoreB - 1);

  localStorage.setItem("scoreA", scoreA);
  localStorage.setItem("scoreB", scoreB);
  updateDisplay();
}

// ------------------------
// 10. Sound Functions
// ------------------------
function playBell() { const bell = document.getElementById("bellSound"); if (bell) { bell.currentTime = 0; bell.play(); } }
function playQuestionBell() { const bell = document.getElementById("questionBell"); if (bell) { bell.currentTime = 0; bell.play(); } }

// ------------------------
// 11. Fullscreen
// ------------------------
function toggleFullscreen() {
  const elem = document.documentElement;
  if (!document.fullscreenElement) {
    if (elem.requestFullscreen) elem.requestFullscreen();
    else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
    else if (elem.msRequestFullscreen) elem.msRequestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.msExitFullscreen) document.msExitFullscreen();
  }
}

// ------------------------
// 12. Settings Overlay
// ------------------------
function openSettings() {
  document.getElementById("settingsOverlay").style.display = "block";
  document.getElementById("settingsPopup").style.display = "block";
}

function closeSettings() {
  document.getElementById("settingsOverlay").style.display = "none";
  document.getElementById("settingsPopup").style.display = "none";
}

// ------------------------
// 13. Tabs (How To Use / About)
// ------------------------
function openTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(tabId).classList.remove('hidden');
  document.querySelector(`.tab-btn[onclick="openTab('${tabId}')"]`).classList.add('active');
}

// ------------------------
// 14. Question Note Toggle
// ------------------------
function toggleQuestionNote() {
  document.getElementById('questionNote').classList.toggle('visible');
}

// ------------------------
// 15. Sync Team Names
// ------------------------
function setTeamNames() {
  const nameA = document.getElementById("teamANameInput").value.trim() || "Team A";
  const nameB = document.getElementById("teamBNameInput").value.trim() || "Team B";

  localStorage.setItem("teamAName", nameA);
  localStorage.setItem("teamBName", nameB);

  syncTeamNamesOnLoad();
}

function syncTeamNamesOnLoad() {
  const nameA = localStorage.getItem("teamAName") || "Team A";
  const nameB = localStorage.getItem("teamBName") || "Team B";

  const buttons = [
    { id: "btnACorrect", text: `${nameA} Correct` },
    { id: "btnAWrong", text: `${nameA} Wrong` },
    { id: "btnBCorrect", text: `${nameB} Correct` },
    { id: "btnBWrong", text: `${nameB} Wrong` },
    { id: "queryDeductA", text: `${nameA} Query Deduction` },
    { id: "queryDeductB", text: `${nameB} Query Deduction` }
  ];

  buttons.forEach(btn => {
    const el = document.getElementById(btn.id);
    if (el) el.innerText = btn.text;
  });

  const trackerHeaders = [
    { id: "trackerTeamA", text: nameA },
    { id: "trackerTeamB", text: nameB }
  ];
  trackerHeaders.forEach(h => {
    const el = document.getElementById(h.id);
    if (el) el.innerText = h.text;
  });
}

// ------------------------
// 16. Reset Match
// ------------------------
function resetMatch() {
  if (!confirm("Are you sure you want to reset scores, timer, and round? This cannot be undone.")) return;

  scoreA = 0; scoreB = 0;
  timeRemaining = rounds.ALTERNATE.duration;
  currentRound = rounds.ALTERNATE;
  eventLog = [];
  tracker = {
    ALTERNATE: { A: "", B: "" },
    SPEED: { A: "", B: "" },
    BUZZER: { A: "", B: "" }
  };

  localStorage.setItem("scoreA", scoreA);
  localStorage.setItem("scoreB", scoreB);
  localStorage.setItem("timeRemaining", timeRemaining);
  localStorage.setItem("currentRound", currentRound.name);
  localStorage.setItem("tracker", JSON.stringify(tracker));
  localStorage.setItem("eventLog", JSON.stringify(eventLog));

  updateDisplay();
  updateTrackerDisplay();
  syncTeamNamesOnLoad();
}

// ------------------------
// 17. Auto-sync display
// ------------------------
setInterval(() => {
  scoreA = parseInt(localStorage.getItem("scoreA")) || 0;
  scoreB = parseInt(localStorage.getItem("scoreB")) || 0;
  const storedTime = parseInt(localStorage.getItem("timeRemaining"));
  if (!isNaN(storedTime)) timeRemaining = storedTime;
  const storedRound = localStorage.getItem("currentRound");
  if (storedRound && rounds[storedRound]) currentRound = rounds[storedRound];
  eventLog = JSON.parse(localStorage.getItem("eventLog")) || [];
  updateDisplay();
}, 500);

// ------------------------
// 18. Keyboard Shortcuts
// ------------------------
document.addEventListener("keydown", function(event) {
  if (event.key === "r" || event.key === "R") startQuestionTimer();
  if (event.key === "p" || event.key === "P") pauseQuestionTimer();
});

// ------------------------
// 19. Initialize
// ------------------------
updateDisplay();
syncTeamNamesOnLoad();

