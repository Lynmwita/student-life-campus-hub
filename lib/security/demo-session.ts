const roles: Record<string, 'student' | 'staff' | 'admin' | 'super_admin'> = {
  'student@summit.ac.ke':'student',
  'alex.mutua@summit.ac.ke':'student',
  'registrar@summit.ac.ke':'staff',
  'admin@summit.ac.ke':'admin',
  'root@studenthub.ac.ke':'super_admin',
};
export function demoSessionEmail(value: string | undefined): string | undefined {
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_ENABLE_DEMO_AUTH !== 'true') return undefined;
  return value && Object.hasOwn(roles, value) ? value : undefined;
}
export function demoSessionRole(email: string | undefined) {
  return email ? roles[demoSessionEmail(email) || ''] : undefined;
}
