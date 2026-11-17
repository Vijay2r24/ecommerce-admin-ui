import React, { useState } from "react";
import {
  TrendingUp,
  CreditCard,
  Building2,
  PieChart as PieIcon,
  Award,
  ArrowUp,
  ArrowDown,
  ShoppingBag,
  IndianRupee,
  Smartphone,
  Landmark,
  Wallet,
  Banknote,
  CheckCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PAYMENT_METHODS = [
  { name: "UPI (GPay / PhonePe)", percentage: 52, amount: 184500, color: "#FF5A5F", icon: Smartphone, successRate: "98.8%" },
  { name: "Credit / Debit Cards", percentage: 26, amount: 92300, color: "#3b82f6", icon: CreditCard, successRate: "97.2%" },
  { name: "Net Banking", percentage: 11, amount: 39100, color: "#10b981", icon: Landmark, successRate: "96.4%" },
  { name: "Cash on Delivery (COD)", percentage: 8, amount: 28400, color: "#f59e0b", icon: Banknote, successRate: "92.1%" },
  { name: "Wallets", percentage: 3, amount: 10600, color: "#ec4899", icon: Wallet, successRate: "99.1%" },
];

export const SalesAnalyticsSection = ({
  chartData = [],
  revenueMetrics = {},
  ordersMetrics = {},
  averageOrderMetrics = {},
  stores = [],
  selectedStores = [],
  comparisonMode = false,
  storeColors = {},
  formatCurrency,
  t,
}) => {
  const [chartViewMode, setChartViewMode] = useState("combined"); // "combined", "revenue", "orders"

  // Derive store ranking data
  const storeRankings = (stores.length > 0 ? stores : [
    { value: "1", label: "Main Flagship Store" },
    { value: "2", label: "Online Direct Store" },
    { value: "3", label: "Downtown Branch" },
    { value: "4", label: "Airport Mall Outlet" },
  ]).map((store, index) => {
    const revMultiplier = [0.44, 0.28, 0.18, 0.10][index] || 0.08;
    const ordMultiplier = [0.42, 0.30, 0.19, 0.09][index] || 0.07;
    const baseRev = 354900;
    const baseOrd = 756;
    return {
      rank: index + 1,
      name: store.label || `Store ${store.value}`,
      revenue: Math.round(baseRev * revMultiplier),
      orders: Math.round(baseOrd * ordMultiplier),
      growth: index === 0 ? "+18.4%" : index === 1 ? "+12.1%" : index === 2 ? "+4.2%" : "-1.5%",
      isPositive: index !== 3,
      share: Math.round(revMultiplier * 100),
    };
  });

  return (
    <div className="space-y-6 mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-custom-bg" />
            <span>Sales Analytics</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Revenue trends, basket economics, payment methods, and store leaderboard
          </p>
        </div>
      </div>

      {/* Row 1: Revenue Trends Chart & AOV Economics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trends (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  Revenue & Orders Trends
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sd-hover text-custom-bg dark:bg-custom-bg/20 dark:text-custom-bg">
                  Daily Interval
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Multi-dimensional volume and value progression
              </p>
            </div>

            {/* Toggle Modes */}
            <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-700/60 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setChartViewMode("combined")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  chartViewMode === "combined"
                    ? "bg-white text-gray-900 shadow-xs dark:bg-gray-800 dark:text-white font-semibold"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
                }`}
              >
                Combined
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode("revenue")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  chartViewMode === "revenue"
                    ? "bg-white text-custom-bg shadow-xs dark:bg-gray-800 dark:text-custom-bg font-semibold"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
                }`}
              >
                Revenue Only
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode("orders")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  chartViewMode === "orders"
                    ? "bg-white text-emerald-600 shadow-xs dark:bg-gray-800 dark:text-emerald-400 font-semibold"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
                }`}
              >
                Orders Only
              </button>
            </div>
          </div>

          {/* Chart Canvas */}
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF5A5F" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#FF5A5F" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                {(chartViewMode === "combined" || chartViewMode === "revenue") && (
                  <YAxis
                    yAxisId="rev"
                    tick={{ fontSize: 10, fill: "#FF5A5F" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                )}
                {(chartViewMode === "combined" || chartViewMode === "orders") && (
                  <YAxis
                    yAxisId="ord"
                    orientation="right"
                    tick={{ fontSize: 10, fill: "#10b981" }}
                    axisLine={false}
                    tickLine={false}
                  />
                )}
                <Tooltip
                  formatter={(val, name) => [
                    name === "Revenue" ? formatCurrency(val) : val,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "0.75rem",
                    border: "1px solid #e2e8f0",
                    fontSize: "0.75rem",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: 10 }} />
                {(chartViewMode === "combined" || chartViewMode === "revenue") && (
                  <Area
                    yAxisId="rev"
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#FF5A5F"
                    strokeWidth={2.5}
                    fill="url(#salesRevGrad)"
                    dot={{ fill: "#FF5A5F", r: 2 }}
                    activeDot={{ r: 5 }}
                  />
                )}
                {(chartViewMode === "combined" || chartViewMode === "orders") && (
                  <Line
                    yAxisId="ord"
                    type="monotone"
                    dataKey="orders"
                    name="Orders"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ fill: "#10b981", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AOV & Basket Economics (1 col) */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-amber-500" />
                <span>Average Order Value (AOV)</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                +8.4% YoY
              </span>
            </div>

            <div className="mt-4">
              <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                {averageOrderMetrics.value || "₹1,460"}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Average spend per completed transaction
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-600/50">
                <span className="text-[11px] text-gray-400 font-medium">Avg Items / Basket</span>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">2.8 units</p>
                <span className="text-[10px] text-emerald-600 font-semibold">+0.3 items</span>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-600/50">
                <span className="text-[11px] text-gray-400 font-medium">Highest Single Order</span>
                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">₹14,990</p>
                <span className="text-[10px] text-gray-400">Electronics SKU</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
            💡 <strong className="text-gray-700 dark:text-gray-300">AOV Boost Tip:</strong> Offering free shipping above ₹1,999 can increase current AOV by ~14%.
          </div>
        </div>
      </div>

      {/* Row 2: Payment-Method Breakdown & Store Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment-Method Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-custom-bg" />
                <span>Payment Method Breakdown</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Share of total settled revenue volume</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sd-hover text-custom-bg dark:bg-custom-bg/20 dark:text-custom-bg">
              97.4% Avg Success
            </span>
          </div>

          <div className="space-y-3 mt-4">
            {PAYMENT_METHODS.map((method) => {
              const IconComp = method.icon;
              return (
                <div key={method.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <IconComp className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{method.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 font-medium">{formatCurrency(method.amount)}</span>
                      <span className="font-bold text-gray-900 dark:text-white">{method.percentage}%</span>
                      <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">
                        {method.successRate}
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${method.percentage}%`, backgroundColor: method.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Store Rankings Leaderboard */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Award className="w-4 h-4 text-custom-bg" />
                <span>Store Performance Rankings</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Contribution & growth comparison across retail locations</p>
            </div>
            <span className="text-xs font-semibold text-gray-500">
              {storeRankings.length} Active Stores
            </span>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700 mt-2">
            {storeRankings.map((store) => (
              <div key={store.rank} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                      store.rank === 1
                        ? "bg-sd-hover text-custom-bg border border-custom-bg/30"
                        : store.rank === 2
                        ? "bg-slate-200 text-slate-800"
                        : store.rank === 3
                        ? "bg-amber-900/10 text-amber-900"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {store.rank}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">{store.name}</h4>
                    <span className="text-[11px] text-gray-400">{store.orders} orders fulfilled</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {formatCurrency(store.revenue)}
                    </span>
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      <span className="text-[10px] text-gray-400">Share: {store.share}%</span>
                      <span
                        className={`text-[10px] font-semibold ${
                          store.isPositive ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {store.growth}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesAnalyticsSection;
