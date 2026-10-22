import { PGlite } from '@electric-sql/pglite';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { beforeAll, afterAll, beforeEach, describe, it, expect } from 'vitest';

const university = '00000000-0000-0000-0000-000000000001';
const otherUniversity = '00000000-0000-0000-0000-000000000002';
const student = '00000000-0000-0000-0000-000000000101';
const staff = '00000000-0000-0000-0000-000000000102';
const notice = { source_id: 'uams-test-notice', title: 'Registration deadline', content: 'Register by Friday.', priority: 'P2',
  target_scope: 'all', is_published: true, published_at: '2026-10-21T08:00:00Z', updated_at: '2026-10-21T08:00:00Z', expires_at: null };
let db: PGlite;
let dataDirectory: string;
const sqlFile = (file: string) => readFile(path.resolve(import.meta.dirname, '../../supabase/migrations', file), 'utf8');

async function importBatch(notices: unknown[], tenant = university) {
  const result = await db.query<{ counts: {processed:number;inserted:number;updated:number;unchanged:number} }>(
    'select public.sync_uams_announcements($1::uuid, $2::jsonb) as counts', [tenant, JSON.stringify(notices)]);
  return result.rows[0].counts;
}

describe('Persistent announcement migrations and PostgreSQL import', () => {
  beforeAll(async () => {
    dataDirectory = await mkdtemp(path.join(tmpdir(), 'campus-announcements-'));
    db = new PGlite(dataDirectory);
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth;
      create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to authenticated, service_role;
    `);
    const core = (await sqlFile('20261015000001_core_schema.sql')).replace(/^CREATE EXTENSION.*$/gm, '');
    await db.exec(core);
    await db.exec(await sqlFile('20261015000002_triggers_and_functions.sql'));
    await db.exec(await sqlFile('20261015000003_row_level_security.sql'));
    await db.exec(await sqlFile('20261015000007_announcements_department_rls.sql'));
    await db.exec(await sqlFile('20261021211544_uams_announcements_sync.sql'));
    await db.exec(`
      grant select, insert, update, delete on all tables in schema public to authenticated;
      insert into universities(id,name,slug,code) values ('${university}','University A','a','A'), ('${otherUniversity}','University B','b','B');
      insert into auth.users(id,email) values ('${student}','student@example.edu'),('${staff}','staff@example.edu');
      insert into university_memberships(user_id,university_id,role,verification_status,department,year_of_study)
        values ('${student}','${university}','student','verified','Computing',2), ('${staff}','${university}','staff','verified','Computing',2);
    `);
  }, 60000);

  beforeEach(async () => { await db.exec('reset role; truncate announcements cascade;'); });
  afterAll(async () => {
    await db?.close();
    // Remove only the uniquely created test directory under the OS temp root.
    if (dataDirectory && path.dirname(dataDirectory) === path.resolve(tmpdir()) && path.basename(dataDirectory).startsWith('campus-announcements-')) {
      await rm(dataDirectory, { recursive: true, force: true });
    }
  });

  it('preserves IDs, receipts and committed data across retries and a database restart', async () => {
    expect(await importBatch([notice])).toEqual({processed:1,inserted:1,updated:0,unchanged:0});
    const id = (await db.query<{id:string}>('select id from announcements')).rows[0].id;
    await db.query('insert into announcement_reads(announcement_id,user_id) values ($1,$2)', [id, student]);
    await db.close();
    db = new PGlite(dataDirectory);
    expect(await importBatch([notice])).toEqual({processed:1,inserted:0,updated:0,unchanged:1});
    expect(await importBatch([{...notice, title:'Extended deadline', updated_at:'2026-10-22T08:00:00Z'}])).toEqual({processed:1,inserted:0,updated:1,unchanged:0});
    expect((await db.query<{id:string;title:string}>('select id,title from announcements')).rows).toEqual([{id,title:'Extended deadline'}]);
    expect((await db.query('select * from announcement_reads')).rows).toHaveLength(1);
    expect((await importBatch([notice])).unchanged).toBe(1);
    expect((await db.query<{title:string}>('select title from announcements')).rows[0].title).toBe('Extended deadline');
  }, 30000);

  it('rolls back an entire invalid batch and rejects cross-tenant campus references', async () => {
    await expect(importBatch([notice, {...notice, source_id:'bad', target_scope:'campus', campus_code:'OTHER'}])).rejects.toThrow('Unknown campus');
    expect((await db.query('select * from announcements')).rows).toHaveLength(0);
    await expect(importBatch([notice, notice])).rejects.toThrow('Duplicate');
    expect((await db.query('select * from announcements')).rows).toHaveLength(0);
  });

  it('retains tenant and department RLS and hides withdrawals and expired notices', async () => {
    await importBatch([notice, {...notice,source_id:'other-department',target_scope:'department',target_department:'Business'},
      {...notice,source_id:'withdrawn',is_published:false}, {...notice,source_id:'expired',expires_at:'2020-01-01T00:00:00Z'}]);
    await importBatch([notice], otherUniversity);
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${student}',false);`);
    expect((await db.query<{source_id:string}>('select source_id from announcements')).rows).toEqual([{source_id:notice.source_id}]);
    await db.exec('reset role;');
    await importBatch([{...notice,is_published:false,updated_at:'2026-10-22T08:00:00Z'}]);
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${student}',false);`);
    expect((await db.query('select * from announcements')).rows).toHaveLength(0);
    await db.exec('reset role;');
  });

  it('blocks browser callers from invoking imports or forging/editing imported notices', async () => {
    await importBatch([notice]);
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${staff}',false);`);
    await expect(importBatch([notice])).rejects.toThrow('permission denied');
    expect((await db.query("update announcements set title='forged' where source_system='uams' returning id")).rows).toHaveLength(0);
    await expect(db.query(`insert into announcements(university_id,author_id,title,content,source_system,source_id,source_updated_at)
      values ($1,$2,'forged','text','uams','forged',now())`, [university,staff])).rejects.toThrow('row-level security');
    await db.exec('reset role;');
  });
});

