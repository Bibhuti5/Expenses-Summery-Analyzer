'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If already "logged in" via demo, redirect
    const saved = sessionStorage.getItem('finance_user');
    if (saved) router.replace('/finance/dashboard');
  }, [router]);

  async function handleGoogleLogin() {
    setLoading(true);
    try {
      const res = await fetch('/api/finance/auth');
      const data = await res.json();

      if (data.demo) {
        sessionStorage.setItem('finance_user', JSON.stringify(data.user));
        router.push('/finance/dashboard');
      } else if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg mb-4">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="10" fill="#1a56db" />
              <path d="M8 12h20M8 18h12M8 24h16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="27" cy="24" r="5" fill="#f59e0b" stroke="white" strokeWidth="1.5"/>
              <path d="M25.5 24h3M27 22.5v3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Finance Tracker</h1>
          <p className="text-gray-500 mt-2">Connect Gmail to track bank transactions</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              Authentication failed. Please try again.
            </div>
          )}

          {/* Features */}
          <div className="space-y-3 mb-8">
            {[
              { icon: '🏦', text: 'Axis Bank, HDFC, SBI & PhonePe UPI' },
              { icon: '📊', text: 'Daily, Monthly & Yearly analytics' },
              { icon: '💸', text: 'All amounts shown in Indian Rupees (₹)' },
              { icon: '🖨️', text: 'Export & Print to PDF' },
            ].map((f) => (
              <div key={f.text} className="flex items-center gap-3 text-sm text-gray-600">
                <span className="text-lg">{f.icon}</span>
                <span>{f.text}</span>
              </div>
            ))}
          </div>

          {/* Google Login Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-blue-300 transition-all font-medium text-gray-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
          </button>

          <p className="text-center text-xs text-gray-400 mt-4">
            We only read transaction emails. No data is stored on servers.
          </p>
        </div>

        {/* Privacy note */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Gmail read-only access · No emails stored · Runs in your browser
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20">
      <path d="M19.6 10.23c0-.68-.06-1.36-.17-2H10v3.79h5.38a4.6 4.6 0 0 1-2 3.02v2.52h3.22c1.88-1.73 2.96-4.28 2.96-7.33z" fill="#4285F4"/>
      <path d="M10 20c2.7 0 4.96-.9 6.62-2.44l-3.22-2.5c-.9.6-2.04.96-3.4.96-2.6 0-4.8-1.76-5.6-4.12H1.07v2.6A9.99 9.99 0 0 0 10 20z" fill="#34A853"/>
      <path d="M4.4 11.9A6 6 0 0 1 4.08 10c0-.66.11-1.3.32-1.9V5.5H1.07A10 10 0 0 0 0 10c0 1.6.38 3.12 1.07 4.5l3.33-2.6z" fill="#FBBC05"/>
      <path d="M10 3.98c1.47 0 2.8.51 3.84 1.5l2.87-2.87A9.97 9.97 0 0 0 10 0 9.99 9.99 0 0 0 1.07 5.5L4.4 8.1C5.2 5.74 7.4 3.98 10 3.98z" fill="#EA4335"/>
    </svg>
  );
}

export default function FinancePage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
