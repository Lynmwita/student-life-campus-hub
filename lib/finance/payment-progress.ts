export interface PaymentProgressParams {
  totalBilled: number;
  totalPaid: number;
  fundingApplied?: number;
  paidByStudent?: number;
}

export interface PaymentProgressCalculation {
  totalBilled: number;
  totalPaid: number;
  totalSettled: number;
  effectivePaidByStudent: number;
  fundingApplied: number;
  percentSettled: number;
  percentStudent: number;
  percentFunding: number;
  percentRemaining: number;
  balanceRemaining: number;
  isCleared: boolean;
}

/**
 * Shared fee payment progress calculator.
 * Capped at 100%, safely handles zero billing, and splits student vs funding contributions.
 */
export function calculatePaymentProgress({
  totalBilled,
  totalPaid,
  fundingApplied = 0,
  paidByStudent,
}: PaymentProgressParams): PaymentProgressCalculation {
  if (totalBilled <= 0) {
    return {
      totalBilled: Math.max(0, totalBilled),
      totalPaid: Math.max(0, totalPaid),
      totalSettled: 0,
      effectivePaidByStudent: 0,
      fundingApplied: 0,
      percentSettled: 0,
      percentStudent: 0,
      percentFunding: 0,
      percentRemaining: 0,
      balanceRemaining: 0,
      isCleared: false,
    };
  }

  const safeFunding = Math.max(0, fundingApplied);
  const effectivePaidByStudent =
    paidByStudent !== undefined
      ? Math.max(0, paidByStudent)
      : Math.max(0, totalPaid - safeFunding);

  // Total amount covered, capped at totalBilled
  const totalSettled = Math.min(totalBilled, Math.max(0, totalPaid));
  const percentSettled = Math.min(100, Math.round((totalSettled / totalBilled) * 100));

  // Segments: student portion & funding portion
  const percentStudent = Math.min(100, Math.round((Math.min(totalBilled, effectivePaidByStudent) / totalBilled) * 100));
  const percentFunding = Math.max(0, Math.min(percentSettled - percentStudent, Math.round((Math.min(totalBilled, safeFunding) / totalBilled) * 100)));
  const percentRemaining = Math.max(0, 100 - percentSettled);
  const balanceRemaining = Math.max(0, totalBilled - totalSettled);
  const isCleared = percentSettled >= 100;

  return {
    totalBilled,
    totalPaid,
    totalSettled,
    effectivePaidByStudent,
    fundingApplied: safeFunding,
    percentSettled,
    percentStudent,
    percentFunding,
    percentRemaining,
    balanceRemaining,
    isCleared,
  };
}
