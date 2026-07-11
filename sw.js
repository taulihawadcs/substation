/* NEA DCS Messaging — Service Worker (Web Push)
   Receives push messages sent by the Supabase Edge Function and shows a
   system notification even when the app / browser tab is CLOSED.
   Must be served from the SAME folder as the app over HTTPS. */

self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', (e) => {
  const show = async () => {
    let d = {};
    try { d = e.data.json(); }
    catch (_) { d = { body: e.data ? e.data.text() : '' }; }

    // If the app is open AND focused, the in-app chime already alerts the
    // operator — skip the duplicate system notification (this also stops the
    // SENDER's own device from notifying itself while they're using the app).
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (wins.some(w => w.focused)) return;

    return self.registration.showNotification(d.title || '⚡ New message', {
      body: d.body || 'नयाँ सन्देश आयो',
      tag: 'nea-msg',
      renotify: true,
      vibrate: [200, 100, 200],
      icon: d.icon || './icon-192.png',
      badge: './badge-96.png',
      data: { url: d.url || './' }
    });
  };
  e.waitUntil(show());
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) {
      if ('focus' in w) return w.focus();
    }
    return self.clients.openWindow(e.notification.data?.url || './');
  })());
});
