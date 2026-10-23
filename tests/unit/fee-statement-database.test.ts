import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { beforeAll, afterAll, describe, it, expect, vi, afterEach } from 'vitest';
import { DEMO_FEE_STATEMENTS, DEMO_PAYMENT_RECORDS } from '@/lib/finance/demo-data';

const tenant = '00000000-0000-0000-0000-000000000001';
const studentA = '00000000-0000-0000-0000-000000000101';
const studentB = '00000000-0000-0000-0000-000000000102';
let db: PGlite;

const paymentRecordA = {
  kind: 'payment_record',
  source_id: 'pay-001',
  student_email: 'student_a@example.edu',
  receipt_number: 'RCP-2026-08491',
  reference_code: 'QHK9821PX4',
  channel: 'mpesa',
  channel_label: 'M-Pesa Paybill',
  amount: 20000,
  currency: 'KES',
  paid_at: '2026-10-12T14:32:00Z',
  academic_year: '2026/2027',
  semester_label: 'Year 2 Semester 1',
  student_name: 'Student A',
  admission_number: 'BIT/2023/8849',
  allocated_to: 'Tuition Fees (KES 10,000) & Hostel (KES 10,000)',
  status: 'verified',
  is_published: true,
  updated_at: '2026-10-23T00:00:00Z',
};

const feeStatementA = {
  kind: 'fee_statement',
  source_id: 'stmt-001',
  student_email: 'student_a@example.edu',
  statement_id: 'STMT-2026-001',
  academic_year: '2026/2027',
  semester: 1,
  semester_label: 'Year 2 Semester 1',
  currency: 'KES',
  total_billed: 69500,
  funding_applied: 25000,
  paid_by_student: 20000,
  total_paid: 45000,
  balance: 24500,
  funding_sources: [
    { name: 'HELB Loan Allocation', amount: 25000, reference: 'HELB-2026-S1-8849' },
  ],
  is_published: true,
  issued_at: '2026-09-01T08:00:00Z',
  updated_at: '2026-10-23T00:00:00Z',
  items: [
    { id: 'item-1', category: 'tuition', title: 'Tuition Fees', amount: 42000, status: 'settled' },
    { id: 'item-2', category: 'hostel', title: 'Hostel Accommodation', amount: 14000, status: 'partial' },
    { id: 'item-3', category: 'examination', title: 'Examination Services', amount: 4000, status: 'billed' },
    { id: 'item-4', category: 'ict', title: 'ICT Infrastructure', amount: 3000, status: 'billed' },
    { id: 'item-5', category: 'library', title: 'Library Services', amount: 2500, status: 'billed' },
    { id: 'item-6', category: 'medical', title: 'Medical Insurance', amount: 2000, status: 'billed' },
    { id: 'item-7', category: 'activity', title: 'Sports & Activities', amount: 1500, status: 'billed' },
    { id: 'item-8', category: 'union', title: 'Student Union Levy', amount: 500, status: 'billed' },
  ],
};

async function syncAcademicRecords(records: unknown[]) {
  const result = await db.query<{ counts: { processed: number; inserted: number; updated: number; unchanged: number } }>(
    'SELECT sync_uams_academic_records($1, $2) AS counts',
    [tenant, JSON.stringify(records)]
  );
  return result.rows[0].counts;
}

