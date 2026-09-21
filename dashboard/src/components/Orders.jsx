import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import apiClient from "../config/api";
import GeneralContext from "./GeneralContext";
import { useMarketData } from "../context/MarketDataContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Ban,
  Loader2,
  RefreshCw,
  AlertCircle,
  FileText,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const Orders = () => {
  const { refreshKey, triggerRefresh } = useContext(GeneralContext);
  const { lastOrderUpdate } = useMarketData();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | PENDING | EXECUTED | CANCELLED
  const [pageSize, setPageSize] = useState(25); // 25 | 50 | 100 | "ALL"
  const [currentPage, setCurrentPage] = useState(1);
  const tableContainerRef = useRef(null);

  const fetchOrders = useCallback(() => {
    setLoading(true);
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
    if (s === "PENDING") {
      return (
        <Badge variant="warning" className="gap-1">
          <Clock className="size-3" />
          PENDING
        </Badge>
      );
    } else if (s === "PENDING_STOP") {
      return (
        <Badge variant="warning" className="gap-1 text-orange-400 border-orange-500/30 bg-orange-500/15">
          <Clock className="size-3" />
          PENDING STOP
        </Badge>
      );
    } else if (s === "PENDING_LIMIT") {
      return (
        <Badge variant="purple" className="gap-1">
          <Clock className="size-3" />
          PENDING LIMIT
        </Badge>
      );
    } else if (s === "EXECUTED") {
      return (
        <Badge variant="profit" className="gap-1">
          <CheckCircle2 className="size-3" />
          EXECUTED
        </Badge>
      );
    } else if (s === "CANCELLED") {
      return (
        <Badge variant="secondary" className="gap-1 text-slate-400">
          <Ban className="size-3" />
          CANCELLED
        </Badge>
      );
    } else if (s === "REJECTED") {
      return (
        <Badge variant="loss" className="gap-1">
          <AlertCircle className="size-3" />
          REJECTED
        </Badge>
      );
    }
    return <Badge variant="secondary">{s}</Badge>;
  };

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "PENDING") {
      return ["PENDING", "PENDING_STOP", "PENDING_LIMIT"].includes(o.status);
    }
    if (statusFilter === "EXECUTED") {
      return o.status === "EXECUTED";
    }
    if (statusFilter === "CANCELLED") {
      return ["CANCELLED", "REJECTED"].includes(o.status);
    }
    return true;
  });

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => ["PENDING", "PENDING_STOP", "PENDING_LIMIT"].includes(o.status)).length,
    executed: orders.filter((o) => o.status === "EXECUTED").length,
    cancelled: orders.filter((o) => ["CANCELLED", "REJECTED"].includes(o.status)).length,
  };

  const totalPages =
    pageSize === "ALL" ? 1 : Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const activePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedOrders =
    pageSize === "ALL"
      ? filteredOrders
      : filteredOrders.slice((activePage - 1) * pageSize, activePage * pageSize);

  const handleFilterChange = (filterId) => {
    setStatusFilter(filterId);
    setCurrentPage(1);
  };

  const scrollTable = (direction) => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollBy({
        left: direction === "left" ? -260 : 260,
        behavior: "smooth",
      });
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400 gap-3">
        <Loader2 className="size-8 text-cyan-400 animate-spin" />
        <p className="text-sm font-medium">Loading trading order book...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center max-w-md mx-auto space-y-4">
          <AlertCircle className="size-10 text-rose-400 mx-auto" />
          <div>
            <h3 className="text-lg font-bold text-white">Failed to load orders</h3>
            <p className="text-sm text-slate-400 mt-1">{error}</p>
          </div>
          <Button variant="gradient" onClick={fetchOrders} className="gap-2">
            <RefreshCw className="size-4" />
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Order Book
            <Badge variant="secondary">0</Badge>
          </h2>
        </div>

        <Card className="border-dashed border-white/10 bg-[#141414]/50">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="size-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mb-4">
              <FileText className="size-8 text-slate-500" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">No orders found</h3>
            <p className="text-sm text-slate-400 max-w-sm mb-6">
              You haven't placed any trades in this session yet. Explore the watchlist to execute your first market or limit order.
            </p>
            <Link to="/">
              <Button variant="gradient" className="gap-2">
                Explore Market Watchlist
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2.5">
            Order Book
            <Badge variant="secondary" className="font-mono">
              {orders.length}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchOrders}
              disabled={loading}
              className="h-6 px-2 text-[11px] text-slate-400 hover:text-white hover:bg-white/10 border border-white/10 rounded-lg gap-1.5 cursor-pointer transition-colors"
              title="Refresh order book"
            >
              <RefreshCw className={`size-3 ${loading ? "animate-spin text-cyan-400" : ""}`} />
              <span className="text-[11px] font-medium">Refresh</span>
            </Button>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Real-time audit log of all executed, pending, and conditional order lifecycle events.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 sm:gap-2 bg-[#171717] p-1 rounded-xl border border-white/5 text-xs font-semibold">
            {[
              { id: "ALL", label: "All", count: counts.all },
              { id: "PENDING", label: "Pending", count: counts.pending },
              { id: "EXECUTED", label: "Executed", count: counts.executed },
              { id: "CANCELLED", label: "Cancelled", count: counts.cancelled },
            ].map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleFilterChange(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    active
                      ? "bg-white/10 text-white shadow-sm font-bold"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] tabular-nums ${
                      active ? "bg-cyan-500/20 text-cyan-300" : "bg-white/5 text-slate-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Orders Table Card */}
      <Card className="overflow-hidden border border-white/10 bg-[#141414] flex flex-col shadow-xl">
        {/* Table Sub-Header / Quick Tools */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-[#171717]/60 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <FileText className="size-3.5 text-cyan-400" />
            <span className="font-semibold text-slate-300">Order History & Executions</span>
            <span className="text-slate-600">•</span>
            <span className="text-[11px] text-slate-500">
              {filteredOrders.length} {filteredOrders.length === 1 ? "record" : "records"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => scrollTable("left")}
              className="h-6 w-6 p-0 text-slate-400 hover:text-white hover:bg-white/10"
              title="Scroll table left"
            >
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => scrollTable("right")}
              className="h-6 w-6 p-0 text-slate-400 hover:text-white hover:bg-white/10"
              title="Scroll table right"
            >
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* Scrollable Viewport Container */}
        <div
          ref={tableContainerRef}
          className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 hover:[&::-webkit-scrollbar-thumb]:bg-white/30 [&::-webkit-scrollbar-track]:bg-black/30"
        >
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#171717]/80 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                <th className="py-3 px-4 whitespace-nowrap">Time</th>
                <th className="py-3 px-4 whitespace-nowrap">Instrument</th>
                <th className="py-3 px-4 whitespace-nowrap">Side</th>
                <th className="py-3 px-4 whitespace-nowrap">Type</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Qty.</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Stop Price</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Limit Price</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Exec. Price</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Total Value</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Realized P&L</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Status</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-xs">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan="12"
                    className="py-12 text-center text-slate-500 font-sans"
                  >
                    No orders match the selected filter.
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order, index) => {
                  const isBuy = order.mode === "BUY";
                  const isCancellable = ["PENDING", "PENDING_STOP", "PENDING_LIMIT"].includes(
                    order.status
                  );
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
                  let stopPriceDisplay = <span className="text-slate-500">—</span>;
                  if (order.stopPrice !== null && order.stopPrice !== undefined) {
                    if (order.orderType === "TRAILING_STOP" && order.highestPrice) {
                      stopPriceDisplay = (
                        <div className="flex flex-col items-end">
                          <span className="text-slate-200">₹{Number(order.stopPrice).toFixed(2)}</span>
                          <span className="text-[10px] text-slate-500">
                            Peak: ₹{Number(order.highestPrice).toFixed(2)}
                          </span>
                        </div>
                      );
                    } else {
                      stopPriceDisplay = (
                        <span className="text-slate-200">₹{Number(order.stopPrice).toFixed(2)}</span>
                      );
                    }
                  }

                  const limitPriceDisplay =
                    order.limitPrice !== null && order.limitPrice !== undefined ? (
                      <span className="text-slate-200">₹{Number(order.limitPrice).toFixed(2)}</span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    );

                  const execPriceDisplay =
                    order.executionPrice !== null && order.executionPrice !== undefined ? (
                      <span className="text-white font-bold">
                        ₹{Number(order.executionPrice).toFixed(2)}
                      </span>
                    ) : order.price !== null && order.price !== undefined ? (
                      <span className="text-slate-300">₹{Number(order.price).toFixed(2)}</span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    );

                  return (
                    <tr
                      key={order._id || index}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Time */}
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {formattedTime}
                      </td>

                      {/* Instrument */}
                      <td className="py-3 px-4 font-sans font-semibold text-white whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span>{order.name}</span>
                          {order.ocoGroupId && (
                            <Badge
                              variant="purple"
                              className="text-[10px] py-0 px-1.5 h-4 border-purple-500/40 bg-purple-500/20 text-purple-300"
                              title="Part of a One-Cancels-the-Other (OCO) Bracket"
                            >
                              OCO
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* Side */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant={isBuy ? "profit" : "loss"}
                          className="gap-1 font-sans text-[11px]"
                        >
                          {isBuy ? (
                            <ArrowUpRight className="size-3" />
                          ) : (
                            <ArrowDownRight className="size-3" />
                          )}
                          {order.mode}
                        </Badge>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-4 whitespace-nowrap font-sans text-xs text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">
                          {order.orderType || "MARKET"}
                        </span>
                      </td>

                      {/* Qty */}
                      <td className="py-3 px-4 text-right text-slate-200 tabular-nums">
                        {order.qty}
                      </td>

                      {/* Stop Price */}
                      <td className="py-3 px-4 text-right tabular-nums">
                        {stopPriceDisplay}
                      </td>

                      {/* Limit Price */}
                      <td className="py-3 px-4 text-right tabular-nums">
                        {limitPriceDisplay}
                      </td>

                      {/* Executed Price */}
                      <td className="py-3 px-4 text-right tabular-nums">
                        {execPriceDisplay}
                      </td>

                      {/* Total Value */}
                      <td className="py-3 px-4 text-right text-slate-200 tabular-nums font-semibold">
                        ₹{totalVal.toFixed(2)}
                      </td>

                      {/* Realized P&L */}
                      <td className="py-3 px-4 text-right tabular-nums">
                        {!isBuy &&
                        order.realizedPnL !== undefined &&
                        order.status === "EXECUTED" ? (
                          <span
                            className={`font-bold ${
                              order.realizedPnL >= 0 ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {order.realizedPnL >= 0 ? "+" : ""}₹
                            {order.realizedPnL.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap font-sans">
                        {getStatusBadge(order.status)}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center whitespace-nowrap font-sans">
                        {isCancellable ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelOrder(order._id)}
                            disabled={cancellingId === order._id}
                            className="h-7 px-2.5 text-xs font-semibold gap-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            title={
                              order.ocoGroupId
                                ? "Cancel entire OCO bracket"
                                : "Cancel this pending order"
                            }
                          >
                            {cancellingId === order._id ? (
                              <>
                                <Loader2 className="size-3 animate-spin" />
                                Cancelling...
                              </>
                            ) : (
                              <>
                                <Ban className="size-3" />
                                Cancel
                              </>
                            )}
                          </Button>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Table Footer */}
        {filteredOrders.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-white/10 bg-[#121212] text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <span>Showing</span>
              <span className="font-semibold text-white">
                {pageSize === "ALL"
                  ? `1–${filteredOrders.length}`
                  : `${Math.min((activePage - 1) * pageSize + 1, filteredOrders.length)}–${Math.min(
                      activePage * pageSize,
                      filteredOrders.length
                    )}`}
              </span>
              <span>of</span>
              <span className="font-semibold text-white">{filteredOrders.length}</span>
              <span>orders</span>
            </div>

            <div className="flex items-center gap-4 flex-wrap justify-center">
              {/* Rows per page selector */}
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(e.target.value === "ALL" ? "ALL" : Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-[#1a1a1a] border border-white/10 text-white rounded-md px-2 py-1 text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value="ALL">All ({filteredOrders.length})</option>
                </select>
              </div>

              {/* Page Navigation Buttons */}
              {pageSize !== "ALL" && totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={activePage === 1}
                    className="h-7 px-2 text-xs border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 disabled:pointer-events-none"
                    title="First Page"
                  >
                    «
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={activePage === 1}
                    className="h-7 px-2.5 text-xs border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    Previous
                  </Button>
                  <span className="px-2 text-slate-300">
                    Page <strong className="text-white">{activePage}</strong> of{" "}
                    <strong className="text-white">{totalPages}</strong>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={activePage === totalPages}
                    className="h-7 px-2.5 text-xs border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={activePage === totalPages}
                    className="h-7 px-2 text-xs border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 disabled:pointer-events-none"
                    title="Last Page"
                  >
                    »
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Orders;
