'use client';
import {useEffect,useState} from 'react';
import {getPilotFeedbackAction,reviewPilotFeedbackAction} from '@/lib/actions/feedback';
type Feedback={id:string;rating:number;category:string;message:string;status:string;staff_note:string|null;created_at:string};
export function FeedbackReviewPanel(){
 const [items,setItems]=useState<Feedback[]>([]),[error,setError]=useState(''),[notice,setNotice]=useState(''),[loading,setLoading]=useState(true),[busy,setBusy]=useState<string|null>(null);
 const load=async()=>{const result=await getPilotFeedbackAction();if(!result.success)throw new Error(result.message);setItems(result.feedback as Feedback[]);};
 useEffect(()=>{
  let active=true;
  void getPilotFeedbackAction().then(result=>{if(!active)return;if(result.success)setItems(result.feedback as Feedback[]);else setError(result.message || 'Feedback could not be loaded.');}).catch(error=>{if(active)setError(error.message);}).finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[]);
 const review=async(event:React.FormEvent<HTMLFormElement>,id:string)=>{
  event.preventDefault();const form=new FormData(event.currentTarget);setBusy(id);setError('');setNotice('');
  try{const result=await reviewPilotFeedbackAction(id,String(form.get('status')),String(form.get('staff_note')||''));if(!result.success)throw new Error(result.message);setNotice(result.message);await load();}
  catch(error){setError(error instanceof Error?error.message:'Review failed.');}finally{setBusy(null);}
 };
 return <section className="space-y-4 rounded-xl border bg-white p-5">
  <h2 className="text-lg font-semibold">Pilot feedback</h2><p className="text-sm text-slate-600">Review student experience reports and record the follow-up visible to the student.</p>
  {error&&<p role="alert" className="text-rose-700">{error}</p>}{notice&&<p role="status" className="text-emerald-700">{notice}</p>}
  {loading?<p>Loading feedback…</p>:items.length===0?<p>No feedback has been submitted.</p>:items.map(item=><article key={item.id} className="rounded-lg border p-4 space-y-2">
   <p className="text-sm font-semibold">{item.rating}/5 · {item.category} · {item.status}</p><p className="whitespace-pre-wrap text-sm">{item.message}</p>
   <p className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString('en-KE')}</p>
   <form className="space-y-2" onSubmit={event=>void review(event,item.id)}>
    <label className="block text-sm">Review status<select name="status" defaultValue={['reviewed','planned','resolved'].includes(item.status)?item.status:'reviewed'} className="ml-2 rounded border p-2"><option value="reviewed">Reviewed</option><option value="planned">Planned</option><option value="resolved">Resolved</option></select></label>
    <label className="block text-sm">Reply to student<textarea name="staff_note" defaultValue={item.staff_note||''} maxLength={4000} className="mt-1 block w-full rounded border p-2" rows={3}/></label>
    <button disabled={busy!==null} className="rounded bg-[#0B1D33] px-4 py-2 text-sm text-white disabled:opacity-50">{busy===item.id?'Saving…':'Save review'}</button>
   </form>
  </article>)}
 </section>;
}
