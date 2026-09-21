import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function MarketTickerBar() {
  const tickerItems = [
    {
      sym: "NIFTY 50",
      price: "24,852.15",
      change: "+118.40",
      pct: "+0.48%",
      pos: true,
    },
    {
      sym: "SENSEX",
      price: "81,455.40",
      change: "+382.10",
      pct: "+0.47%",
      pos: true,
    },
    {
      sym: "NIFTY PHARMA",
      price: "26,710.10",
      change: "+130.25",
      pct: "+0.49%",
      pos: true,
    },
    {
      sym: "NIFTY MIDCAP 150",
      price: "22,901.85",
      change: "+334.40",
      pct: "+1.48%",
      pos: true,
    },
    {
      sym: "NIFTY FMCG",
      price: "45,466.80",
      change: "-105.10",
      pct: "-0.23%",
      pos: false,
    },
    {
      sym: "BANK NIFTY",
      price: "51,320.10",
      change: "-145.20",
      pct: "-0.28%",
      pos: false,
    },
    {
      sym: "NIFTY IT",
      price: "36,110.80",
      change: "+280.50",
      pct: "+0.78%",
      pos: true,
    },
    {
      sym: "RELIANCE",
      price: "2,940.50",
      change: "+18.25",
      pct: "+0.62%",
      pos: true,
    },
    {
      sym: "TCS",
      price: "3,845.00",
      change: "+32.10",
      pct: "+0.84%",
      pos: true,
    },
    {
      sym: "INFY",
      price: "1,520.30",
      change: "-8.40",
      pct: "-0.55%",
      pos: false,
    },
    {
      sym: "HDFCBANK",
      price: "1,640.80",
      change: "+12.60",
      pct: "+0.77%",
      pos: true,
    },
    {
      sym: "ICICIBANK",
      price: "1,180.20",
      change: "+9.40",
      pct: "+0.80%",
      pos: true,
    },
    {
      sym: "SBIN",
      price: "782.40",
      change: "-4.20",
      pct: "-0.53%",
      pos: false,
    },
    {
      sym: "TATAMOTORS",
      price: "975.50",
      change: "+14.80",
      pct: "+1.54%",
      pos: true,
    },
    {
      sym: "BHARTIARTL",
      price: "1,425.00",
      change: "+8.20",
      pct: "+0.58%",
      pos: true,
    },
  ];

  return (
    <div
      className="w-full relative overflow-hidden border-y border-white/[0.07] bg-[#0A0A0A]/60 backdrop-blur-md py-2 sm:py-2.5 mt-2.5 sm:mt-3.5 select-none group"
      aria-label="Live Market Ticker"
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0%, black 3%, black 97%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 3%, black 97%, transparent 100%)",
      }}
    >
      <div className="flex w-max">
        <div className="flex shrink-0 items-center gap-7 sm:gap-9 pr-7 sm:pr-9 animate-ticker-marquee">
          {tickerItems.map((item, idx) => (
            <div
              key={`track1-${item.sym}-${idx}`}
              className="flex items-center gap-2.5 text-xs whitespace-nowrap hover:bg-white/[0.04] px-2 py-1 rounded-lg transition-colors cursor-default"
            >
              <span className="font-bold text-slate-300 text-[11px] sm:text-xs tracking-wide">
                {item.sym}
              </span>
              <span className="font-mono font-semibold text-white text-[11px] sm:text-xs tabular-nums">
                ₹{item.price}
              </span>
              <span
                className={`inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-semibold px-1.5 py-0.5 rounded font-mono ${
                  item.pos
                    ? "text-emerald-400 bg-emerald-500/10"
                    : "text-rose-400 bg-rose-500/10"
                }`}
              >
                {item.pos ? (
                  <TrendingUp className="size-3 stroke-[2.5]" />
                ) : (
                  <TrendingDown className="size-3 stroke-[2.5]" />
                )}
                <span>{item.pct}</span>
              </span>
              <span className="size-1 rounded-full bg-white/15 ml-1" />
            </div>
          ))}
        </div>

        <div
          className="flex shrink-0 items-center gap-7 sm:gap-9 pr-7 sm:pr-9 animate-ticker-marquee"
          aria-hidden="true"
        >
          {tickerItems.map((item, idx) => (
            <div
              key={`track2-${item.sym}-${idx}`}
              className="flex items-center gap-2.5 text-xs whitespace-nowrap hover:bg-white/[0.04] px-2 py-1 rounded-lg transition-colors cursor-default"
            >
              <span className="font-bold text-slate-300 text-[11px] sm:text-xs tracking-wide">
                {item.sym}
              </span>
              <span className="font-mono font-semibold text-white text-[11px] sm:text-xs tabular-nums">
                ₹{item.price}
              </span>
              <span
                className={`inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-semibold px-1.5 py-0.5 rounded font-mono ${
                  item.pos
                    ? "text-emerald-400 bg-emerald-500/10"
                    : "text-rose-400 bg-rose-500/10"
                }`}
              >
                {item.pos ? (
                  <TrendingUp className="size-3 stroke-[2.5]" />
                ) : (
                  <TrendingDown className="size-3 stroke-[2.5]" />
                )}
                <span>{item.pct}</span>
              </span>
              <span className="size-1 rounded-full bg-white/15 ml-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
