import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-xl border border-white/10 bg-[#1A1A1A] px-3.5 py-2 text-sm text-white placeholder:text-slate-500 transition-all outline-none file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:border-cyan-500/50 focus-visible:ring-2 focus-visible:ring-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50 tabular-nums",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
