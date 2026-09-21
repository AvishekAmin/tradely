import * as React from "react";
import { cn } from "@/lib/utils";

function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-[#141414] text-[#EDEDED] shadow-xl transition-all",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-5", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }) {
  return (
    <h3
      className={cn(
        "text-lg font-bold leading-none tracking-tight text-white",
        className,
      )}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }) {
  return (
    <p
      className={cn("text-sm text-slate-400 leading-relaxed", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }) {
  return <div className={cn("p-5 pt-0", className)} {...props} />;
}

function CardFooter({ className, ...props }) {
  return (
    <div
      className={cn(
        "flex items-center p-5 pt-0 border-t border-white/5",
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
