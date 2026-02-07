// 版本號：每次你有大修改 (例如改了 index.html)，建議把這裡的 v1 改成 v2, v3...
const CACHE_NAME = 'finance-master-v2'; 

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];

// 安裝 Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  // 強制立即接管頁面
  self.skipWaiting();
});

// 啟動 Service Worker (刪除舊快取)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('刪除舊快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // 讓新版 SW 立即控制所有開啟的頁面
  return self.clients.claim();
});

// 攔截請求：網路優先策略 (Network First)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 如果網路請求成功，複製一份到快取，然後回傳
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME)
          .then(cache => {
            cache.put(event.request, responseToCache);
          });
        return response;
      })
      .catch(() => {
        // 如果網路失敗 (離線)，才去讀取快取
        return caches.match(event.request);
      })
  );
});
