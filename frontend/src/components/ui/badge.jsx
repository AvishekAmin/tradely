import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-blue-600/20 text-blue-400 border-blue-500/30",
        blue:
          "border-blue-500/30 bg-blue-500/10 text-blue-400",
        green:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        amber:
          "border-amber-500/30 bg-amber-500/10 text-amber-400",
        red:
          "border-red-500/30 bg-red-500/10 text-red-400",
        purple:
          "border-purple-500/30 bg-purple-500/10 text-purple-400",
        outline:
          "border-white/10 text-slate-300 bg-[#1A1A1A]",
        live:
          "border-emerald-500/30 bg-emerald-950/40 text-emerald-400 font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant = "default", ...props }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
