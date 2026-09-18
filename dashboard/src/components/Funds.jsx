import React, { useState, useEffect, useContext } from "react";
import apiClient from "../config/api";
import GeneralContext from "./GeneralContext";

const Funds = () => {
  const { refreshKey } = useContext(GeneralContext);
  const [funds, setFunds] = useState({
    balance: 0,
    initialBalance: 100000,
    availableMargin: 0,
    usedMargin: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get("/funds")
      .then((res) => {
        if (res.data?.success && res.data?.data) {
          setFunds(res.data.data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading account funds:", err);
        setLoading(false);
      });
  }, [refreshKey]);

  const formattedBalance = (funds.balance || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const formattedInitial = (funds.initialBalance || 100000).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const usedMargin = Math.max(0, (funds.initialBalance || 100000) - (funds.balance || 0));
  const formattedUsedMargin = usedMargin.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return (
    <>
      <div className="funds">
        <p>Simulated trading capital ledger</p>
        <button
          type="button"
          className="btn btn-green"
          title="Deposit functionality in future Funds Management phase"
          disabled
          style={{ opacity: 0.6, cursor: "not-allowed" }}
        >
          Add funds
        </button>
        <button
          type="button"
          className="btn btn-blue"
          title="Withdrawal functionality in future Funds Management phase"
          disabled
          style={{ opacity: 0.6, cursor: "not-allowed" }}
        >
          Withdraw
        </button>
      </div>

      <div className="row">
        <div className="col">
          <span>
            <p>Equity Segment</p>
          </span>

          <div className="table">
            <div className="data">
              <p>Available margin</p>
              <p className="imp colored">₹{loading ? "..." : formattedBalance}</p>
            </div>
            <div className="data">
              <p>Used margin</p>
              <p className="imp">₹{loading ? "..." : formattedUsedMargin}</p>
            </div>
            <div className="data">
              <p>Available cash</p>
              <p className="imp">₹{loading ? "..." : formattedBalance}</p>
            </div>
            <hr />
            <div className="data">
              <p>Opening Balance</p>
              <p>₹{loading ? "..." : formattedInitial}</p>
            </div>
            <div className="data">
              <p>Collateral Margin</p>
              <p>₹0.00</p>
            </div>
            <div className="data">
              <p>SPAN</p>
              <p>₹0.00</p>
            </div>
            <div className="data">
              <p>Delivery margin</p>
              <p>₹0.00</p>
            </div>
            <div className="data">
              <p>Exposure</p>
              <p>₹0.00</p>
            </div>
            <div className="data">
              <p>Options premium</p>
              <p>₹0.00</p>
            </div>
            <hr />
            <div className="data">
              <p>Total Collateral</p>
              <p>₹0.00</p>
            </div>
          </div>
        </div>

        <div className="col">
          <div className="commodity">
            <p>Commodity segment inactive</p>
            <button
              type="button"
              className="btn btn-blue"
              disabled
              style={{ opacity: 0.6, cursor: "not-allowed" }}
            >
              Segment Inactive
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Funds;
