import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useMarketData } from '../../context/MarketDataContext';

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
    }, 4000);
  }, []);

  useEffect(() => {
    if (lastOrderUpdate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (lastOrderUpdate.status === 'EXECUTED') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        addToast(`Order executed: ${lastOrderUpdate.side} ${lastOrderUpdate.quantity} ${lastOrderUpdate.instrument}`, 'success');
      } else if (lastOrderUpdate.status === 'REJECTED' || lastOrderUpdate.status === 'CANCELLED') {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        addToast(`Order ${lastOrderUpdate.status.toLowerCase()}: ${lastOrderUpdate.instrument}`, 'error');
      } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        addToast(`Order ${lastOrderUpdate.status.toLowerCase()}: ${lastOrderUpdate.instrument}`, 'info');
      }
    }
  }, [lastOrderUpdate, addToast]);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
