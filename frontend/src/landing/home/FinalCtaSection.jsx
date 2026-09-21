import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FinalCtaSection() {
  return (
    <section id="create-account" className="pt-8 pb-16 lg:pt-10 lg:pb-20 relative overflow-hidden scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-[#181818] to-[#101010] p-8 sm:p-14 lg:p-16 text-center space-y-8 shadow-2xl shadow-black/80 overflow-hidden">
          
          {/* Ambient Lighting in Card */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Build your trading strategy in Tradely.
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Practice with zero-risk capital. Master advanced limit, trailing, and OCO bracket orders. Understand your portfolio before committing real capital anywhere.
            </p>
          </div>

          <div className="flex justify-center items-center pt-2">
            <Button
              asChild
              size="lg"
              className="bg-gradient-to-r from-[#00D8F6] to-[#7B61FF] text-black font-bold px-8 h-12 shadow-xl shadow-cyan-500/25 hover:brightness-110 active:scale-[0.98] gap-2 text-base rounded-full transition-all"
            >
              <Link to="/signup">
                <span>Start Trading — Free Account</span>
                <ArrowRight className="size-4 text-black stroke-[2.5]" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
