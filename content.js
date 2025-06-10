// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkPage') {
        // You can add page-specific logic here
        sendResponse({ status: 'active' });
    }
});

// Add a visual indicator when the timer is running
function addTimerIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'timer-extension-indicator';
    indicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 5px 10px;
        background-color: #4CAF50;
        color: white;
        border-radius: 4px;
        z-index: 10000;
        display: none;
    `;
    document.body.appendChild(indicator);
}

// Initialize the indicator
addTimerIndicator(); 