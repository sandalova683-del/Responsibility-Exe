/* =====================================================
   Ответственность.exe
   Version: 1.0.0 Release
   sw.js
   © 2026
===================================================== */

const CACHE_NAME = 'responsibility-exe-v1.0.1';

const FILES_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    './css/style.css',
    './js/data.js',
    './js/storage.js',
    './js/app.js',
    './assets/ball.webp',
    './assets/ball-thinking.webp',
    './assets/ball-gold.webp',
    './assets/icons/favicon.png',
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png',
    './sounds/whoosh.mp3'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(FILES_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if(event.request.method !== 'GET'){
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            if(cachedResponse){
                return cachedResponse;
            }

            return fetch(event.request)
                .then(networkResponse => {
                    const responseClone = networkResponse.clone();

                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });

                    return networkResponse;
                })
                .catch(() => caches.match('./index.html'));
        })
    );
});
