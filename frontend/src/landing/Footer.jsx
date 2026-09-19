import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Mail, Check } from "lucide-react";
import TradelyLogo from "./TradelyLogo";

export default function Footer() {
  const location = useLocation();
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleHashClick = (e, targetId) => {
    if (location.pathname === "/") {
      e.preventDefault();
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", `#${targetId}`);
        window.dispatchEvent(new Event("hashchange"));
      }
    }
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 4500);
    }
  };

  const socialLinks = [
    {
      name: "Facebook",
      href: "https://www.facebook.com/avishek207",
      icon: (
        <svg
          className="size-4 fill-current"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: "Instagram",
      href: "https://www.instagram.com/avishek.______",
      icon: (
        <svg
          className="size-4 fill-current"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/in/avishekamin",
      icon: (
        <svg
          className="size-4 fill-current"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      ),
    },
    {
      name: "X (Twitter)",
      href: "https://x.com/avishek______",
      icon: (
        <svg
          className="size-3.5 fill-current"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: "YouTube",
      href: "https://www.youtube.com/@Avishekkk",
      icon: (
        <svg
          className="size-4 fill-current"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    {
      name: "Email",
      href: "mailto:avishekamin207@gmail.com",
      icon: <Mail className="size-4" />,
    },
  ];

  return (
    <footer className="w-full bg-[#0C0C0C] border-t border-white/[0.08] text-slate-400 text-[0.88rem] relative mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        {/* 5-Column Responsive Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-8 lg:gap-6">
          {/* Brand & Social Column */}
          <div className="sm:col-span-2 md:col-span-3 lg:col-span-3 space-y-3.5">
            <Link
              to="/"
              className="inline-block group focus:outline-none"
              aria-label="Tradely Home"
            >
              <TradelyLogo size="default" />
            </Link>
            <p className="text-slate-400 text-[0.88rem] leading-[1.68] max-w-[320px]">
              A modern simulated trading platform built for education, strategy
              testing and portfolio analytics.
            </p>

            {/* Social Icons row */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target={
                    social.href.startsWith("mailto") ? undefined : "_blank"
                  }
                  rel="noopener noreferrer"
                  className="w-[38px] h-[38px] rounded-full bg-[#181818] border border-white/[0.08] flex items-center justify-center text-slate-400 hover:text-white hover:border-white/20 hover:bg-[#202020] hover:-translate-y-1 hover:shadow-lg hover:shadow-black/60 transition-all duration-200 focus:outline-none"
                  aria-label={social.name}
                  title={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Platform Column */}
          <div className="sm:col-span-1 md:col-span-1 lg:col-span-2 space-y-3.5">
            <h4 className="text-[0.82rem] font-semibold text-white uppercase tracking-[1.3px] font-mono">
              Platform
            </h4>
            <ul className="space-y-2.5 text-[0.88rem]">
              <li>
                <Link
                  to="/#terminal"
                  onClick={(e) => handleHashClick(e, "terminal")}
                  className="text-slate-400 hover:text-white hover:translate-x-1 transition-all duration-200 inline-block"
                >
                  Trading Terminal
                </Link>
              </li>
              <li>
                <Link
                  to="/#how-it-works"
                  onClick={(e) => handleHashClick(e, "how-it-works")}
                  className="text-slate-400 hover:text-white hover:translate-x-1 transition-all duration-200 inline-block"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  to="/#order-management"
                  onClick={(e) => handleHashClick(e, "order-management")}
                  className="text-slate-400 hover:text-white hover:translate-x-1 transition-all duration-200 inline-block"
                >
                  Order Management
                </Link>
              </li>
              <li>
                <Link
                  to="/#analytics"
                  onClick={(e) => handleHashClick(e, "analytics")}
                  className="text-slate-400 hover:text-white hover:translate-x-1 transition-all duration-200 inline-block"
                >
                  Portfolio Analysis
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div className="sm:col-span-1 md:col-span-1 lg:col-span-2 space-y-3.5">
            <h4 className="text-[0.82rem] font-semibold text-white uppercase tracking-[1.3px] font-mono">
              Support
            </h4>
            <ul className="space-y-2.5 text-[0.88rem]">
              <li>
                <Link
                  to="/help"
                  className="text-slate-400 hover:text-white hover:translate-x-1 transition-all duration-200 inline-block"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  to="/support"
                  className="text-slate-400 hover:text-white hover:translate-x-1 transition-all duration-200 inline-block"
                >
                  Support & FAQs
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-slate-400 hover:text-white hover:translate-x-1 transition-all duration-200 inline-block"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-slate-400 hover:text-white hover:translate-x-1 transition-all duration-200 inline-block"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="sm:col-span-1 md:col-span-1 lg:col-span-2 space-y-3.5">
            <h4 className="text-[0.82rem] font-semibold text-white uppercase tracking-[1.3px] font-mono">
              Company
            </h4>
            <ul className="space-y-2.5 text-[0.88rem]">
              <li>
                <Link
                  to="/about"
                  className="text-slate-400 hover:text-white hover:translate-x-1 transition-all duration-200 inline-block"
                >
                  About Tradely
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-slate-400 hover:text-white hover:translate-x-1 transition-all duration-200 inline-block"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  to="/#pricing"
                  onClick={(e) => handleHashClick(e, "pricing")}
                  className="text-slate-400 hover:text-white hover:translate-x-1 transition-all duration-200 inline-block"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  to="/report"
                  className="text-slate-400 hover:text-white hover:translate-x-1 transition-all duration-200 inline-block"
                >
                  Report an Issue
                </Link>
              </li>
            </ul>
          </div>

          {/* Stay in the Loop (Newsletter) Column */}
          <div className="sm:col-span-2 md:col-span-3 lg:col-span-3 space-y-3.5">
            <h4 className="text-[0.82rem] font-semibold text-white uppercase tracking-[1.3px] font-mono">
              Stay in the loop
            </h4>
            <p className="text-[0.88rem] text-slate-400 leading-[1.68]">
              Get simulated market insights, platform updates, and feature
              announcements.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2 pt-1">
              <div className="flex items-center rounded-full border border-white/10 bg-[#141414] p-1 focus-within:border-white/30 focus-within:ring-1 focus-within:ring-white/10 transition-all shadow-inner shadow-black/40">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  required
                  className="w-full bg-transparent px-3.5 py-1.5 text-[0.88rem] text-white placeholder:text-slate-500 outline-none min-w-0"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-gradient-to-r from-[#00D8F6] to-[#7B61FF] text-black font-bold text-[0.85rem] px-4 py-2 hover:brightness-110 active:scale-95 transition-all shadow-md shadow-cyan-500/20"
                >
                  Subscribe
                </button>
              </div>
              {subscribed && (
                <p className="text-[0.82rem] text-emerald-400 font-medium pl-2 flex items-center gap-1.5">
                  <Check className="size-3.5" />
                  <span>You'll be notified of new Tradely updates!</span>
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Footer Divider */}
        <hr className="border-t border-white/[0.08] mt-6 mb-3" />

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[0.84rem] text-slate-500 mb-2">
          <p className="text-slate-400 text-[0.84rem]">
            &copy; {currentYear} Tradely. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-3 sm:gap-3.5 text-[0.84rem]">
            <Link
              to="/privacy"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-slate-600">&bull;</span>
            <Link
              to="/terms"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
            <span className="text-slate-600">&bull;</span>
            <Link
              to="/support"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Support
            </Link>
          </div>
        </div>

        {/* Educational Simulation Disclaimer */}
        <div className="pt-2 text-[0.82rem] text-slate-400/90 leading-[1.6] w-full border-t border-white/[0.06]">
          <strong className="text-slate-300 font-semibold">Disclaimer:</strong> Tradely is a
          simulated educational trading platform. All market data, orders, and
          executions are virtual and do not represent real financial
          transactions. Tradely does not provide investment advice, broker
          services, or access to real stock exchanges.
        </div>
      </div>
    </footer>
  );
}
