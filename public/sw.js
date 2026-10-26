const STATIC_CACHE='campus-hub-static-v5';
const PRECACHE_ASSETS=['/offline.html','/icons/icon-192x192.png','/icons/icon-512x512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(STATIC_CACHE).then(cache=>Promise.allSettled(PRECACHE_ASSETS.map(url=>cache.add(url)))).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('campus-hub-')&&k!==STATIC_CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const {request}=event;const url=new URL(request.url);if(url.origin!==self.location.origin||request.method!=='GET')return;
if(self.location.hostname==='localhost'||self.location.hostname==='127.0.0.1')return;
if(request.mode==='navigate'){event.respondWith(fetch(request).catch(()=>caches.match('/offline.html').then(r=>r||new Response('Offline',{status:503}))));return;}
const publicStatic=url.pathname.startsWith('/_next/static/')||url.pathname.startsWith('/icons/')||url.pathname==='/offline.html';
if(!publicStatic||url.search||request.headers.has('authorization')||request.headers.has('rsc'))return;
event.respondWith(caches.open(STATIC_CACHE).then(async cache=>{const cached=await cache.match(request);if(cached)return cached;const response=await fetch(request);if(response.ok&&response.type==='basic')await cache.put(request,response.clone());return response;}));});
self.addEventListener('push',event=>{let data;try{data=event.data.json();}catch{return;}event.waitUntil(self.registration.showNotification(data.title||'Campus Hub',{body:data.body||'A new notice is available.',icon:'/icons/icon-192x192.png',tag:data.tag,requireInteraction:data.priority==='P1',data:{url:'/dashboard'}}));});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(async clients=>{const client=clients.find(c=>new URL(c.url).origin===self.location.origin);if(client){await client.navigate('/dashboard');return client.focus();}return self.clients.openWindow('/dashboard');}));});