import { describe, it, expect } from 'vitest';
import {
  getStudentClearanceSummaryAction,
  getVaultDocumentsAction,
  requestOfficialTranscriptAction,
  getTranscriptRequestsAction,
  getSponsorViewSummaryAction,
} from '@/lib/actions/graduation';
import {
  DEMO_CLEARANCE_SUMMARY,
  DEMO_VAULT_DOCUMENTS,
  DEMO_SPONSOR_VIEW,
} from '@/lib/graduation/demo-data';
import * as fs from 'fs';
import * as path from 'path';

describe('Graduation: Multi-Department Final Clearance Checklist', () => {
  it('tracks all 5 statutory university departments for final exit clearance', async () => {
    const res = await getStudentClearanceSummaryAction();
    expect(res.success).toBe(true);
    expect(res.summary).toBeDefined();

    const summary = res.summary!;
    expect(summary.totalDepartmentsCount).toBe(5);
    expect(summary.departments.length).toBe(5);

    const categories = summary.departments.map((d) => d.category);
    expect(categories).toContain('library');
    expect(categories).toContain('hostels');
    expect(categories).toContain('sports');
    expect(categories).toContain('finance');
    expect(categories).toContain('registrar');
  });

  it('honesty rule: blocks departments with outstanding liabilities and provides resolution links', async () => {
    const res = await getStudentClearanceSummaryAction();
    const summary = res.summary!;

    // In demo state: Library has overdue book, Finance has fee balance
    const libraryDept = summary.departments.find((d) => d.category === 'library');
    expect(libraryDept).toBeDefined();
    expect(libraryDept?.status).toBe('blocked');
    expect(libraryDept?.blockingReason).toContain('overdue');
    expect(libraryDept?.resolutionActionUrl).toBe('/library');

    const financeDept = summary.departments.find((d) => d.category === 'finance');
    expect(financeDept).toBeDefined();
    expect(financeDept?.status).toBe('blocked');
    expect(financeDept?.blockingReason).toContain('24,500');
    expect(financeDept?.resolutionActionUrl).toBe('/fees');

    // Fully cleared status is false while blockers exist
    expect(summary.isFullyCleared).toBe(false);
    expect(summary.finalClearanceCertificateRef).toBeUndefined();
  });

  it('accurately reports cleared departments with officer sign-off credentials', async () => {
    const res = await getStudentClearanceSummaryAction();
    const summary = res.summary!;

    const hostelsDept = summary.departments.find((d) => d.category === 'hostels');
    expect(hostelsDept?.status).toBe('cleared');
    expect(hostelsDept?.officerName).toBeDefined();
    expect(hostelsDept?.officerRole).toBeDefined();

    const sportsDept = summary.departments.find((d) => d.category === 'sports');
    expect(sportsDept?.status).toBe('cleared');
    expect(sportsDept?.officerName).toBeDefined();
  });
});

describe('Graduation: Digital Documents Vault', () => {
  it('retrieves certified academic and financial documents', async () => {
    const res = await getVaultDocumentsAction();
    expect(res.success).toBe(true);
    expect(res.documents.length).toBeGreaterThanOrEqual(4);

    const admissionDoc = res.documents.find((d) => d.type === 'admission_letter');
    expect(admissionDoc).toBeDefined();
    expect(admissionDoc?.isAvailable).toBe(true);
    expect(admissionDoc?.referenceNumber).toContain('SMU/ADM');

    const feeDoc = res.documents.find((d) => d.type === 'fee_receipt');
    expect(feeDoc).toBeDefined();
    expect(feeDoc?.isAvailable).toBe(true);

    const examDoc = res.documents.find((d) => d.type === 'provisional_transcript');
    expect(examDoc).toBeDefined();
    expect(examDoc?.isAvailable).toBe(true);
  });

  it('honesty rule: holds final clearance certificate as unavailable until all departments clear', async () => {
    const res = await getVaultDocumentsAction();
    const clrDoc = res.documents.find((d) => d.type === 'clearance_certificate');

    expect(clrDoc).toBeDefined();
    expect(clrDoc?.isAvailable).toBe(false);
    expect(clrDoc?.unavailableReason).toContain('all 5 departments sign off');
  });
});

