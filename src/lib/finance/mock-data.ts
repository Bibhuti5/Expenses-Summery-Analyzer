import type { Transaction, BankName } from './types';

const banks: BankName[] = ['Axis Bank', 'HDFC Bank', 'SBI', 'PhonePe'];

const descriptions = {
  'Axis Bank': [
    'NEFT Transfer to Rahul Sharma', 'ATM Withdrawal Axis Bank', 'EMI Deduction Home Loan',
    'Salary Credit - Cognizant', 'UPI Payment - Swiggy', 'Cheque Deposit',
    'Online Shopping - Amazon', 'Credit Card Bill Payment', 'Insurance Premium',
  ],
  'HDFC Bank': [
    'IMPS Transfer to Priya', 'HDFC Credit Card Bill', 'Mutual Fund SIP',
    'Salary Credit', 'Netflix Subscription', 'Electricity Bill BESCOM',
    'UPI - Zomato Order', 'FD Interest Credit', 'Gas Bill Payment',
  ],
  'SBI': [
    'YONO SBI Transfer', 'ATM Cash Withdrawal', 'SBI Life Insurance Premium',
    'Pension Credit', 'PPF Deposit', 'Govt Scheme Credit',
    'Property Tax Payment', 'Water Bill Payment', 'NACH Debit - LIC',
  ],
  'PhonePe': [
    'UPI to @ybl Rohit Kumar', 'Recharge - Airtel 599', 'PhonePe Wallet Load',
    'Movie Tickets - PVR Cinemas', 'Grocery - BigBasket', 'Uber Ride Payment',
    'PhonePe Insurance', 'Gold Purchase', 'Cashback Received',
  ],
};

function randomAmount(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomDate(start: Date, end: Date) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export function generateMockTransactions(): Transaction[] {
  const transactions: Transaction[] = [];
  const now = new Date();
  const start = new Date(now.getFullYear() - 1, now.getMonth(), 1);

  let id = 1;
  for (const bank of banks) {
    const count = 30 + Math.floor(Math.random() * 40);
    const descs = descriptions[bank];
    for (let i = 0; i < count; i++) {
      const date = randomDate(start, now);
      const isCredit = Math.random() < 0.25;
      const amount = isCredit ? randomAmount(500, 80000) : randomAmount(50, 15000);
      const desc = descs[Math.floor(Math.random() * descs.length)];
      transactions.push({
        id: String(id++),
        date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
        amount,
        type: isCredit ? 'credit' : 'debit',
        bank,
        description: desc,
        reference: `REF${String(id).padStart(10, '0')}`,
      });
    }
  }

  return transactions.sort((a, b) => b.date.localeCompare(a.date));
}

export const MOCK_TRANSACTIONS = generateMockTransactions();
