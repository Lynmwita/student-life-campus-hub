/* eslint-disable @typescript-eslint/no-explicit-any -- These PostgREST test doubles deliberately implement only the chained methods each scenario exercises; production imports remain fully typed. */
import {afterEach,describe,it,expect,vi} from 'vitest';
import {uamsSyncPayloadSchema} from '@/lib/validations/sync';
import {importCore,importAcademicRecords} from '@/lib/uams/core-import';
import {syncSupportToUams} from '@/lib/uams/support';
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
describe('Academic and reverse support sync contracts',()=>{
 it('requires dated authoritative enrollment and rejects invalid date ranges/duplicate grade identity',()=>{
  const student={email:'s@example.edu',full_name:'Student',registration_number:'REG001',faculty:'Computing',department:'Science',year_of_study:1,enrollment_status:'active'};
  expect(uamsSyncPayloadSchema.safeParse({version:1,students:[student]}).success).toBe(false);
  const event={source_id:'e',updated_at:'2026-10-22T00:00:00Z',is_published:true,title:'Event',description:'Body',venue:'Hall',starts_at:'2026-10-22T10:00:00Z',ends_at:'2026-10-22T09:00:00Z'};
  expect(uamsSyncPayloadSchema.safeParse({version:1,events:[event]}).success).toBe(false);
 });
 it('reports database errors rather than counting local student/course/timetable success',async()=>{
  const query:any={select:()=>query,eq:()=>query,then:(resolve:any)=>resolve({data:null,error:{message:'unreachable'}})};
  await expect(importCore({from:()=>query} as any,'tenant',uamsSyncPayloadSchema.parse({version:1}))).rejects.toThrow('not acknowledged');
  await expect(importAcademicRecords({rpc:()=>Promise.resolve({data:{processed:1,inserted:2,updated:0,unchanged:0},error:null})} as any,'tenant',uamsSyncPayloadSchema.parse({version:1,academic_dates:[{source_id:'d',title:'Date',description:'',kind:'exam',starts_at:'2026-10-22T10:00:00Z',ends_at:'2026-10-22T12:00:00Z',updated_at:'2026-10-22T00:00:00Z',is_published:true}]}))).rejects.toThrow('acknowledgement');
 });
 it('moves a timetable by stable source identity and ignores an old retry',async()=>{
  const writes:any[]=[];const source={id:'same-row',source_updated_at:'2026-10-22T00:00:00Z'};
  const client:any={from:(table:string)=>{const q:any={select:()=>q,eq:()=>q,maybeSingle:()=>Promise.resolve({data:source,error:null}),single:()=>Promise.resolve({data:{id:'course-id'},error:null}),upsert:(row:any,options:any)=>{writes.push({row,options});return Promise.resolve({error:null});},then:(resolve:any)=>resolve({data:table==='campuses'?[{id:'campus-id',code:'MAIN'}]:[],error:null})};return q;}};
  const payload=uamsSyncPayloadSchema.parse({version:1,timetables:[{source_id:'s1',updated_at:'2026-10-23T00:00:00Z',course_code:'C1',campus_code:'MAIN',day_of_week:3,start_time:'11:00',end_time:'13:00',venue:'Hall',lecturer_name:'Lecturer',semester:1,academic_year:'2026/2027'}]});
  expect((await importCore(client,'tenant',payload)).timetables_updated).toBe(1);expect(writes[0]).toMatchObject({row:{id:'same-row',day_of_week:3,start_time:'11:00'},options:{onConflict:'university_id,source_id'}});
  writes.length=0;payload.timetables[0].updated_at='2026-10-21T00:00:00Z';await importCore(client,'tenant',payload);expect(writes).toHaveLength(0);
 });
 it('preserves degree programs, tenant-scoped campus lookup and explicit existing-account passwords',async()=>{
  const writes:any[]=[];const passwordUpdate=vi.fn().mockResolvedValue({error:null});
  const client:any={auth:{admin:{updateUserById:passwordUpdate}},from:(table:string)=>{const q:any={select:()=>q,eq:()=>q,maybeSingle:()=>Promise.resolve({data:table==='user_profiles'?{id:'student-id'}:null,error:null}),upsert:(row:any)=>{writes.push({table,row});return Promise.resolve({error:null});},then:(resolve:any)=>resolve({data:table==='campuses'?[{id:'campus-id',code:'MAIN'}]:[],error:null})};return q;}};
  const payload=uamsSyncPayloadSchema.parse({version:1,students:[{email:'student@example.edu',full_name:'Student One',registration_number:'REG001',faculty:'Computing',department:'Science',program_name:'Specific Degree',year_of_study:2,campus_code:'main',initial_password:'ExplicitPassword123!'}]});
  await importCore(client,'selected-tenant',payload);
  expect(writes.find(write=>write.table==='university_memberships')?.row).toMatchObject({university_id:'selected-tenant',campus_id:'campus-id',program_of_study:'Specific Degree'});
  expect(passwordUpdate).toHaveBeenCalledWith('student-id',{password:'ExplicitPassword123!'});
  passwordUpdate.mockClear();delete payload.students[0].initial_password;await importCore(client,'selected-tenant',payload);expect(passwordUpdate).not.toHaveBeenCalled();
 });
 it('exports restricted ticket pointers and persists receipt only after acknowledgement',async()=>{
  vi.stubEnv('UAMS_SUPPORT_API_URL','https://uams.example/support');vi.stubEnv('HUB_SYNC_API_KEY','k'.repeat(40));
  const receipt=vi.fn().mockResolvedValue({error:null});
  const client:any={from:(table:string)=>{const q:any={select:()=>q,eq:()=>q,order:()=>q,range:()=>q,single:()=>Promise.resolve({data:{email:'s@example.edu'},error:null}),upsert:receipt,then:(resolve:any)=>resolve({error:null,data:table==='help_requests'?[{id:'t1',student_id:'s1',is_sensitive:true,description:'Private medical details',subject:'Sensitive',status:'submitted',created_at:'2026-10-22T00:00:00Z',updated_at:'2026-10-22T00:00:00Z'}]:[]})};return q;}};
  let body:any;const send=vi.fn(async(_url:any,options:any)=>{body=JSON.parse(options.body);return new Response(JSON.stringify({success:true,accepted:1,updates:[]}),{status:200});});vi.stubGlobal('fetch',send);
  await syncSupportToUams(client,'tenant');expect(body.records[0].body).not.toContain('Private');expect(body.records[0].is_sensitive).toBe(true);expect(receipt).toHaveBeenCalledTimes(1);
  receipt.mockClear();send.mockResolvedValueOnce(new Response('failure',{status:503}));await expect(syncSupportToUams(client,'tenant')).rejects.toThrow('rejected');expect(receipt).not.toHaveBeenCalled();
 });
});
