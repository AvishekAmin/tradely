import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import apiClient from "../config/api";
import GeneralContext from "./GeneralContext";

const Orders = () => {
  const { refreshKey } = useContext(GeneralContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    apiClient
      .get("/allOrders")
      .then((res) => {
        if (!ignore) {
          setOrders(res.data || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Error fetching orders:", err);
          setError("Failed to load orders from trading engine.");
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [refreshKey]);

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
            onClick={() => window.location.reload()}
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
              <th>Type</th>
              <th>Qty.</th>
              <th>Price</th>
              <th>Total Value</th>
              <th>Realized P&L</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => {
              const isBuy = order.mode === "BUY";
              const isExecuted = (order.status || "EXECUTED") === "EXECUTED";
              const totalVal =
                order.totalValue ?? (order.qty || 0) * (order.price || 0);

              const formattedTime = order.createdAt
                ? new Date(order.createdAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })
                : "—";

              return (
                <tr key={order._id || index}>
                  <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                    {formattedTime}
                  </td>
                  <td style={{ fontWeight: 600 }}>{order.name}</td>
                  <td>
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
                  <td>{order.qty}</td>
                  <td>₹{(order.price || 0).toFixed(2)}</td>
                  <td>₹{totalVal.toFixed(2)}</td>
                  <td>
                    {!isBuy && order.realizedPnL !== undefined ? (
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
                  <td>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        backgroundColor: isExecuted
                          ? "rgba(59, 130, 246, 0.15)"
                          : "rgba(239, 68, 68, 0.15)",
                        color: isExecuted
                          ? "var(--accent-blue, #3b82f6)"
                          : "var(--loss, #ef4444)",
                      }}
                    >
                      {order.status || "EXECUTED"}
                    </span>
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
