import type { SupabaseClient } from '@supabase/supabase-js';
import type { UamsAnnouncementInput } from '@/lib/validations/sync';

export type AnnouncementImportCounts = { processed: number; inserted: number; updated: number; unchanged: number };

export async function importUamsAnnouncements(client: SupabaseClient, universityId: string, announcements: UamsAnnouncementInput[]): Promise<AnnouncementImportCounts> {
  const { data, error } = await client.rpc('sync_uams_announcements', {
    p_university_id: universityId,
    p_announcements: announcements,
  }).abortSignal(AbortSignal.timeout(15000));
  if (error) throw new Error('Announcement import was not acknowledged. Retry the same source records safely.');
  if (!data || ['processed', 'inserted', 'updated', 'unchanged'].some(key =>
    !Number.isSafeInteger(data[key]) || data[key] < 0) || data.processed !== announcements.length ||
    data.inserted + data.updated + data.unchanged !== data.processed) {
    throw new Error('Announcement import returned invalid acknowledgement counts.');
  }
  if(process.env.VAPID_PRIVATE_KEY && announcements.length){
 const {data:rows,error:lookupError}=await client.from('announcements').select('id').eq('university_id',universityId).eq('source_system','uams').in('source_id',announcements.map(a=>a.source_id));
 if(!lookupError){const {deliverAnnouncementPush}=await import('@/lib/push/delivery');for(const row of rows??[])await deliverAnnouncementPush(row.id).catch(()=>console.error('Push dispatch failed; safe to retry on next sync.'));}}
 return data as AnnouncementImportCounts;
}
