import type { RateType } from '../types';
import { addMonthsISO } from './format';

/** Monthly interest rate as a decimal (0.02 = 2%). */
export function monthlyRate(interestRate: number, rateType: RateType): number {
  if (rateType === 'monthly') return interestRate / 100;
  if (rateType === 'annual') return interestRate / 12 / 100;
  return 0; // flat rate handled separately
}

/** Reducing-balance EMI (or flat-rate EMI when rateType === 'flat'). */
export function calcEmi(
  principal: number,
  interestRate: number,
  rateType: RateType,
  months: number
): number {
  if (months <= 0 || principal <= 0) return 0;
  if (rateType === 'flat') {
    const totalInterest = (principal * interestRate * months) / 1200;
    return (principal + totalInterest) / months;
  }
  const r = monthlyRate(interestRate, rateType);
  if (r <= 0) return principal / months;
  const f = Math.pow(1 + r, months);
  return (principal * r * f) / (f - 1);
}

export interface ScheduleRow {
  n: number;
  date: string; // YYYY-MM-DD
  emi: number;
  principal: number;
  interest: number;
  balance: number;
}

/** Per-month amortisation schedule starting from the disbursement date. */
export function emiSchedule(
  principal: number,
  interestRate: number,
  rateType: RateType,
  months: number,
  startDate: string
): ScheduleRow[] {
  const emi = calcEmi(principal, interestRate, rateType, months);
  if (months <= 0 || emi <= 0) return [];
  const rows: ScheduleRow[] = [];
  let balance = principal;
  const r = monthlyRate(interestRate, rateType);
  const flatInterestPerMonth =
    rateType === 'flat' ? (principal * interestRate * months) / 1200 / months : 0;

  for (let i = 1; i <= months; i++) {
    const interest =
      rateType === 'flat' ? flatInterestPerMonth : balance * r;
    let principalPart = emi - interest;
    if (i === months || principalPart > balance) principalPart = balance;
    const actualEmi = principalPart + interest;
    balance = Math.max(0, balance - principalPart);
    rows.push({
      n: i,
      date: addMonthsISO(startDate, i),
      emi: round2(actualEmi),
      principal: round2(principalPart),
      interest: round2(interest),
      balance: round2(balance),
    });
  }
  return rows;
}

/** Total expected interest over the life of the loan. */
export function totalExpectedInterest(
  principal: number,
  interestRate: number,
  rateType: RateType,
  months: number,
  emiAmount?: number | null
): number {
  if (months <= 0 || principal <= 0) return 0;
  if (rateType === 'flat') return (principal * interestRate * months) / 1200;
  const emi = emiAmount && emiAmount > 0 ? emiAmount : calcEmi(principal, interestRate, rateType, months);
  return Math.max(0, emi * months - principal);
}

function round2(x: number): number {
  return Math.round((x + Number.EPSILON) * 100) / 100;
}
