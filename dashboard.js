document.addEventListener('DOMContentLoaded', () => {
    // Register the FCM-compatible service worker (replaces old service-worker.js)
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./firebase-messaging-sw.js')
            .then(reg => console.log('✅ Service worker registered (scope:', reg.scope + ')'))
            .catch(err => console.error('❌ SW Registration failed:', err));
    }

    // ── Load or generate today's schedule (never regenerates on refresh) ──
    const schedule = Scheduler.getOrGenerateTodaySchedule();
    const container = document.getElementById('tasks-container');

    if (!schedule || schedule.tasks.length === 0) {
        container.innerHTML = `
            <div class="glass empty-state">
                <p>No tasks for today. You're either done or haven't set up your syllabus.</p>
                <button class="btn" style="margin-top: 2rem;" onclick="window.location.href='index.html'">Edit Syllabus</button>
            </div>
        `;
        const ring = document.querySelector('.progress-section');
        if (ring) ring.style.display = 'none';
        return;
    }

    renderTasks(schedule);
    updateProgress();

    // ── Notification Bell → opens settings modal ──
    const bellIcon = document.getElementById('bell-icon');
    const settingsModal = document.getElementById('settings-modal');

    bellIcon.addEventListener('click', () => {
        const settings = Storage.getSettings();
        document.getElementById('notify-enable').checked = settings.notificationsEnabled;
        document.getElementById('notify-time').value = settings.reminderTime;
        settingsModal.showModal();
    });

    // When the toggle is enabled → request FCM permission + get token
    document.getElementById('notify-enable').addEventListener('change', async (e) => {
        if (e.target.checked) {
            try {
                await FirebaseNotifications.requestPermissionAndGetToken();
            } catch (err) {
                console.error('FCM permission error:', err);
                e.target.checked = false;
                alert("Notifications could not be enabled. Please allow notification permissions in your browser settings.");
            }
        }
    });

    document.getElementById('save-settings').addEventListener('click', () => {
        const notifyEnabled = document.getElementById('notify-enable').checked;
        const notifyTime = document.getElementById('notify-time').value;

        Storage.saveSettings({
            notificationsEnabled: notifyEnabled,
            reminderTime: notifyTime
        });

        settingsModal.close();
    });

    document.getElementById('close-settings').addEventListener('click', () => {
        settingsModal.close();
    });
});

function renderTasks(schedule) {
    const container = document.getElementById('tasks-container');
    container.innerHTML = '';

    const data = Storage.getData();

    schedule.tasks.forEach(task => {
        const subject = data.subjects.find(s => s.name === task.subject);
        const total = subject && subject.topics.length ? subject.topics.length : 1;
        const progress = subject ? Math.round((subject.currentIndex / total) * 100) : 0;
        const isSubjectDone = subject && subject.currentIndex >= subject.topics.length;

        const card = document.createElement('div');
        card.className = `task-card glass ${task.completed ? 'completed' : ''}`;

        if (isSubjectDone) {
            card.innerHTML = `
                <div class="task-info">
                    <h4>${task.subject}</h4>
                    <p style="color: var(--success);">Subject Completed ✓</p>
                    <div class="subject-progress-bar">
                        <div class="fill" style="width: 100%"></div>
                    </div>
                </div>
            `;
        } else {
            card.innerHTML = `
                <div class="task-info">
                    <h4>${task.subject}</h4>
                    <p>${task.topic}</p>
                    <div class="subject-progress-bar">
                        <div class="fill" style="width: ${progress}%"></div>
                    </div>
                </div>
                <label class="custom-checkbox">
                    <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="window.toggleTask('${task.id}', this.checked)">
                    <span class="checkmark"></span>
                </label>
            `;
        }

        container.appendChild(card);
    });
}

window.toggleTask = function (taskId, isChecked) {
    Scheduler.markTaskCompleted(taskId, isChecked);

    const schedule = Storage.getSchedule();
    renderTasks(schedule);
    updateProgress();
};

function updateProgress() {
    const schedule = Storage.getSchedule();
    if (!schedule) return;

    const total = schedule.tasks.length;
    let completed = 0;

    schedule.tasks.forEach(task => {
        if (task.completed) completed++;
    });

    const dashElement = document.getElementById('daily-progress-text');
    if (dashElement) {
        dashElement.innerHTML = `
            <span class="num">${completed} / ${total}</span>
            <span class="label">Completed</span>
        `;
    }

    const ring = document.querySelector('.progress-ring__circle');
    if (ring && total > 0) {
        const radius = ring.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        ring.style.strokeDasharray = `${circumference} ${circumference}`;

        const percent = completed / total;
        const offset = circumference - (percent * circumference);
        ring.style.strokeDashoffset = offset;
    }
}
