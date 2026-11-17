import React from "react";
import {
  Heart,
  ShoppingCart,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Bell,
  Sparkles,
} from "lucide-react";

const MOST_WISHLISTED_PRODUCTS = [
  {
    id: "wish-1",
    name: "Noise-Cancelling Wireless Headphones Pro",
    category: "Electronics",
    wishlistCount: 184,
    price: 3499,
    stock: 24,
    status: "In Stock",
  },
  {
    id: "wish-2",
    name: "Classic Italian Leather Bifold Wallet",
    category: "Accessories",
    wishlistCount: 142,
    price: 1299,
    stock: 18,
    status: "In Stock",
  },
  {
    id: "wish-3",
    name: "Smart Fitness Tracker Band with Heart Monitor",
    category: "Wearables",
    wishlistCount: 119,
    price: 2199,
    stock: 35,
    status: "In Stock",
  },
  {
    id: "wish-4",
    name: "Pure Egyptian Cotton Premium Bath Towel Set",
    category: "Home & Living",
    wishlistCount: 88,
    price: 899,
    stock: 12,
    status: "Low Stock",
  },
];

const WISHLISTED_OUT_OF_STOCK = [
  {
    id: "oos-1",
    name: "Ultra-Lightweight Running Sneakers (Size 9)",
    category: "Footwear",
    wishlistCount: 52,
    price: 2899,
    potentialLoss: 150748,
    supplierLeadTime: "3 days",
  },
  {
    id: "oos-2",
    name: "Mechanical Gaming Keyboard RGB (Blue Switch)",
    category: "Gaming",
    wishlistCount: 38,
    price: 4499,
    potentialLoss: 170962,
    supplierLeadTime: "5 days",
  },
  {
    id: "oos-3",
    name: "Ceramic Minimalist Coffee Mug Set (Matte Black)",
    category: "Kitchenware",
    wishlistCount: 29,
    price: 799,
    potentialLoss: 23171,
    supplierLeadTime: "2 days",
  },
];

export const AbandonedCartsSection = ({
  navigate,
  formatCurrency,
  t,
}) => {
  const abandonedCount = 42;
  const abandonedValue = 134500;
  const recoveredCount = 8;
  const recoveredValue = 24800;
  const recoveryRate = "19.4%";

  return (
    <div className="space-y-6 mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-custom-bg fill-custom-bg" />
            <span>Abandoned Carts & Wishlist Demand</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Recoverable revenue, shopper intent, and high-demand inventory gaps
          </p>
        </div>
      </div>

      {/* Row 1: Abandoned Cart Economics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Abandoned Carts</span>
            <div className="p-2 rounded-lg bg-sd-hover dark:bg-custom-bg/20 text-custom-bg">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {abandonedCount} <span className="text-xs font-normal text-gray-400">carts</span>
          </div>
          <span className="text-[11px] text-custom-bg font-semibold">+4 since yesterday</span>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Lost Cart Value</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {formatCurrency(abandonedValue)}
          </div>
          <span className="text-[11px] text-gray-400">Avg {formatCurrency(3202)} / cart</span>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Recovery Rate</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <RefreshCw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {recoveryRate}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">{recoveredCount} carts converted</span>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Recovered Revenue</span>
            <div className="p-2 rounded-lg bg-sd-hover dark:bg-custom-bg/20 text-custom-bg">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-custom-bg">
            {formatCurrency(recoveredValue)}
          </div>
          <span className="text-[11px] text-gray-400">Via automated WhatsApp/Email</span>
        </div>
      </div>

      {/* Row 2: Most Wishlisted vs. Wishlisted Out of Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most-Wishlisted Products */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500" />
                <span>Most-Wishlisted Products</span>
              </h3>
              <span className="text-xs text-gray-400">High purchase interest</span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700 mt-2">
              {MOST_WISHLISTED_PRODUCTS.map((prod) => (
                <div key={prod.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sd-hover dark:bg-custom-bg/20 flex items-center justify-center text-custom-bg font-bold text-xs">
                      <Heart className="w-4 h-4 fill-custom-bg" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[200px]">
                        {prod.name}
                      </h4>
                      <span className="text-[11px] text-gray-400">{prod.category} · {formatCurrency(prod.price)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <span className="text-xs font-black text-custom-bg">
                        {prod.wishlistCount} saves
                      </span>
                      <div className="text-[10px] text-emerald-600 font-medium">
                        {prod.stock} in stock
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
            <span className="text-gray-400">Tip: Send special 10% coupon to wishlisters</span>
            <button
              type="button"
              onClick={() => navigate("/notifications")}
              className="text-custom-bg font-semibold hover:underline"
            >
              Broadcast Promotion
            </button>
          </div>
        </div>

        {/* Wishlisted OUT-OF-STOCK Items (Urgent Restock Demand!) */}
        <div className="bg-gradient-to-br from-sd-hover/40 to-white dark:from-gray-800 dark:to-gray-800 rounded-2xl shadow-xs border border-sd-hover dark:border-custom-bg/30 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-sd-hover/60 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-sd-hover dark:bg-custom-bg/20 text-custom-bg">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    Wishlisted But Out-of-Stock
                  </h3>
                  <p className="text-[11px] text-custom-bg font-medium">
                    Immediate lost sales! Shoppers want these now.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-custom-bg text-white shadow-xs">
                3 Critical SKUs
              </span>
            </div>

            <div className="divide-y divide-sd-hover/60 dark:divide-gray-700 mt-2">
              {WISHLISTED_OUT_OF_STOCK.map((prod) => (
                <div key={prod.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                      {prod.name}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                      <span className="text-custom-bg font-semibold">{prod.wishlistCount} customers waiting</span>
                      <span>·</span>
                      <span className="text-gray-400">Supplier: {prod.supplierLeadTime}</span>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <span className="text-xs font-black text-custom-bg">
                      ~{formatCurrency(prod.potentialLoss)}
                    </span>
                    <span className="text-[10px] text-gray-400">Potential loss</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-sd-hover/60 dark:border-gray-700 flex items-center justify-between">
            <span className="text-[11px] text-gray-700 dark:text-gray-300 font-medium">
              Total Lost Opportunity: <strong className="font-bold text-custom-bg">₹3,44,881</strong>
            </span>
            <button
              type="button"
              onClick={() => navigate("/low-stock")}
              className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-custom-bg hover:bg-bg-hover text-white transition cursor-pointer shadow-xs"
            >
              <span>Restock Inventory</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbandonedCartsSection;
