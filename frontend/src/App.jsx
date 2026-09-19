import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import "./index.css";

import HomePage from "./landing/home/HomePage";
import SignUp from "./landing/signup/SignUp";
import LoginPage from "./landing/login/LoginPage";
import AboutPage from "./landing/about/AboutPage";
import SupportPage from "./landing/support/SupportPage";
import HelpPage from "./landing/help/HelpPage";
import PrivacyPage from "./landing/privacy/PrivacyPage";
import TermsOfServicePage from "./landing/terms/TermsOfServicePage";
import ContactPage from "./landing/contact/ContactPage";
import ReportIssuePage from "./landing/report/ReportIssuePage";
import Navbar from "./landing/Navbar";
import Footer from "./landing/Footer";
import BackToTop from "./landing/BackToTop";
import NotFound from "./landing/NotFound";
import { AuthProvider } from "./context/AuthContext";

function AppLayout() {
  const location = useLocation();
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/signup";

  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace("#", "");
      const timer = setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [location.pathname, location.hash]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0F0F0F] text-[#EDEDED]">
      {!isAuthPage && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/product" element={<Navigate to="/#terminal" replace />} />
          <Route path="/products" element={<Navigate to="/#terminal" replace />} />
          <Route path="/pricing" element={<Navigate to="/#pricing" replace />} />
          <Route path="/order-management" element={<Navigate to="/#order-management" replace />} />
          <Route path="/risk-management" element={<Navigate to="/#order-management" replace />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/terms-of-service" element={<Navigate to="/terms" replace />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/report" element={<ReportIssuePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAuthPage && <Footer />}
      {!isAuthPage && <BackToTop />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </AuthProvider>
  );
}
