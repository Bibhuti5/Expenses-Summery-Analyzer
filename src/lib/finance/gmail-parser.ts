import type { Transaction, BankName } from './types';

interface ParsedTransaction {
  amount: number;
  type: 'debit' | 'credit';
  bank: BankName;
  description: string;
  date: string;
  reference?: string;
}

const BANK_PATTERNS: Record<BankName, RegExp[]> = {
  'Axis Bank': [
    /axis\s*bank/i, /axisbank/i,
  ],
  'HDFC Bank': [
    /hdfc\s*bank/i, /hdfcbank/i,
  ],
  'SBI': [
    /state\s*bank/i, /sbi/i, /yono/i,
  ],
  'PhonePe': [
    /phonepe/i, /phone\s*pe/i,
  ],
  'Other': [],
};

const AMOUNT_PATTERNS = [
  /(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
  /([\d,]+(?:\.\d{1,2})?)\s*(?:rs\.?|inr|₹)/i,
  /amount[:\s]+(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
];

const DEBIT_KEYWORDS = [
  /debited/i, /debit/i, /withdrawn/i, /paid/i, /payment/i,
  /spent/i, /charged/i, /purchase/i,
];

const CREDIT_KEYWORDS = [
  /credited/i, /credit/i, /received/i, /deposited/i,
  /cashback/i, /refund/i, /salary/i,
];

const DATE_PATTERNS = [
  /(\d{2}[\/\-]\d{2}[\/\-]\d{4})/,
  /(\d{4}[\/\-]\d{2}[\/\-]\d{2})/,
  /(\d{2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})/i,
];

function detectBank(text: string): BankName {
  for (const [bank, patterns] of Object.entries(BANK_PATTERNS) as [BankName, RegExp[]][]) {
    if (bank === 'Other') continue;
    if (patterns.some((p) => p.test(text))) return bank;
  }
  return 'Other';
}

function extractAmount(text: string): number | null {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const cleaned = match[1].replace(/,/g, '');
      const amount = parseFloat(cleaned);
      if (!isNaN(amount) && amount > 0) return amount;
    }
  }
  return null;
}

function detectType(text: string): 'debit' | 'credit' {
  const creditScore = CREDIT_KEYWORDS.filter((p) => p.test(text)).length;
  const debitScore = DEBIT_KEYWORDS.filter((p) => p.test(text)).length;
  return creditScore > debitScore ? 'credit' : 'debit';
}

function extractDate(text: string): string {
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const raw = match[1];
      const parts = raw.split(/[\/\-\s]/);
      if (parts.length === 3) {
        const [a, b, c] = parts;
        if (c.length === 4) return `${c}-${a.padStart(2, '0')}-${b.padStart(2, '0')}`;
        if (a.length === 4) return `${a}-${b.padStart(2, '0')}-${c.padStart(2, '0')}`;
      }
    }
  }
  return new Date().toISOString().slice(0, 10);
}

let counter = 1000;

export function parseEmailToTransaction(
  subject: string,
  body: string,
): ParsedTransaction | null {
  const text = `${subject} ${body}`;
  const bank = detectBank(text);
  const amount = extractAmount(text);
  if (!amount) return null;

  return {
    id: String(counter++),
    amount,
    type: detectType(text),
    bank,
    description: subject.slice(0, 80),
    date: extractDate(text),
    reference: text.match(/ref[:\s#]*([\w\d]+)/i)?.[1],
  } as ParsedTransaction & { id: string };
}

export function buildGmailQuery(): string {
  return [
    'from:(alerts@axisbank.com OR alerts@hdfcbank.com OR sbialerts@sbi.co.in OR no-reply@phonepe.com)',
    'subject:(transaction OR debit OR credit OR payment OR transfer)',
    'newer_than:1y',
  ].join(' ');
}
