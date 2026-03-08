/**
 * Firebase Cloud Messaging helper for EG Study Scheduler
 * Handles:
 * - Service worker registration
 * - Notification permission
 * - FCM token generation
 * - Foreground notification handling
 */

const VAPID_KEY = "BMNnGC40X-psH5kY1ephc1QiMbjWj4ZMY0X3aQSn55YKz-rISXph2LaCpFczrigr2lsoDN7jpEWvT8in4jISmjo";

// Initialize Firebase (guard against double initialization)
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
 * Firebase Notifications Helper
 */
const FirebaseNotifications = {

    /**
     * Request permission and get FCM token
     */
    async requestPermissionAndGetToken() {

        let swReg;

        try {
            // Register service worker
            swReg = await navigator.serviceWorker.register('./firebase-messaging-sw.js');
            await navigator.serviceWorker.ready;

            console.log("✅ Service worker registered successfully");

        } catch (err) {
            console.error("❌ Service worker registration failed:", err);
            throw err;
        }

        // Request notification permission
        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
            console.error("❌ Notification permission denied");
            throw new Error("Notification permission denied");
        }

        console.log("✅ Notification permission granted");

        try {

            const token = await messaging.getToken({
                vapidKey: VAPID_KEY,
                serviceWorkerRegistration: swReg
            });

            if (token) {

                console.log("✅ FCM token generated successfully");
                console.log("FCM Token:", token);

                // Save token locally
                if (typeof Storage !== "undefined" && Storage.setFcmToken) {
                    Storage.setFcmToken(token);
                } else {
                    localStorage.setItem("fcmToken", token);
                }

                return token;

            } else {
                throw new Error("getToken returned empty");
            }

        } catch (err) {
            console.error("❌ FCM token retrieval failed:", err);
            throw err;
        }
    },

    /**
     * Listen for foreground messages
     */
    listenForeground() {

        messaging.onMessage((payload) => {

            console.log("[FCM] Foreground message:", payload);

            const { title, body } = payload.notification || {};

            if (title) {
                new Notification(title, {
                    body: body || "Complete today's study topics in EG.",
                    icon: "./icon-192.png",
                    badge: "./icon-192.png",
                    vibrate: [200, 100, 200],
                    data: { url: "/dashboard.html" }
                });
            }

        });
    }

};


// Start listening for foreground messages
FirebaseNotifications.listenForeground();
