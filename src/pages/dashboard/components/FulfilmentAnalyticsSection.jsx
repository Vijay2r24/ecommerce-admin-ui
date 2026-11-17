import React from "react";
import {
  Truck,
  Clock,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  Send,
  Navigation,
  ArrowUpRight,
  ShieldCheck,
  Gauge,
} from "lucide-react";

const COURIER_PERFORMANCE = [
  { name: "Blue Dart Express", onTimeRate: "97.4%", avgDays: "1.9 days", shipments: 342, status: "Excellent" },
  { name: "Delhivery Surface & Air", onTimeRate: "95.1%", avgDays: "2.3 days", shipments: 284, status: "Good" },
  { name: "DTDC Logistics", onTimeRate: "91.8%", avgDays: "3.1 days", shipments: 112, status: "Attention" },
  { name: "Local Store Hyperlocal", onTimeRate: "99.4%", avgDays: "4.2 hrs", shipments: 78, status: "Fastest" },
];

const PIPELINE_STAGES = [
  { stage: "Awaiting Pick", count: 18, color: "bg-amber-500", desc: "Warehouse queue" },
  { stage: "Packed & Ready", count: 32, color: "bg-blue-500", desc: "Awaiting pickup" },
  { stage: "In Transit", count: 64, color: "bg-indigo-500", desc: "Courier network" },
  { stage: "Out for Delivery", count: 27, color: "bg-purple-500", desc: "Final mile delivery" },
  { stage: "Delivered", count: 615, color: "bg-emerald-500", desc: "Signed by recipient" },
];

export const FulfilmentAnalyticsSection = ({
  orders = [],
  navigate,
  t,
}) => {
  const onTimeRate = 95.4;
  const avgDispatchTime = "12.8 hrs";
  const avgDeliveryTime = "2.3 days";
  const totalCycleTime = "2.8 days";

  return (
    <div className="space-y-6 mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-custom-bg" />
            <span>Fulfilment & Delivery Analytics</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Dispatch velocity, courier SLAs, delivery compliance, and stage tracking
          </p>
        </div>
      </div>

      {/* Row 1: Key SLA & Time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* On-Time Delivery Rate */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">On-Time Delivery Rate</span>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {onTimeRate}%
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${onTimeRate}%` }} />
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-gray-400">
            <span>Target: 95.0%</span>
            <span className="text-emerald-600 font-semibold">+0.4% Above Target</span>
          </div>
        </div>

        {/* Avg Dispatch Time */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Avg Dispatch Velocity</span>
            <div className="p-2 rounded-lg bg-sd-hover dark:bg-custom-bg/20 text-custom-bg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {avgDispatchTime}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Order placed → Handed to carrier</p>
          </div>
          <span className="text-[11px] text-custom-bg font-medium">-2.1 hrs faster this month</span>
        </div>

        {/* Avg Transit Time */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">In-Transit Duration</span>
            <div className="p-2 rounded-lg bg-sd-hover dark:bg-custom-bg/20 text-custom-bg">
              <Navigation className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {avgDeliveryTime}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Shipped → Reached doorstep</p>
          </div>
          <span className="text-[11px] text-custom-bg font-medium">Metro pincodes: 1.4 days</span>
        </div>

        {/* Total Cycle Time */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Order Cycle Time</span>
            <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600">
              <PackageCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              {totalCycleTime}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">End-to-end customer journey</p>
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Top 5% in eCommerce class</span>
        </div>
      </div>

      {/* Row 2: Pipeline Stage Flow & Courier SLAs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fulfillment Pipeline Stage Tracker (1 col) */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-custom-bg" />
                <span>Live Fulfillment Pipeline</span>
              </h3>
              <span className="text-xs text-gray-400">755 Active</span>
            </div>

            <div className="space-y-3 mt-4">
              {PIPELINE_STAGES.map((stg, i) => (
                <div key={stg.stage} className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-600/50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center justify-center text-xs font-bold shadow-xs">
                      {i + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200">{stg.stage}</h4>
                      <span className="text-[10px] text-gray-400">{stg.desc}</span>
                    </div>
                  </div>
                  <span className="text-sm font-black text-gray-900 dark:text-white">
                    {stg.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/orders")}
            className="w-full mt-4 py-2 text-center text-xs font-semibold text-custom-bg bg-sd-hover hover:bg-custom-bg hover:text-white rounded-xl transition cursor-pointer"
          >
            Open Order Fulfillment Desk
          </button>
        </div>

        {/* Courier Partner Benchmark Table (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-custom-bg" />
                <span>Courier Partner SLA Scorecard</span>
              </h3>
              <span className="text-xs text-gray-400">Real carrier delivery performance</span>
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 text-gray-400 font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Carrier Partner</th>
                    <th className="py-2.5 px-3 text-right">Shipments</th>
                    <th className="py-2.5 px-3 text-right">Avg Transit</th>
                    <th className="py-2.5 px-3 text-right">On-Time Rate</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {COURIER_PERFORMANCE.map((c) => (
                    <tr key={c.name} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/40 transition">
                      <td className="py-3 px-3 font-bold text-gray-900 dark:text-white">
                        {c.name}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-gray-700 dark:text-gray-300">
                        {c.shipments}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-gray-600 dark:text-gray-400">
                        {c.avgDays}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                        {c.onTimeRate}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.status === "Excellent" || c.status === "Fastest"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : c.status === "Good"
                              ? "bg-sd-hover text-custom-bg dark:bg-custom-bg/20 dark:text-custom-bg"
                              : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
            <span>Automatic routing chooses Blue Dart for metro air and Delhivery for surface freight.</span>
            <span className="text-custom-bg font-semibold cursor-pointer hover:underline">Courier API Settings</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FulfilmentAnalyticsSection;
