"use client";
import {useState,useSyncExternalStore} from 'react';
import {checkInEventAction} from '@/lib/actions/attendance';
export interface CalendarItem {id:string;universityId:string;title:string;date:string;venue:string;kind:string;}
const subscribeClock=(notify:()=>void)=>{const timer=window.setInterval(notify,60000);document.addEventListener('visibilitychange',notify);return()=>{window.clearInterval(timer);document.removeEventListener('visibilitychange',notify);};};
export function CampusCalendar({items}:{items:CalendarItem[]}){
 const currentMonth=useSyncExternalStore(subscribeClock,()=>new Date().toISOString().slice(0,7),()=>'');
 const [selectedMonth,setMonth]=useState(''),[message,setMessage]=useState('');
 const month=selectedMonth||currentMonth;
 const shown=items.filter(e=>e.date.startsWith(month)).sort((a,b)=>a.date.localeCompare(b.date));
 function download(){const escape=(s:string)=>s.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Campus Hub//Calendar//EN',...shown.flatMap(e=>['BEGIN:VEVENT',`UID:${e.id}@campus-hub`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,`DTSTART;VALUE=DATE:${e.date.slice(0,10).replace(/-/g,'')}`,`SUMMARY:${escape(e.title)}`,`LOCATION:${escape(e.venue)}`,'END:VEVENT']),'END:VCALENDAR'];const url=URL.createObjectURL(new Blob([lines.join('\r\n')],{type:'text/calendar'}));const a=document.createElement('a');a.href=url;a.download='campus-calendar.ics';a.click();URL.revokeObjectURL(url);}
 return <section className="border rounded-xl p-4 space-y-3"><h2 className="font-bold text-lg">Campus calendar</h2><label>Month <input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="border rounded p-2"/></label><button className="border rounded p-2 ml-2" disabled={!shown.length} onClick={download}>Export calendar</button><p role="status">{message}</p>{shown.length===0?<p>No published events or academic dates this month.</p>:<ol className="space-y-3">{shown.map(e=><li key={e.id} className="border-t pt-2"><time>{e.date.slice(0,10)}</time><p className="font-semibold">{e.title}</p><p>{e.venue} · {e.kind}</p>{e.kind==='event'&&<button className="border rounded p-2" onClick={async()=>{try{const r=await checkInEventAction(e.id,e.universityId);setMessage(r.success?(r.message??'Checked in.'):(r.error??'Could not check in.'));}catch{setMessage('Check-in requires a connection.');}}}>Check in</button>}</li>)}</ol>}</section>;
}
