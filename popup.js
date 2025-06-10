document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const intervalInput = document.getElementById('interval');
    const timerDisplay = document.getElementById('timer');

    // Load saved interval
    chrome.storage.local.get(['interval'], function(result) {
        if (result.interval) {
            intervalInput.value = result.interval;
        }
    });

    startBtn.addEventListener('click', function() {
        const interval = parseInt(intervalInput.value);
        if (interval > 0) {
            // Save interval
            chrome.storage.local.set({ interval: interval });
            
            // Create alarm
            chrome.runtime.sendMessage({
                action: 'startTimer',
                interval: interval
            });
        }
    });

    stopBtn.addEventListener('click', function() {
        chrome.runtime.sendMessage({ action: 'stopTimer' });
    });

    // Listen for timer updates from background script
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === 'updateTimer') {
            const minutes = Math.floor(request.timeLeft / 60);
            const seconds = request.timeLeft % 60;
            timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    });
}); 