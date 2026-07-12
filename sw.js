/* NEA DCS Messaging — Service Worker (Web Push)
   Receives push messages sent by the Supabase Edge Function and shows a
   system notification even when the app / browser tab is CLOSED.
   Must be served from the SAME folder as the app over HTTPS. */

self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', (e) => {
  const show = async () => {
    let d = {};
    try {
      d = e.data.json();
    } catch (_) {
      d = { body: e.data ? e.data.text() : '' };
    }

    // If the app is open AND focused, the in-app chime already alerts the
    // operator — skip the duplicate system notification.
    const wins = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });

    if (wins.some(w => w.focused)) return;

    return self.registration.showNotification(
      d.title || '⚡ New message',
      {
        body: d.body || 'नयाँ सन्देश आयो',
        tag: 'nea-msg',
        renotify: true,
        vibrate: [200, 100, 200],
        icon: './icon.png',       // Large notification icon
        badge: './icon.png',      // Status bar icon
        data: {
          url: d.url || './?role=monitor'
        }
      }
    );
  };

  e.waitUntil(show());
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();

  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });

    for (const w of wins) {
      if ('focus' in w) {
        return w.focus();
      }
    }

    return self.clients.openWindow(
      e.notification.data?.url || './?role=monitor'
    );
  })());
});
