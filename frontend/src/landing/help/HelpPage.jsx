import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  BookOpen,
  Zap,
  ShieldCheck,
  Cpu,
  HelpCircle,
  ArrowRight,
  Sliders,
  DollarSign,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function HelpPage() {
  useEffect(() => {
    document.title = "Tradely — Help Center & Documentation";
  }, []);

  const [searchQuery, setSearchQuery] = useState("");

  const helpTopics = [
    {
      category: "Getting Started",
      icon: Zap,
      accent: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      items: [
        {
          title: "Virtual Capital Allocation",
          desc: "Every newly registered account automatically receives ₹100,000 in virtual trading capital to practice strategy execution with zero financial risk.",
        },
        {
          title: "Watchlist Management",
          desc: "Search blue-chip equities from the NSE universe (e.g. RELIANCE, TCS, INFY) and pin them to your live terminal sidebar to monitor real-time ticks.",
        },
        {
          title: "Resetting Portfolio Balance",
          desc: "If your virtual capital runs out, you can trigger a full educational reset directly from the terminal Funds page.",
        },
      ],
    },
    {
      category: "Order Types & Risk Engine",
      icon: Sliders,
      accent: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
      items: [
        {
          title: "Market vs Limit Orders",
          desc: "Market orders execute immediately against the latest market tick, while Limit orders rest on the order book until market price hits your threshold.",
        },
        {
          title: "OCO (One-Cancels-the-Other) Brackets",
          desc: "Link a Take-Profit limit order leg and a Stop-Loss trigger leg together. When one leg executes, the competing leg is atomically cancelled.",
        },
        {
          title: "Ratcheting Trailing Stops",
          desc: "Set a dynamic trailing buffer that ratchets upward as stock prices advance, locking in gains while protecting downside risk.",
        },
      ],
    },
    {
      category: "Portfolio & Ledger Architecture",
      icon: DollarSign,
      accent: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      items: [
        {
          title: "Atomic Capital Reservations",
          desc: "Pending limit and stop buy orders reserve the required cash balance upfront. You can never accidentally double-spend open virtual funds.",
        },
        {
          title: "Realized vs Unrealized P&L",
          desc: "Unrealized P&L recalculates dynamically against live tick prices. Realized profit and loss is finalized only upon squaring off open positions.",
        },
        {
          title: "Asset Allocation Doughnut Charts",
          desc: "Visualize your total portfolio exposure across equities to maintain disciplined sector weighting and avoid concentration risk.",
        },
      ],
    },
    {
      category: "Market Engine & Streaming",
      icon: Cpu,
      accent: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      items: [
        {
          title: "Real-Time WebSocket Stream",
          desc: "Market prices update at regular ~1.5 second intervals via Socket.IO, pushing live bid/ask fluctuations directly into active terminal sessions.",
        },
        {
          title: "Server-Authoritative Matching",
          desc: "Order verification, balance deductions, and share settlements happen exclusively on the server engine to prevent forged executions.",
        },
        {
          title: "ACID Transaction Guarantees",
          desc: "Order execution, share allocations, and reservation releases are executed within multi-document MongoDB transactions for zero state corruption.",
        },
      ],
    },
  ];

  const filteredTopics = helpTopics.map((group) => ({
    ...group,
    items: group.items.filter(
      (item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col justify-between pt-4 pb-20">
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Back Link */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white bg-[#141414] border border-white/10 hover:bg-[#1C1C1C] rounded-full px-4 py-2 transition-all"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to home</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="text-center space-y-4 py-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            How can we help your strategy?
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Explore comprehensive guides and documentation for Tradely's market engine, advanced bracket orders, and portfolio tracking.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto pt-2">
            <Search className="size-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guides e.g. OCO orders, reservations, virtual funds..."
              className="pl-11 h-12 rounded-full border-white/10 bg-[#141414] text-sm text-white placeholder:text-slate-500 shadow-xl"
            />
          </div>
        </div>

        {/* Topics Grid */}
        <div className="space-y-10">
          {filteredTopics.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.category} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`size-8 rounded-lg border flex items-center justify-center ${group.accent}`}>
                    <Icon className="size-4" />
                  </div>
                  <h2 className="text-lg font-bold text-white tracking-wide">
                    {group.category}
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {group.items.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-white/[0.08] bg-[#141414] p-5 sm:p-6 space-y-2 hover:border-white/20 transition-all flex flex-col justify-between"
                    >
                      <h3 className="text-sm font-bold text-white">
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Support & Contact Action Strip */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#181818] to-[#101010] p-8 sm:p-10 text-center space-y-4 shadow-2xl shadow-black/80">
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            Still have questions or need support?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            Visit our FAQs, contact our team directly, or report platform bugs to help improve Tradely for the community.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button asChild className="rounded-full bg-gradient-to-r from-[#00D8F6] to-[#7B61FF] text-black font-bold px-6 h-10 text-xs sm:text-sm hover:brightness-110 transition-all">
              <Link to="/support">View Support & FAQs</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full border-white/15 bg-white/5 hover:bg-white/10 text-white font-medium px-6 h-10 text-xs sm:text-sm">
              <Link to="/contact">Contact Team</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
