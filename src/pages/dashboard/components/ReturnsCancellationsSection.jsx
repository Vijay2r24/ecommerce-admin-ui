import React from "react";
import {
  RotateCcw,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  HelpCircle,
  CheckCircle,
  FileText,
} from "lucide-react";

const RETURN_REASONS = [
  { reason: "Size / Fit Not Matching", percentage: 38, count: 18, color: "bg-custom-bg", advice: "Add size guide popup" },
  { reason: "Defective / Damaged in Transit", percentage: 24, count: 11, color: "bg-rose-500", advice: "Upgrade bubble wrap packaging" },
  { reason: "Delayed Delivery (Purchased Locally)", percentage: 18, count: 8, color: "bg-amber-500", advice: "Prioritize same-day dispatch" },
  { reason: "Product Differed from Photo / Color", percentage: 12, count: 6, color: "bg-purple-500", advice: "Update catalog photography" },
  { reason: "Changed Mind / Accidental Duplicate", percentage: 8, count: 4, color: "bg-gray-400", advice: "Standard customer remorse" },
];

const MOST_RETURNED_PRODUCTS = [
  {
    id: "ret-1",
    name: "Slim-Fit Stretch Denim Jeans (Blue)",
    category: "Apparel",
    returns: 14,
    returnRate: "11.2%",
    primaryReason: "Waist tighter than standard size chart",
    action: "Update Sizing Chart",
    severity: "warning",
  },
  {
    id: "ret-2",
    name: "Bluetooth Wireless Earbuds (Matte White)",
    category: "Electronics",
    returns: 9,
    returnRate: "8.4%",
    primaryReason: "Left earbud pairing issue",
    action: "Vendor Batch Quality Check",
    severity: "critical",
  },
  {
    id: "ret-3",
    name: "Ceramic Non-Stick Frying Pan (28cm)",
    category: "Cookware",
    returns: 6,
    returnRate: "4.1%",
    primaryReason: "Handle looseness during transit",
    action: "Improve Box Padding",
    severity: "attention",
  },
];

export const ReturnsCancellationsSection = ({
  orders = [],
  navigate,
  formatCurrency,
  t,
}) => {
  const cancellationRate = "2.8%";
  const returnRate = "3.4%";
  const totalCancelledRefund = 38900;

  return (
    <div className="space-y-6 mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-custom-bg" />
            <span>Returns & Cancellations</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Return rates, customer-reported reasons, and SKU defect flags
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/cancellations")}
          className="text-xs font-semibold text-custom-bg hover:text-bg-hover flex items-center gap-1"
        >
          <span>Manage Cancellation Requests</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Row 1: Key Rate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Order Cancellation Rate</span>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-gray-900 dark:text-white">{cancellationRate}</div>
            <p className="text-xs text-gray-400 mt-0.5">Industry benchmark: &lt; 4.0%</p>
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full inline-block w-fit">
            ✓ Healthy &amp; Low
          </span>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Product Return Rate</span>
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-gray-900 dark:text-white">{returnRate}</div>
            <p className="text-xs text-gray-400 mt-0.5">Fashion avg: 12-15%, Electronics avg: 4%</p>
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full inline-block w-fit">
            ✓ Within Safety Threshold
          </span>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Refund Capital Impact</span>
            <div className="p-2 rounded-lg bg-sd-hover dark:bg-custom-bg/20 text-custom-bg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-custom-bg">
              {formatCurrency(totalCancelledRefund)}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">Settled refunds across 21 requests</p>
          </div>
          <span className="text-[11px] text-gray-400">100% processed within 24 hrs</span>
        </div>
      </div>

      {/* Row 2: Return Reasons Breakdown & Most Returned Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reasons Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Customer-Reported Return Reasons
              </h3>
              <span className="text-xs text-gray-400">47 Total Reasons Logged</span>
            </div>

            <div className="space-y-4 mt-4">
              {RETURN_REASONS.map((r) => (
                <div key={r.reason} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{r.reason}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 font-mono">{r.count} orders</span>
                      <span className="font-black text-gray-900 dark:text-white">{r.percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${r.color}`} style={{ width: `${r.percentage}%` }} />
                  </div>
                  <span className="text-[10px] text-gray-400 italic">💡 {r.advice}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500">
            Fixing top 2 causes (sizing and transit packaging) can eliminate <strong className="font-bold">62%</strong> of all return requests.
          </div>
        </div>

        {/* Most Returned Products */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Most-Returned Products (Quality Flagged)</span>
              </h3>
              <span className="text-xs text-rose-600 font-bold">Action Needed</span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700 mt-2">
              {MOST_RETURNED_PRODUCTS.map((prod) => (
                <div key={prod.id} className="py-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white">{prod.name}</h4>
                      <span className="text-[11px] text-gray-400">{prod.category}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-rose-600">{prod.returns} returns</span>
                      <span className="block text-[10px] text-gray-400 font-mono">Rate: {prod.returnRate}</span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700/40 text-[11px] text-gray-600 dark:text-gray-300 flex items-center justify-between">
                    <span><strong>Report:</strong> {prod.primaryReason}</span>
                    <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 font-semibold text-[10px]">
                      {prod.action}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
            <span className="text-gray-400">Review vendor quality contracts</span>
            <button
              type="button"
              onClick={() => navigate("/productList")}
              className="text-custom-bg font-semibold hover:underline"
            >
              Open Product Catalog
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReturnsCancellationsSection;
