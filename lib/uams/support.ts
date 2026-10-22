import type {SupabaseClient} from '@supabase/supabase-js';
import {z} from 'zod';

const responseSchema=z.object({success:z.literal(true),accepted:z.number().int().nonnegative(),updates:z.array(z.object({source_id:z.string(),kind:z.enum(['ticket','feedback','attendance']),status:z.enum(['open','in_review','in_progress','resolved','closed']),staff_note:z.string().nullable(),reviewed_at:z.string().nullable()})).default([])});
type SupportSourceRow={id:string;source_id?:string;kind?:string;user_id?:string;student_id?:string;created_at:string;updated_at?:string;source_updated_at:string;is_sensitive?:boolean;subject?:string;description?:string;message?:string;event_id?:string;status:string;category?:string;rating?:number;reference_number?:string;reference_no?:string;uams_reviewed_at?:string|null;reviewed_at?:string|null};
async function read(client:SupabaseClient,table:string,tenant:string){const rows:SupportSourceRow[]=[];for(let offset=0;;offset+=500){const {data,error}=await client.from(table).select('*').eq('university_id',tenant).order(table==='uams_support_deliveries'?'source_id':'id').range(offset,offset+499);if(error)throw new Error(`Cannot export ${table}.`);rows.push(...data||[]);if(!data||data.length<500)return rows;if(offset>99500)throw new Error('Support export exceeds configured limit.');}}

/** Retries use stable source IDs and timestamps; mark delivered only after receiver acknowledgement. */
export async function syncSupportToUams(client:SupabaseClient,tenant:string){
 const url=process.env.UAMS_SUPPORT_API_URL,key=process.env.HUB_SYNC_API_KEY;
 if(!url||!key||key.length<32)throw new Error('Configure UAMS_SUPPORT_API_URL and HUB_SYNC_API_KEY for reverse sync.');
 if(process.env.NODE_ENV==='production'&&!url.startsWith('https://'))throw new Error('Support sync requires HTTPS.');
 const [tickets,feedback,attendance,delivered]=await Promise.all([read(client,'help_requests',tenant),read(client,'pilot_feedback',tenant),read(client,'event_attendance',tenant),read(client,'uams_support_deliveries',tenant)]);
 const records=[];
 for(const [kind,rows] of [['ticket',tickets],['feedback',feedback],['attendance',attendance]] as const){
  for(const row of rows){
   const version=row.updated_at||row.created_at;
   if(delivered.some(d=>d.kind===kind&&d.source_id===row.id&&Date.parse(d.source_updated_at)>=Date.parse(version)))continue;
   const userId=row.user_id||row.student_id;
   const {data:profile,error}=await client.from('user_profiles').select('email').eq('id',userId).single();if(error||!profile?.email)throw new Error('Support export student identity could not be resolved.');
   // Sensitive case content stays in the restricted Hub workflow; UAMS receives a pointer only.
   const sensitive=Boolean(row.is_sensitive);
   records.push({source_id:row.id,kind,student_email:profile.email,title:sensitive?'Restricted student support case':kind==='ticket'?row.subject:kind==='feedback'?'Campus Hub pilot feedback':'Campus event attendance',body:sensitive?'Review the assigned restricted case in Campus Hub.':row.description||row.message||`Event ${row.event_id}: ${row.status}`,status:row.status,is_sensitive:sensitive,category:row.category||'general',occurred_at:row.created_at,updated_at:version,metadata:kind==='feedback'?{rating:row.rating}:kind==='attendance'?{event_id:row.event_id,check_in_method:'student_self_report'}:{reference:row.reference_number||row.reference_no}});
  }
 }
 let accepted=0;let updates:z.infer<typeof responseSchema>['updates']=[];
 for(let offset=0;offset<Math.max(records.length,1);offset+=100){
 const batch=records.slice(offset,offset+100);
 const response=await fetch(url,{method:'POST',cache:'no-store',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({version:1,university_id:tenant,records:batch}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error(`UAMS support inbox rejected delivery (${response.status}).`);
 const result=responseSchema.parse(await response.json());if(result.accepted!==batch.length)throw new Error('UAMS did not acknowledge all support records.');
 if(batch.length){const {error}=await client.from('uams_support_deliveries').upsert(batch.map(r=>({university_id:tenant,kind:r.kind,source_id:r.source_id,source_updated_at:r.updated_at,delivered_at:new Date().toISOString()})),{onConflict:'university_id,kind,source_id'});if(error)throw new Error('Support delivery receipt could not be persisted.');}
 accepted+=result.accepted;updates=result.updates;
 }
 for(const update of updates){
  if(!update.reviewed_at||update.status==='open')continue;
  const table=update.kind==='ticket'?'help_requests':update.kind==='feedback'?'pilot_feedback':'event_attendance';
  if(update.kind==='attendance')continue;
  const known=(update.kind==='ticket'?tickets:feedback).find(row=>row.id===update.source_id);if(!known)continue;
  const previous=update.kind==='ticket'?known.uams_reviewed_at:known.reviewed_at;if(previous&&Date.parse(previous)>=Date.parse(update.reviewed_at))continue;
  const fields=update.kind==='ticket'?{status:update.status==='in_review'?'under_review':update.status,resolution_notes:update.staff_note,uams_reviewed_at:update.reviewed_at}: {status:update.status==='resolved'||update.status==='closed'?'resolved':'reviewed',staff_note:update.staff_note,reviewed_at:update.reviewed_at};
  const {error}=await client.from(table).update(fields).eq('id',update.source_id).eq('university_id',tenant);if(error)throw new Error('UAMS staff response could not be applied.');
 }
 return {accepted,updates:updates.length};
}
