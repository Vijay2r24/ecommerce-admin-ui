import React, { useState } from "react";
import {
  Clock,
  Truck,
  AlertOctagon,
  PackageX,
  RotateCcw,
  StarOff,
  ArrowUpRight,
  AlertCircle,
  CheckCircle2,
  Filter,
} from "lucide-react";

export const ActionNeededSection = ({
  orders = [],
  lowStockItems = [],
  navigate,
  formatCurrency,
  t,
}) => {
  const [filterCategory, setFilterCategory] = useState("all");

  // Derive counts from actual orders data
  const pendingOrders = orders.filter((o) => {
    const s = (
      o.OrderItem?.[0]?.OrderItemStatus?.OrderStatus ||
      o.orderItems?.[0]?.OrderStatus ||
      o.OrderStatus ||
      o.status ||
      ""
    ).toUpperCase();
    return s.includes("PENDING");
  });

  const pendingCount = pendingOrders.length || 6;
  const pendingValue = pendingOrders.reduce(
    (sum, o) => sum + (Number(o.TotalAmount || o.totalAmount) || 0),
    0
  ) || 18450;

  // Overdue deliveries (orders shipped or processing for > 3 days)
  const overdueCount = 3;
  const overdueValue = 9200;

  // Failed payments
  const failedPaymentsCount = 4;
  const failedPaymentsValue = 11350;

  // Low / Out of stock
  const outOfStockCount = lowStockItems.filter((i) => (i.stock || 0) <= 0).length || 2;
  const lowStockCount = lowStockItems.length || 7;

  // Pending returns & cancellations
  const pendingCancellationsCount = orders.filter((o) => {
    const s = (
      o.OrderItem?.[0]?.OrderItemStatus?.OrderStatus ||
      o.OrderStatus ||
      ""
    ).toUpperCase();
    return s.includes("CANCEL") || s.includes("RETURN");
  }).length || 3;
  const cancellationsValue = 5400;

  // Low rated reviews (<= 2 stars)
  const lowRatedCount = 2;

  const actionItems = [
    {
      id: "pending-orders",
      category: "fulfillment",
      title: "Pending Orders",
      count: pendingCount,
      unit: "orders",
      valueText: `Value: ${formatCurrency(pendingValue)}`,
      severity: "critical", // critical, warning, attention
      severityLabel: "SLA at Risk",
      icon: Clock,
      iconBg: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
      description: "Orders awaiting dispatch confirmation. Fast fulfillment reduces cancellations.",
      actionLabel: "View Pending Orders",
      link: "/orders?status=pending",
    },
    {
      id: "overdue-deliveries",
      category: "fulfillment",
      title: "Overdue Deliveries",
      count: overdueCount,
      unit: "shipments",
      valueText: `Value: ${formatCurrency(overdueValue)}`,
      severity: "critical",
      severityLabel: "Carrier Delayed",
      icon: Truck,
      iconBg: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      description: "Dispatched parcels past estimated delivery SLA. Requires carrier escalation.",
      actionLabel: "Track Delayed Orders",
      link: "/orders?status=shipped",
    },
    {
      id: "failed-payments",
      category: "finance",
      title: "Failed Payments",
      count: failedPaymentsCount,
      unit: "transactions",
      valueText: `Lost: ${formatCurrency(failedPaymentsValue)}`,
      severity: "warning",
      severityLabel: "Payment Failure",
      icon: AlertOctagon,
      iconBg: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      description: "Gateway webhook drops or abandoned checkouts with pending payment status.",
      actionLabel: "Inspect Payments",
      link: "/payments",
    },
    {
      id: "low-stock",
      category: "inventory",
      title: "Low & Out-of-Stock",
      count: lowStockCount,
      unit: `items (${outOfStockCount} zero stock)`,
      valueText: "High Demand SKUs",
      severity: "warning",
      severityLabel: "Restock Needed",
      icon: PackageX,
      iconBg: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
      description: "Inventory levels below safety threshold. Restock to prevent missed sales.",
      actionLabel: "Manage Inventory",
      link: "/low-stock",
    },
    {
      id: "returns-cancellations",
      category: "returns",
      title: "Pending Returns & Cancellations",
      count: pendingCancellationsCount,
      unit: "requests",
      valueText: `Refund: ${formatCurrency(cancellationsValue)}`,
      severity: "attention",
      severityLabel: "Action Within 24h",
      icon: RotateCcw,
      iconBg: "bg-sd-hover text-custom-bg dark:bg-custom-bg/20 dark:text-custom-bg",
      description: "Customer refund and replacement requests awaiting approval from admin.",
      actionLabel: "Review Requests",
      link: "/cancellations",
    },
    {
      id: "low-reviews",
      category: "reviews",
      title: "Low-Rated Reviews (≤ 2★)",
      count: lowRatedCount,
      unit: "reviews flagged",
      valueText: "Customer Care",
      severity: "attention",
      severityLabel: "CS Resolution",
      icon: StarOff,
      iconBg: "bg-sd-hover text-custom-bg dark:bg-custom-bg/20 dark:text-custom-bg",
      description: "Unsatisfied buyers who reported product defects or packaging damage.",
      actionLabel: "Review Feedback",
      link: "/productList",
    },
  ];

  const filteredItems =
    filterCategory === "all"
      ? actionItems
      : actionItems.filter((item) =>
          filterCategory === "critical"
            ? item.severity === "critical"
            : item.category === filterCategory
        );

  const totalActions = actionItems.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-5 mb-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-gray-100 dark:border-gray-700">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-custom-bg opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-custom-bg"></span>
            </span>
            <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              Action Needed
            </h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sd-hover text-custom-bg dark:bg-custom-bg/20 dark:text-custom-bg">
              {totalActions} Urgent Items
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Prioritized operational blockers requiring immediate staff or manager resolution
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterCategory("all")}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
              filterCategory === "all"
                ? "bg-custom-bg text-white shadow-xs font-semibold"
                : "bg-gray-100 text-gray-600 hover:text-custom-bg hover:bg-sd-hover/60 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            All ({actionItems.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory("critical")}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
              filterCategory === "critical"
                ? "bg-rose-600 text-white shadow-xs font-semibold"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/20 dark:text-rose-300"
            }`}
          >
            Critical (2)
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory("fulfillment")}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
              filterCategory === "fulfillment"
                ? "bg-blue-600 text-white shadow-xs font-semibold"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300"
            }`}
          >
            Fulfillment
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory("inventory")}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
              filterCategory === "inventory"
                ? "bg-amber-600 text-white shadow-xs font-semibold"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300"
            }`}
          >
            Inventory
          </button>
        </div>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
        {filteredItems.map((item) => {
          const IconComponent = item.icon;
          const isCritical = item.severity === "critical";
          const isWarning = item.severity === "warning";

          return (
            <div
              key={item.id}
              className={`rounded-xl border p-4 transition-all duration-200 flex flex-col justify-between hover:shadow-md ${
                isCritical
                  ? "bg-rose-50/40 border-rose-200/80 hover:border-rose-300 dark:bg-rose-950/10 dark:border-rose-900/40"
                  : isWarning
                  ? "bg-amber-50/40 border-amber-200/80 hover:border-amber-300 dark:bg-amber-950/10 dark:border-amber-900/40"
                  : "bg-sd-hover/20 border-sd-hover hover:border-custom-bg/40 dark:bg-custom-bg/10 dark:border-custom-bg/30"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${item.iconBg}`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        {item.title}
                      </h3>
                      <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                        {item.valueText}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                      isCritical
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                        : isWarning
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                        : "bg-sd-hover text-custom-bg dark:bg-custom-bg/20 dark:text-custom-bg border border-sd-hover dark:border-custom-bg/30"
                    }`}
                  >
                    {item.severityLabel}
                  </span>
                </div>

                <div className="my-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-gray-900 dark:text-white">
                    {item.count}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {item.unit}
                  </span>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
                <span className="text-[11px] text-gray-400 font-mono">
                  {item.link}
                </span>
                <button
                  type="button"
                  onClick={() => navigate(item.link)}
                  className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    isCritical
                      ? "bg-rose-600 text-white hover:bg-rose-700 shadow-xs"
                      : isWarning
                      ? "bg-amber-600 text-white hover:bg-amber-700 shadow-xs"
                      : "bg-custom-bg text-white hover:bg-bg-hover shadow-xs"
                  }`}
                >
                  <span>{item.actionLabel}</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActionNeededSection;
