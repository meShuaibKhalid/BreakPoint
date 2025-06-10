let timerInterval;
let timeLeft = 0;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'startTimer') {
        startTimer(request.interval);
    } else if (request.action === 'stopTimer') {
        stopTimer();
    }
});

function startTimer(minutes) {
    // Clear any existing timer
    stopTimer();
    
    timeLeft = minutes * 60;
    
    // Create an alarm for when the timer ends
    chrome.alarms.create('timerAlarm', {
        delayInMinutes: minutes
    });
    
    // Update timer display immediately
    updateTimerDisplay();
    
    // Start the countdown
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            stopTimer();
            showNotification();
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    // Clear any existing alarm
    chrome.alarms.clear('timerAlarm');
    timeLeft = 0;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    chrome.runtime.sendMessage({
        action: 'updateTimer',
        timeLeft: timeLeft
    });
}

function showNotification() {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: '/icon.png',  // Updated path to be relative to extension root
        title: 'Time for a Break!',
        message: 'Take a short break to rest your eyes and stretch.',
        priority: 2
    });
}

// Handle alarm
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'timerAlarm') {
        showNotification();
    }
}); 