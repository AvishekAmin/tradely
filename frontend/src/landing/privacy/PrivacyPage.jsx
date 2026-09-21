import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ShieldCheck,
  Lock,
  EyeOff,
  Database,
  Cookie,
  UserX,
  CheckCircle2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function PrivacyPage() {
  useEffect(() => {
    document.title = "Tradely — Privacy Policy";
  }, []);

  const sections = [
    {
      title: "1. Scope & Educational Nature",
      icon: ShieldCheck,
      content: (
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
          Tradely is a paper trading and portfolio tracking educational
          platform. We do not require, collect, or process real bank account
          numbers, credit/debit card numbers, Aadhaar details, PAN numbers, or
          demat brokerage account credentials. All transactions within Tradely
          use virtual currency with zero monetary value.
        </p>
      ),
    },
    {
      title: "2. Information We Collect",
      icon: Database,
      content: (
        <div className="space-y-3 text-slate-300 text-xs sm:text-sm leading-relaxed">
          <p>
            When you create an account on Tradely, we collect minimal
            information necessary to deliver the trading platform experience:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
            <li>
              <strong>Account Credentials:</strong> Username, email address, and
              cryptographically hashed password (using bcrypt with work factor
              10).
            </li>
            <li>
              <strong>Portfolio Data:</strong> Virtual cash ledger, executed
              order history, open positions, and customized watchlist symbols.
            </li>
            <li>
              <strong>Technical Session Logs:</strong> Standard HTTP request
              metadata including IP address and user-agent string for
              brute-force rate-limiting and security auditing.
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: "3. HttpOnly Cookie Security & Session Management",
      icon: Cookie,
      content: (
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
          Tradely issues JSON Web Tokens (JWT) strictly via secure,{" "}
          <strong>HttpOnly, SameSite</strong> session cookies. Authentication
          tokens are never exposed in browser{" "}
          <code className="text-cyan-400 font-mono">localStorage</code> or{" "}
          <code className="text-cyan-400 font-mono">sessionStorage</code>,
          preventing token theft through Cross-Site Scripting (XSS) vectors.
        </p>
      ),
    },
    {
      title: "4. Strict Data Isolation & Access Controls",
      icon: Lock,
      content: (
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
          Every database query executed by the server matching engine enforces
          authenticated user scoping. Users can never view, mutate, or access
          another user's portfolio, watchlist, pending orders, or transaction
          history. Multi-document MongoDB transactional boundaries safeguard
          ledger integrity.
        </p>
      ),
    },
    {
      title: "5. Zero Third-Party Tracking & Advertising",
      icon: EyeOff,
      content: (
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
          We respect your focus. Tradely does not embed behavioral advertising
          scripts, commercial marketing trackers, or third-party analytical
          cookies. We do not sell, license, rent, or distribute user information
          to any third parties or brokerage services.
        </p>
      ),
    },
    {
      title: "6. Data Retention & Account Reset",
      icon: UserX,
      content: (
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
          You retain full autonomy over your trading account. Users can trigger
          an instant educational portfolio reset directly from the terminal
          Funds page, or contact our support team at{" "}
          <a
            href="mailto:avishekamin207@gmail.com"
            className="text-cyan-400 hover:underline"
          >
            avishekamin207@gmail.com
          </a>{" "}
          to request full account deletion and ledger erasure.
        </p>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col justify-between pt-4 pb-20">
      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white bg-[#141414] border border-white/10 hover:bg-[#1C1C1C] rounded-full px-4 py-2 transition-all"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to home</span>
          </Link>
        </div>

        <div className="text-center space-y-4 py-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Privacy Policy
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Effective Date: September 2026. This policy outlines how Tradely
            collects, protects, and handles trading account data.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#121212] p-6 space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 text-sm font-bold">
            <CheckCircle2 className="size-4" />
            <span>Key Commitment: Privacy-First & Zero Financial Risk</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Tradely is designed exclusively for financial education and paper
            trading. We will never ask for your real banking credentials, demat
            account logins, or real payment details. Your portfolios remain
            strictly private to your authenticated session.
          </p>
        </div>

        <div className="space-y-6">
          {sections.map((sec) => {
            const Icon = sec.icon;
            return (
              <div
                key={sec.title}
                className="rounded-2xl border border-white/[0.08] bg-[#141414] p-6 sm:p-7 space-y-4 hover:border-white/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                    <Icon className="size-4" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    {sec.title}
                  </h2>
                </div>
                {sec.content}
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#141414] p-6 sm:p-7 text-center space-y-2">
          <h3 className="text-sm sm:text-base font-bold text-white">
            Questions regarding our privacy practices?
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            Reach out directly to the Tradely engineering team at{" "}
            <a
              href="mailto:avishekamin207@gmail.com"
              className="text-cyan-400 hover:text-cyan-300 font-medium underline"
            >
              avishekamin207@gmail.com
            </a>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
