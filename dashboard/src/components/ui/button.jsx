/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { cva } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 focus-visible:ring-2 focus-visible:ring-cyan-500/60",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-[#00D8F6] to-[#7B61FF] text-black font-bold shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-[0.98]",
        gradient:
          "bg-gradient-to-r from-[#00D8F6] to-[#7B61FF] text-black font-bold shadow-xl shadow-cyan-500/25 hover:brightness-110 active:scale-[0.98]",
        buy:
          "bg-emerald-500 text-black font-bold shadow-md shadow-emerald-500/20 hover:bg-emerald-400 active:scale-[0.98]",
        sell:
          "bg-rose-500 text-black font-bold shadow-md shadow-rose-500/20 hover:bg-rose-400 active:scale-[0.98]",
        secondary:
          "bg-[#1A1A1A] text-white border border-white/10 hover:bg-[#242424] hover:border-white/20 active:scale-[0.98]",
        outline:
          "border border-white/10 bg-transparent text-slate-200 hover:bg-white/5 hover:text-white hover:border-white/20",
        ghost:
          "text-slate-300 hover:bg-white/5 hover:text-white",
        destructive:
          "bg-red-600 text-white hover:bg-red-500 shadow-md shadow-red-600/20 active:scale-[0.98]",
        link:
          "text-cyan-400 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2 rounded-xl",
        sm: "h-8 px-3 text-xs rounded-lg [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 px-6 text-base font-semibold rounded-2xl",
        pill: "h-10 px-5 text-sm font-semibold rounded-full",
        icon: "size-9 rounded-lg",
        "icon-sm": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        "action-btn": "size-6 rounded font-bold text-xs p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
