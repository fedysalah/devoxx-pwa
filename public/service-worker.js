'use strict';

var CACHE = 'airbeernbeer-precache';
var precacheFiles =
  ["/css/bundle/devoxxapp.css",
    "/images/icons/icon-128x128.png",
    "/images/icons/icon-144x144.png",
    "/images/icons/icon-152x152.png",
    "/images/icons/icon-192x192.png",
    "/images/icons/icon-384x384.png",
    "/images/icons/icon-512x512.png",
    "/images/icons/icon-72x72.png",
    "/images/icons/icon-96x96.png",
    "/images/favicon.png",
    "/images/logo.png",
    "/index.html",
    "/javascripts/bundle/devoxxapp.js",
    "/javascripts/bundle/media/fontawesome-webfont.eot",
    "/javascripts/bundle/media/fontawesome-webfont.svg",
    "/javascripts/bundle/media/fontawesome-webfont.ttf"
  ];

self.addEventListener('install', function (event) {
  console.log('The service worker is being installed.');
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(precacheFiles);
    }).then(function () {
      console.log('Skip waiting on install');
      return self.skipWaiting();
    }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          return caches.delete(cacheName);
        })
      );
    }).then(function () {
      console.log('clients claim()');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  console.log('fetch event listener', event.request);
  if (event.request.method === 'GET' && 0 === event.request.url.indexOf("http")) {
    console.log('The service worker is serving ' + event.request.url);
    if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') return;
    event.respondWith(
      caches.open(CACHE).then(function (cache) {
        return caches.match(event.request)
          .then(function (matching) {
            if (matching) {
              fetch(event.request).then(function (response) {
                //file to use the next time we show view
                cache.put(event.request, response.clone());
              })
              return matching;
            } else {
              return fetch(event.request).then(function (response) {
                //file to use the next time we show view
                cache.put(event.request, response.clone());
                return response;
              })
            }
          });
      })
    );
  }
});

function updateCache(urlPattern, response) {
  return caches.open(CACHE).then(function (cache) {
    return cache.keys()
      .then(function (requests) {
        const request = requests.find(_request => _request.url.endsWith(urlPattern));
        if (request) {
          console.log('updating cache fro pattern', urlPattern);
          return cache.put(request, response);
        }
        return Promise.resolve();
      })
  });
}

self.addEventListener('notificationclick', function (event) {
  console.log('On notification click: ', event.notification);
  event.notification.close();
  event.waitUntil(
    clients.matchAll({
      type: "window"
    }).then(function () {
      if (clients.openWindow) {
        return clients.openWindow(`https://airbeerandbeer.firebaseapp.com/notifications`);
      }
    })
  );
});

self.addEventListener("push", e => {
  const data = e.data.json();
  console.log("Push Recieved... !n", data);
  db.notifications.add({
    postId: data.postId,
    authorId: data.authorId,
    action: data.action,
    date: data.date,
    seen: 'false',
  }).then(() => {
    clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage(JSON.stringify({ message: 'gotNotification' }));
      })
    })
  });


  self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon,
  });
});

importScripts('https://unpkg.com/dexie@2.0.4/dist/dexie.min.js');

const db = new Dexie("AirBeerNbeer");
db.version(1).stores({
  favorites: "postId, authorId, unsynced",
  posts: "++postId, authorId, date, location, text, picture, unsynced",
  comments: "++commentId, postId, authorId, date, text, unsynced",
  votes: "postId, authorId, value, unsynced",
  notifications: "++id, postId, authorId, action, date ,seen"
});

self.addEventListener('message', function (event) {
  console.log("SW Received Message: " + event.data);
  launchSync(event.data);
});

self.addEventListener('sync', function (event) {
  console.log("sync Recieved: "+ event.tag);
  launchSync(event.tag);
});

function launchSync(tag) {
  if (tag == 'posts_updated') {
    syncPosts();
  }
  else if (tag == 'comments_updated') {
    syncComments();
  }
  else if (tag == 'favorites_updated') {
    syncFavorites();
  }
  else if (tag == 'votes_updated') {
    syncVotes();
  }
}

function syncFavorites() {
  return db.favorites.where('unsynced').equals('true').toArray()
    .then(favorites => {
      return fetch('/api/syncfavorites', {
        method: 'POST',
        body: JSON.stringify({ favorites }),
        headers: { 'content-type': 'application/json' }
      })
        .then((response) => {
          if (response.status === 200) {
            return Promise.all(favorites.map(fav => db.favorites.update(fav.postId, { unsynced: 'false' })))
          } else {
            return Promise.reject('an error occurred while syncing favorites')
          }
        })
    })
}

function syncVotes() {
  return db.votes.where('unsynced').equals('true').toArray()
    .then(votes => {
      return fetch('/api/syncvotes', {
        method: 'POST',
        body: JSON.stringify({ votes }),
        headers: { 'content-type': 'application/json' }
      }).then(response => {
        const clone = response.clone();
        if (response.status === 200) {
          return updateCache('/api/posts', clone)
            .then(() => {
              return clients.matchAll().then(clients => {
                clients.forEach(client => {
                  client.postMessage(JSON.stringify({ message: 'reloadPosts' }));
                })
              })
            })
        } else {
          return Promise.reject('an error occurred while syncing posts')
        }
      }).then(() => {
        return db.votes.where('unsynced').equals('true').modify({ unsynced: 'false' })
      })
    })
}

function syncPosts() {
  return db.posts.toArray()
    .then(posts => {
      return fetch('/api/syncposts', {
        method: 'POST',
        body: JSON.stringify({ posts }),
        headers: { 'content-type': 'application/json' }
      })
    }).then(response => {
      const clone = response.clone();
      if (response.status === 200) {
        return updateCache('/api/posts', clone)
          .then(() => {
            return clients.matchAll().then(clients => {
              clients.forEach(client => {
                client.postMessage(JSON.stringify({ message: 'reloadPosts' }));
              })
            })
          })
      } else {
        return Promise.reject('an error occurred while syncing posts')
      }
    }).then(() => db.posts.clear());
}

function syncComments() {
  return db.comments.toArray()
    .then(comments => {
      return fetch('/api/synccomments', {
        method: 'POST',
        body: JSON.stringify({ comments }),
        headers: { 'content-type': 'application/json' }
      })
    }).then(response => {
      const clone = response.clone();
      if (response.status === 200) {
        return updateCache('/api/comments', clone)
          .then(() => {
            return clients.matchAll().then(clients => {
              clients.forEach(client => {
                client.postMessage(JSON.stringify({ message: 'reloadComments' }));
              })
            })
          })
      } else {
        return Promise.reject('an error occurred while syncing comments')
      }
    }).then(() => db.comments.clear());
}


