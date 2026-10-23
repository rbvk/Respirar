/* Respirar v4.1 — recursos públicos locales; no guarda sesiones ni datos clínicos */
const CACHE='respirar-static-v4.1.0';
const BASE=new URL('./',self.registration.scope);
const LOCAL=['./','./index.html','./privacidad.html','./styles.css','./app.js','./manifest.webmanifest','./assets/favicon.svg','./assets/icon-192.png','./assets/icon-512.png','./assets/social-card.png','./assets/audio/mar.mp3','./assets/audio/brisa.mp3','./assets/audio/lluvia.mp3','./assets/audio/bosque.mp3','./assets/audio/cafeteria.mp3','./assets/audio/rio.mp3','./assets/audio/fogata.mp3','./assets/audio/noche.mp3','./assets/audio/ventilador.mp3','./assets/audio/marron.mp3'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(LOCAL.map(u=>new URL(u,BASE).href))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('respirar-static-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin || !url.pathname.startsWith(BASE.pathname))return;
 event.respondWith((async()=>{
   const cache=await caches.open(CACHE);
   const cached=await cache.match(event.request,{ignoreSearch:true});
   // Con conexión, obtener HTML/JS/CSS recientes. Evita que los presets y el metrónomo
   // queden ligados indefinidamente a una versión antigua por el caché offline.
   const core=url.pathname.endsWith('/app.js')||url.pathname.endsWith('/styles.css')||url.pathname.endsWith('/index.html');
   const freshFirst=event.request.mode==='navigate'||core;
   if(!freshFirst && cached)return cached;
   try{
     const response=await fetch(event.request);
     if(response.ok)event.waitUntil(cache.put(event.request,response.clone()));
     return response;
   }catch(error){
     if(cached)return cached;
     if(event.request.mode==='navigate')return await cache.match(new URL('./index.html',BASE).href) || Response.error();
     return Response.error();
   }
 })());
});
