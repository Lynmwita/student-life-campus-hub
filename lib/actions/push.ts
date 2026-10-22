"use server";
import {z} from 'zod';
import {createClient} from '@/lib/supabase/server';
import {isTrustedPushEndpoint} from '@/lib/push/endpoint';
const schema=z.object({endpoint:z.string().url().max(2048).refine(isTrustedPushEndpoint,'Unsupported push service'),keys:z.object({p256dh:z.string().regex(/^[A-Za-z0-9_-]{80,120}$/),auth:z.string().regex(/^[A-Za-z0-9_-]{20,30}$/)})});
export async function savePushSubscriptionAction(input:unknown,priorities:string[]) {
 const parsed=schema.safeParse(input);if(!parsed.success || !priorities.length || priorities.some(p=>!['P1','P2','P3','P4'].includes(p))) return {success:false,message:'Invalid subscription or priorities.'};
 const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)return {success:false,message:'Sign in to enable notifications.'};
 const {error}=await db.from('push_subscriptions').upsert({user_id:user.id,endpoint:parsed.data.endpoint,...parsed.data.keys,priorities:[...new Set(priorities)],updated_at:new Date().toISOString()},{onConflict:'endpoint'});
 return {success:!error,message:error?'Could not save notification settings.':'Notification settings saved.'};
}
export async function removePushSubscriptionAction(endpoint:string){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)return {success:false};
 const {error}=await db.from('push_subscriptions').delete().eq('user_id',user.id).eq('endpoint',endpoint);return {success:!error};
}
export async function getPushSubscriptionAction(endpoint:string){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)return {success:false,priorities:[] as string[]};
 const {data,error}=await db.from('push_subscriptions').select('priorities').eq('user_id',user.id).eq('endpoint',endpoint).maybeSingle();return {success:!error&&!!data,priorities:(data?.priorities??[]) as string[]};
}
