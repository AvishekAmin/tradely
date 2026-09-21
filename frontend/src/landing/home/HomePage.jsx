import React, { useEffect } from "react";
import MarketTickerBar from "./MarketTickerBar";
import HeroSection from "./HeroSection";
import TerminalShowcaseSection from "./TerminalShowcaseSection";
import HowItWorksSection from "./HowItWorksSection";
import RiskManagementSection from "./RiskManagementSection";
import AnalyticsSection from "./AnalyticsSection";
import PricingSection from "./PricingSection";
import FinalCtaSection from "./FinalCtaSection";

export default function HomePage() {
  useEffect(() => {
    document.title = "Tradely — Professional Paper Trading & Portfolio Terminal";
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <MarketTickerBar />
      <HeroSection />
      <TerminalShowcaseSection />
      <HowItWorksSection />
      <RiskManagementSection />
      <AnalyticsSection />
      <PricingSection />
      <FinalCtaSection />
    </div>
  );
}
