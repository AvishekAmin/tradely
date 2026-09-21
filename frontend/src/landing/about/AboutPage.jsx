import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Target,
  Cpu,
  ShieldCheck,
  Users,
  Code2,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  useEffect(() => {
    document.title = "About Tradely — Engineering & Philosophy";
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col justify-between pt-4 pb-20">
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
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
          <div className="flex justify-center mb-2">
            <div className="relative group cursor-default">
              <svg
                className="size-12 sm:size-14 transition-transform duration-300 group-hover:scale-105"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  filter: "drop-shadow(0 0 18px rgba(0, 216, 255, 0.45))",
                }}
                aria-label="Tradely Logo"
              >
                <defs>
                  <linearGradient
                    id="tradelyAboutHeroGradient"
                    x1="2"
                    y1="21"
                    x2="22"
                    y2="3"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stopColor="#00F0FF" />
                    <stop offset="100%" stopColor="#00B8F6" />
                  </linearGradient>
                </defs>
                <path
                  d="M15 4l2.4 2.4-4.8 4.8-3.6-3.6L2 14.6l2 2 5-5 3.6 3.6 6.4-6.4L22 11V4h-7z M3 17.5a1 1 0 0 1 1-1h1.5a1 1 0 0 1 1 1V21H3v-3.5z M8.5 14.5a1 1 0 0 1 1-1h1.5a1 1 0 0 1 1 1V21h-3.5v-6.5z M14 10.5a1 1 0 0 1 1-1h1.5a1 1 0 0 1 1 1V21H14v-10.5z"
                  fill="url(#tradelyAboutHeroGradient)"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            About Tradely
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Building an authentic, transparent, and robust educational
            environment where traders can develop and test real strategies
            without financial risk.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-[#141414] border border-white/[0.08] p-5 text-center space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-400 font-mono tabular-nums">
              ~1.5s
            </span>
            <p className="text-xs text-slate-400 font-medium">
              Market Price Tick
            </p>
          </div>
          <div className="rounded-2xl bg-[#141414] border border-white/[0.08] p-5 text-center space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono tabular-nums">
              100%
            </span>
            <p className="text-xs text-slate-400 font-medium">
              ACID Transaction Safety
            </p>
          </div>
          <div className="rounded-2xl bg-[#141414] border border-white/[0.08] p-5 text-center space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-purple-400 font-mono tabular-nums">
              5
            </span>
            <p className="text-xs text-slate-400 font-medium">
              Advanced Order Types
            </p>
          </div>
          <div className="rounded-2xl bg-[#141414] border border-white/[0.08] p-5 text-center space-y-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono tabular-nums">
              ₹100,000
            </span>
            <p className="text-xs text-slate-400 font-medium">
              Free Virtual Capital
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-[#141414] border border-white/10 p-6 sm:p-10 shadow-xl space-y-4">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <BookOpen className="size-5 text-blue-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Our Story
            </h2>
          </div>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Financial trading platforms often present beginners with high
            barriers to entry, complex jargon, and catastrophic risk of capital
            loss while testing new strategies. Tradely was created to eliminate
            this barrier.
          </p>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            We set out to build a platform that mirrors the exact realities of
            professional electronic exchanges — continuous price action, order
            queues, stop triggers, trailing ratchets, and bracket cancellation —
            while running in a completely risk-free, zero-loss paper trading
            sandbox.
          </p>
        </div>

        <div className="rounded-3xl bg-[#141414] border border-white/10 p-6 sm:p-10 shadow-xl space-y-4">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <Cpu className="size-5 text-purple-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Engineering Architecture
            </h2>
          </div>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Tradely is engineered using modern full-stack patterns:
          </p>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-300 list-disc list-inside">
            <li>
              <strong>Frontend:</strong> React 19, Tailwind CSS v4, shadcn/ui
              accessible primitives, and Lucide icons.
            </li>
            <li>
              <strong>Dashboard Terminal:</strong> Real-time Socket.IO
              subscriptions, Chart.js analytics, and responsive trading
              controls.
            </li>
            <li>
              <strong>Backend Engine:</strong> Node.js, Express, MongoDB with
              transactional atomicity (`withTransaction`), and sliding-window
              rate limiting.
            </li>
            <li>
              <strong>Security:</strong> HttpOnly SameSite JWT cookies, strict
              user-scoped query filters, and comprehensive credential redaction
              in structured logs.
            </li>
          </ul>
        </div>

        <div className="rounded-3xl bg-[#141414] border border-white/10 p-6 sm:p-10 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <Users className="size-5 text-emerald-400" />
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              Meet the Team
            </h2>
          </div>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            The passionate minds behind Tradely's vision, distributed engine
            architecture, and product growth.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            <div className="text-center p-6 sm:p-7 rounded-2xl bg-[#181818] border border-white/[0.08] hover:border-white/20 hover:bg-[#1C1C1C] hover:-translate-y-1 transition-all duration-300 group flex flex-col items-center justify-center space-y-3">
              <div className="size-16 sm:size-18 rounded-full bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-purple-600/20 border-2 border-blue-500/30 flex items-center justify-center text-xl sm:text-2xl font-extrabold text-cyan-400 group-hover:border-cyan-400/60 group-hover:shadow-[0_0_20px_rgba(0,216,255,0.2)] transition-all">
                A
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Avishek Amin
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Co-Founder &amp; CEO
                </p>
              </div>
            </div>

            <div className="text-center p-6 sm:p-7 rounded-2xl bg-[#181818] border border-white/[0.08] hover:border-white/20 hover:bg-[#1C1C1C] hover:-translate-y-1 transition-all duration-300 group flex flex-col items-center justify-center space-y-3">
              <div className="size-16 sm:size-18 rounded-full bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-purple-600/20 border-2 border-blue-500/30 flex items-center justify-center text-xl sm:text-2xl font-extrabold text-cyan-400 group-hover:border-cyan-400/60 group-hover:shadow-[0_0_20px_rgba(0,216,255,0.2)] transition-all">
                P
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Priyansh Agarwal
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Chief Product Officer
                </p>
              </div>
            </div>

            <div className="text-center p-6 sm:p-7 rounded-2xl bg-[#181818] border border-white/[0.08] hover:border-white/20 hover:bg-[#1C1C1C] hover:-translate-y-1 transition-all duration-300 group flex flex-col items-center justify-center space-y-3">
              <div className="size-16 sm:size-18 rounded-full bg-gradient-to-br from-blue-600/20 via-indigo-600/10 to-purple-600/20 border-2 border-blue-500/30 flex items-center justify-center text-xl sm:text-2xl font-extrabold text-cyan-400 group-hover:border-cyan-400/60 group-hover:shadow-[0_0_20px_rgba(0,216,255,0.2)] transition-all">
                S
              </div>
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Sandeep Pathak
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Head of Engineering
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#181818] to-[#101010] p-8 sm:p-10 text-center space-y-4 shadow-2xl shadow-black/80">
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            Ready to test your trading strategies?
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            Create an account in 30 seconds and start trading with ₹100,000 in
            virtual capital.
          </p>
          <div className="pt-2">
            <Button
              asChild
              className="rounded-full bg-gradient-to-r from-[#00D8F6] to-[#7B61FF] text-black font-bold px-6 h-11 text-sm hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-cyan-500/25"
            >
              <Link to="/signup" className="inline-flex items-center gap-2">
                <span>Get Started for Free</span>
                <ArrowRight className="size-4 text-black stroke-[2.5]" />
              </Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
