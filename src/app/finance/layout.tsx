import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Finance Tracker — Gmail Bank Transactions',
  description: 'Track your bank transactions from Gmail',
};

export default function FinanceLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
