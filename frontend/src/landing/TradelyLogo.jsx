import React from "react";

export default function TradelyLogo({
  size = "default",
  showText = true,
  className = "",
}) {
  const dimensions = {
    small: { icon: 26, font: "1.1rem", gap: "9px" },
    navbar: { icon: 30, font: "1.3rem", gap: "10px" },
    default: { icon: 32, font: "1.35rem", gap: "10px" },
    large: { icon: 42, font: "1.65rem", gap: "12px" },
  }[size] || { icon: 32, font: "1.35rem", gap: "10px" };

  return (
    <div
      className={`tradely-logo-container inline-flex items-center select-none ${className}`}
      style={{
        gap: dimensions.gap,
        textDecoration: "none",
      }}
    >
      <div className="relative flex items-center justify-center shrink-0">
        <svg
          width={dimensions.icon}
          height={dimensions.icon}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-200 group-hover:scale-105"
          style={{ filter: "drop-shadow(0 0 7px rgba(0, 216, 255, 0.65))" }}
        >
          <defs>
            <linearGradient
              id="tradelyBrandFaviconGradient"
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
            fill="url(#tradelyBrandFaviconGradient)"
          />
        </svg>
      </div>

      {showText && (
        <span
          className="font-extrabold tracking-tight text-white transition-colors duration-200 group-hover:text-cyan-300"
          style={{
            fontFamily:
              '"Poppins", "Inter", system-ui, -apple-system, sans-serif',
            fontSize: dimensions.font,
            letterSpacing: "-0.025em",
            textShadow: "0 0 20px rgba(0, 216, 255, 0.28)",
          }}
        >
          Tradely
        </span>
      )}
    </div>
  );
}
