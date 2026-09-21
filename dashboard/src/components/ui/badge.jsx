import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
        blue: "border-blue-500/30 bg-blue-500/10 text-blue-400",
        profit:
          "border-emerald-500/30 bg-emerald-500/15 text-emerald-400 font-bold",
        loss: "border-rose-500/30 bg-rose-500/15 text-rose-400 font-bold",
        warning: "border-amber-500/30 bg-amber-500/15 text-amber-400",
        purple: "border-purple-500/30 bg-purple-500/15 text-purple-400",
        secondary: "border-white/10 bg-[#1A1A1A] text-slate-300",
        outline: "border-white/10 text-slate-300 bg-transparent",
        live: "border-emerald-500/30 bg-emerald-950/40 text-emerald-400 font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({ className, variant = "default", ...props }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
