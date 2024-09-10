import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist } from 'serwist';

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the
// actual precache manifest. By default, this string is set to
// `"self.__SW_MANIFEST"`.
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
});

self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/general_icon@192.png',
      badge: '/og.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2',
      },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Add this function to get all clients
async function getClients() {
  return await self.clients.matchAll({
    type: 'window',
    includeUncontrolled: true,
  });
}

// Example usage in the notificationclick event
self.addEventListener('notificationclick', async function (event) {
  console.log('Notification click received.');
  event.notification.close();

  const clientList = await getClients();

  if (clientList.length > 0) {
    // If a client is already open, focus it
    clientList[0].focus();
  } else {
    // If no client is open, open a new window
    await self.clients.openWindow('https://crosscube.app');
  }
});

serwist.addEventListeners();
