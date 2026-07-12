/* NEA DCS Messaging — Service Worker (Web Push)
   Receives push messages sent by the Supabase Edge Function and shows a
   system notification even when the app/browser is CLOSED.
*/

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  const showNotification = async () => {
    let data = {};

    try {
      data = event.data.json();
    } catch (err) {
      data = {
        title: "⚡ New Message",
        body: event.data ? event.data.text() : "नयाँ सन्देश आयो"
      };
    }

    // Don't show notification if app is already open and focused
    const windows = await self.clients.matchAll({
      type: "window",
      includeUncontrolled: true
    });

    if (windows.some(win => win.focused)) {
      return;
    }

    return self.registration.showNotification(
      data.title || "⚡ NEA DCS Messaging",
      {
        body: data.body || "नयाँ सन्देश आयो",
        icon: "./icon.png",
        badge: "./icon.png",
        image: "./icon.png",
        vibrate: [200, 100, 200],
        tag: "nea-dcs-message",
        renotify: true,
        requireInteraction: true,
        data: {
          url: data.url || "./"
        }
      }
    );
  };

  event.waitUntil(showNotification());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true
      });

      for (const client of allClients) {
        if ("focus" in client) {
          client.focus();
          client.navigate(event.notification.data.url);
          return;
        }
      }

      await self.clients.openWindow(event.notification.data.url || "./");
    })()
  );
});
