const SHARE_CACHE = 'dcc-share-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Minimal pass-through fetch handler — required for installability,
// and this is where we intercept the Share Target POST.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isAdminPost = event.request.method === 'POST' && url.pathname.endsWith('/admin.html');

  if (isAdminPost) {
    event.respondWith((async () => {
      try {
        const formData = await event.request.clone().formData();
        const file = formData.get('sharedFile');
        const title = formData.get('sharedTitle') || '';
        if (file) {
          const cache = await caches.open(SHARE_CACHE);
          await cache.put('pending-share', new Response(file, {
            headers: {
              'Content-Type': file.type || 'application/octet-stream',
              'X-File-Name': encodeURIComponent(file.name || 'shared-file'),
              'X-Share-Title': encodeURIComponent(title)
            }
          }));
        }
      } catch (e) {
        // fall through — admin.html will just show the normal upload form
      }
      return Response.redirect('admin.html?shared=1', 303);
    })());
    return;
  }
  // everything else: just let the network handle it
});