describe('Rule 1: Locked-Door Test & Privacy for Fee Statements (RLS)', () => {
  beforeAll(async () => {
    db = new PGlite();
    await db.exec(`
      CREATE ROLE anon;
      CREATE ROLE authenticated;
      CREATE ROLE service_role BYPASSRLS;
      CREATE SCHEMA auth;
      CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
        SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
      GRANT USAGE ON SCHEMA auth TO authenticated;

      CREATE TABLE universities (id uuid PRIMARY KEY, is_active boolean);
      CREATE TABLE user_profiles (id uuid PRIMARY KEY, email text);
      CREATE TABLE university_memberships (
        user_id uuid,
        university_id uuid,
        role text,
        verification_status text
      );
      CREATE TABLE help_requests (id uuid);
      CREATE TABLE sync_runs (id uuid);
      CREATE TABLE timetables (university_id uuid);
      CREATE TABLE events (
        id uuid,
        university_id uuid,
        is_published boolean,
        event_date date,
        start_time time,
        end_time time
      );

      INSERT INTO universities VALUES ('${tenant}', true);
      INSERT INTO user_profiles VALUES
        ('${studentA}', 'student_a@example.edu'),
        ('${studentB}', 'student_b@example.edu');
      INSERT INTO university_memberships VALUES
        ('${studentA}', '${tenant}', 'student', 'verified'),
        ('${studentB}', '${tenant}', 'student', 'verified');
    `);

    // Load academic and support sync migration (creates table uams_academic_records and base RLS)
    await db.exec(
      await readFile(
        path.resolve(import.meta.dirname, '../../supabase/migrations/20261021214455_uams_academic_and_support_sync.sql'),
        'utf8'
      )
    );

    // Apply fee statement sync migration
    await db.exec(
      await readFile(
        path.resolve(import.meta.dirname, '../../supabase/migrations/20261023114500_fee_statement_sync.sql'),
        'utf8'
      )
    );

    await db.exec('GRANT SELECT ON university_memberships TO authenticated;');
  }, 60000);

  afterAll(async () => {
    await db?.close();
  });

  it('syncs fee statements securely and assigns student_id accurately', async () => {
    const res = await syncAcademicRecords([feeStatementA]);
    expect(res).toMatchObject({ inserted: 1, processed: 1 });

    const raw = await db.query<{ student_id: string; kind: string }>(
      'SELECT student_id, kind FROM uams_academic_records WHERE source_id = $1',
      ['stmt-001']
    );
    expect(raw.rows).toHaveLength(1);
    expect(raw.rows[0].student_id).toBe(studentA);
    expect(raw.rows[0].kind).toBe('fee_statement');
  });

  it('LOCKED-DOOR: Student B CANNOT see Student A fee statement under RLS', async () => {
    // Switch to authenticated Student B
    await db.exec(`
      SET ROLE authenticated;
      SELECT set_config('request.jwt.claim.sub', '${studentB}', false);
    `);

    const queryAsStudentB = await db.query(
      "SELECT * FROM uams_academic_records WHERE kind = 'fee_statement'"
    );
    expect(queryAsStudentB.rows).toHaveLength(0);

    const directLookup = await db.query(
      "SELECT * FROM uams_academic_records WHERE source_id = 'stmt-001'"
    );
    expect(directLookup.rows).toHaveLength(0);

    await db.exec('RESET ROLE;');
  });

  it('LOCKED-DOOR: Student A CAN see their own fee statement under RLS', async () => {
    // Switch to authenticated Student A
    await db.exec(`
      SET ROLE authenticated;
      SELECT set_config('request.jwt.claim.sub', '${studentA}', false);
    `);

    const queryAsStudentA = await db.query<{ data: typeof feeStatementA }>(
      "SELECT * FROM uams_academic_records WHERE kind = 'fee_statement'"
    );
    expect(queryAsStudentA.rows).toHaveLength(1);
    expect(queryAsStudentA.rows[0].data.total_billed).toBe(69500);
    expect(queryAsStudentA.rows[0].data.funding_applied).toBe(25000);
    expect(queryAsStudentA.rows[0].data.paid_by_student).toBe(20000);
    expect(queryAsStudentA.rows[0].data.balance).toBe(24500);
    expect(queryAsStudentA.rows[0].data.items).toHaveLength(8);

    await db.exec('RESET ROLE;');
  });

  it('LOCKED-DOOR: Unpublished fee statement is hidden from everyone including the owner', async () => {
    // Reset role to service_role before sync
    await db.exec('RESET ROLE;');

    // Update to unpublished (draft)
    await syncAcademicRecords([{ ...feeStatementA, is_published: false, updated_at: '2026-10-23T01:00:00Z' }]);

    // Query as Student A
    await db.exec(`
      SET ROLE authenticated;
      SELECT set_config('request.jwt.claim.sub', '${studentA}', false);
    `);

    const queryAsStudentA = await db.query(
      "SELECT * FROM uams_academic_records WHERE kind = 'fee_statement'"
    );
    expect(queryAsStudentA.rows).toHaveLength(0);

    await db.exec('RESET ROLE;');
  });

  it('LOCKED-DOOR: Student B CANNOT see Student A payment history or receipts under RLS', async () => {
    // Reset to service_role before sync
    await db.exec('RESET ROLE;');
    const res = await syncAcademicRecords([paymentRecordA]);
    expect(res).toMatchObject({ inserted: 1 });

    // Switch to authenticated Student B
    await db.exec(`
      SET ROLE authenticated;
      SELECT set_config('request.jwt.claim.sub', '${studentB}', false);
    `);

    const queryAsStudentB = await db.query(
      "SELECT * FROM uams_academic_records WHERE kind = 'payment_record'"
    );
    expect(queryAsStudentB.rows).toHaveLength(0);

    const directLookup = await db.query(
      "SELECT * FROM uams_academic_records WHERE source_id = 'pay-001'"
    );
    expect(directLookup.rows).toHaveLength(0);

    await db.exec('RESET ROLE;');
  });

  it('LOCKED-DOOR: Student A CAN see their own payment records and receipts', async () => {
    // Switch to authenticated Student A
    await db.exec(`
      SET ROLE authenticated;
      SELECT set_config('request.jwt.claim.sub', '${studentA}', false);
    `);

    const queryAsStudentA = await db.query<{ data: typeof paymentRecordA }>(
      "SELECT * FROM uams_academic_records WHERE kind = 'payment_record'"
    );
    expect(queryAsStudentA.rows).toHaveLength(1);
    expect(queryAsStudentA.rows[0].data.reference_code).toBe('QHK9821PX4');
    expect(queryAsStudentA.rows[0].data.amount).toBe(20000);
    expect(queryAsStudentA.rows[0].data.receipt_number).toBe('RCP-2026-08491');

    await db.exec('RESET ROLE;');
  });
});

