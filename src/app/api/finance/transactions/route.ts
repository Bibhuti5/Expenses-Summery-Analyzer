import { NextRequest, NextResponse } from 'next/server';
import { MOCK_TRANSACTIONS } from '@/lib/finance/mock-data';
import { filterByDateRange } from '@/lib/finance/utils';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from') ?? undefined;
  const to = searchParams.get('to') ?? undefined;
  const bank = searchParams.get('bank') ?? undefined;
  const type = searchParams.get('type') ?? undefined;

  let transactions = filterByDateRange(MOCK_TRANSACTIONS, from, to);

  if (bank && bank !== 'all') {
    transactions = transactions.filter((t) => t.bank === bank);
  }
  if (type && type !== 'all') {
    transactions = transactions.filter((t) => t.type === type);
  }

  return NextResponse.json({ transactions });
}
