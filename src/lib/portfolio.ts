import type { Loan, LedgerEntry } from '../types';
import { totalExpectedInterest } from './emi';

export interface LoanStats {
  principalPaid: number;
  interestPaid: number;
  charges: number;
  adjustments: number;
  disbursed: number;
  outstanding: number;
  expectedInterest: number;
  interestDue: number;
}

/** Aggregate ledger entries for one loan into portfolio numbers. */
export function loanStats(loan: Loan, entries: LedgerEntry[]): LoanStats {
  let principalPaid = 0;
  let interestPaid = 0;
  let charges = 0;
  let adjustments = 0;
  let disbursed = 0;

  for (const e of entries) {
    if (e.loan_id !== loan.id) continue;
    const amt = Number(e.amount) || 0;
    switch (e.entry_type) {
      case 'principal_payment':
        principalPaid += amt;
        break;
      case 'interest_payment':
        interestPaid += amt;
        break;
      case 'charge':
        charges += amt;
        break;
      case 'adjustment':
        adjustments += amt;
        break;
      case 'disbursement':
        disbursed += amt;
        break;
    }
  }

  const principal = Number(loan.principal) || 0;
  const outstanding = Math.max(0, principal - principalPaid + adjustments);
  const expectedInterest = totalExpectedInterest(
    principal,
    Number(loan.interest_rate) || 0,
    loan.rate_type,
    Number(loan.tenure_months) || 0,
    loan.emi_amount ? Number(loan.emi_amount) : null
  );
  const interestDue = Math.max(0, expectedInterest - interestPaid);

  return {
    principalPaid,
    interestPaid,
    charges,
    adjustments,
    disbursed,
    outstanding,
    expectedInterest,
    interestDue,
  };
}

export interface PortfolioTotals {
  totalDisbursed: number;
  outstanding: number;
  interestDue: number;
  interestCollected: number;
  charges: number;
  activeCount: number;
  closedCount: number;
}

/** Portfolio-wide totals. Outstanding/due are computed over active loans only. */
export function portfolioTotals(loans: Loan[], entries: LedgerEntry[]): PortfolioTotals {
  let totalDisbursed = 0;
  let outstanding = 0;
  let interestDue = 0;
  let interestCollected = 0;
  let charges = 0;
  let activeCount = 0;
  let closedCount = 0;

  for (const loan of loans) {
    totalDisbursed += Number(loan.principal) || 0;
    const s = loanStats(loan, entries);
    if (loan.status === 'active') {
      activeCount++;
      outstanding += s.outstanding;
      interestDue += s.interestDue;
      interestCollected += s.interestPaid;
      charges += s.charges;
    } else {
      closedCount++;
    }
  }

  return {
    totalDisbursed,
    outstanding,
    interestDue,
    interestCollected,
    charges,
    activeCount,
    closedCount,
  };
}

/** Next unpaid EMI installment number, based on "EMI #N" ledger notes. */
export function nextEmiNumber(entries: LedgerEntry[]): number {
  let count = 0;
  for (const e of entries) {
    if (e.note && /^EMI #\d+/.test(e.note)) count++;
  }
  return Math.floor(count / 2) + 1;
}
