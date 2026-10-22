import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const { rpc } = vi.hoisted(() => ({rpc:vi.fn()}));
vi.mock('@/lib/supabase/admin', () => ({createAdminClient: () => ({rpc})}));
import { executeUamsSync, resetSyncStoreForTesting } from '@/lib/uams/sync-engine';
import { uamsSyncPayloadSchema } from '@/lib/validations/sync';
import { normalizeRegistrarPayload } from '@/lib/uams/adapter';
import { fetchRegistrarFeed } from '@/lib/uams/client';

const tenant = '00000000-0000-0000-0000-000000000001';
const notice = {source_id:'notice-1',title:'Registration closes',content:'Complete registration by Friday.',priority:'P2',target_scope:'all',
  published_at:'2026-10-21T08:00:00Z',updated_at:'2026-10-21T08:00:00Z'};
const payload = {version:1,announcements:[notice]};
function acknowledge(data: unknown, error: unknown = null) {
  rpc.mockReturnValue({abortSignal:() => Promise.resolve({data,error})});
}
beforeEach(async () => {
  await resetSyncStoreForTesting();
  vi.stubEnv('UAMS_SYNC_UNIVERSITY_ID',tenant);
  rpc.mockReset();
});
afterEach(() => {vi.unstubAllEnvs();vi.unstubAllGlobals();});

describe('Announcement sync contract and durable acknowledgement', () => {
  it('keeps old version-1 payloads compatible and validates explicit targeting', () => {
    expect(uamsSyncPayloadSchema.parse({version:1}).announcements).toEqual([]);
    for (const invalid of [
      {...notice,target_scope:'department'}, {...notice,target_scope:'campus'}, {...notice,target_scope:'year',target_year:8},
      {...notice,priority:'Urgent'}, {...notice,source_id:''}, {...notice,updated_at:'invalid'},
    ]) expect(uamsSyncPayloadSchema.safeParse({version:1,announcements:[invalid]}).success).toBe(false);
    expect(uamsSyncPayloadSchema.safeParse({version:1,announcements:[notice,notice]}).success).toBe(false);
    expect(() => normalizeRegistrarPayload({data:{announcements:[{...notice,target_scope:'department'}]}})).toThrow();
  });

  it('validates dry runs without opening the database or counting inserts', async () => {
    const result = await executeUamsSync({payload,dryRun:true});
    expect(result.success).toBe(true);
    expect(result.counts.announcements_processed).toBe(1);
    expect(result.counts.announcements_inserted).toBe(0);
    expect(rpc).not.toHaveBeenCalled();
  });

  it('imports using the configured tenant and counts only acknowledged changes',async()=>{
    acknowledge({processed:1,inserted:1,updated:0,unchanged:0});
    const result=await executeUamsSync({payload});
    expect(result.success).toBe(true);
    expect(result.counts.announcements_inserted).toBe(1);
    expect(result.records_changed).toBe(1);
    expect(rpc).toHaveBeenCalledWith('sync_uams_announcements',{
      p_university_id:tenant,p_announcements:expect.arrayContaining([expect.objectContaining({source_id:'notice-1'})]),
    });
    acknowledge({processed:1,inserted:0,updated:0,unchanged:1});
    const repeat=await executeUamsSync({payload,triggerSource:'manual'});
    expect(repeat.records_changed).toBe(0);
    expect(repeat.counts.announcements_unchanged).toBe(1);
  });

  it('reports database errors and malformed acknowledgements as failed syncs',async()=>{
    acknowledge(null,{message:'connection lost'});
    let result=await executeUamsSync({payload,triggerSource:'manual'});
    expect(result.success).toBe(false);
    expect(result.records_changed).toBe(0);
    expect(result.counts.announcements_inserted).toBe(0);
    acknowledge({processed:1,inserted:2,updated:0,unchanged:0});
    result=await executeUamsSync({payload,triggerSource:'manual'});
    expect(result.success).toBe(false);
  });

  it('refuses to guess the destination university',async()=>{
    vi.stubEnv('UAMS_SYNC_UNIVERSITY_ID','');
    const result=await executeUamsSync({payload});
    expect(result.success).toBe(false);
    expect(result.message).toContain('UAMS_SYNC_UNIVERSITY_ID');
    expect(rpc).not.toHaveBeenCalled();
  });

  it('accepts announcement-only live feeds and an explicitly empty snapshot',async()=>{
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify(payload))));
    expect((await fetchRegistrarFeed({apiUrl:'https://uams.example.edu/feed'})).source).toBe('live_api');
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify({version:1,announcements:[]}))));
    expect((await fetchRegistrarFeed({apiUrl:'https://uams.example.edu/feed'})).source).toBe('live_api');
  });

  it('appends a dedicated announcement feed without replacing the SIS feed or importing demo fixtures',async()=>{
    const fetchMock=vi.fn().mockImplementation(async (url:string, init?:RequestInit) => {
      expect(init?.cache).toBe('no-store');
      return new Response(JSON.stringify(
      url.includes('/announcements') ? payload : {version:1,students:[{email:'real@example.edu',full_name:'Real Student',
        registration_number:'BCS/2026/101',faculty:'Computing',department:'Computing',year_of_study:1}]}
    )); });
    vi.stubGlobal('fetch',fetchMock);
    const options={apiUrl:'https://uams.example.edu/sis',announcementsApiUrl:'https://uams.example.edu/announcements',announcementsApiKey:'dedicated-secret'};
    const combined=await fetchRegistrarFeed(options);
    expect(combined.data.students[0].email).toBe('real@example.edu');
    expect(combined.data.announcements).toHaveLength(1);
    expect(fetchMock.mock.calls[1][1]).toMatchObject({headers:{Authorization:'Bearer dedicated-secret'}});
    vi.stubEnv('UAMS_API_URL','');
    const onlyAnnouncements=await fetchRegistrarFeed({announcementsApiUrl:options.announcementsApiUrl});
    expect(onlyAnnouncements.data.students).toEqual([]);
    expect(onlyAnnouncements.data.course_units).toEqual([]);
    expect(onlyAnnouncements.data.announcements).toHaveLength(1);
  });

  it('does not turn a failed live feed into a successful import of local fixtures',async()=>{
    vi.stubEnv('UAMS_API_URL','https://uams.example.edu/feed');
    vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('unavailable',{status:503})));
    const result=await executeUamsSync({triggerSource:'manual'});
    expect(result.success).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });
});
