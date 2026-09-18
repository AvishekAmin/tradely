import React, { createContext, useContext, useState, useCallback } from "react";
import BuyActionWindow from "./BuyActionWindow";
import SellActionWindow from "./SellActionWindow";

const GeneralContext = createContext({
  openBuyWindow: (_uid) => {},
  closeBuyWindow: () => {},
  openSellWindow: (_uid) => {},
  closeSellWindow: () => {},
  isBuyWindowOpen: false,
  isSellWindowOpen: false,
  selectedStockUID: "",
  refreshKey: 0,
  triggerRefresh: () => {},
});

export const GeneralContextProvider = ({ children }) => {
  const [isBuyWindowOpen, setIsBuyWindowOpen] = useState(false);
  const [isSellWindowOpen, setIsSellWindowOpen] = useState(false);
  const [selectedStockUID, setSelectedStockUID] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleOpenBuyWindow = useCallback((uid) => {
    setIsSellWindowOpen(false);
    setIsBuyWindowOpen(true);
    setSelectedStockUID(uid);
  }, []);

  const handleCloseBuyWindow = useCallback(() => {
    setIsBuyWindowOpen(false);
    setSelectedStockUID("");
  }, []);

  const handleOpenSellWindow = useCallback((uid) => {
    setIsBuyWindowOpen(false);
    setIsSellWindowOpen(true);
    setSelectedStockUID(uid);
  }, []);

  const handleCloseSellWindow = useCallback(() => {
    setIsSellWindowOpen(false);
    setSelectedStockUID("");
  }, []);

  return (
    <GeneralContext.Provider
      value={{
        openBuyWindow: handleOpenBuyWindow,
        closeBuyWindow: handleCloseBuyWindow,
        openSellWindow: handleOpenSellWindow,
        closeSellWindow: handleCloseSellWindow,
        isBuyWindowOpen,
        isSellWindowOpen,
        selectedStockUID,
        refreshKey,
        triggerRefresh,
      }}
    >
      {children}
      {isBuyWindowOpen && (
        <BuyActionWindow key={`buy-${selectedStockUID}`} uid={selectedStockUID} />
      )}
      {isSellWindowOpen && (
        <SellActionWindow key={`sell-${selectedStockUID}`} uid={selectedStockUID} />
      )}
    </GeneralContext.Provider>
  );
};

export const useGeneralContext = () => useContext(GeneralContext);
export default GeneralContext;
