var tmp = 0;

self.addEventListener('sync', function(event) {
    if (event.tag == 'demo-sync') {
        console.log('%c demo-sync received!', 'background: #ffab40; color: #000000')
      event.waitUntil(fake());
    }
  });

function fake() {
    return Promise.resolve('yeah')
}