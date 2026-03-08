/**
 * Firebase Cloud Messaging helper for EG Study Scheduler.
 *
 * Firebase is already initialized by the inline <script type="module">
 * block in dashboard.html.  This file sets up FCM messaging using the
 * compat SDK and exposes the FirebaseNotifications helper.
 */

const VAPID_KEY = "BMNnGC40X-psH5kY1ephc1QiMbjWj4ZMY0X3aQSn55YKz-rISXph2LaCpFczrigr2lsoDN7jpEWvT8in4jISmjo";

// ── Initialize compat SDK (guarded against double-init) ──
if (!firebase.apps.length) {
    firebase.initializeApp({
        apiKey: "AIzaSyCRM0Sa95-Knf3lKDxlsC3G9CeFjH9A1bs",
        authDomain: "eg-study-scheduler.firebaseapp.com",
        projectId: "eg-study-scheduler",
        storageBucket: "eg-study-scheduler.firebasestorage.app",
        messagingSenderId: "558635584282",
        appId: "1:558635584282:web:b515a2dd11df8ec229faa3"
    });
}

const messaging = firebase.messaging();

/**
 * Thin wrapper around FCM permission + token retrieval + test notification.
 */
const FirebaseNotifications = {
    /**
     * Registers the FCM service worker, requests permission,
     * retrieves a token, and triggers a test notification.
     */
    async requestPermissionAndGetToken() {
        // 1. Register firebase-messaging-sw.js
        let swReg;
        try {
            swReg = await navigator.serviceWorker.register('./firebase-messaging-sw.js');
            await navigator.serviceWorker.ready;  // wait until it's active
            console.log('Complete today's study topics in EG.');
        } catch (err) {
            console.error('❌ Service worker registration failed:', err);
            throw err;
        }

        // 2. Request notification permission
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            console.error('❌ Notification permission denied');
            throw new Error('Notification permission denied');
        }
        console.log('✅ Notification permission granted');

        // 3. Get FCM token
        try {
            const token = await messaging.getToken({
                vapidKey: VAPID_KEY,
                serviceWorkerRegistration: swReg
            });

            if (token) {
                console.log('✅ FCM token generated successfully');
                console.log('FCM Token:', token);
                Storage.setFcmToken(token);

                // 4. Trigger a local test notification via the service worker
                this.triggerTestNotification(swReg);

                return token;
            }
            throw new Error('getToken returned empty');
        } catch (err) {
            console.error('❌ FCM token retrieval failed:', err);
            throw err;
        }
    },

    /**
     * Fires a local test push notification via the active service worker.
     */
    triggerTestNotification(swReg) {
        if (swReg && swReg.active) {
            swReg.showNotification('EG Reminder', {
                body: "Complete today's study topics in EG.",
                icon: './icon-192.png',
                badge: './icon-192.png',
                vibrate: [200, 100, 200],
                data: { url: '/dashboard.html' }
            });
            console.log('Complete today's study topics in EG.');
        } else {
            console.warn('⚠️ Service worker not yet active, skipping test notification');
        }
    },

    /**
     * Handle foreground messages while the app tab is open.
     */
    listenForeground() {
        messaging.onMessage((payload) => {
            console.log('[FCM] Foreground message:', payload);
            const { title, body } = payload.notification || {};
            if (title) {
                new Notification(title, {
                    body: body || "Complete today's study topics.",
                    icon: './icon-192.png'
                });
            }
        });
    }
};

// Start listening for foreground messages
FirebaseNotifications.listenForeground();



