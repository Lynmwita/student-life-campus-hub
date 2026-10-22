import {beforeEach,describe,it,expect,vi} from 'vitest';
import {setOfflineAccount,saveOffline,readOffline,clearPrivateOffline} from '@/lib/offline';
function storage(){const data:Record<string,string>={};return new Proxy(data,{get:(target,key)=>key==='getItem'?(k:string)=>target[k]??null:key==='setItem'?(k:string,v:string)=>{target[k]=v;}:key==='removeItem'?(k:string)=>{delete target[k];}:target[key as string]});}
beforeEach(()=>{vi.stubGlobal('window',{});vi.stubGlobal('localStorage',storage());vi.stubGlobal('sessionStorage',storage());localStorage.setItem('campus-offline-opt-in','yes');});
describe('Private offline views',()=>{
 it('cannot read another account views and clears data on account switch',()=>{setOfflineAccount('alice');saveOffline('timetable',{entries:['private']},100);expect(readOffline('timetable',101)?.data).toEqual({entries:['private']});setOfflineAccount('bob');expect(readOffline('timetable',101)).toBeNull();setOfflineAccount('alice');expect(readOffline('timetable',101)).toBeNull();});
 it('expires at 24 hours and clears all saved private and legacy participation data',()=>{setOfflineAccount('alice');saveOffline('feed',{notices:['notice']},100);expect(readOffline('feed',86400100)).toBeNull();saveOffline('feed',{},200);localStorage.setItem('smu_event_rsvps','private');clearPrivateOffline();expect(Object.keys(localStorage).filter(k=>k.startsWith('campus-private:'))).toEqual([]);expect(localStorage.getItem('smu_event_rsvps')).toBeNull();});
 it('requires explicit device opt-in and a session account key',()=>{saveOffline('feed',{},0);expect(readOffline('feed',1)).toBeNull();setOfflineAccount('alice');localStorage.setItem('campus-offline-opt-in','no');saveOffline('feed',{},0);expect(readOffline('feed',1)).toBeNull();});
});
