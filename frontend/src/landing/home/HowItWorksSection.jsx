import React from "react";
import { UserCheck, ListPlus, TrendingUp, PieChart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function HowItWorksSection() {
  const steps = [
    {
      num: "01",
      icon: UserCheck,
      title: "Create Free Account",
      desc: "Instant signup with zero payment information. Receive ₹100,000 in virtual capital instantly in your educational account.",
    },
    {
      num: "02",
      icon: ListPlus,
      title: "Curate Watchlist",
      desc: "Search supported Indian market equities. Pin key symbols and track live price movements pushed every ~1.5s.",
    },
    {
      num: "03",
      icon: TrendingUp,
      title: "Execute Strategy",
      desc: "Place MARKET, LIMIT, STOP-MARKET, STOP-LIMIT, TRAILING STOP, or OCO bracket orders with atomic quantity reservations.",
    },
    {
      num: "04",
      icon: PieChart,
      title: "Analyze Portfolio",
      desc: "Review realized gains from closed sales, unrealized gains on open positions, and dynamic asset allocation charts.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="pt-8 pb-16 lg:pt-10 lg:pb-24 relative scroll-mt-16"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            From first login to deep portfolio analysis.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Get started in under two minutes. No complex KYC, no real money at
            risk.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="relative rounded-3xl border border-white/[0.08] bg-[#171717] p-7 space-y-5 hover:border-white/20 transition-all flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-extrabold text-white/20 font-mono group-hover:text-blue-500/40 transition-colors">
                    {step.num}
                  </span>
                  <div className="size-11 rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                    <Icon className="size-5" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="pt-2">
                  <div className="h-1 w-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-40 group-hover:w-full group-hover:opacity-100 transition-all duration-300" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
