"use client";

import {clearPrivateOffline} from "@/lib/offline";
import * as React from "react";
import {usePathname} from 'next/navigation';

export function PwaRegister() {
  const pathname=usePathname();
  React.useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      const register = () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("PWA service worker registered with scope:", registration.scope);
          })
          .catch((error) => {
            console.warn("PWA service worker registration failed:", error);
          });
      };

      if (document.readyState === "complete") {
        register();
      } else {
        window.addEventListener("load", register);
        return () => window.removeEventListener("load", register);
      }
    }
  }, []);

  const [savedAt,setSavedAt]=React.useState<number|null>(null);
 React.useEffect(()=>{document.documentElement.dataset.lowData=String(localStorage.getItem('campus-low-data')==='yes');let active=true;if(['/login','/logout','/signout'].includes(pathname)){clearPrivateOffline();queueMicrotask(()=>{if(active)setSavedAt(null);});if('serviceWorker'in navigator)navigator.serviceWorker.getRegistration().then(r=>r?.pushManager.getSubscription()).then(s=>s?.unsubscribe()).catch(()=>{});}const used=(e:Event)=>setSavedAt((e as CustomEvent<number>).detail);window.addEventListener('campus-offline-used',used);return ()=>{active=false;window.removeEventListener('campus-offline-used',used);};},[pathname]);
 return savedAt?<div role="status" className="fixed bottom-0 inset-x-0 bg-amber-100 text-amber-950 p-2 text-center z-50">Offline saved view from {new Date(savedAt).toLocaleString()}. Reconnect for current information.</div>:null;
}
