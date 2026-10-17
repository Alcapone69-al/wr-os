const C="wr-os-v14";
/* Push com a app fechada (Firebase Cloud Messaging) */
try{
 self.window=self;
 importScripts("vendor/firebase-app-compat.js","vendor/firebase-messaging-compat.js","firebase-config.js");
 if(self.WR_FIREBASE&&self.WR_FIREBASE.apiKey){
  firebase.initializeApp(self.WR_FIREBASE);
  firebase.messaging().onBackgroundMessage(p=>{
   const d=(p&&p.data)||{};
   return self.registration.showNotification(d.title||"WR Oficina",{body:d.body||"",tag:d.tag||"wr",icon:"icon-192.png",badge:"icon-192.png",data:{url:d.url||"./"},renotify:true});
  });
 }
}catch(e){}
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(["./","icon-192.png","manifest.webmanifest"]).catch(()=>{})));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{const r=e.request;if(r.method!=="GET")return;
 if(r.mode==="navigate"){e.respondWith(fetch(r).then(x=>{const y=x.clone();caches.open(C).then(c=>c.put("./",y));return x}).catch(()=>caches.match("./")));return}
 e.respondWith(caches.match(r).then(h=>{const n=fetch(r).then(x=>{if(x&&(x.ok||x.type==="opaque")){const y=x.clone();caches.open(C).then(c=>c.put(r,y))}return x}).catch(()=>h);return h||n}))});
self.addEventListener("notificationclick",e=>{e.notification.close();e.waitUntil(self.clients.matchAll({type:"window",includeUncontrolled:true}).then(l=>{for(const c of l){if("focus" in c)return c.focus()}return self.clients.openWindow((e.notification.data&&e.notification.data.url)||"./")}))});