describe('Rule 2: Demo money isolation and total integrity', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('verifies demo payment records accurately match settled totals', () => {
    // Current semester payments
    const currentSemPayments = DEMO_PAYMENT_RECORDS.filter((p) => p.semester_label === 'Year 2 Semester 1');
    const totalCurrentPaid = currentSemPayments.reduce((sum, p) => sum + p.amount, 0);
    expect(totalCurrentPaid).toBe(45000); // 20,000 M-Pesa + 25,000 HELB = 45,000

    // Verify individual payments
    const mpesaPayment = currentSemPayments.find((p) => p.channel === 'mpesa');
    expect(mpesaPayment?.reference_code).toBe('QHK9821PX4');
    expect(mpesaPayment?.amount).toBe(20000);

    const helbPayment = currentSemPayments.find((p) => p.channel === 'helb');
    expect(helbPayment?.reference_code).toBe('HELB-2026-SEM1-8849');
    expect(helbPayment?.amount).toBe(25000);

    // Previous semester payments
    const prevSemPayments = DEMO_PAYMENT_RECORDS.filter((p) => p.semester_label === 'Year 1 Semester 2');
    const totalPrevPaid = prevSemPayments.reduce((sum, p) => sum + p.amount, 0);
    expect(totalPrevPaid).toBe(52500); // 27,500 M-Pesa + 25,000 HELB = 52,500
  });

  it('verifies demo fee statements total exactly 69,500 for the current semester', () => {
    const currentSem = DEMO_FEE_STATEMENTS[0];
    expect(currentSem.semester_label).toBe('Year 2 Semester 1');
    expect(currentSem.total_billed).toBe(69500);
    expect(currentSem.total_paid).toBe(45000);
    expect(currentSem.balance).toBe(24500);

    // Sum of items must equal 69,500
    const calculatedSum = currentSem.items.reduce((sum, item) => sum + item.amount, 0);
    expect(calculatedSum).toBe(69500);

    // Verify item amounts
    const itemMap = Object.fromEntries(currentSem.items.map((i) => [i.category, i.amount]));
    expect(itemMap.tuition).toBe(42000);
    expect(itemMap.hostel).toBe(14000);
    expect(itemMap.examination).toBe(4000);
    expect(itemMap.ict).toBe(3000);
    expect(itemMap.library).toBe(2500);
    expect(itemMap.medical).toBe(2000);
    expect(itemMap.activity).toBe(1500);
    expect(itemMap.union).toBe(500);
  });
});
