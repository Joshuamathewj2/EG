/**
 * notifications.js – Client-side reminder scheduler.
 *
 * For when the PWA tab is OPEN, this provides a fallback timer
 * that fires local notifications at the user's chosen time(s).
 *
 * Push notifications when the PWA is CLOSED are handled entirely
 * by Firebase Cloud Messaging (see firebase-init.js + service-worker.js).
 *
 * The default reminder windows are 19:00, 21:00, 22:30.
 * At 22:30 a stronger "warning" message is sent if tasks remain.
 */

class NotificationManager {
    constructor() {
        this.alreadySent = new Set(); // tracks which HH:MM slots we fired today
        this._checkInterval = null;
        this.start();
    }

    start() {
        // Check every 30 seconds
        this._checkInterval = setInterval(() => this._tick(), 30000);
        // Also run once immediately
        this._tick();
    }

    _tick() {
        const settings = Storage.getSettings();
        if (!settings.notificationsEnabled) return;
        if (Notification.permission !== 'granted') return;

        const now = new Date();
        const hh = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const currentSlot = `${hh}:${mm}`;

        // Reset tracking at midnight
        if (currentSlot === '00:00') {
            this.alreadySent.clear();
        }

        // The three default reminder windows
        const slots = ['19:00', '21:00', '22:30'];
        // Also include the user-selected custom time if it isn't one of the defaults
        if (settings.reminderTime && !slots.includes(settings.reminderTime)) {
            slots.push(settings.reminderTime);
        }

        if (slots.includes(currentSlot) && !this.alreadySent.has(currentSlot)) {
            this._fire(currentSlot);
            this.alreadySent.add(currentSlot);
        }
    }

    _fire(slot) {
        const schedule = Storage.getSchedule();
        if (!schedule) return;

        const hasIncomplete = schedule.tasks.some(t => !t.completed);
        if (!hasIncomplete) return; // all done, no nag needed

        const isWarning = (slot === '22:30');

        new Notification(isWarning ? 'EG Warning' : 'EG Reminder', {
            body: isWarning
                ? "You still have unfinished study topics today."
                : "Complete today's study topics.",
            icon: './icon-192.png'
        });
    }
}

// Auto-start
window.notifier = new NotificationManager();
