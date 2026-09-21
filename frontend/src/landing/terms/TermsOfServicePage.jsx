import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  AlertTriangle,
  Scale,
  ShieldCheck,
  Ban,
  Coins,
  Cpu,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TermsOfServicePage() {
  useEffect(() => {
    document.title = "Tradely — Terms of Service";
  }, []);

  const terms = [
    {
      title: "1. Educational Paper Trading Disclaimer",
      icon: AlertTriangle,
      badgeColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      content: (
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
          Tradely is strictly an educational software project built to model
          modern trading terminal architecture, order management mechanics, and
          real-time market streams.{" "}
          <strong>
            Tradely is not a registered stockbroker, SEBI intermediary,
            investment advisor, or regulated securities exchange.
          </strong>{" "}
          All market prices, order fills, valuations, and portfolio balances are
          entirely virtual and carry zero real-world financial value.
        </p>
      ),
    },
    {
      title: "2. Account Eligibility & Access",
      icon: ShieldCheck,
      badgeColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      content: (
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
          You must create an account to access the trading terminal. You are
          responsible for maintaining the confidentiality of your authentication
          credentials and for all trading actions occurring under your account.
          Tradely reserves the right to suspend or delete accounts that engage
          in malicious exploitation.
        </p>
      ),
    },
    {
      title: "3. Paper Trading Capital & Execution Mechanics",
      icon: Coins,
      badgeColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      content: (
        <div className="space-y-2 text-slate-300 text-xs sm:text-sm leading-relaxed">
          <p>
            Accounts start with an illustrative allocation of ₹100,000 in
            virtual capital. Virtual funds cannot be withdrawn, redeemed, or
            transferred to real-world monetary systems.
          </p>
          <p>
            Order fills occur using algorithmic matching against live price
            ticks. Historical or forward-looking performance on Tradely does not
            guarantee or indicate comparable outcomes when trading real equities
            on regulated exchanges.
          </p>
        </div>
      ),
    },
    {
      title: "4. Acceptable Use & System Integrity",
      icon: Ban,
      badgeColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      content: (
        <div className="space-y-2 text-slate-300 text-xs sm:text-sm leading-relaxed">
          <p>Users agree not to:</p>
          <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
            <li>
              Launch automated Denial of Service (DoS) attacks or flood
              WebSocket channels.
            </li>
            <li>
              Bypass server-side sliding-window rate limiters or order
              reservation checks.
            </li>
            <li>
              Inject malicious scripts, exploit vulnerabilities, or compromise
              database transactions.
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: "5. Intellectual Property & Open Source",
      icon: Cpu,
      badgeColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      content: (
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
          Tradely is engineered by Avishek Amin. The source code, architectural
          documentation, and design assets are licensed under standard
          open-source terms. You are free to inspect, study, and fork the
          repository for educational and software engineering exploration.
        </p>
      ),
    },
    {
      title: "6. Limitation of Liability",
      icon: Scale,
      badgeColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
      content: (
        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
          Tradely, its creator, and contributors shall not be held liable for
          any real-world financial losses, damages, or missed trading
          opportunities resulting from the use of, or reliance upon, trading
          models, analytics, or educational content provided on this platform.
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
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Last Updated: September 2026. Please review the terms governing
            access to and usage of Tradely's educational paper trading terminal.
          </p>
        </div>

        <div className="space-y-6">
          {terms.map((term) => {
            const Icon = term.icon;
            return (
              <div
                key={term.title}
                className="rounded-2xl border border-white/[0.08] bg-[#141414] p-6 sm:p-7 space-y-4 hover:border-white/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`size-8 rounded-lg border flex items-center justify-center ${term.badgeColor} shrink-0`}
                  >
                    <Icon className="size-4" />
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    {term.title}
                  </h2>
                </div>
                {term.content}
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#141414] p-6 text-center space-y-2">
          <p className="text-xs sm:text-sm text-slate-400">
            For questions or legal inquiries regarding these terms, please
            contact{" "}
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
