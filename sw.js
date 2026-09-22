const C='cuaderno-cuidado-v53';
const A=["./", "index.html", "style.css", "app.js", "manifest.webmanifest", "assets/portada-congreso.png", "assets/portada-cuaderno.png", "assets/simbolo-dina.png", "assets/comibam.png", "assets/ctc.png", "assets/philhos.png",];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(A)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{const copy=resp.clone();caches.open(C).then(c=>c.put(e.request,copy));return resp}).catch(()=>caches.match('index.html'))))});
