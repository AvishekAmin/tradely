import React, { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

/**
 * BackToTop - Floating upward arrow button that appears after scrolling down.
 * Smoothly scrolls the window back to the top when clicked.
 * Replicates the design and interaction from Havenly.
 */
export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      id="back-to-top"
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`fixed bottom-6 right-6 sm:bottom-9 sm:right-9 z-50 size-10 sm:size-12 rounded-full flex items-center justify-center cursor-pointer border border-[#00D8F6]/30 bg-[#0F0F0F]/85 backdrop-blur-md text-[#00D8F6] shadow-lg shadow-black/60 outline-none transition-all duration-300 ease-out hover:bg-[#00D8F6]/15 hover:border-[#00D8F6] hover:text-[#00D8F6] hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(0,216,255,0.45)] active:scale-95 ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto visible"
          : "opacity-0 translate-y-4 pointer-events-none invisible"
      }`}
    >
      <ArrowUp className="size-4 sm:size-5 stroke-[2.5]" />
    </button>
  );
}
