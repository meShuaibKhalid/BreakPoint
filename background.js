let timerInterval;
let timeLeft = 0;
let totalTime = 0;
let paused = false;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startTimer') {
        startTimer(request.interval);
    } else if (request.action === 'stopTimer') {
        stopTimer();
    } else if (request.action === 'pauseTimer') {
        pauseTimer();
    } else if (request.action === 'resumeTimer') {
        resumeTimer();
    } else if (request.action === 'getTimerState') {
        sendResponse({
            timeLeft,
            totalTime,
            running: timeLeft > 0 && !paused,
            paused
        });
    }
});

function startTimer(minutes) {
    stopTimer();
    timeLeft = minutes * 60;
    totalTime = timeLeft;
    paused = false;
    chrome.alarms.create('timerAlarm', {
        delayInMinutes: minutes
    });
    updateTimerDisplay();
    sendTimerState('timerStarted', minutes);
    timerInterval = setInterval(() => {
        if (!paused) {
            timeLeft--;
            updateTimerDisplay();
            sendTimerState('timerTick', Math.floor(timeLeft / 60), timeLeft % 60);
            if (timeLeft <= 0) {
                stopTimer();
                showNotification();
            }
        }
    }, 1000);
}

function pauseTimer() {
    paused = true;
    sendTimerState('timerPaused');
}

function resumeTimer() {
    if (paused && timeLeft > 0) {
        paused = false;
        sendTimerState('timerStarted', Math.floor(timeLeft / 60));
    }
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    chrome.alarms.clear('timerAlarm');
    timeLeft = 0;
    totalTime = 0;
    paused = false;
    updateTimerDisplay();
    sendTimerState('timerStopped');
}

function updateTimerDisplay() {
    chrome.runtime.sendMessage({
        action: 'updateTimer',
        timeLeft: timeLeft,
        totalTime: totalTime
    });
}

function sendTimerState(action, minutes = 0, seconds = 0) {
    chrome.runtime.sendMessage({
        action,
        minutes,
        seconds
    });
}

function showNotification() {
    chrome.notifications.create('breakNotification', {
        type: 'basic',
        iconUrl: 'icons/breakpoint.png',
        title: 'BreakPoint Reminder',
        message: 'Time for a break!',
        buttons: [
            { title: 'Take Break' },
            { title: 'Snooze 5m' }
        ],
        priority: 2
    });
}

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'timerAlarm') {
        showNotification();
    }
});

chrome.notifications.onButtonClicked.addListener((notifId, btnIdx) => {
    if (notifId === 'breakNotification') {
        if (btnIdx === 0) {
            // Take Break: open break screen
            chrome.tabs.create({ url: 'break.html' });
        } else if (btnIdx === 1) {
            // Snooze: start a 5-minute timer
            startTimer(5);
        }
    }
}); 