import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ContactPage() {
  useEffect(() => {
    document.title = "Tradely — Contact Us";
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      setSubmitted(true);
      setTimeout(() => {
        setFormData({ name: "", email: "", subject: "", message: "" });
      }, 500);
      setTimeout(() => setSubmitted(false), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col justify-between pt-4 pb-20">
      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Back Link */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white bg-[#141414] border border-white/10 hover:bg-[#1C1C1C] rounded-full px-4 py-2 transition-all"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to home</span>
          </Link>
        </div>

        {/* Page Header */}
        <div className="text-center space-y-4 py-4">

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Contact the Tradely Team
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
            Have questions about simulated order mechanics, portfolio analytics, or architectural feedback? We'd love to hear from you.
          </p>
        </div>

        {/* 2-Column Responsive Contact Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Direct Info Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl border border-white/[0.08] bg-[#141414] p-6 sm:p-7 space-y-6">
              <div className="space-y-2">
                <h2 className="text-lg font-bold text-white">
                  Direct Communication
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Tradely is an open-source educational platform engineered by Avishek Amin. We actively respond to developer feedback and platform inquiries.
                </p>
              </div>

              {/* Direct Email */}
              <div className="flex items-start gap-3.5">
                <div className="size-10 rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                  <Mail className="size-4.5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Email Inquiries
                  </h3>
                  <a
                    href="mailto:avishekamin207@gmail.com"
                    className="text-sm font-bold text-white hover:text-[#00D8F6] transition-colors"
                  >
                    avishekamin207@gmail.com
                  </a>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Fast response within 24 hours.
                  </p>
                </div>
              </div>

              {/* Operating Hours */}
              <div className="flex items-start gap-3.5">
                <div className="size-10 rounded-2xl bg-emerald-600/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <Clock className="size-4.5" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Operating Hours
                  </h3>
                  <p className="text-sm font-bold text-white">
                    Mon &ndash; Fri: 9:00 AM &ndash; 7:00 PM IST
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Sat: 10:00 AM &ndash; 5:00 PM IST &bull; Sun: Closed
                  </p>
                </div>
              </div>

              {/* Office Location */}
              <div className="flex items-start gap-3.5">
                <div className="size-10 rounded-2xl bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                  <MapPin className="size-4.5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Office Location
                  </h3>
                  <p className="text-sm font-bold text-white leading-snug">
                    Tradely Technologies Pvt. Ltd.
                  </p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    123 Innovation Drive, 4th Floor<br />
                    Koramangala, Bengaluru<br />
                    Karnataka 560001, India
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Link to Bug Report */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#141414] p-5 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-white">Found a matching engine bug?</p>
                <p className="text-[11px] text-slate-400">File a structured report on our issue tracker.</p>
              </div>
              <Button asChild variant="outline" size="sm" className="rounded-full border-white/10 text-xs shrink-0">
                <Link to="/report">Report Bug</Link>
              </Button>
            </div>
          </div>

          {/* Right Column: Contact Form (7 cols) */}
          <div className="lg:col-span-7">
            <div className="rounded-3xl border border-white/10 bg-[#141414] p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-white">Send a Message</h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Fill out the form below and our team will get back to your email shortly.
                </p>
              </div>

              {submitted ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center space-y-2 animate-in fade-in zoom-in duration-300">
                  <div className="size-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="size-6" />
                  </div>
                  <h3 className="text-base font-bold text-white">Message Sent Successfully!</h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-sm mx-auto">
                    Thank you for reaching out. We have received your message and will review it promptly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Your Name *</label>
                      <Input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Avishek Amin"
                        className="bg-[#181818] border-white/10 text-sm text-white placeholder:text-slate-500 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Email Address *</label>
                      <Input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="you@domain.com"
                        className="bg-[#181818] border-white/10 text-sm text-white placeholder:text-slate-500 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Subject</label>
                    <Input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g. Question on OCO bracket order implementation"
                      className="bg-[#181818] border-white/10 text-sm text-white placeholder:text-slate-500 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">Your Message *</label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Write your question, suggestion, or message in detail..."
                      className="w-full rounded-xl border border-white/10 bg-[#181818] p-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-white/30 focus:ring-1 focus:ring-white/20 transition-all resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full rounded-full bg-gradient-to-r from-[#00D8F6] to-[#7B61FF] text-black font-bold text-sm h-11 hover:brightness-110 active:scale-[0.99] transition-all shadow-md shadow-cyan-500/20 gap-2"
                  >
                    <span>Send Message</span>
                    <Send className="size-4 text-black" />
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
