"use client";
import {useSyncExternalStore} from 'react';
import {clearPrivateOffline} from '@/lib/offline';
const subscribe=(listener:()=>void)=>{window.addEventListener('storage',listener);window.addEventListener('campus-settings',listener);return()=>{window.removeEventListener('storage',listener);window.removeEventListener('campus-settings',listener);};};
function useDeviceSetting(key:string){return useSyncExternalStore(subscribe,()=>localStorage.getItem(key)==='yes',()=>false);}
function setDeviceSetting(key:string,value:boolean){localStorage.setItem(key,value?'yes':'no');window.dispatchEvent(new Event('campus-settings'));}
export function OfflineSettings(){
 const enabled=useDeviceSetting('campus-offline-opt-in'),low=useDeviceSetting('campus-low-data');
 return <section className="border rounded-xl p-4 space-y-3">
  <h2 className="font-bold text-lg">Offline and data usage</h2>
  <p className="text-sm">On a personal device, save viewed notices, timetable and campus events for up to 24 hours. Saved data is cleared on sign out or account change and is available only in this browser session.</p>
  <label className="block"><input type="checkbox" checked={enabled} onChange={e=>{setDeviceSetting('campus-offline-opt-in',e.target.checked);if(!e.target.checked){const account=sessionStorage.getItem('campus-account');clearPrivateOffline();if(account)sessionStorage.setItem('campus-account',account);}}}/> Save core views on this device</label>
  <label className="block"><input type="checkbox" checked={low} onChange={e=>{setDeviceSetting('campus-low-data',e.target.checked);document.documentElement.dataset.lowData=String(e.target.checked);}}/> Low data mode (no optional images)</label>
  <button className="border p-2 rounded" onClick={()=>{const account=sessionStorage.getItem('campus-account');clearPrivateOffline();if(account)sessionStorage.setItem('campus-account',account);}}>Clear saved views</button>
 </section>;
}
