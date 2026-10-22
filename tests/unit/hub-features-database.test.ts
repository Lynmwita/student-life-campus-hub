import {PGlite} from '@electric-sql/pglite';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {beforeAll,afterAll,it,expect} from 'vitest';
let db:PGlite;
const ids={student:'00000000-0000-0000-0000-000000000101',staff:'00000000-0000-0000-0000-000000000102',outsider:'00000000-0000-0000-0000-000000000103',uni:'00000000-0000-0000-0000-000000000001',other:'00000000-0000-0000-0000-000000000002'};
async function as(user:string){await db.exec(`reset role;set role authenticated;select set_config('request.jwt.claim.sub','${user}',false);`);}
beforeAll(async()=>{
 db=new PGlite();await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated,service_role;`);
 for(const f of ['20261015000001_core_schema.sql','20261015000002_triggers_and_functions.sql','20261015000003_row_level_security.sql','20261015000004_security_hardening.sql','20261015000009_academics_and_campus_life.sql','20261015000013_help_desk_and_audit.sql','20261021214425_hub_feedback_push.sql','20261021221906_audit_tenant_security.sql']){await db.exec((await readFile(path.resolve('supabase/migrations',f),'utf8')).replace(/^CREATE EXTENSION.*$/gm,''));}
 await db.exec(`insert into universities(id,name,slug,code) values('${ids.uni}','University','uni','UNI'),('${ids.other}','Other','other','OTHER');insert into auth.users(id,email) values('${ids.student}','student@example.com'),('${ids.staff}','staff@example.com'),('${ids.outsider}','other@example.com');insert into university_memberships(user_id,university_id,role,verification_status) values('${ids.student}','${ids.uni}','student','verified'),('${ids.staff}','${ids.uni}','staff','verified'),('${ids.outsider}','${ids.other}','student','verified');grant select on university_memberships,events,clubs_communities to authenticated;`);
},60000);
afterAll(async()=>{await db?.close();});
it('persists student feedback, protects review columns, and permits only tenant staff review',async()=>{
 await as(ids.student);const rows=await db.query<{id:string}>(`insert into pilot_feedback(user_id,university_id,rating,category,message) values($1,$2,4,'usability','Calendar is easy to use') returning id`,[ids.student,ids.uni]);const id=rows.rows[0].id;
 await expect(db.query(`update pilot_feedback set message='forged change' where id=$1`,[id])).rejects.toThrow();
 await db.query(`update pilot_feedback set status='resolved',reviewed_by=$1 where id=$2`,[ids.student,id]);expect((await db.query<{status:string}>('select status from pilot_feedback')).rows[0].status).toBe('new');
 await as(ids.outsider);expect((await db.query('select * from pilot_feedback')).rows).toHaveLength(0);await expect(db.query(`insert into pilot_feedback(user_id,university_id,rating,category,message) values($1,$2,4,'other','Cross university entry')`,[ids.outsider,ids.uni])).rejects.toThrow();
 await as(ids.staff);await db.query(`update pilot_feedback set status='resolved',staff_note='Improved',reviewed_by=$1 where id=$2`,[ids.staff,id]);expect((await db.query<{status:string}>('select status from pilot_feedback')).rows[0].status).toBe('resolved');
});
it('keeps push keys private to each account and delivery receipts server-only',async()=>{
 await as(ids.student);await db.query(`insert into push_subscriptions(user_id,endpoint,p256dh,auth) values($1,'https://fcm.googleapis.com/push/test','test-key','test-auth')`,[ids.student]);expect((await db.query('select * from push_subscriptions')).rows).toHaveLength(1);
 await as(ids.outsider);expect((await db.query('select * from push_subscriptions')).rows).toHaveLength(0);await expect(db.query('select * from push_deliveries')).rejects.toThrow();
 await db.exec('reset role;set role anon;');await expect(db.query('select * from pilot_feedback')).rejects.toThrow();await expect(db.query('select * from push_subscriptions')).rejects.toThrow();
});
it('rejects direct student ticket workflow escalation and cross-university creation or assignment',async()=>{
 await db.exec('reset role;grant select,insert,update on help_requests to authenticated;grant select on campuses to authenticated;');
 await as(ids.student);
 const ticket=(await db.query<{id:string}>(`insert into help_requests(student_id,university_id,category,priority,subject,description,status) values($1,$2,'general','P3','Private ticket','Needs assistance','submitted') returning id`,[ids.student,ids.uni])).rows[0].id;
 await expect(db.query(`update help_requests set assigned_staff_id=$1 where id=$2`,[ids.outsider,ticket])).rejects.toThrow('Staff workflow');
 await expect(db.query(`update help_requests set status='resolved' where id=$1`,[ticket])).rejects.toThrow('Staff workflow');
 await expect(db.query(`insert into help_requests(student_id,university_id,category,priority,subject,description,status) values($1,$2,'general','P3','Private ticket','Needs assistance','submitted')`,[ids.student,ids.other])).rejects.toThrow('Verified tenant');
 await as(ids.staff);await expect(db.query(`update help_requests set assigned_staff_id=$1 where id=$2`,[ids.outsider,ticket])).rejects.toThrow('Assignee must');
 await db.query(`update help_requests set assigned_staff_id=$1 where id=$2`,[ids.staff,ticket]);expect((await db.query<{assigned_to:string}>('select assigned_to from help_requests where id=$1',[ticket])).rows[0].assigned_to).toBe(ids.staff);
});
