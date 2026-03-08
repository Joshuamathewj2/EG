// Firebase Cloud Messaging Service Worker
// Must be named firebase-messaging-sw.js and live at the root.

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Initialize Firebase inside the service worker
firebase.initializeApp({
    apiKey: "AIzaSyCRM0Sa95-Knf3lKDxlsC3G9CeFjH9A1bs",
    authDomain: "eg-study-scheduler.firebaseapp.com",
    projectId: "eg-study-scheduler",
    storageBucket: "eg-study-scheduler.firebasestorage.app",
    messagingSenderId: "558635584282",
    appId: "1:558635584282:web:b515a2dd11df8ec229faa3"
});

const messaging = firebase.messaging();

// ────────── FCM Background Message Handler ──────────
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] Background message received:', payload);

    const title = (payload.notification && payload.notification.title) || 'EG Reminder';
    const body = (payload.notification && payload.notification.body) || "Complete today's study topics.";

    const options = {
        body,
        icon: './icon-192.png',
        badge: './icon-192.png',
        vibrate: [200, 100, 200],
        data: { url: './dashboard.html' }
    };

    return self.registration.showNotification(title, options);
});

// ────────── App Shell Caching (relative paths for GitHub Pages) ──────────
const CACHE_NAME = 'eg-app-v4';

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Use relative URLs resolved against the SW's own location
            const base = self.registration.scope;
            const assets = [
                '',
                'index.html',
                'dashboard.html',
                'style.css',
                'app.js',
                'storage.js',
                'scheduler.js',
                'dashboard.js',
                'notifications.js',
                'firebase-init.js',
                'manifest.json',
                'icon-192.png',
                'icon-512.png'
            ].map(a => base + a);
            return cache.addAll(assets);
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request)
            .then((res) => res || fetch(e.request))
    );
});

// ────────── Fallback Push Handler ──────────
self.addEventListener('push', (event) => {
    if (event.__handled) return;

    let title = 'EG Reminder';
    let body = "Complete today's study topics.";

    if (event.data) {
        try {
            const payload = event.data.json();
            title = (payload.notification && payload.notification.title) || title;
            body = (payload.notification && payload.notification.body) || body;
        } catch (_) {
            body = event.data.text() || body;
        }
    }

    event.waitUntil(
        self.registration.showNotification(title, {
            body,
            icon: './icon-192.png',
            badge: './icon-192.png',
            vibrate: [200, 100, 200],
            data: { url: './dashboard.html' }
        })
    );
});

// ────────── Notification click → open dashboard ──────────
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const targetUrl = (event.notification.data && event.notification.data.url)
        ? new URL(event.notification.data.url, self.registration.scope).href
        : new URL('dashboard.html', self.registration.scope).href;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            for (const client of clientList) {
                if (client.url.includes('dashboard') && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
