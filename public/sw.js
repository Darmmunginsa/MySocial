const CACHE='oh-prototype-v1';
const BASE=new URL('./',self.location.href);
const ASSETS=['./','./index.html','./src/app.js','./src/core.js','./src/style.css','./data/edition.json','./icon.svg','./manifest.webmanifest'].map(p=>new URL(p,BASE).href);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith('oh-prototype-')&&name!==CACHE)await caches.delete(name);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==BASE.origin||!ASSETS.includes(event.request.url))return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE);try{const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response;}catch{return await cache.match(event.request)||new Response('Offline',{status:503});}})());
});
