import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
const tenant='00000000-0000-0000-0000-000000000001',student='00000000-0000-0000-0000-000000000101',other='00000000-0000-0000-0000-000000000102';let db:PGlite;
const grade={kind:'grade',source_id:'g1',student_email:'student@example.edu',course_code:'C1',course_name:'Course',grade:'A',score:80,semester:1,academic_year:'2026/2027',is_published:true,updated_at:'2026-10-22T00:00:00Z'};
async function sync(records:unknown[]){return (await db.query<{counts:{processed:number;inserted:number;updated:number;unchanged:number}}>('select sync_uams_academic_records($1,$2) counts',[tenant,JSON.stringify(records)])).rows[0].counts;}
describe('Durable academic sync with real PostgreSQL',()=>{
 beforeAll(async()=>{db=new PGlite();await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;create table universities(id uuid primary key,is_active boolean);create table user_profiles(id uuid primary key,email text);create table university_memberships(user_id uuid,university_id uuid,role text,verification_status text);create table help_requests(id uuid);create table sync_runs(id uuid);create table timetables(university_id uuid);create table events(id uuid,university_id uuid,is_published boolean,event_date date,start_time time,end_time time);insert into universities values('${tenant}',true);insert into user_profiles values('${student}','student@example.edu'),('${other}','other@example.edu');insert into university_memberships values('${student}','${tenant}','student','pending'),('${other}','${tenant}','student','verified');`);await db.exec(await readFile(path.resolve(import.meta.dirname,'../../supabase/migrations/20261021214455_uams_academic_and_support_sync.sql'),'utf8'));await db.exec('grant select on university_memberships,events to authenticated;');},60000);
 afterAll(async()=>{await db?.close();});
 it('upserts by identity, ignores old versions, withdraws publications, rejects cross-tenant grades atomically',async()=>{
  expect(await sync([grade])).toMatchObject({inserted:1});expect(await sync([grade])).toMatchObject({unchanged:1});
  expect(await sync([{...grade,updated_at:'2026-10-23T00:00:00Z',grade:'B'}])).toMatchObject({updated:1});
  expect(await sync([grade])).toMatchObject({unchanged:1});
  await expect(sync([{...grade,source_id:'new'}, {...grade,source_id:'bad',student_email:'unknown@example.edu'}])).rejects.toThrow();
  expect((await db.query('select * from uams_academic_records')).rows).toHaveLength(1);
 });
 it('allows only own verified check-ins during published events and stamps source times',async()=>{
  const event='00000000-0000-0000-0000-000000000501';
  await db.exec(`insert into events values('${event}','${tenant}',true,(now() at time zone 'Africa/Nairobi')::date,((now() at time zone 'Africa/Nairobi')-interval '15 minutes')::time,'23:59');set role authenticated;select set_config('request.jwt.claim.sub','${other}',false);`);
  await expect(db.query('insert into event_attendance(user_id,university_id,event_id) values($1,$2,$3)',[student,tenant,event])).rejects.toThrow();
  await db.query('insert into event_attendance(user_id,university_id,event_id,created_at,updated_at) values($1,$2,$3,$4,$4)',[other,tenant,event,'2099-01-01']);
  const rows=await db.query<{updated_at:Date}>('select updated_at from event_attendance');expect(rows.rows).toHaveLength(1);expect(new Date(rows.rows[0].updated_at).getUTCFullYear()).toBeLessThan(2099);
  await expect(db.query('insert into event_attendance(user_id,university_id,event_id) values($1,$2,$3)',[other,tenant,'00000000-0000-0000-0000-000000000599'])).rejects.toThrow();await db.exec('reset role;');
 });
 it('changes verification only from a newer authoritative status and hides another students grades',async()=>{
  await db.query('select sync_uams_enrollment($1,$2,$3,$4)',[tenant,student,'active','2026-10-22T00:00:00Z']);
  await db.query('select sync_uams_enrollment($1,$2,$3,$4)',[tenant,student,'withdrawn','2026-10-21T00:00:00Z']);
  expect((await db.query<{verification_status:string}>('select verification_status from university_memberships where user_id=$1',[student])).rows[0].verification_status).toBe('verified');
  await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${other}',false);`);expect((await db.query('select * from uams_academic_records')).rows).toHaveLength(0);
  await db.exec(`select set_config('request.jwt.claim.sub','${student}',false);`);expect((await db.query('select * from uams_academic_records')).rows).toHaveLength(1);
  await db.exec('reset role;');await sync([{...grade,is_published:false,updated_at:'2026-10-24T00:00:00Z'}]);await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','${student}',false);`);expect((await db.query('select * from uams_academic_records')).rows).toHaveLength(0);await db.exec('reset role;');
 });
});
