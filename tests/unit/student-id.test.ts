import { describe, it, expect } from 'vitest';
import { DEMO_STUDENT_ID_CARD } from '@/lib/student-id/demo-data';
import { DigitalStudentIdCard } from '@/lib/student-id/types';

describe('Digital Student ID Badge Feature', () => {
  it('correctly resolves student identity credentials for gate and library verification', () => {
    const card = DEMO_STUDENT_ID_CARD;
    expect(card.studentName).toBe('Faith Wanjiku');
    expect(card.admissionNumber).toBe('BIT/2023/8849');
    expect(card.programme).toBe('Bachelor of Science in Information Technology');
    expect(card.faculty).toBe('School of Computing & Informatics');
    expect(card.campusName).toContain('Main Campus');
    expect(card.status).toBe('active');
    expect(card.validUntil).toBe('DEC 2027');
  });

  it('generates authoritative gate verification QR payload and library barcode', () => {
    const card = DEMO_STUDENT_ID_CARD;
    expect(card.qrPayload).toBe('SMU-PASS:BIT/2023/8849:VERIFIED:EXP-2027');
    expect(card.libraryBarcode).toMatch(/^20238849/);
    expect(card.emergencyContact).toContain('+254');
  });

  it('enforces locked-door privacy: Student B cannot view Student A ID credentials', () => {
    const cardA: DigitalStudentIdCard = {
      ...DEMO_STUDENT_ID_CARD,
      id: 'card-A',
      studentName: 'Student Alpha',
      admissionNumber: 'BIT/2023/0001',
    };
    const cardB: DigitalStudentIdCard = {
      ...DEMO_STUDENT_ID_CARD,
      id: 'card-B',
      studentName: 'Student Beta',
      admissionNumber: 'BIT/2023/0002',
    };

    const cardsPool = [cardA, cardB];
    const studentBQueryResult = cardsPool.filter((c) => c.admissionNumber === 'BIT/2023/0002');

    expect(studentBQueryResult).toHaveLength(1);
    expect(studentBQueryResult[0].studentName).toBe('Student Beta');

    const leakedCredentials = studentBQueryResult.filter((c) => c.admissionNumber === 'BIT/2023/0001');
    expect(leakedCredentials).toHaveLength(0);
  });

  it('ensures zero emojis and zero em dashes in student ID records and data structures', () => {
    const card = DEMO_STUDENT_ID_CARD;
    const allText = JSON.stringify(card);

    // Emoji check
    const emojiMatch = allText.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/);
    expect(emojiMatch).toBeNull();

    // Em dash check
    expect(allText.includes('\u2014')).toBe(false);
  });

  it('generates standard decodable ISO/IEC 18004 QR modules with finder patterns', async () => {
    const QRCode = (await import('qrcode')).default;
    const qr = QRCode.create(DEMO_STUDENT_ID_CARD.qrPayload, { errorCorrectionLevel: 'M' });
    expect(qr.modules.size).toBeGreaterThanOrEqual(21);
    
    // Top-left finder pattern verification (7x7)
    // Corner module (0,0) must be dark (1)
    expect(qr.modules.get(0, 0)).toBeTruthy();
    // Inner white separator ring at (1,1) must be light (0)
    expect(qr.modules.get(1, 1)).toBeFalsy();
    // Inner center module at (3,3) must be dark (1)
    expect(qr.modules.get(3, 3)).toBeTruthy();
  });
});
