import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import apiClient from "../config/api";
import { useAuth } from "../context/AuthContext";
import { useGeneralContext } from "../components/GeneralContext";
import { useToast } from "../components/ui/ToastContainer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  ArrowLeft,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

const QUICK_AMOUNTS = [1000, 5000, 10000, 25000];
const MIN_AMOUNT = 100;
const MAX_AMOUNT = 500000;

const PaymentPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshKey, triggerRefresh } = useGeneralContext();
  const { addToast } = useToast();

  const [availableCash, setAvailableCash] = useState(0);
  const [loadingCash, setLoadingCash] = useState(true);
  const [amount, setAmount] = useState(10000);
  const [inputVal, setInputVal] = useState("10000");
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    apiClient
      .get("/funds")
      .then((res) => {
        if (isMounted && res.data?.success && res.data?.data) {
          setAvailableCash(res.data.data.balance || 0);
        }
        if (isMounted) setLoadingCash(false);
      })
      .catch((err) => {
        console.error("Failed to load funds on payment page:", err);
        if (isMounted) setLoadingCash(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const handleAmountChange = (e) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    setInputVal(val);
    setError("");
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed)) {
      setAmount(parsed);
    } else {
      setAmount(0);
    }
  };

  const handleQuickSelect = (val) => {
    setAmount(val);
    setInputVal(val.toString());
    setError("");
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleProceedToPayment = async (e) => {
    e.preventDefault();
    setError("");

    if (!amount || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      setError(
        `Please enter a deposit amount between ₹${MIN_AMOUNT.toLocaleString("en-IN")} and ₹${MAX_AMOUNT.toLocaleString("en-IN")}.`,
      );
      return;
    }

    setSubmitting(true);

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        throw new Error(
          "Unable to load Razorpay payment gateway script. Please check your internet connection.",
        );
      }

      const orderRes = await apiClient.post("/payments/create-order", {
        amount: Number(amount),
      });

      if (!orderRes.data?.success || !orderRes.data?.data) {
        throw new Error(
          orderRes.data?.message || "Failed to create payment order.",
        );
      }

      const orderData = orderRes.data.data;

      const options = {
        key: orderData.keyId,
        amount: orderData.amount, // in paise
        currency: orderData.currency || "INR",
        name: "Tradely",
        description: "Add Funds (Razorpay)",
        order_id: orderData.orderId,
        handler: async function (response) {
          setSubmitting(false);
          setVerifying(true);
          try {
            const verifyRes = await apiClient.post("/payments/verify", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            setVerifying(false);

            if (verifyRes.data?.success) {
              addToast(
                `₹${Number(amount).toLocaleString("en-IN")} added successfully.`,
                "success",
              );
              triggerRefresh();
              navigate("/funds");
            } else {
              addToast(
                "Payment completed but verification is pending. Your balance has not been credited yet.",
                "info",
              );
            }
          } catch (verifyErr) {
            setVerifying(false);
            const msg =
              verifyErr.response?.data?.message ||
              "Payment verification failed. Your balance has not been credited.";
            setError(msg);
            addToast(msg, "error");
          }
        },
        prefill: {
          name: user?.username || "",
          email: user?.email || "",
        },
        theme: {
          color: "#00D8F6",
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
            addToast("Payment dismissed. No charges were made.", "info");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        setSubmitting(false);
        const reason =
          response.error?.description || "Payment failed in Razorpay.";
        setError(reason);
        addToast(reason, "error");
      });

      rzp.open();
    } catch (err) {
      setSubmitting(false);
      const msg =
        err.response?.data?.message ||
        err.message ||
        "An error occurred while initiating payment.";
      setError(msg);
      addToast(msg, "error");
    }
  };

  const projectBalance = availableCash + (amount > 0 ? amount : 0);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <Link
          to="/funds"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Funds & Cash Management
        </Link>
      </div>

      <Card className="border-white/10 bg-[#141414] relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500" />

        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="size-5 text-cyan-400" />
            Add Funds
          </CardTitle>
          <CardDescription className="text-xs text-slate-400">
            Deposit capital into your trading account.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="p-4 rounded-lg bg-[#0E0E0E] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Wallet className="size-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 font-medium">
                  Current Available Cash
                </span>
                <div className="text-lg font-bold text-white font-mono tabular-nums">
                  ₹
                  {loadingCash
                    ? "..."
                    : availableCash.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                </div>
              </div>
            </div>
            <Badge
              variant="outline"
              className="text-[11px] text-slate-400 border-white/10"
            >
              Instant Margin
            </Badge>
          </div>

          <form onSubmit={handleProceedToPayment} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="amount-input"
                className="text-xs font-semibold text-slate-300"
              >
                Deposit Amount (INR)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 font-mono">
                  ₹
                </span>
                <Input
                  id="amount-input"
                  type="text"
                  value={inputVal}
                  onChange={handleAmountChange}
                  placeholder="10,000"
                  disabled={submitting || verifying}
                  className="pl-8 text-base font-mono font-bold text-white bg-[#0E0E0E] border-white/10 focus:border-cyan-500 focus:ring-cyan-500/20"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 px-0.5">
                <span>Min: ₹{MIN_AMOUNT.toLocaleString("en-IN")}</span>
                <span>Max: ₹{MAX_AMOUNT.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-medium text-slate-400">
                Quick Select:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {QUICK_AMOUNTS.map((val) => {
                  const isSelected = amount === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      disabled={submitting || verifying}
                      onClick={() => handleQuickSelect(val)}
                      className={`px-3 py-2 rounded-lg text-xs font-mono font-semibold border transition-all ${
                        isSelected
                          ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-sm"
                          : "bg-white/[0.02] border-white/10 text-slate-300 hover:bg-white/[0.05] hover:border-white/20"
                      }`}
                    >
                      +₹{val.toLocaleString("en-IN")}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-[#0A0A0A] p-4 space-y-2.5 text-xs">
              <div className="font-semibold text-slate-300 uppercase tracking-wider text-[10px] pb-1 border-b border-white/5">
                Payment Summary
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Requested Deposit:</span>
                <span className="font-mono font-bold text-white tabular-nums">
                  ₹
                  {amount > 0
                    ? amount.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })
                    : "0.00"}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Payment Gateway:</span>
                <span className="text-cyan-400 font-medium">Razorpay</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 pt-1.5 border-t border-white/5">
                <span className="text-slate-200 font-medium">
                  Account balance after success:
                </span>
                <span className="font-mono font-bold text-emerald-400 text-sm tabular-nums">
                  ₹
                  {projectBalance.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="default"
              disabled={
                submitting ||
                verifying ||
                amount < MIN_AMOUNT ||
                amount > MAX_AMOUNT
              }
              className="w-full py-6 text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Initiating Razorpay Checkout...
                </>
              ) : verifying ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Verifying Cryptographic Signature...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4 mr-2" />
                  Proceed to Payment (₹
                  {amount > 0 ? amount.toLocaleString("en-IN") : "0"})
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentPage;
