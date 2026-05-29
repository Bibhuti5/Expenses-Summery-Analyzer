import { NextRequest, NextResponse } from 'next/server';
import { buildGmailQuery } from '@/lib/finance/gmail-parser';

// In production: exchange accessToken to call Gmail API
// GET /api/finance/sync — returns sync status + count
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { accessToken } = body as { accessToken?: string };

  if (!accessToken) {
    return NextResponse.json(
      { error: 'No access token. Please connect your Gmail account.' },
      { status: 401 },
    );
  }

  // Real implementation would call:
  // https://gmail.googleapis.com/gmail/v1/users/me/messages?q=<buildGmailQuery()>
  // then fetch each message and parse with parseEmailToTransaction()
  const query = buildGmailQuery();

  // Simulate a sync with delay
  await new Promise((r) => setTimeout(r, 1200));

  return NextResponse.json({
    success: true,
    synced: 147,
    query,
    message: 'Sync complete. Found 147 transaction emails.',
  });
}

export async function GET() {
  return NextResponse.json({
    lastSync: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: 'connected',
    emailsScanned: 423,
    transactionsParsed: 147,
  });
}