describe('UAMS announcement storage migration', () => {
  let uams: PGlite;
  beforeAll(async () => {
    uams = new PGlite();
    await uams.exec('create role anon; create role authenticated; create role service_role bypassrls;');
    const schema = await readFile(path.resolve(import.meta.dirname, '../../../UAMS/database/01_schema_init.sql'), 'utf8');
    // Apply the actual existing announcement table before the additive migration.
    await uams.exec('create table schools(id uuid primary key); create table departments(id uuid primary key); create table programs(id uuid primary key); create table users(id uuid primary key);');
    await uams.exec(schema.slice(schema.indexOf('CREATE TABLE IF NOT EXISTS announcements ('), schema.indexOf('-- 12. IMMUTABLE')));
    await uams.exec(await readFile(path.resolve(import.meta.dirname, '../../../UAMS/supabase/migrations/20261021211540_persistent_announcements.sql'), 'utf8'));
  }, 30000);
  afterAll(async () => { await uams?.close(); });

  it('stores and versions institutional notices while denying direct browser access', async () => {
    await uams.exec("set role service_role; insert into announcements(title,content,target_audience,author_email) values ('Exam dates','Check dates','students','registrar@example.edu'); reset role;");
    const original = (await uams.query<{created_at:Date;updated_at:Date}>('select created_at,updated_at from announcements')).rows[0];
    await uams.exec("set role service_role; update announcements set title='Revised exam dates', created_at='2000-01-01', updated_at='2000-01-01'; reset role;");
    const updated = (await uams.query<{created_at:Date;updated_at:Date}>('select created_at,updated_at from announcements')).rows[0];
    expect(updated.created_at).toEqual(original.created_at);
    expect(new Date(updated.updated_at).getTime()).toBeGreaterThanOrEqual(new Date(original.updated_at).getTime());
    await uams.exec('set role authenticated;');
    await expect(uams.query('select * from announcements')).rejects.toThrow('permission denied');
    await expect(uams.query("insert into announcements(title,content) values ('forged','text')")).rejects.toThrow('permission denied');
    await uams.exec('reset role;');
  });
});
