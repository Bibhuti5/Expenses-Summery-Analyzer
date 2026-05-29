import type {
  Transaction, BankName, BankSummary, DailySummary, MonthlySummary, YearlySummary,
} from './types';

export const BANK_COLORS: Record<BankName, string> = {
  'Axis Bank': '#97144d',
  'HDFC Bank': '#004C8F',
  'SBI': '#22409A',
  'PhonePe': '#5f259f',
  'Other': '#6b7280',
};

export const BANK_BG: Record<BankName, string> = {
  'Axis Bank': '#fdf2f7',
  'HDFC Bank': '#eff6ff',
  'SBI': '#eff3ff',
  'PhonePe': '#f5f0ff',
  'Other': '#f9fafb',
};

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getBankSummaries(transactions: Transaction[]): BankSummary[] {
  const banks: BankName[] = ['Axis Bank', 'HDFC Bank', 'SBI', 'PhonePe'];
  return banks.map((bank) => {
    const bankTx = transactions.filter((t) => t.bank === bank);
    return {
      bank,
      totalDebit: bankTx.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0),
      totalCredit: bankTx.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0),
      count: bankTx.length,
      color: BANK_COLORS[bank],
    };
  });
}

export function getDailySummaries(transactions: Transaction[]): DailySummary[] {
  const map = new Map<string, DailySummary>();
  for (const t of transactions) {
    const key = t.date;
    if (!map.has(key)) map.set(key, { date: key, debit: 0, credit: 0, count: 0 });
    const s = map.get(key)!;
    if (t.type === 'debit') s.debit += t.amount; else s.credit += t.amount;
    s.count++;
  }
  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function getMonthlySummaries(transactions: Transaction[]): MonthlySummary[] {
  const map = new Map<string, MonthlySummary>();
  for (const t of transactions) {
    const key = t.date.slice(0, 7);
    const [yr, mo] = key.split('-');
    if (!map.has(key)) {
      map.set(key, {
        month: key,
        label: `${MONTH_LABELS[parseInt(mo) - 1]} ${yr}`,
        debit: 0, credit: 0, count: 0,
      });
    }
    const s = map.get(key)!;
    if (t.type === 'debit') s.debit += t.amount; else s.credit += t.amount;
    s.count++;
  }
  return Array.from(map.values()).sort((a, b) => b.month.localeCompare(a.month));
}

export function getYearlySummaries(transactions: Transaction[]): YearlySummary[] {
  const map = new Map<string, YearlySummary>();
  for (const t of transactions) {
    const key = t.date.slice(0, 4);
    if (!map.has(key)) map.set(key, { year: key, debit: 0, credit: 0, count: 0 });
    const s = map.get(key)!;
    if (t.type === 'debit') s.debit += t.amount; else s.credit += t.amount;
    s.count++;
  }
  return Array.from(map.values()).sort((a, b) => b.year.localeCompare(a.year));
}

export function filterByDateRange(
  transactions: Transaction[],
  from?: string,
  to?: string,
): Transaction[] {
  return transactions.filter((t) => {
    if (from && t.date < from) return false;
    if (to && t.date > to) return false;
    return true;
  });
}