describe('Graduation: Alumni Mode & Official Transcript Requests', () => {
  it('submits an official transcript dispatch request with valid tracking reference', async () => {
    const res = await requestOfficialTranscriptAction({
      destinationInstitution: 'Dalberg Research Africa',
      destinationEmail: 'recruitment@dalberg.com',
      format: 'electronic_certified',
      notes: 'Application ID: DAL-2026-ENG',
    });

    expect(res.success).toBe(true);
    expect(res.request).toBeDefined();
    expect(res.request?.trackingReference).toMatch(/^TRQ-2026-\d{4}$/);
    expect(res.request?.destinationInstitution).toBe('Dalberg Research Africa');
    expect(res.request?.format).toBe('electronic_certified');
    expect(res.request?.status).toBe('submitted');
  });

  it('validates destination requirements prior to transcript dispatch', async () => {
    const emptyInstRes = await requestOfficialTranscriptAction({
      destinationInstitution: '',
      destinationEmail: 'admin@uni.ac.ke',
      format: 'electronic_certified',
    });
    expect(emptyInstRes.success).toBe(false);
    expect(emptyInstRes.message).toContain('specify the destination');

    const invalidEmailRes = await requestOfficialTranscriptAction({
      destinationInstitution: 'KPMG East Africa',
      destinationEmail: 'not-an-email',
      format: 'embossed_hardcopy',
    });
    expect(invalidEmailRes.success).toBe(false);
    expect(invalidEmailRes.message).toContain('valid destination email');
  });

  it('lists existing transcript requests with status and destination', async () => {
    const res = await getTranscriptRequestsAction();
    expect(res.success).toBe(true);
    expect(res.requests.length).toBeGreaterThanOrEqual(1);

    res.requests.forEach((r) => {
      expect(r.trackingReference).toBeDefined();
      expect(r.destinationInstitution).toBeDefined();
      expect(r.format).toMatch(/electronic_certified|embossed_hardcopy/);
    });
  });
});

describe('Graduation: Parent & Sponsor Statement', () => {
  it('generates a clean, read-only summary for parent/sponsor payment and academic tracking', async () => {
    const res = await getSponsorViewSummaryAction();
    expect(res.success).toBe(true);
    expect(res.summary).toBeDefined();

    const summary = res.summary!;
    expect(summary.studentName).toBe('Faith Wanjiku');
    expect(summary.admissionNumber).toBe('BIT/2023/8849');
    expect(summary.feeSummary.balance).toBe(24500);
    expect(summary.feeSummary.paybillNumber).toBe('247247');
    expect(summary.feeSummary.accountNumber).toBe('BIT20238849');
    expect(summary.feeSummary.bankDetails.bankName).toBe('Kenya Commercial Bank (KCB)');
    expect(summary.enrolledUnitsCount).toBeGreaterThan(0);
  });

  it('privacy protection: sponsor view does not leak internal help tickets or private student notes', async () => {
    const res = await getSponsorViewSummaryAction();
    const jsonStr = JSON.stringify(res.summary);

    // Verify absence of sensitive internal attributes
    expect(jsonStr).not.toContain('help_requests');
    expect(jsonStr).not.toContain('ticketReference');
    expect(jsonStr).not.toContain('confidential');
  });
});

describe('Design Rules & Integrity', () => {
  it('enforces strictly zero em dashes and zero emojis across graduation and sponsor files', () => {
    const files = [
      'lib/graduation/types.ts',
      'lib/graduation/demo-data.ts',
      'lib/actions/graduation.ts',
      'app/(dashboard)/graduation/graduation-client.tsx',
      'app/(dashboard)/graduation/page.tsx',
      'app/(dashboard)/sponsor-view/page.tsx',
    ];

    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;

    files.forEach((relPath) => {
      const fullPath = path.resolve(process.cwd(), relPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        expect(content).not.toContain('\u2014'); // no em dash
        expect(emojiRegex.test(content)).toBe(false); // no emoji
      }
    });
  });
});
