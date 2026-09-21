/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useMarketData } from '../../context/MarketDataContext';
import { cn } from '@/lib/utils';

const ToastContext = createContext({
  addToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const { lastOrderUpdate } = useMarketData();

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    if (!lastOrderUpdate) return;
    const timer = setTimeout(() => {
      const mode = (lastOrderUpdate.mode || lastOrderUpdate.side || '').toUpperCase();
      const stock = lastOrderUpdate.name || lastOrderUpdate.symbol || lastOrderUpdate.instrument || '';
      const status = (lastOrderUpdate.status || '').toUpperCase();

      if (status === 'EXECUTED') {
        const action = mode === 'SELL' ? 'Sell order executed' : mode === 'BUY' ? 'Buy order executed' : 'Order executed';
        const msg = stock ? `${action}: ${stock}` : action;
        addToast(msg, 'success');
      } else if (status === 'REJECTED' || status === 'CANCELLED') {
        const action = status === 'REJECTED' ? 'Order rejected' : 'Order cancelled';
        const msg = stock ? `${action}: ${stock}` : action;
        addToast(msg, 'error');
      } else if (status) {
        const action = `Order ${status.toLowerCase()}`;
        const msg = stock ? `${action}: ${stock}` : action;
        addToast(msg, 'info');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [lastOrderUpdate, addToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex items-center gap-3 p-3.5 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5 text-sm font-medium",
              toast.type === "success" && "border-emerald-500/30 bg-[#0F1D17]/95 text-emerald-300 shadow-emerald-950/40",
              toast.type === "error" && "border-rose-500/30 bg-[#1D0F12]/95 text-rose-300 shadow-rose-950/40",
              toast.type === "info" && "border-cyan-500/30 bg-[#0F171D]/95 text-cyan-300 shadow-cyan-950/40"
            )}
          >
            {toast.type === "success" && <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />}
            {toast.type === "error" && <AlertCircle className="size-4 shrink-0 text-rose-400" />}
            {toast.type === "info" && <Info className="size-4 shrink-0 text-cyan-400" />}
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="rounded p-1 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
