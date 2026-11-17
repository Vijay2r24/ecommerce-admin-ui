import React, { useState } from "react";
import {
  Boxes,
  Package,
  TrendingDown,
  TrendingUp,
  Star,
  DollarSign,
  Calendar,
  AlertCircle,
  ArrowUpRight,
  Sparkles,
  Tag,
} from "lucide-react";

const BEST_SELLERS = [
  { id: "bs-1", name: "Wireless Bluetooth Earbuds Pro", sales: 218, revenue: 327000, stock: 45, rating: 4.8 },
  { id: "bs-2", name: "Premium Casual Cotton Shirt", sales: 164, revenue: 196800, stock: 32, rating: 4.7 },
  { id: "bs-3", name: "Minimalist Leather Backpack", sales: 112, revenue: 224000, stock: 18, rating: 4.9 },
  { id: "bs-4", name: "Smart Fitness Watch V2", sales: 98, revenue: 245000, stock: 14, rating: 4.6 },
];

const WORST_SELLERS = [
  { id: "ws-1", name: "Neon Yellow Formal Trousers", sales: 1, revenue: 1499, stock: 78, daysStagnant: 64, deadStockValue: 116922 },
  { id: "ws-2", name: "Vintage Floral Ceramic Vase", sales: 2, revenue: 1998, stock: 42, daysStagnant: 52, deadStockValue: 41958 },
  { id: "ws-3", name: "Wired USB Stereo Headset (Gen 1)", sales: 3, revenue: 2097, stock: 55, daysStagnant: 71, deadStockValue: 38445 },
  { id: "ws-4", name: "Heavyweight Wool Trench Coat (XXL)", sales: 0, revenue: 0, stock: 19, daysStagnant: 90, deadStockValue: 66500 },
];

export const ProductInventorySection = ({
  topProducts = [],
  lowStockItems = [],
  navigate,
  formatCurrency,
  t,
}) => {
  const [sellerTab, setSellerTab] = useState("best"); // "best" or "worst"

  const totalStockValue = 2845000;
  const stockCoverageDays = 34; // Days of inventory runway
  const slowMovingCapital = 263825; // Dead stock value
  const avgCatalogRating = 4.7;

  return (
    <div className="space-y-6 mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-custom-bg" />
            <span>Product & Inventory Insights</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Inventory valuation, stock coverage runway, slow-moving capital, and performance extremes
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/InventoryList")}
          className="text-xs font-semibold text-custom-bg hover:text-bg-hover flex items-center gap-1"
        >
          <span>Inventory Management</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Row 1: Inventory Health & Valuation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total Stock Valuation */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Stock Valuation</span>
            <div className="p-2 rounded-lg bg-sd-hover dark:bg-custom-bg/20 text-custom-bg">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {formatCurrency(totalStockValue)}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Across 1,420 units in warehouse</p>
          </div>
          <span className="text-[11px] text-gray-500">Asset value on books</span>
        </div>

        {/* Stock Coverage Runway */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Stock Coverage Runway</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {stockCoverageDays} Days
            </div>
            <p className="text-xs text-gray-400 mt-0.5">At current 30-day sales velocity</p>
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">✓ Optimal (30-45d ideal)</span>
        </div>

        {/* Slow-Selling / Dead Stock Capital */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Slow-Selling Capital</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {formatCurrency(slowMovingCapital)}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">4 SKUs stagnant for &gt; 50 days</p>
          </div>
          <span className="text-[11px] text-amber-600 font-medium">Action: Run clearance discount</span>
        </div>

        {/* Catalog Average Rating */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Catalog Quality Rating</span>
            <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950/40 text-yellow-600">
              <Star className="w-4 h-4 fill-yellow-500" />
            </div>
          </div>
          <div className="my-2 flex items-baseline gap-2">
            <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {avgCatalogRating}
            </div>
            <span className="text-xs font-semibold text-gray-400">/ 5.0★</span>
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">Based on 1,280 customer reviews</span>
        </div>
      </div>

      {/* Row 2: Best Sellers vs. Worst Sellers Tabbed Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Product Velocity Extremes
            </h3>
            <div className="inline-flex rounded-lg bg-gray-100 dark:bg-gray-700/60 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setSellerTab("best")}
                className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                  sellerTab === "best"
                    ? "bg-white text-emerald-700 shadow-xs dark:bg-gray-800 dark:text-emerald-400 font-bold"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Best Sellers</span>
              </button>
              <button
                type="button"
                onClick={() => setSellerTab("worst")}
                className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                  sellerTab === "worst"
                    ? "bg-white text-rose-700 shadow-xs dark:bg-gray-800 dark:text-rose-400 font-bold"
                    : "text-gray-500 hover:text-gray-900 dark:text-gray-400"
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Slow / Worst Sellers</span>
              </button>
            </div>
          </div>
          <span className="text-xs text-gray-400">
            {sellerTab === "best" ? "Reorder stock before sellout" : "Clear capital holding up warehouse shelves"}
          </span>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700 text-gray-400 font-semibold uppercase text-[10px]">
                <th className="py-2.5 px-3">Product SKU</th>
                <th className="py-2.5 px-3 text-right">Units Sold</th>
                <th className="py-2.5 px-3 text-right">
                  {sellerTab === "best" ? "Net Revenue" : "Tied-Up Capital"}
                </th>
                <th className="py-2.5 px-3 text-right">
                  {sellerTab === "best" ? "Remaining Stock" : "Days Stagnant"}
                </th>
                <th className="py-2.5 px-3 text-right">Action Needed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {sellerTab === "best"
                ? BEST_SELLERS.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/40 transition">
                      <td className="py-3 px-3">
                        <div className="font-bold text-gray-900 dark:text-white">{item.name}</div>
                        <div className="text-[11px] text-yellow-600 flex items-center gap-1 mt-0.5">
                          <Star className="w-3 h-3 fill-yellow-500" />
                          <span>{item.rating} rating</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-black text-gray-900 dark:text-white">
                        {item.sales} units
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(item.revenue)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`font-mono font-bold text-xs ${
                            item.stock < 20 ? "text-rose-600" : "text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {item.stock} left
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => navigate("/low-stock")}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-sd-hover text-custom-bg hover:bg-custom-bg hover:text-white dark:bg-custom-bg/20 dark:text-custom-bg transition cursor-pointer"
                        >
                          Reorder Units
                        </button>
                      </td>
                    </tr>
                  ))
                : WORST_SELLERS.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/40 transition">
                      <td className="py-3 px-3">
                        <div className="font-bold text-gray-900 dark:text-white">{item.name}</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">Stock on hand: {item.stock} units</div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-rose-600">
                        {item.sales} sold
                      </td>
                      <td className="py-3 px-3 text-right font-black text-amber-600 dark:text-amber-400">
                        {formatCurrency(item.deadStockValue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-gray-500">
                        {item.daysStagnant} days idle
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => navigate("/productList")}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 transition"
                        >
                          Clearance Discount
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductInventorySection;
