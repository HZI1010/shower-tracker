// State Management
let showerData = JSON.parse(localStorage.getItem('showerData')) || {
    lastShower: null,
    history: [],
    notificationsEnabled: false,
    interval: 24
};

// DOM Elements
const timeDisplay = document.getElementById('time-since');
const statusText = document.getElementById('status-text');
const statusOrb = document.getElementById('status-orb');
const showerBtn = document.getElementById('shower-btn');
const notifToggle = document.getElementById('notif-toggle');
const intervalSelect = document.getElementById('interval-select');
const historyList = document.getElementById('history-list');
const resetBtn = document.getElementById('reset-btn');

// Initialize
function init() {
    updateUI();

    // Set initial values from state
    notifToggle.checked = showerData.notificationsEnabled;
    intervalSelect.value = showerData.interval;

    // Start timer update loop
    setInterval(updateTimer, 1000);
}

// Update the "time since" display
function updateTimer() {
    if (!showerData.lastShower) return;

    const last = new Date(showerData.lastShower);
    const now = new Date();
    const diff = now - last;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    timeDisplay.textContent = `${pad(hours)}:${pad(mins)}:${pad(secs)}`;

    // Update status color based on time
    const intervalHours = parseInt(showerData.interval);
    if (hours < intervalHours * 0.75) {
        statusOrb.style.background = 'var(--success)';
        statusOrb.style.boxShadow = '0 0 10px var(--success)';
        statusText.textContent = "You're all fresh!";
    } else if (hours < intervalHours) {
        statusOrb.style.background = 'var(--warning)';
        statusOrb.style.boxShadow = '0 0 10px var(--warning)';
        statusText.textContent = "Getting close to shower time...";
    } else {
        statusOrb.style.background = 'var(--danger)';
        statusOrb.style.boxShadow = '0 0 10px var(--danger)';
        statusText.textContent = "Time for a shower!";

        // Trigger notification if enabled and not already sent for this cycle
        if (showerData.notificationsEnabled) {
            sendNotification();
        }
    }
}

function pad(num) {
    return num.toString().padStart(2, '0');
}

// Update UI elements
function updateUI() {
    updateTimer();
    renderHistory();
}

// Handle Shower Button Click
showerBtn.addEventListener('click', () => {
    const now = new Date();
    showerData.lastShower = now.toISOString();

    // Add to history (max 10 items)
    showerData.history.unshift(now.toLocaleString());
    if (showerData.history.length > 10) showerData.history.pop();

    saveData();
    updateUI();

    // Trigger feedback animation
    showerBtn.style.transform = 'scale(0.95)';
    setTimeout(() => showerBtn.style.transform = 'scale(1)', 100);
});

// Toggle Notifications
notifToggle.addEventListener('change', (e) => {
    showerData.notificationsEnabled = e.target.checked;

    if (showerData.notificationsEnabled) {
        requestNotificationPermission();
    }

    saveData();
});

// Change Interval
intervalSelect.addEventListener('change', (e) => {
    showerData.interval = parseInt(e.target.value);
    saveData();
    updateTimer();
});

// Reset History
resetBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to reset your shower history? This cannot be undone.")) {
        showerData.lastShower = null;
        showerData.history = [];
        saveData();
        updateUI();

        // Reset timer display
        timeDisplay.textContent = '--:--:--';
        statusOrb.style.background = 'var(--success)';
        statusOrb.style.boxShadow = '0 0 10px var(--success)';
        statusText.textContent = "Checking status...";
    }
});

// Request Permission
async function requestNotificationPermission() {
    if (!("Notification" in window)) {
        alert("This browser does not support desktop notification");
        notifToggle.checked = false;
        showerData.notificationsEnabled = false;
        return;
    }

    if (Notification.permission === "granted") return;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
        notifToggle.checked = false;
        showerData.notificationsEnabled = false;
        saveData();
    }
}

// Send Notification
function sendNotification() {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    // Check if we already notified in the last hour to prevent spam
    const lastNotified = localStorage.getItem('lastNotified');
    const now = Date.now();

    if (lastNotified && (now - lastNotified < 3600000)) return;

    new Notification("Shower Reminder", {
        body: "It's been a while since your last shower. Time to get fresh!",
        icon: "https://cdn-icons-png.flaticon.com/512/3100/3100824.png"
    });

    localStorage.setItem('lastNotified', now);
}

// Save to LocalStorage
function saveData() {
    localStorage.setItem('showerData', JSON.stringify(showerData));
}

// Render History List
function renderHistory() {
    if (showerData.history.length === 0) {
        historyList.innerHTML = '<li class="empty-msg">No history yet</li>';
        return;
    }

    historyList.innerHTML = showerData.history.map(item => `
        <li class="history-item">
            <span>Shower</span>
            <span style="color: var(--text-dim); font-size: 0.8rem;">${item}</span>
        </li>
    `).join('');
}

// Run Init
init();
