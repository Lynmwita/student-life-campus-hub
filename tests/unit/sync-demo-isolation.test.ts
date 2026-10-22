import {afterEach,describe,it,expect,vi} from 'vitest';
const {admin}=vi.hoisted(()=>({admin:vi.fn(()=>{throw new Error('Privileged database must not be reached.');})}));
vi.mock('@/lib/supabase/admin',()=>({createAdminClient:admin}));
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>({auth:{getUser:async()=>({data:{user:null}})}})}));
vi.mock('next/headers',()=>({cookies:async()=>({get:(key:string)=>({value:key==='smu_demo_session'?'registrar@summit.ac.ke':'admin'})})}));
import {syncUamsDataAction,registerStudentAction,deleteStudentForCleanupAction} from '@/lib/actions/sync';
import * as publicSyncActions from '@/lib/actions/sync';
afterEach(()=>{vi.unstubAllEnvs();admin.mockClear();});
describe('Demo sync isolation',()=>{
 it('does not expose the privileged engine or reset helpers as server actions',()=>{
  expect(Object.keys(publicSyncActions)).not.toContain('executeUamsSync');expect(Object.keys(publicSyncActions)).not.toContain('resetSyncStoreForTesting');expect(Object.keys(publicSyncActions)).not.toContain('resetSyncLockForTesting');
 });
 it('rejects production cleanup before accessing the privileged database',async()=>{
  vi.stubEnv('NODE_ENV','production');vi.stubEnv('VITEST','false');
  const result=await deleteStudentForCleanupAction('existing@example.edu');expect(result.success).toBe(false);expect(result.message).toContain('Unauthorized');expect(admin).not.toHaveBeenCalled();
 });
 it('validates a demo import without privileged writes outside test mode',async()=>{
  vi.stubEnv('NODE_ENV','development');vi.stubEnv('VITEST','false');
  const result=await syncUamsDataAction({version:1,course_units:[{code:'C1',name:'Course',faculty:'Computing',department:'Computer Science',year_of_study:1,semester:1}]});
  expect(result.success).toBe(true);expect(result.dry_run).toBe(true);expect(admin).not.toHaveBeenCalled();
 });
 it('rejects demo account provisioning outside tests',async()=>{
  vi.stubEnv('NODE_ENV','development');vi.stubEnv('VITEST','false');
  const result=await registerStudentAction({fullName:'Test Student',email:'s@example.edu',registrationNumber:'REG001',faculty:'Computing',department:'Computer Science',yearOfStudy:1,campusCode:'MAIN',initialPassword:'password123'});
  expect(result.success).toBe(false);expect(result.error).toContain('Demo');expect(admin).not.toHaveBeenCalled();
 });
});
