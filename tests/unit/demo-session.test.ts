import { afterEach, describe, expect, it, vi } from 'vitest';
import { demoSessionEmail, demoSessionRole } from '@/lib/security/demo-session';
afterEach(()=>vi.unstubAllEnvs());
describe('demonstration session boundary',()=>{
 it('ignores forged demo cookies in production by default',()=>{
  vi.stubEnv('NODE_ENV','production');vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_AUTH','false');
  expect(demoSessionEmail('admin@summit.ac.ke')).toBeUndefined();
  expect(demoSessionRole('admin@summit.ac.ke')).toBeUndefined();
 });
 it('derives an explicitly enabled demo role from a known account',()=>{
  vi.stubEnv('NODE_ENV','production');vi.stubEnv('NEXT_PUBLIC_ENABLE_DEMO_AUTH','true');
  expect(demoSessionRole('alex.mutua@summit.ac.ke')).toBe('student');
  expect(demoSessionEmail('forged-admin@example.org')).toBeUndefined();
 });
});
