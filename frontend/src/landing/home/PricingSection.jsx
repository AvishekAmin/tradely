import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Coins, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function PricingSection() {
  const tiers = [
    {
      title: "Account Creation",
      price: "₹0",
      desc: "Instant access with zero credit card or deposit requirement.",
      features: [
        "₹100,000 instant virtual capital allocation",
        "Full access to NSE equity universe",
        "Persistent user watchlist management",
        "Real-time ~1.5s market streaming",
      ],
      buttonText: "Create Free Account",
      popular: false,
    },
    {
      title: "Advanced Orders",
      price: "₹0",
      popular: true,
      desc: "Practice with advanced order types without hidden execution fees.",
      features: [
        "MARKET, LIMIT, & STOP-MARKET orders",
        "STOP-LIMIT floor protection",
        "Ratcheting TRAILING STOP orders",
        "Atomic OCO bracket orders with shared reservation",
      ],
      buttonText: "Start Trading Free",
    },
    {
      title: "Analytics & Tools",
      price: "₹0",
      desc: "Comprehensive portfolio tracking and execution audit history.",
      features: [
        "Live portfolio valuation against server ticks",
        "Realized P&L tracking strictly on closed sells",
        "Interactive asset allocation doughnut charts",
        "Complete order history with status audit badges",
      ],
      buttonText: "Explore Analytics",
      popular: false,
    },
  ];

  return (
    <section
      id="pricing"
      className="pt-8 pb-16 lg:pt-10 lg:pb-24 border-t border-white/[0.08] bg-[#0A0A0A] relative scroll-mt-16"
    >
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[550px] h-[350px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Zero Fees. Unlimited Strategy Testing.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Tradely is completely free to use. We provide open, barrier-free
            access to realistic financial market mechanics so you can master
            order types and portfolio risk without financial exposure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.title}
              className={`rounded-3xl border p-6 sm:p-8 space-y-6 flex flex-col justify-between transition-all ${
                tier.popular
                  ? "border-blue-500/40 bg-gradient-to-b from-[#181818] to-[#111111] shadow-2xl shadow-blue-500/10 relative"
                  : "border-white/10 bg-[#141414] hover:border-white/20"
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">{tier.title}</h3>
                </div>

                <div>
                  <div className="text-4xl sm:text-5xl font-extrabold font-mono text-emerald-400 tabular-nums">
                    {tier.price}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{tier.desc}</p>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-white/10">
                  {tier.features.map((feat) => (
                    <div
                      key={feat}
                      className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300"
                    >
                      <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <Button
                  asChild
                  className={`w-full rounded-full h-11 text-xs sm:text-sm font-bold transition-all ${
                    tier.popular
                      ? "bg-gradient-to-r from-[#00D8F6] to-[#7B61FF] text-black shadow-lg shadow-cyan-500/25 hover:brightness-110 active:scale-[0.98]"
                      : "border border-white/10 bg-[#1E1E1E] text-white hover:bg-white/10"
                  }`}
                >
                  <Link
                    to="/signup"
                    className="flex items-center justify-center gap-1.5"
                  >
                    <span>{tier.buttonText}</span>
                    <ArrowRight className="size-3.5 text-current stroke-[2.5]" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
