/* Service worker: giữ một bản vỏ app để chạy offline, NHƯNG ưu tiên mạng trước
   để mở app là thấy bản mới nhất ngay (không phải mở lại 2 lần).
   Đổi CACHE mỗi khi sửa app. */
const CACHE = 'doc-code-app-v20';
const SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './qrcode.js',
  './manifest.webmanifest',
  './icon.svg',
  './icon-maskable.svg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Chỉ quản VỎ APP (cùng nguồn). Dữ liệu Gist (khác nguồn) để trình duyệt tự lo.
  if (url.origin !== location.origin) return;
  // MẠNG TRƯỚC: luôn thử tải bản mới; nếu mất mạng mới dùng bản trong máy.
  e.respondWith(
    fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
  );
});
