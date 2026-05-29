'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Transaction, BankName, ViewMode, GmailAccount } from '@/lib/finance/types';
import type { BankSummary, MonthlySummary } from '@/lib/finance/types';
import {
  formatINR, getBankSummaries, getDailySummaries,
  getMonthlySummaries, getYearlySummaries, BANK_COLORS, BANK_BG,
} from '@/lib/finance/utils';

// ─── helpers ────────────────────────────────────────────────────────────────

function Avatar({ user }: { user: GmailAccount }) {
  if (user.picture) {
    return <img src={user.picture} alt={user.name} className="w-8 h-8 rounded-full" />;
  }
  return (
    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
      {user.name?.[0]?.toUpperCase() ?? 'U'}
    </div>
  );
}

function BankBadge({ bank }: { bank: BankName }) {
  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: BANK_BG[bank], color: BANK_COLORS[bank] }}
    >
      {bank}
    </span>
  );
}

function BarChart({ data }: { data: { label: string; debit: number; credit: number }[] }) {
  const MAX_BARS = 12;
  const shown = data.slice(0, MAX_BARS).reverse();
  const maxVal = Math.max(...shown.flatMap((d) => [d.debit, d.credit]), 1);

  return (
    <div className="flex items-end gap-1.5 h-36 w-full">
      {shown.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-0.5">
          <div className="w-full flex items-end gap-0.5 h-28">
            <div
              className="flex-1 rounded-t bg-red-400 opacity-80 min-h-[2px] transition-all"
              style={{ height: `${(d.debit / maxVal) * 100}%` }}
              title={`Debit: ${formatINR(d.debit)}`}
            />
            <div
              className="flex-1 rounded-t bg-green-500 opacity-80 min-h-[2px] transition-all"
              style={{ height: `${(d.credit / maxVal) * 100}%` }}
              title={`Credit: ${formatINR(d.credit)}`}
            />
          </div>
          <span className="text-[9px] text-gray-400 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function StatCard({
  label, value, sub, accent,
}: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${accent ?? 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── main dashboard ─────────────────────────────────────────────────────────

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<GmailAccount | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [selectedBank, setSelectedBank] = useState<BankName | 'all'>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'debit' | 'credit'>('all');
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  // Restore user from session or URL params
  useEffect(() => {
    let u: GmailAccount | null = null;
    const email = searchParams.get('email');
    if (email) {
      u = {
        email,
        name: searchParams.get('name') ?? email,
        picture: searchParams.get('picture') ?? undefined,
        accessToken: searchParams.get('token') ?? undefined,
      };
      sessionStorage.setItem('finance_user', JSON.stringify(u));
    } else {
      const saved = sessionStorage.getItem('finance_user');
      if (saved) u = JSON.parse(saved);
    }
    if (!u) { router.replace('/finance'); return; }
    setUser(u);
  }, [router, searchParams]);

  // Load transactions
  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedBank !== 'all') params.set('bank', selectedBank);
      if (selectedType !== 'all') params.set('type', selectedType);
      const res = await fetch(`/api/finance/transactions?${params}`);
      const data = await res.json();
      setTransactions(data.transactions ?? []);
    } finally {
      setLoading(false);
    }
  }, [selectedBank, selectedType]);

  useEffect(() => { loadTransactions(); }, [loadTransactions]);

  // Sync
  async function handleSync() {
    setSyncing(true);
    setSyncStatus('Scanning Gmail for transaction emails…');
    try {
      const accessToken = user?.accessToken ?? 'demo';
      const res = await fetch('/api/finance/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });
      const data = await res.json();
      setSyncStatus(data.message ?? 'Sync complete');
      await loadTransactions();
    } catch {
      setSyncStatus('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncStatus(''), 4000);
    }
  }

  function handlePrint() {
    window.print();
  }

  function handleLogout() {
    sessionStorage.removeItem('finance_user');
    router.replace('/finance');
  }

  // Derived data
  const filtered = transactions.filter((t) => {
    if (searchText) {
      const q = searchText.toLowerCase();
      return t.description.toLowerCase().includes(q) || t.bank.toLowerCase().includes(q);
    }
    return true;
  });

  const totalDebit = filtered.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
  const totalCredit = filtered.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const bankSummaries: BankSummary[] = getBankSummaries(filtered);
  const monthlySummaries = getMonthlySummaries(filtered);
  const dailySummaries = getDailySummaries(filtered).slice(0, 30);
  const yearlySummaries = getYearlySummaries(filtered);

  const chartData = viewMode === 'daily'
    ? dailySummaries.slice(0, 14).map((d) => ({ label: d.date.slice(5), debit: d.debit, credit: d.credit }))
    : viewMode === 'monthly'
    ? monthlySummaries.slice(0, 12).map((d) => ({ label: d.label.slice(0, 6), debit: d.debit, credit: d.credit }))
    : yearlySummaries.map((d) => ({ label: d.year, debit: d.debit, credit: d.credit }));

  const tableData = viewMode === 'daily' ? dailySummaries.slice(0, 30)
    : viewMode === 'monthly' ? monthlySummaries
    : yearlySummaries;

  const BANKS: BankName[] = ['Axis Bank', 'HDFC Bank', 'SBI', 'PhonePe'];

  if (!user) return null;

  return (
    <div ref={printRef} className="min-h-screen bg-gray-50">
      {/* ── Navbar ── */}
      <header className="bg-white border-b border-gray-200 print:hidden sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 4h14M2 9h9M2 14h11" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-bold text-gray-900">Finance Tracker</span>
          </div>

          <div className="flex items-center gap-3">
            {syncStatus && (
              <span className="text-xs text-blue-600 bg-blue-50 px-3 py-1 rounded-full animate-pulse">
                {syncStatus}
              </span>
            )}

            {/* Workspace Sync Button */}
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors disabled:opacity-60"
            >
              <svg
                width="15" height="15" viewBox="0 0 15 15" fill="none"
                className={syncing ? 'animate-spin' : ''}
              >
                <path d="M13.5 7.5A6 6 0 1 1 7.5 1.5" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M13.5 1.5v4h-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {syncing ? 'Syncing…' : 'Sync Gmail'}
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-medium text-gray-600 transition-colors"
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <rect x="2" y="5" width="11" height="8" rx="1" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M5 5V2h5v3" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M5 10h5M5 12.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <circle cx="4" cy="8" r="0.75" fill="currentColor"/>
              </svg>
              Print PDF
            </button>

            <div className="flex items-center gap-2">
              <Avatar user={user} />
              <div className="hidden sm:block">
                <p className="text-xs font-medium text-gray-800 leading-tight">{user.name}</p>
                <p className="text-[10px] text-gray-400">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-gray-400 hover:text-gray-600 ml-1"
                title="Logout"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M9 2h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9M6 10l3-3-3-3M9 7H1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ── Print Header (only visible in print) ── */}
        <div className="hidden print:block mb-4">
          <h1 className="text-2xl font-bold">Finance Report — {user.email}</h1>
          <p className="text-sm text-gray-500">Generated {new Date().toLocaleDateString('en-IN', { dateStyle: 'full' })}</p>
        </div>

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Debit" value={formatINR(totalDebit)} accent="text-red-600" sub={`${filtered.filter((t) => t.type === 'debit').length} transactions`} />
          <StatCard label="Total Credit" value={formatINR(totalCredit)} accent="text-green-600" sub={`${filtered.filter((t) => t.type === 'credit').length} transactions`} />
          <StatCard label="Net Balance" value={formatINR(totalCredit - totalDebit)} accent={totalCredit >= totalDebit ? 'text-green-700' : 'text-red-700'} sub="Credit minus Debit" />
          <StatCard label="Transactions" value={String(filtered.length)} sub={`Across ${BANKS.filter((b) => filtered.some((t) => t.bank === b)).length} banks`} />
        </div>

        {/* ── Bank Summaries ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {bankSummaries.map((bs) => (
            <button
              key={bs.bank}
              onClick={() => setSelectedBank(selectedBank === bs.bank ? 'all' : bs.bank)}
              className={`text-left rounded-xl p-4 border transition-all ${
                selectedBank === bs.bank
                  ? 'border-2 shadow-md'
                  : 'border-gray-100 bg-white hover:shadow-sm'
              }`}
              style={{
                borderColor: selectedBank === bs.bank ? bs.color : undefined,
                background: BANK_BG[bs.bank],
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold" style={{ color: bs.color }}>{bs.bank}</span>
                <span className="text-xs text-gray-400">{bs.count} txns</span>
              </div>
              <p className="text-xs text-gray-500">Debit <span className="font-semibold text-red-600">{formatINR(bs.totalDebit)}</span></p>
              <p className="text-xs text-gray-500">Credit <span className="font-semibold text-green-600">{formatINR(bs.totalCredit)}</span></p>
            </button>
          ))}
        </div>

        {/* ── Chart + Filters ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <h2 className="font-semibold text-gray-800">Transaction Trend</h2>
            <div className="flex items-center gap-2">
              {/* View toggle */}
              <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
                {(['daily', 'monthly', 'yearly'] as ViewMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setViewMode(m)}
                    className={`px-3 py-1.5 capitalize transition-colors ${
                      viewMode === m ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                  >{m}</button>
                ))}
              </div>
              {/* Type filter */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as typeof selectedType)}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 bg-white"
              >
                <option value="all">All types</option>
                <option value="debit">Debit only</option>
                <option value="credit">Credit only</option>
              </select>
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-4 mb-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 rounded-sm bg-red-400 opacity-80" /> Debit
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 rounded-sm bg-green-500 opacity-80" /> Credit
            </div>
          </div>

          <BarChart data={chartData} />
        </div>

        {/* ── Period Summary Table ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 capitalize">{viewMode} Summary</h2>
            <span className="text-xs text-gray-400">{tableData.length} periods</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-3">Period</th>
                  <th className="text-right px-4 py-3">Debit</th>
                  <th className="text-right px-4 py-3">Credit</th>
                  <th className="text-right px-4 py-3">Net</th>
                  <th className="text-right px-4 py-3">Txns</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tableData.map((row) => {
                  const label = 'label' in row ? row.label : 'date' in row ? row.date : row.year;
                  const net = row.credit - row.debit;
                  return (
                    <tr key={label} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-700">{label}</td>
                      <td className="px-4 py-3 text-right text-red-600 font-medium">{formatINR(row.debit)}</td>
                      <td className="px-4 py-3 text-right text-green-600 font-medium">{formatINR(row.credit)}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {net >= 0 ? '+' : ''}{formatINR(net)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">{row.count}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Transaction List ── */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex flex-wrap items-center gap-3 justify-between">
            <h2 className="font-semibold text-gray-800">All Transactions</h2>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search transactions…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 w-48 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              {selectedBank !== 'all' && (
                <button
                  onClick={() => setSelectedBank('all')}
                  className="text-xs text-blue-600 border border-blue-200 px-2 py-1 rounded-lg hover:bg-blue-50"
                >
                  Clear filter
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Loading transactions…
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
              {filtered.slice(0, 100).map((t) => (
                <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: BANK_COLORS[t.bank] }}
                  >
                    {t.bank[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{t.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <BankBadge bank={t.bank} />
                      <span className="text-xs text-gray-400">{t.date}</span>
                      {t.reference && <span className="text-[10px] text-gray-300">{t.reference}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${t.type === 'debit' ? 'text-red-600' : 'text-green-600'}`}>
                      {t.type === 'debit' ? '−' : '+'}{formatINR(t.amount)}
                    </p>
                    <p className="text-[10px] text-gray-400 capitalize">{t.type}</p>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="p-10 text-center text-gray-400 text-sm">No transactions found</div>
              )}
              {filtered.length > 100 && (
                <div className="p-3 text-center text-xs text-gray-400">
                  Showing 100 of {filtered.length} transactions
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Print footer ── */}
        <div className="hidden print:block text-xs text-gray-400 text-center pt-4 border-t">
          Finance Tracker · {user.email} · Printed {new Date().toLocaleString('en-IN')}
        </div>
      </div>

      {/* ── Print styles ── */}
      <style>{`
        @media print {
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .max-h-\\[500px\\] { max-height: none !important; overflow: visible !important; }
          header { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}
