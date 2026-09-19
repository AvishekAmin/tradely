import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

export default function RiskManagementSection() {
  const [selectedOrder, setSelectedOrder] = useState("LIMIT");

  useEffect(() => {
    const handleHashCheck = () => {
      if (
        window.location.hash === "#order-management" ||
        window.location.hash === "#risk-management"
      ) {
        setSelectedOrder("LIMIT");
      }
    };

    window.addEventListener("hashchange", handleHashCheck);
    return () => window.removeEventListener("hashchange", handleHashCheck);
  }, []);

  const orderTypes = {
    LIMIT: {
      title: "Limit Order",
      tag: "TARGET PRICING",
      trigger: "Market price reaches or exceeds your specified limit price.",
      reservation: "Full cash or share quantity locked until fill or cancellation.",
      diagram: [
        { label: "Target Set", detail: "e.g. Buy @ ₹2,800.00 (Current: ₹2,940)" },
        { label: "Pending Trigger", detail: "Market fluctuates above limit" },
        { label: "Fill Guarantee", detail: "Executes only @ ₹2,800 or better" },
      ],
    },
    STOP_MARKET: {
      title: "Stop-Market Order",
      tag: "DOWNSIDE PROTECTION",
      trigger: "Market price drops below specified stop trigger price.",
      reservation: "Exact shares reserved in portfolio ledger.",
      diagram: [
        { label: "Stop Trigger", detail: "Set Stop @ ₹2,750.00" },
        { label: "Market Drop", detail: "Live tick touches ₹2,749.50" },
        { label: "Immediate Market Order", detail: "Executed instantly at next available tick" },
      ],
    },
    STOP_LIMIT: {
      title: "Stop-Limit Order",
      tag: "CONTROLLED FLOORS",
      trigger: "Triggers a Limit Order when stop price is touched, respecting limit price as floor.",
      reservation: "Reserved at initiation. Prevents catastrophic gap-down fills.",
      diagram: [
        { label: "Stop Trigger", detail: "e.g. Trigger @ ₹2,750.00" },
        { label: "Limit Floor", detail: "Floor Limit @ ₹2,740.00" },
        { label: "Controlled Execution", detail: "Fills between ₹2,740 and ₹2,750 only" },
      ],
    },
    TRAILING_STOP: {
      title: "Trailing Stop Order",
      tag: "PROFIT HARVESTING",
      trigger: "Stop trigger automatically ratchets upward as market makes new highs.",
      reservation: "Initial stop set below market; trails by fixed % or ₹ distance.",
      diagram: [
        { label: "Ratcheting High", detail: "Stock climbs from ₹2,900 to ₹3,100" },
        { label: "Stop Follows", detail: "Stop automatically rises with high" },
        { label: "Drop Trigger", detail: "Market reverses by trail distance -> Exit triggered" },
      ],
    },
    OCO: {
      title: "OCO (One-Cancels-the-Other) Bracket",
      tag: "DUAL LEG STRATEGY",
      trigger: "Take-Profit Limit leg OR Stop-Loss leg triggers. The winner executes, loser cancels instantly.",
      reservation: "CRITICAL: Single shared reservation. Does NOT double-reserve your position.",
      diagram: [
        { label: "Take-Profit Leg", detail: "Upper Limit @ ₹3,200.00" },
        { label: "Shared Reservation", detail: "Same 10 shares back both outcomes" },
        { label: "Stop-Loss Leg", detail: "Lower Stop @ ₹2,800.00" },
      ],
    },
  };

  const current = orderTypes[selectedOrder];

  return (
    <section id="order-management" className="pt-8 pb-16 lg:pt-10 lg:pb-24 border-t border-white/[0.08] bg-[#0A0A0A] scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Control your downside. Automate your strategy.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Tradely supports advanced order types engineered with server-authoritative matching and atomic reservation locks.
          </p>
        </div>

        {/* Order Type Selector Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-[#141414] border border-white/10 max-w-2xl mx-auto">
          {Object.keys(orderTypes).map((key) => {
            const isSelected = selectedOrder === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedOrder(key)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  isSelected
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {key.replace("_", "-")}
              </button>
            );
          })}
        </div>

        {/* Interactive Order Breakdown Card */}
        <div className="rounded-3xl border border-white/10 bg-[#141414] p-6 sm:p-10 shadow-2xl shadow-black/80">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left: Explanation */}
            <div className="lg:col-span-6 space-y-5">
              <div className="flex items-center gap-3">
                <Badge variant="blue" className="font-mono">
                  {current.tag}
                </Badge>
                <h3 className="text-2xl font-bold text-white">{current.title}</h3>
              </div>

              <div className="space-y-4">
                <div className="rounded-xl border border-white/[0.08] bg-[#1A1A1A] p-4 space-y-1">
                  <div className="text-xs font-mono font-semibold text-slate-400 uppercase">
                    Execution Condition
                  </div>
                  <p className="text-sm text-slate-200">{current.trigger}</p>
                </div>

                <div className="rounded-xl border border-white/[0.08] bg-[#1A1A1A] p-4 space-y-1">
                  <div className="text-xs font-mono font-semibold text-amber-400 uppercase">
                    Reservation Guarantee
                  </div>
                  <p className="text-sm text-slate-200">{current.reservation}</p>
                </div>
              </div>
            </div>

            {/* Right: Visual Execution Flow Diagram */}
            <div className="lg:col-span-6 rounded-2xl border border-white/10 bg-[#0F0F0F] p-6 space-y-4">
              <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-white/10">
                LIFECYCLE FLOW: {selectedOrder}
              </div>

              <div className="space-y-3">
                {current.diagram.map((step, idx) => (
                  <div
                    key={step.label}
                    className="flex items-start gap-3 p-3 rounded-xl bg-[#171717] border border-white/[0.05]"
                  >
                    <div className="size-6 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{step.label}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{step.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
