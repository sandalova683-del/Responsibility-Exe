/* =====================================================
   Ответственность.exe
   Version: 1.0.0 Release
   sw.js
   © 2026
===================================================== */

const CACHE_NAME = 'responsibility-exe-v1.0.2';

const FILES_TO_CACHE = [
    './index.html',
    './manifest.json',
    './css/style.css',
    './js/data.js',
    './js/storage.js',
    './js/sound.js',
    './js/app.js',
    './assets/ball.png',
    './assets/ball-thinking.png',
    './assets/ball-gold.png',
    './assets/icons/favicon.png',
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png',
    './sounds/whoosh.mp3'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                // Добавляем файлы по одному, игнорируя ошибки
                return Promise.allSettled(
                    FILES_TO_CACHE.map(url => 
                        cache.add(url).catch(() => {})
                    )
                );
            })
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
    const url = event.request.url;
    
    // Пропускаем запросы к расширениям Chrome
    if (url.startsWith('chrome-extension://')) {
        return;
    }
    
    // Пропускаем запросы к расширениям браузера
    if (url.startsWith('moz-extension://')) {
        return;
    }
    
    // Пропускаем запросы к devtools
    if (url.includes('devtools')) {
        return;
    }

    // Работаем только с GET запросами
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Проверяем, что ответ успешный и не частичный
                if (!response || response.status !== 200 || response.type === 'opaque') {
                    return response;
                }
                
                // Проверяем Content-Range (частичные ответы)
                const contentRange = response.headers.get('Content-Range');
                if (contentRange) {
                    return response; // Пропускаем частичные ответы
                }

                // Клонируем и кэшируем только успешные ответы
                const copy = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    try {
                        cache.put(event.request, copy);
                    } catch (error) {
                        // Игнорируем ошибки кэширования
                    }
                });

                return response;
            })
            .catch(() => {
                // Если офлайн, пробуем достать из кэша
                return caches.match(event.request)
                    .then(response => {
                        if (response) return response;
                        // Если ничего не найдено, показываем index.html
                        return caches.match('./index.html');
                    });
            })
    );
});