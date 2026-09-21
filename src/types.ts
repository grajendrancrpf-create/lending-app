export type RateType = 'monthly' | 'annual' | 'flat';
export type LoanType =
  | 'personal'
  | 'business'
  | 'gold'
  | 'vehicle'
  | 'microfinance'
  | 'other';
export type EntryType =
  | 'disbursement'
  | 'principal_payment'
  | 'interest_payment'
  | 'charge'
  | 'adjustment';

export interface Profile {
  id: string;
  full_name: string | null;
  created_at: string;
}

export interface Loan {
  id: string;
  user_id: string;
  client_name: string;
  phone: string | null;
  pan: string | null;
  loan_type: LoanType;
  principal: number;
  interest_rate: number;
  rate_type: RateType;
  disbursement_date: string;
  tenure_months: number;
  emi_amount: number | null;
  status: 'active' | 'closed';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface LedgerEntry {
  id: string;
  user_id: string;
  loan_id: string;
  entry_type: EntryType;
  amount: number;
  entry_date: string;
  note: string | null;
  created_at: string;
}

export const LOAN_TYPE_LABELS: Record<LoanType, string> = {
  personal: 'Personal',
  business: 'Business',
  gold: 'Gold',
  vehicle: 'Vehicle',
  microfinance: 'Microfinance',
  other: 'Other',
};

export const RATE_TYPE_LABELS: Record<RateType, string> = {
  monthly: 'Monthly %',
  annual: 'Annual %',
  flat: 'Flat %',
};

export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  disbursement: 'Disbursement',
  principal_payment: 'Principal payment',
  interest_payment: 'Interest payment',
  charge: 'Charge',
  adjustment: 'Adjustment',
};
