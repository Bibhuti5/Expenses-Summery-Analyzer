export type BankName = 'Axis Bank' | 'HDFC Bank' | 'SBI' | 'PhonePe' | 'Other';

export type TransactionType = 'debit' | 'credit';

export interface Transaction {
  id: string;
  date: string; // ISO date string
  amount: number;
  type: TransactionType;
  bank: BankName;
  description: string;
  reference?: string;
  emailSubject?: string;
  category?: string;
}

export interface BankSummary {
  bank: BankName;
  totalDebit: number;
  totalCredit: number;
  count: number;
  color: string;
}

export interface DailySummary {
  date: string; // YYYY-MM-DD
  debit: number;
  credit: number;
  count: number;
}

export interface MonthlySummary {
  month: string; // YYYY-MM
  label: string; // "Jan 2025"
  debit: number;
  credit: number;
  count: number;
}

export interface YearlySummary {
  year: string;
  debit: number;
  credit: number;
  count: number;
}

export type ViewMode = 'daily' | 'monthly' | 'yearly';

export interface GmailAccount {
  email: string;
  name: string;
  picture?: string;
  accessToken?: string;
}
