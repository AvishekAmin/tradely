import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  HelpCircle,
  Activity,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SupportPage() {
  useEffect(() => {
    document.title = "Tradely — Support & Knowledge Base";
  }, []);

  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      q: "Is Tradely a real broker or licensed exchange?",
      a: "No. Tradely is a paper trading platform built for education, software architecture demonstrations, and strategy testing. No real money, deposits, or regulated brokerage transactions occur.",
    },
    {
      q: "How fast is the market stream updated?",
      a: "Our market engine pushes live price ticks to connected clients every approximately 1.5 seconds via Socket.IO WebSockets. This provides realistic price motion without overwhelming the client.",
    },
    {
      q: "How does the OCO (One-Cancels-the-Other) order work?",
      a: "An OCO group links a Take-Profit limit leg and a Stop-Loss leg under a single shared reservation. When market conditions trigger one leg, it atomically claims the OCO group and cancels the competing leg immediately.",
    },
    {
      q: "Are cash and share reservations enforced?",
      a: "Yes. Every open LIMIT, STOP, or OCO order reserves the required capital or share quantity in your portfolio ledger. You cannot double-spend shares across conflicting pending orders.",
    },
    {
      q: "Can I reset my trading account balance?",
      a: "Yes. Accounts start with ₹100,000 in virtual capital. If your balance runs low, you can trigger an educational funds reset directly from the terminal Funds page.",
    },
    {
      q: "Where can I report bugs or review the source code?",
      a: "Tradely is completely open-source. You can file issues, review backend architectures, or inspect the frontend code directly on our GitHub repository.",
      link: "https://github.com/AvishekAmin/tradely",
    },
  ];

  const filteredFaqs = faqs.filter(
    (item) =>
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.a.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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

        {/* Hero & Search Header */}
        <div className="text-center space-y-6 py-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            How can we help your strategy?
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Search our knowledge base for answers on order mechanics,
            portfolio analytics, and platform architecture.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto">
            <Search className="size-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search e.g. OCO, reservation, market tick rate..."
              className="pl-11 h-12 rounded-full border-white/10 bg-[#141414] text-sm text-white placeholder:text-slate-500 shadow-xl"
            />
          </div>
        </div>

        {/* FAQ Cards */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFaqs.map((faq) => (
              <div
                key={faq.q}
                className="rounded-2xl border border-white/[0.08] bg-[#141414] p-5 sm:p-6 space-y-2.5 hover:border-white/20 transition-all"
              >
                <h3 className="text-sm font-bold text-white flex items-start gap-2">
                  <HelpCircle className="size-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>{faq.q}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pl-6">
                  {faq.a}
                </p>
                {faq.link && (
                  <div className="pl-6 pt-1">
                    <a
                      href={faq.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
                    >
                      <span>Visit GitHub Repository</span>
                      <ExternalLink className="size-3" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#181818] to-[#101010] p-8 sm:p-10 text-center space-y-4 shadow-2xl shadow-black/80">
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            Have an issue not covered here?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
            Open an issue or submit a pull request on GitHub to help improve
            Tradely for everyone.
          </p>
          <div className="pt-2">
            <Button
              asChild
              className="rounded-full bg-gradient-to-r from-[#00D8F6] to-[#7B61FF] text-black font-bold px-6 h-11 text-sm hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-cyan-500/25"
            >
              <a
                href="https://github.com/AvishekAmin/tradely"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                <span>Open GitHub Issue</span>
                <ExternalLink className="size-4 text-black stroke-[2.5]" />
              </a>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
