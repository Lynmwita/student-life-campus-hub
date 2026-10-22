import webpush from 'web-push';
import {createHash} from 'node:crypto';
import {createAdminClient} from '@/lib/supabase/admin';
import {isTrustedPushEndpoint} from './endpoint';
export function pushUrgency(priority:string): 'high'|'normal'|'low'|'very-low' {return ({P1:'high',P2:'normal',P3:'low',P4:'very-low'} as const)[priority as 'P1']??'very-low';}
export async function deliverAnnouncementPush(announcementId:string){
 if(!process.env.VAPID_PRIVATE_KEY||!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY||!process.env.VAPID_SUBJECT||!process.env.SUPABASE_SERVICE_ROLE_KEY)return {sent:0,failed:0,configured:false};
 webpush.setVapidDetails(process.env.VAPID_SUBJECT,process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,process.env.VAPID_PRIVATE_KEY);
 const db=createAdminClient();const {data:a,error}=await db.from('announcements').select('*').eq('id',announcementId).single();
 if(error)throw new Error('Could not load announcement for push');
 if(!a?.is_published||(a.expires_at&&new Date(a.expires_at)<=new Date()))return {sent:0,failed:0,configured:true};
 const {data:members,error:memberError}=await db.from('university_memberships').select('user_id,campus_id,faculty,department,year_of_study').eq('university_id',a.university_id).eq('verification_status','verified');
 if(memberError)throw new Error('Could not load push recipients');
 const userIds=(members??[]).filter(m=>a.target_scope==='all'||(a.target_scope==='campus'&&m.campus_id===a.campus_id)||(a.target_scope==='faculty'&&m.faculty===a.target_faculty)||(a.target_scope==='department'&&m.department===a.target_department)||(a.target_scope==='year'&&m.year_of_study===a.target_year)).map(m=>m.user_id);
 let sent=0,failed=0;
 const fingerprint=createHash('sha256').update(JSON.stringify([a.title,a.content,a.priority,a.target_scope,a.campus_id,a.target_faculty,a.target_department,a.target_year])).digest('hex');
 // Chunk recipient queries to avoid URL limits for large universities.
 for(let start=0;start<userIds.length;start+=100){
 const {data:subs,error:subError}=await db.from('push_subscriptions').select('*').in('user_id',userIds.slice(start,start+100)).contains('priorities',[a.priority]);if(subError)throw new Error('Could not load subscriptions');
 for(const sub of subs??[]){
 if(!isTrustedPushEndpoint(sub.endpoint)){failed++;await db.from('push_subscriptions').delete().eq('id',sub.id);continue;}
 const key={subscription_id:sub.id,announcement_id:a.id,fingerprint};
 const {error:claimError}=await db.from('push_deliveries').insert({...key,status:'sending'});
 if(claimError){if(claimError.code==='23505')continue;throw new Error('Could not claim push delivery');}
 try{
 // Lock-screen payload deliberately omits notice content and personal information.
 await webpush.sendNotification({endpoint:sub.endpoint,keys:{p256dh:sub.p256dh,auth:sub.auth}},JSON.stringify({title:`Campus Hub · ${a.priority}`,body:'A new university notice is available. Sign in to read it.',url:'/dashboard',tag:`notice-${a.id}`,priority:a.priority}),{TTL:a.priority==='P1'?3600:86400,urgency:pushUrgency(a.priority),timeout:10000});
 const {error:ack}=await db.from('push_deliveries').update({status:'sent'}).match(key);if(ack)throw new Error('Push acknowledgement failed');sent++;
 }catch(e){failed++;const status=(e as {statusCode?:number}).statusCode;if(status===404||status===410)await db.from('push_subscriptions').delete().eq('id',sub.id);else await db.from('push_deliveries').delete().match(key);}
 }
 }return {sent,failed,configured:true};
}
