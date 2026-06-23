// Service Worker — TradingLog PWA
const CACHE = 'tradinglog-v13';
const STATIC = [
  '/trading/',
  '/trading/index.html',
  '/trading/css/app.css',
  '/trading/js/icons.js',
  '/trading/js/firebase-config.js',
  '/trading/js/store.js',
  '/trading/js/assets.js',
  '/trading/js/theme.js',
  '/trading/js/auth.js',
  '/trading/js/journals.js',
  '/trading/js/trades.js',
  '/trading/js/dashboard.js',
  '/trading/js/journal-page.js',
  '/trading/js/strategies.js',
  '/trading/js/calendar.js',
  '/trading/js/economics.js',
  '/trading/js/analytics.js',
  '/trading/js/calculator.js',
  '/trading/js/markets.js',
  '/trading/js/paywall.js',
  '/trading/js/profile.js',
  '/trading/js/notebook.js',
  '/trading/js/app.js',
  '/trading/icons/favicon-32.png',
  '/trading/data/calendar.json',
];

// Installation : mise en cache des fichiers statiques
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).then(() => self.skipWaiting())
  );
});

// Activation : nettoyage des anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch : network-first pour les données, cache-first pour les assets
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Toujours réseau pour Firebase et APIs externes
  if (url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis') ||
      url.hostname.includes('gstatic') ||
      url.hostname.includes('forexfactory') ||
      url.hostname.includes('corsproxy')) {
    return;
  }

  // Network-first pour calendar.json (données fraîches en priorité)
  if (url.pathname.includes('calendar.json')) {
    e.respondWith(
      fetch(e.request)
        .then(res => { caches.open(CACHE).then(c => c.put(e.request, res.clone())); return res; })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first pour tout le reste (assets statiques)
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
