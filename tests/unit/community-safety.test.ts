import { describe, it, expect } from 'vitest';
import {
  claimLostFoundItemAction,
  getKdpaStudentDataExportAction,
  getLostAndFoundItemsAction,
  reportLostFoundItemAction,
  triggerEmergencySosAction,
} from '@/lib/actions/community-safety';
import {
  DEMO_KDPA_DATA_PACKAGE,
  DEMO_LOST_FOUND_ITEMS,
} from '@/lib/community-safety/demo-data';
import * as fs from 'fs';
import * as path from 'path';

describe('Community & Safety: Emergency SOS & Dispatch', () => {
  it('dispatches a Priority 1 emergency incident and labels hotlines honestly as provisional pilot contacts', async () => {
    const res = await triggerEmergencySosAction(
      'Hall 3 Block B Room 204',
      'security',
      'Intruder reported near rear exit'
    );

    expect(res.success).toBe(true);
    expect(res.ticketNumber).toMatch(/^SOS-2026-\d{4}$/);
    expect(res.studentLocation).toBe('Hall 3 Block B Room 204');
    expect(res.campusSecurityPhone).toContain('Provisional Pilot Line');
    expect(res.campusHealthCentrePhone).toContain('Provisional Pilot Line');
    expect(res.dispatchedTo).toContain('Campus Security Control Room');
    expect(res.message).toContain('Priority 1 Emergency Incident dispatched');
    expect(res.message).toContain('provisional pilot');
  });

  it('honesty rule: never claims to dispatch national municipal 999 services directly', async () => {
    const res = await triggerEmergencySosAction('Main Library 2nd Floor', 'medical');

    // The Hub dispatches to campus staff responders, never municipal police/fire
    expect(res.dispatchedTo).not.toContain('National Police Service');
    expect(res.dispatchedTo).not.toContain('City Ambulance');
    expect(res.campusSecurityPhone).toContain('Provisional');
  });
});

describe('Community & Safety: Lost & Found Custodial Board', () => {
  it('retrieves custodial items without exposing personal student telephone numbers', async () => {
    const res = await getLostAndFoundItemsAction();

    expect(res.success).toBe(true);
    expect(res.items.length).toBeGreaterThanOrEqual(3);

    res.items.forEach((item) => {
      expect(item.id).toBeDefined();
      expect(item.title).toBeDefined();
      expect(item.location).toBeDefined();
      expect(item.status).toMatch(/open|claimed|handed_over/);

      // Verify no raw phone numbers are exposed on the public board
      expect(item.description).not.toMatch(/\+254\s*7\d{8}/);
      expect((item as any).phone).toBeUndefined();
      expect((item as any).studentPhone).toBeUndefined();
    });
  });

  it('allows registering a new lost or found notice with an automatic custodial ticket reference', async () => {
    const res = await reportLostFoundItemAction({
      type: 'found',
      title: 'Scientific Calculator Casio fx-991EX',
      category: 'electronics',
      location: 'Science Complex Lab 2',
      description: 'Found on front workbench after practical. Deposited with laboratory custodian.',
    });

    expect(res.success).toBe(true);
    expect(res.item).toBeDefined();
    expect(res.item?.ticketReference).toMatch(/^HD-2026-\d{4}$/);
    expect(res.item?.type).toBe('found');
    expect(res.item?.category).toBe('electronics');
    expect(res.item?.status).toBe('open');
  });

  it('routes claims through the staff help-desk custody queue with verification proof requirement', async () => {
    // Rejects claim without verification proof
    const rejectRes = await claimLostFoundItemAction('lf-01', '');
    expect(rejectRes.success).toBe(false);
    expect(rejectRes.message).toContain('identifying details or serial verification proof');

    // Accepts claim with ownership proof and instructs student on physical handover
    const claimRes = await claimLostFoundItemAction(
      'lf-01',
      'Charger serial number SN-HP-65W-99214 with blue tape around adapter neck.'
    );
    expect(claimRes.success).toBe(true);
    expect(claimRes.message).toContain('Security Custody Office');
    expect(claimRes.message).toContain('student ID');
  });
});

describe('Community & Safety: KDPA 2019 Section 26 Data Protection Export', () => {
  it('exports authoritative personal and educational data bundle for the authenticated student', async () => {
    const res = await getKdpaStudentDataExportAction();

    expect(res.success).toBe(true);
    expect(res.package).toBeDefined();

    const pkg = res.package!;
    expect(pkg.legalBasis).toContain('Kenya Data Protection Act (KDPA 2019), Section 26');
    expect(pkg.dataController).toContain('Data Protection Officer');

    // Profile verification
    expect(pkg.studentProfile.fullName).toBe('Faith Wanjiku');
    expect(pkg.studentProfile.admissionNumber).toBe('BIT/2023/8849');
    expect(pkg.studentProfile.programme).toContain('Information Technology');

    // Records inventory completeness
    expect(pkg.records.academicGradesCount).toBeGreaterThan(0);
    expect(pkg.records.academicGrades[0]).toHaveProperty('courseCode');
    expect(pkg.records.academicGrades[0]).toHaveProperty('grade');

    expect(pkg.records.feeStatementsCount).toBeGreaterThan(0);
    expect(pkg.records.feeStatements[0]).toHaveProperty('balance');

    expect(pkg.records.libraryLoansCount).toBeGreaterThan(0);
    expect(pkg.records.libraryLoans[0]).toHaveProperty('accessionNumber');

    expect(pkg.records.unitRegistrationsCount).toBeGreaterThan(0);
    expect(pkg.records.unitRegistrations[0]).toHaveProperty('courseCode');
  });

  it('includes plain-words KDPA statutory rights summary and retention rules', async () => {
    const res = await getKdpaStudentDataExportAction();
    const pkg = res.package!;

    expect(pkg.kdpaRightsSummary.rightToAccess).toContain('right to request access');
    expect(pkg.kdpaRightsSummary.rightToRectification).toContain('right to request correction');
    expect(pkg.kdpaRightsSummary.rightToErasure).toContain('non-statutory records');
    expect(pkg.kdpaRightsSummary.retentionPolicy).toContain('Universities Act');
  });

  it('strict locked-door check: student data bundle contains zero records belonging to other students', async () => {
    const res = await getKdpaStudentDataExportAction();
    const pkg = res.package!;

    // Faith's export must not contain another student's admission number or records
    const otherStudentAdmission = 'BCS/2024/9912';
    const jsonStr = JSON.stringify(pkg);

    expect(jsonStr).not.toContain(otherStudentAdmission);
    expect(pkg.studentProfile.admissionNumber).toBe('BIT/2023/8849');
  });
});

describe('Design Rules & Integrity', () => {
  it('enforces strictly zero em dashes and zero emojis across community safety files', () => {
    const safetyFiles = [
      'lib/community-safety/types.ts',
      'lib/community-safety/demo-data.ts',
      'lib/actions/community-safety.ts',
      'app/(dashboard)/safety/safety-client.tsx',
      'app/(dashboard)/safety/page.tsx',
    ];

    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;

    safetyFiles.forEach((relPath) => {
      const fullPath = path.resolve(process.cwd(), relPath);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        expect(content).not.toContain('\u2014'); // no em dash
        expect(emojiRegex.test(content)).toBe(false); // no emoji
      }
    });
  });
});
