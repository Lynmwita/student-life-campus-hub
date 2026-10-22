import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {describe,it,expect,vi} from 'vitest';
describe('Service worker privacy boundary',()=>{
 it('never stores navigation responses, API responses, RSC requests or cross-origin data',async()=>{
 const handlers:Record<string,(e:unknown)=>void>={};const put=vi.fn();const fetch=vi.fn().mockResolvedValue({ok:true,type:'basic',clone:()=>({})});
 const caches={open:vi.fn().mockResolvedValue({match:vi.fn().mockResolvedValue(null),put}),match:vi.fn().mockResolvedValue({offline:true})};
 vm.runInNewContext(readFileSync('public/sw.js','utf8'),{self:{location:{origin:'https://hub.test'},addEventListener:(name:string,fn:(e:unknown)=>void)=>{handlers[name]=fn;}},URL,Response,fetch,caches});
 async function request(path:string,mode='cors',headers=new Headers()){const pending:Promise<unknown>[]=[];handlers.fetch({request:{url:path.startsWith('https')?path:'https://hub.test'+path,mode,method:'GET',headers},respondWith:(p:Promise<unknown>)=>pending.push(p)});await Promise.all(pending);}
 await request('/dashboard','navigate');await request('/api/private');await request('/dashboard?_rsc=test');await request('/_next/static/a.js','cors',new Headers({rsc:'1'}));await request('https://other.test/icons/private.png');expect(put).not.toHaveBeenCalled();
 await request('/_next/static/a.js');expect(put).toHaveBeenCalledOnce();
 });
});
