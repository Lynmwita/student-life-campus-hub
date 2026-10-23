import { jsPDF } from 'jspdf';
import { PaymentRecord } from './types';

function numberToWordsKES(amount: number): string {
  // Simple clean integer representation for KES receipts
  const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (amount === 0) return 'Zero Kenya Shillings Only';

  function convertChunk(num: number): string {
    let str = '';
    if (num >= 100) {
      str += units[Math.floor(num / 100)] + ' Hundred ';
      num %= 100;
    }
    if (num >= 20) {
      str += tens[Math.floor(num / 10)] + ' ';
      num %= 10;
    }
    if (num > 0) {
      str += units[num] + ' ';
    }
    return str.trim();
  }

  let words = '';
  const thousands = Math.floor(amount / 1000);
  const remainder = amount % 1000;

  if (thousands > 0) {
    words += convertChunk(thousands) + ' Thousand ';
  }
  if (remainder > 0) {
    words += convertChunk(remainder) + ' ';
  }

  return `${words.trim()} Kenya Shillings Only`;
}

export function generatePaymentReceiptPdf(
  payment: PaymentRecord,
  universityName: string = 'SUMMIT METROPOLITAN UNIVERSITY'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Theme colors
  const primaryNavy = [11, 29, 51]; // #0B1D33
  const secondaryGold = [197, 155, 39]; // #C59B27
  const textDark = [30, 41, 59]; // #1E293B
  const textMuted = [100, 116, 139]; // #64748B
  const bgLight = [248, 250, 252]; // #F8FAFC
  const borderGrey = [226, 232, 240]; // #E2E8F0

  // Outer border & header banner
  doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
  doc.setLineWidth(0.5);
  doc.rect(12, 12, 186, 273); // Main border

  // Top header color band
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(12, 12, 186, 28, 'F');

  // Gold accent line
  doc.setFillColor(secondaryGold[0], secondaryGold[1], secondaryGold[2]);
  doc.rect(12, 40, 186, 1.5, 'F');

  // University Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(universityName.toUpperCase(), 105, 22, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text('OFFICE OF THE REGISTRAR • DIRECTORATE OF FINANCE & STUDENT ACCOUNTS', 105, 28, { align: 'center' });
  doc.text('ELECTRONIC PAYMENT RECEIPT & VERIFICATION RECORD', 105, 33, { align: 'center' });

  // Receipt Identifier Title
  let y = 52;
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('OFFICIAL STUDENT RECEIPT', 20, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Receipt No: ${payment.receipt_number}`, 145, y);

  y += 5;
  doc.text(`Issued: ${new Date(payment.paid_at).toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' })}`, 145, y);

  // Divider
  y += 4;
  doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
  doc.line(20, y, 190, y);

  // Student & Academic Information Box
  y += 8;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(20, y, 170, 42, 2, 2, 'F');
  doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
  doc.roundedRect(20, y, 170, 42, 2, 2, 'S');

  const leftColX = 26;
  const rightColX = 110;
  let textY = y + 8;

  // Row 1
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('STUDENT FULL NAME:', leftColX, textY);
  doc.text('ADMISSION NUMBER:', rightColX, textY);

  textY += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(payment.student_name.toUpperCase(), leftColX, textY);
  doc.setFont('courier', 'bold');
  doc.text(payment.admission_number, rightColX, textY);

  // Row 2
  textY += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text('DEGREE / ACADEMIC PROGRAM:', leftColX, textY);
  doc.text('ACADEMIC PERIOD:', rightColX, textY);

  textY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(payment.degree_program || 'Degree of Study', leftColX, textY);
  doc.text(payment.semester_label, rightColX, textY);

  // Transaction Breakdown Table
  y += 50;
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(20, y, 170, 7.5, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('PAYMENT ATTRIBUTES', 26, y + 5);
  doc.text('TRANSACTION RECORD DETAILS', 85, y + 5);
  doc.text('AMOUNT (KES)', 180, y + 5, { align: 'right' });

  // Rows
  const tableRows = [
    { label: 'Reference / M-Pesa Code', val: payment.reference_code, isCode: true },
    { label: 'Payment Method / Channel', val: payment.channel_label, isCode: false },
    { label: 'Disbursement / Deposit Date', val: new Date(payment.paid_at).toLocaleString('en-KE'), isCode: false },
    { label: 'Account Allocation', val: payment.allocated_to, isCode: false },
    { label: 'Registry Reconciliation Status', val: 'VERIFIED & CREDITED TO ACCOUNT', isCode: false },
  ];

  y += 7.5;
  tableRows.forEach((row, i) => {
    const rowBg = i % 2 === 0 ? [255, 255, 255] : bgLight;
    doc.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
    doc.rect(20, y, 170, 8.5, 'F');
    doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
    doc.line(20, y + 8.5, 190, y + 8.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(row.label, 26, y + 5.5);

    doc.setFont(row.isCode ? 'courier' : 'helvetica', row.isCode ? 'bold' : 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.text(row.val, 85, y + 5.5);

    y += 8.5;
  });

  // Total Credited Box
  y += 6;
  doc.setFillColor(bgLight[0], bgLight[1], bgLight[2]);
  doc.roundedRect(20, y, 170, 24, 2, 2, 'F');
  doc.setDrawColor(secondaryGold[0], secondaryGold[1], secondaryGold[2]);
  doc.setLineWidth(0.8);
  doc.roundedRect(20, y, 170, 24, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('TOTAL AMOUNT CREDITED:', 26, y + 8);

  doc.setFont('courier', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text(`KES ${payment.amount.toLocaleString('en-KE')}.00`, 180, y + 9, { align: 'right' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(`Amount in words: ${numberToWordsKES(payment.amount)}`, 26, y + 17);

  // Digital Validation Box & Seal
  y += 35;
  doc.setDrawColor(borderGrey[0], borderGrey[1], borderGrey[2]);
  doc.setLineWidth(0.4);
  doc.line(20, y, 190, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.text('OFFICIAL VERIFICATION & AUDIT COMPLIANCE NOTICE', 20, y);

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  doc.text(
    'This electronic receipt is an authoritative payment record generated by the Student Life & Campus Hub in synchronization',
    20,
    y
  );
  y += 3.5;
  doc.text(
    'with the University Academic Management System (UAMS). It serves as formal proof of fee payment for academic clearance,',
    20,
    y
  );
  y += 3.5;
  doc.text(
    'examination card issuance, and library privileges. Valid without physical rubber stamp or signature.',
    20,
    y
  );

  // Security hash text footer
  y += 10;
  const securityHash = `SMU-VERIFIED-${payment.reference_code}-${payment.receipt_number.replace(/[^0-9]/g, '')}`;
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(textDark[0], textDark[1], textDark[2]);
  doc.text(`DIGITAL SIGNATURE HASH: ${securityHash}`, 20, y);

  const cleanRef = payment.reference_code.replace(/[^a-zA-Z0-9]/g, '');
  const cleanAdm = payment.admission_number.replace(/[^a-zA-Z0-9]/g, '');
  const filename = `Receipt_${cleanRef}_${cleanAdm}.pdf`;

  // Download PDF file in browser
  doc.save(filename);
}
