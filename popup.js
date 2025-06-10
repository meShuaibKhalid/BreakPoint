// popup.js functionality
const timerDisplay = document.getElementById("timerDisplay");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resetBtn = document.getElementById("resetBtn");
const presetSelect = document.getElementById("presetSelect");
const customInputs = document.getElementById("customInputs");
const customIntervalInput = document.getElementById("customInterval");
const applyCustomBtn = document.getElementById("applyCustomBtn");
const settingsBtn = document.getElementById("settingsBtn");
const optionsLink = document.getElementById("optionsLink");
const helpLink = document.getElementById("helpLink");
const progressCircle = document.getElementById("progressCircle");
const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

progressCircle.style.strokeDasharray = CIRCUMFERENCE;
progressCircle.style.strokeDashoffset = CIRCUMFERENCE;

let timerState = {
  timeLeft: 0,
  totalTime: 0,
  running: false,
  paused: false
};

function updateProgress() {
  if (timerState.totalTime === 0) return;
  const offset = CIRCUMFERENCE * (timerState.timeLeft / timerState.totalTime);
  progressCircle.style.strokeDashoffset = offset;
}

function formatTime(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

function updateDisplay() {
  timerDisplay.textContent = formatTime(timerState.timeLeft);
  updateProgress();
}

function updateButtonsState() {
  if (timerState.running && !timerState.paused) {
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    resetBtn.disabled = false;
    pauseBtn.textContent = "Pause";
  } else if (timerState.paused) {
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    pauseBtn.textContent = "Resume";
    resetBtn.disabled = false;
  } else {
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = "Pause";
    resetBtn.disabled = true;
  }
}

function sendToBackground(action, data = {}) {
  chrome.runtime.sendMessage({ action, ...data });
}

startBtn.addEventListener("click", () => {
  let val = parseInt(document.getElementById("interval")?.value || 0, 10);
  if (isNaN(val) || val < 1) {
    alert("Please enter a valid interval (>= 1 minute).");
    return;
  }
  sendToBackground("startTimer", { interval: val });
});

pauseBtn.addEventListener("click", () => {
  if (timerState.running && !timerState.paused) {
    sendToBackground("pauseTimer");
  } else if (timerState.paused) {
    sendToBackground("resumeTimer");
  }
});

resetBtn.addEventListener("click", () => {
  sendToBackground("stopTimer");
});

presetSelect.addEventListener("change", () => {
  const v = presetSelect.value;
  if (v === "custom") {
    customInputs.style.display = "flex";
    customIntervalInput.focus();
  } else if (v) {
    const minutes = parseInt(v, 10);
    if (!isNaN(minutes)) {
      sendToBackground("startTimer", { interval: minutes });
    }
    presetSelect.value = "";
  }
});

applyCustomBtn.addEventListener("click", () => {
  const v = parseInt(customIntervalInput.value, 10);
  if (!isNaN(v) && v >= 1) {
    sendToBackground("startTimer", { interval: v });
    customInputs.style.display = "none";
    customIntervalInput.value = "";
    presetSelect.value = "";
  } else {
    alert("Enter a valid number >= 1");
  }
});

settingsBtn.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
optionsLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});
helpLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: "https://github.com/your-repo/BreakPoint#readme" });
});

document.addEventListener("DOMContentLoaded", () => {
  updateButtonsState();
  timerDisplay.textContent = "00:00";
  chrome.runtime.sendMessage({ action: "getTimerState" }, (response) => {
    if (response) {
      timerState = {
        timeLeft: response.timeLeft,
        totalTime: response.totalTime,
        running: response.running,
        paused: response.paused
      };
      updateDisplay();
      updateButtonsState();
    }
  });
  chrome.storage.sync.get(["theme", "accentColor"], (res) => {
    if (res.theme) {
      document.documentElement.setAttribute("data-theme", res.theme);
    }
    if (res.accentColor) {
      document.documentElement.style.setProperty("--accent", res.accentColor);
      document.documentElement.style.setProperty(
        "--accent-hover",
        res.accentColor
      );
    }
  });
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "updateTimer") {
    timerState.timeLeft = msg.timeLeft;
    timerState.totalTime = msg.totalTime;
    timerState.running = msg.timeLeft > 0 && !timerState.paused;
    updateDisplay();
    updateButtonsState();
  } else if (msg.action === "timerStarted") {
    timerState.running = true;
    timerState.paused = false;
    if (typeof msg.minutes === "number") {
      timerState.timeLeft = msg.minutes * 60;
      timerState.totalTime = msg.minutes * 60;
    }
    updateDisplay();
    updateButtonsState();
  } else if (msg.action === "timerTick") {
    timerState.running = true;
    timerState.paused = false;
    timerState.timeLeft = (msg.minutes * 60) + (msg.seconds || 0);
    updateDisplay();
    updateButtonsState();
  } else if (msg.action === "timerPaused") {
    timerState.paused = true;
    updateButtonsState();
  } else if (msg.action === "timerStopped") {
    timerState.running = false;
    timerState.paused = false;
    timerState.timeLeft = 0;
    timerState.totalTime = 0;
    updateDisplay();
    updateButtonsState();
  }
});

(function () {
  function addTimerIndicator() {
    if (document.getElementById("breakpoint-indicator")) return;
    const indicator = document.createElement("div");
    indicator.id = "breakpoint-indicator";
    indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            padding: 5px 10px;
            background-color: var(--accent, #2AA198);
            color: white;
            border-radius: 4px;
            z-index: 10000;
            font-family: sans-serif;
            font-size: 12px;
            display: none;
        `;
    indicator.setAttribute("aria-live", "polite");
    indicator.textContent = "BreakPoint: Running";
    document.body.appendChild(indicator);
  }
  addTimerIndicator();
  chrome.runtime.onMessage.addListener((req) => {
    const indicator = document.getElementById("breakpoint-indicator");
    if (!indicator) return;
    if (req.action === "timerStarted") {
      indicator.style.display = "block";
      indicator.textContent = `Next break in ${req.minutes}m`;
    } else if (req.action === "timerTick") {
      indicator.textContent = `Next break in ${req.minutes}m ${req.seconds}s`;
    } else if (req.action === "timerPaused") {
      indicator.textContent = "BreakPoint: Paused";
    } else if (req.action === "timerStopped") {
      indicator.style.display = "none";
    }
  });
})();
