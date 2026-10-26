'use client';

import * as React from 'react';
import QRCode from 'qrcode';

interface ExamPassQrProps {
  payload: string;
  size?: number;
  className?: string;
  margin?: number;
}

/**
 * Authoritative SVG QR code renderer for Digital Exam Pass & Gate Check-in verification.
 * Generates an authentic, scanner-compliant ISO/IEC 18004 QR code decodable by phone cameras.
 */
export function ExamPassQr({ payload, size = 120, className = '', margin = 2 }: ExamPassQrProps) {
  const { cells, totalSize } = React.useMemo(() => {
    try {
      const qr = QRCode.create(payload || 'EMPTY', { errorCorrectionLevel: 'M' });
      const moduleCount = qr.modules.size;
      const total = moduleCount + margin * 2;
      const rects: { x: number; y: number }[] = [];

      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (qr.modules.get(r, c)) {
            rects.push({ x: c + margin, y: r + margin });
          }
        }
      }

      return { cells: rects, totalSize: total };
    } catch {
      return { cells: [], totalSize: 25 };
    }
  }, [payload, margin]);

  return (
    <div className={`p-2 bg-white rounded-xl border border-slate-200 shadow-2xs inline-block ${className}`}>
      <svg
        viewBox={`0 0 ${totalSize} ${totalSize}`}
        width={size}
        height={size}
        className="w-full h-full"
        shapeRendering="crispEdges"
        aria-label={`Authoritative verification QR code encoding: ${payload}`}
        role="img"
      >
        <rect width={totalSize} height={totalSize} fill="#FFFFFF" />
        {cells.map((cell) => (
          <rect
            key={`${cell.y}-${cell.x}`}
            x={cell.x}
            y={cell.y}
            width={1}
            height={1}
            fill="#0B1D33"
          />
        ))}
      </svg>
    </div>
  );
}
