// Define the cache name for your PWA
const CACHE_NAME = 'focus-tracker-v1';

// List of URLs to cache when the service worker is installed
// These are your "app shell" files, crucial for offline functionality.
// Remember to adjust paths if your app is in a subfolder (e.g., /your-repo-name/index.html)
const urlsToCache = [
  // Base URL for GitHub Pages repository (replace 'focus-time-tracker' with your repo name)
  '/focus-time-tracker/',
  '/focus-time-tracker/index.html',
  // Your manifest file
  '/focus-time-tracker/manifest.json',
  // External libraries
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js',
  // Placeholder for icons (you'll need to create these or use emojis/SVGs)
  // If you don't have these exact icon files, remove these lines or replace with actual paths.
  '/focus-time-tracker/icons/icon-72x72.png',
  '/focus-time-tracker/icons/icon-96x96.png',
  '/focus-time-tracker/icons/icon-128x128.png',
  '/focus-time-tracker/icons/icon-144x144.png',
  '/focus-time-tracker/icons/icon-152x152.png',
  '/focus-time-tracker/icons/icon-192x192.png',
  '/focus-time-tracker/icons/icon-384x384.png',
  '/focus-time-tracker/icons/icon-512x512.png'
];

// Install event: caches the app shell
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell:', urlsToCache);
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[Service Worker] Failed to cache app shell:', error);
      })
  );
});

// Activate event: cleans up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Ensure the service worker takes control of all clients immediately
  event.waitUntil(self.clients.claim());
});

// Fetch event: serves cached content or fetches from network
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Check if the request is for an HTML navigation
  // This is important for PWAs to work offline for navigation requests
  if (event.request.mode === 'navigate' || (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html'))) {
    console.log('[Service Worker] Handling navigation request:', event.request.url);
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          console.log('[Service Worker] Serving navigation from cache:', event.request.url);
          return cachedResponse;
        }
        // If not in cache, try to fetch from network
        return fetch(event.request)
          .then((response) => {
            // If fetch successful, cache the response
            if (response && response.status === 200 && response.type === 'basic') {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return response;
          })
          .catch(() => {
            // If network fails, try to serve the offline page o