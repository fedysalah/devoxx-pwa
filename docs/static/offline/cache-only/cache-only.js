'use strict';
self.addEventListener('install', function(event) {
    console.log('install')
    event.waitUntil(
      caches.open('devoxx-pwa-cache-only-assets').then(function(cache) {
        console.log('caching assets');
        return cache.addAll([
          '../../../assets/css/style.css',
          '../../../assets/images/devoxx_brand.gif',
          '../../../assets/images/cache-only.png',
          './cache-only.html'
        ]);
      })
    );
  });

  self.addEventListener('activate', function(event) {
    console.log('activate')
    event.waitUntil(
      caches.keys().then(function(cacheNames) {
        console.log('cacheNames', cacheNames)
        return Promise.all(
          cacheNames.filter(function(cacheName) {
          }).map(function(cacheName) {
            console.log('delete cache', cacheName)
            return caches.delete(cacheName);
          })
        );
      })
    );
  });

  self.addEventListener('fetch', function(event) {
    // If a match isn't found in the cache, the response
    // will look like a connection error
    event.respondWith(function(){
      var cacheResponse = caches.match(event.request)
      if (cacheResponse) {
        console.log('element found in cache for ', event.request);
      } else {
        console.log('element not found in cache for ', event.request)
      }
      return cacheResponse;
    }());
  });
