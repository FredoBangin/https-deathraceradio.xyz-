const SHELL_CACHE = 'drr-shell-v1';
const AUDIO_CACHE = 'drr-audio-v1';
const AUDIO_CACHE_LIMIT = 60; // max cached audio files

const AUDIO_ORIGINS = ['juicewrldapi.com'];

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== SHELL_CACHE && k !== AUDIO_CACHE)
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

const isAudioRequest = (url) => {
  const { hostname, pathname } = new URL(url);
  return AUDIO_ORIGINS.includes(hostname) && pathname.startsWith('/files/');
};

const trimAudioCache = async () => {
  const cache = await caches.open(AUDIO_CACHE);
  const keys = await cache.keys();
  if (keys.length > AUDIO_CACHE_LIMIT) {
    const toDelete = keys.slice(0, keys.length - AUDIO_CACHE_LIMIT);
    await Promise.all(toDelete.map(k => cache.delete(k)));
  }
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (isAudioRequest(request.url)) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;

        try {
          const response = await fetch(request);
          if (response.ok && response.status === 200) {
            cache.put(request, response.clone());
            trimAudioCache();
          }
          return response;
        } catch {
          return new Response('Audio unavailable offline.', { status: 503 });
        }
      })
    );
  }
});
