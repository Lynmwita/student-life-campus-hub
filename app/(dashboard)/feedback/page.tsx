"use client";
import {useEffect,useState} from 'react';
import {AppHeader} from '@/components/shared/app-header';
import {submitPilotFeedbackAction,getPilotFeedbackAction} from '@/lib/actions/feedback';
export default function FeedbackPage(){
 const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);const [items,setItems]=useState<Awaited<ReturnType<typeof getPilotFeedbackAction>>['feedback']>([]);
 useEffect(()=>{getPilotFeedbackAction().then(r=>setItems(r.feedback));},[]);
 return <><AppHeader/><main className="max-w-2xl mx-auto p-6 space-y-6"><h1 className="text-3xl font-bold">Help improve Campus Hub</h1><p>Share your pilot experience. Your university team can review your feedback and reply below. For personal support, use the Help Desk.</p><form className="space-y-4" onSubmit={async e=>{e.preventDefault();setBusy(true);const form=e.currentTarget;try{const r=await submitPilotFeedbackAction(new FormData(form));setMessage(r.message);if(r.success){form.reset();setItems((await getPilotFeedbackAction()).feedback);}}catch{setMessage('Could not connect. Your feedback was not sent.');}finally{setBusy(false);}}}>
 <label className="block">Overall experience<select name="rating" required className="block border rounded p-2 w-full" defaultValue=""><option value="" disabled>Select a rating</option>{[1,2,3,4,5].map(n=><option key={n} value={n}>{n} / 5</option>)}</select></label>
 <label className="block">Topic<select name="category" className="block border rounded p-2 w-full">{['usability','performance','accessibility','content','other'].map(v=><option key={v}>{v}</option>)}</select></label>
 <label className="block">What worked, and what should improve?<textarea name="message" minLength={10} maxLength={4000} required rows={5} className="block border rounded p-2 w-full"/></label><p className="text-sm">Please leave out passwords and sensitive personal information.</p><button disabled={busy} className="bg-[#0B1D33] text-white rounded px-4 py-2">{busy?'Sending…':'Send feedback'}</button><p role="status">{message}</p></form>
 <h2 className="text-xl font-bold">Your feedback</h2>{items.map(item=><article key={item.id} className="border rounded p-4"><p>{item.message}</p><p className="text-sm">{item.rating}/5 · {item.status}</p>{item.staff_note&&<p className="mt-2">University response: {item.staff_note}</p>}</article>)}</main></>;
}
