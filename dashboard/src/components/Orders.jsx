import React, { useState, useEffect, useContext, useCallback } from "react";
import { Link } from "react-router-dom";
import apiClient from "../config/api";
import GeneralContext from "./GeneralContext";
import { useMarketData } from "../context/MarketDataContext";

const Orders = () => {
  const { refreshKey, triggerRefresh } = useContext(GeneralContext);
  const { lastOrderUpdate } = useMarketData();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchOrders = useCallback(() => {
    return apiClient
      .get("/allOrders")
      .then((res) => {
        setOrders(res.data || []);
        setError(null);
      })
      .catch((err) => {
        console.error("Error fetching orders:", err);
        setError("Failed to load orders from trading engine.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let ignore = false;
    apiClient
      .get("/allOrders")
      .then((res) => {
        if (!ignore) {
          setOrders(res.data || []);
          setError(null);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Error fetching orders:", err);
          setError("Failed to load orders from trading engine.");
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [refreshKey, lastOrderUpdate]);

  const handleCancelOrder = async (orderId) => {
    if (!orderId || cancellingId) return;
    setCancellingId(orderId);
    try {
      const res = await apiClient.post(`/orders/${orderId}/cancel`);
      if (res.data?.success) {
        triggerRefresh();
        await fetchOrders();
      }
    } catch (err) {
      console.error("Error cancelling order:", err);
      alert(err.response?.data?.message || "Failed to cancel order.");
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || "EXECUTED").toUpperCase();
    let bg = "rgba(59, 130, 246, 0.15)";
    let color = "var(--accent-blue, #3b82f6)";
    let label = s;

    if (s === "PENDING") {
      bg = "rgba(245, 158, 11, 0.15)";
      color = "var(--warning, #f59e0b)";
      label = "PENDING";
    } else if (s === "PENDING_STOP") {
      bg = "rgba(249, 115, 22, 0.15)";
      color = "#fb923c";
      label = "PENDING STOP";
    } else if (s === "PENDING_LIMIT") {
      bg = "rgba(168, 85, 247, 0.15)";
      color = "#c084fc";
      label = "PENDING LIMIT";
    } else if (s === "EXECUTED") {
      bg = "rgba(16, 185, 129, 0.15)";
      color = "var(--profit, #10b981)";
      label = "EXECUTED";
    } else if (s === "CANCELLED") {
      bg = "rgba(156, 163, 175, 0.15)";
      color = "#9ca3af";
      label = "CANCELLED";
    } else if (s === "REJECTED") {
      bg = "rgba(239, 68, 68, 0.15)";
      color = "var(--loss, #ef4444)";
      label = "REJECTED";
    }

    return (
      <span
        style={{
          padding: "2px 8px",
          borderRadius: "4px",
          fontSize: "0.75rem",
          fontWeight: 600,
          backgroundColor: bg,
          color,
          display: "inline-block",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    );
  };

  if (loading && orders.length === 0) {
    return (
      <div className="orders">
        <h3 className="title">Orders</h3>
        <p style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>
          Loading orders...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders">
        <h3 className="title">Orders</h3>
        <div
          style={{
            textAlign: "center",
            padding: "30px",
            color: "var(--loss, #ef4444)",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            borderRadius: "8px",
          }}
        >
          <p>{error}</p>
          <button
            type="button"
            className="btn btn-blue"
            onClick={fetchOrders}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="orders">
        <div className="no-orders">
          <p>You haven't placed any orders yet</p>
          <Link to={"/"} className="btn btn-blue">
            Get started
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="orders">
      <h3 className="title">Orders ({orders.length})</h3>
      <div className="order-table">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Instrument</th>
              <th>Side</th>
              <th>Type</th>
              <th>Qty.</th>
              <th>Stop Price</th>
              <th>Limit Price</th>
              <th>Executed Price</th>
              <th>Total Value</th>
              <th>Realized P&L</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => {
              const isBuy = order.mode === "BUY";
              const isCancellable = ["PENDING", "PENDING_STOP", "PENDING_LIMIT"].includes(order.status);
              const totalVal =
                order.totalValue ??
                (order.qty || 0) * (order.executionPrice || order.limitPrice || order.price || 0);

              const formattedTime = order.createdAt
                ? new Date(order.createdAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                : "—";

              // Stop Price display
              let stopPriceDisplay = "—";
              if (order.stopPrice !== null && order.stopPrice !== undefined) {
                if (order.orderType === "TRAILING_STOP" && order.highestPrice) {
                  stopPriceDisplay = (
                    <div>
                      <span>₹{Number(order.stopPrice).toFixed(2)}</span>
                      <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                        Peak: ₹{Number(order.highestPrice).toFixed(2)}
                      </div>
                    </div>
                  );
                } else {
                  stopPriceDisplay = `₹${Number(order.stopPrice).toFixed(2)}`;
                }
              }

              const limitPriceDisplay =
                order.limitPrice !== null && order.limitPrice !== undefined
                  ? `₹${Number(order.limitPrice).toFixed(2)}`
                  : "—";

              const execPriceDisplay =
                order.executionPrice !== null && order.executionPrice !== undefined
                  ? `₹${Number(order.executionPrice).toFixed(2)}`
                  : order.price !== null && order.price !== undefined
                  ? `₹${Number(order.price).toFixed(2)}`
                  : "—";

              return (
                <tr key={order._id || index}>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                    {formattedTime}
                  </td>
                  <td className="tabular-nums">
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontWeight: 600 }}>{order.name}</span>
                      {order.ocoGroupId && (
                        <span
                          title="Part of an OCO bracket"
                          style={{
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            padding: "1px 5px",
                            borderRadius: "3px",
                            backgroundColor: "rgba(168, 85, 247, 0.2)",
                            color: "#c084fc",
                            border: "1px solid rgba(168, 85, 247, 0.4)",
                          }}
                        >
                          OCO
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="tabular-nums">
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        backgroundColor: isBuy
                          ? "rgba(16, 185, 129, 0.15)"
                          : "rgba(239, 68, 68, 0.15)",
                        color: isBuy
                          ? "var(--profit, #10b981)"
                          : "var(--loss, #ef4444)",
                      }}
                    >
                      {order.mode}
                    </span>
                  </td>
                  <td className="tabular-nums">
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        color: "var(--text-muted)",
                      }}
                    >
                      {order.orderType || "MARKET"}
                    </span>
                  </td>
                  <td className="tabular-nums">{order.qty}</td>
                  <td className="tabular-nums">{stopPriceDisplay}</td>
                  <td className="tabular-nums">{limitPriceDisplay}</td>
                  <td style={{ fontWeight: execPriceDisplay !== "—" ? 600 : 400 }}>
                    {execPriceDisplay}
                  </td>
                  <td className="tabular-nums">₹{totalVal.toFixed(2)}</td>
                  <td className="tabular-nums">
                    {!isBuy && order.realizedPnL !== undefined && order.status === "EXECUTED" ? (
                      <span
                        style={{
                          fontWeight: 600,
                          color:
                            order.realizedPnL >= 0
                              ? "var(--profit, #10b981)"
                              : "var(--loss, #ef4444)",
                        }}
                      >
                        {order.realizedPnL >= 0 ? "+" : ""}₹
                        {order.realizedPnL.toFixed(2)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="tabular-nums">{getStatusBadge(order.status)}</td>
                  <td className="tabular-nums">
                    {isCancellable ? (
                      <button
                        type="button"
                        onClick={() => handleCancelOrder(order._id)}
                        disabled={cancellingId === order._id}
                        title={order.ocoGroupId ? "Cancel entire OCO bracket" : "Cancel order"}
                        style={{
                          padding: "3px 10px",
                          fontSize: "0.75rem",
                          borderRadius: "4px",
                          border: "1px solid rgba(239, 68, 68, 0.4)",
                          backgroundColor: "rgba(239, 68, 68, 0.15)",
                          color: "var(--loss, #ef4444)",
                          cursor: cancellingId === order._id ? "not-allowed" : "pointer",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {cancellingId === order._id ? "Cancelling..." : "Cancel"}
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;
