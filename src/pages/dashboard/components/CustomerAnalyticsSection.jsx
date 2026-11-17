import React from "react";
import {
  Users,
  UserCheck,
  UserX,
  UserPlus,
  Crown,
  Mail,
  Send,
  ArrowUpRight,
  TrendingUp,
  Percent,
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const CUSTOMER_SPLIT = [
  { name: "New Customers", value: 68, count: 514, color: "#FF5A5F" },
  { name: "Returning Customers", value: 32, count: 242, color: "#10b981" },
];

const TOP_CUSTOMERS = [
  {
    id: "cust-1",
    name: "Aaryen Sharma",
    email: "aaryen.sharma@example.com",
    totalSpent: 48900,
    ordersCount: 16,
    tier: "Platinum",
    tierColor: "bg-sd-hover text-custom-bg border-custom-bg/30 dark:bg-custom-bg/20 dark:text-custom-bg",
    lastOrder: "2 days ago",
  },
  {
    id: "cust-2",
    name: "Lavanya Ananth",
    email: "lavanya.a351@gmail.com",
    totalSpent: 36450,
    ordersCount: 12,
    tier: "Gold",
    tierColor: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
    lastOrder: "Yesterday",
  },
  {
    id: "cust-3",
    name: "Vikram Reddy",
    email: "vikram.reddy@techcorp.in",
    totalSpent: 29800,
    ordersCount: 9,
    tier: "Gold",
    tierColor: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300",
    lastOrder: "5 days ago",
  },
  {
    id: "cust-4",
    name: "Pooja Malhotra",
    email: "pooja.m@lifestyle.com",
    totalSpent: 24200,
    ordersCount: 7,
    tier: "Silver",
    tierColor: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
    lastOrder: "1 week ago",
  },
];

export const CustomerAnalyticsSection = ({
  customersMetrics = {},
  navigate,
  formatCurrency,
  t,
}) => {
  return (
    <div className="space-y-6 mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-custom-bg" />
            <span>Customer Analytics</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Cohort segmentation, loyalty retention, VIP buyers, and onboarding funnels
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/users")}
          className="text-xs font-semibold text-custom-bg hover:text-bg-hover flex items-center gap-1"
        >
          <span>All Customers Directory</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* New vs Returning Customers (1 col) */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-custom-bg" />
                <span>New vs. Returning</span>
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sd-hover text-custom-bg dark:bg-custom-bg/20 dark:text-custom-bg">
                31.8% Retention
              </span>
            </div>

            <div className="h-44 w-full relative flex items-center justify-center my-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={CUSTOMER_SPLIT}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {CUSTOMER_SPLIT.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center pointer-events-none">
                <span className="text-xl font-black text-gray-900 dark:text-white">756</span>
                <span className="block text-[10px] text-gray-400 uppercase font-bold tracking-wider">Total</span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              {CUSTOMER_SPLIT.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="font-medium text-gray-700 dark:text-gray-300">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-mono">{item.count}</span>
                    <span className="font-bold text-gray-900 dark:text-white">{item.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-2.5 rounded-xl bg-sd-hover/40 dark:bg-custom-bg/10 border border-sd-hover dark:border-custom-bg/30 text-[11px] text-gray-800 dark:text-gray-200">
            Repeat shoppers generate <strong className="font-bold text-custom-bg">2.4x higher lifetime spend</strong> than one-time buyers.
          </div>
        </div>

        {/* Top VIP Customers (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Crown className="w-4 h-4 text-amber-500" />
                <span>Top High-Value Customers (VIPs)</span>
              </h3>
              <span className="text-xs text-gray-400">Ranked by overall net expenditure</span>
            </div>

            <div className="overflow-x-auto mt-3">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 text-gray-400 font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">VIP Tier</th>
                    <th className="py-2.5 px-3 text-right">Orders</th>
                    <th className="py-2.5 px-3 text-right">Total Spent</th>
                    <th className="py-2.5 px-3 text-right">Last Purchase</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {TOP_CUSTOMERS.map((cust) => (
                    <tr key={cust.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/40 transition">
                      <td className="py-3 px-3">
                        <div className="font-bold text-gray-900 dark:text-white">{cust.name}</div>
                        <div className="text-[11px] text-gray-400">{cust.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cust.tierColor}`}>
                          <Crown className="w-2.5 h-2.5" />
                          <span>{cust.tier}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-gray-800 dark:text-gray-200">
                        {cust.ordersCount}
                      </td>
                      <td className="py-3 px-3 text-right font-black text-gray-900 dark:text-white">
                        {formatCurrency(cust.totalSpent)}
                      </td>
                      <td className="py-3 px-3 text-right text-gray-400 text-[11px]">
                        {cust.lastOrder}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
            <span className="text-gray-400">Showing top 4 spenders</span>
            <button
              type="button"
              onClick={() => navigate("/users")}
              className="text-custom-bg font-semibold hover:underline"
            >
              Export Customer Segment (CSV)
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Inactive Customers & Incomplete Registrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inactive Customers Card */}
        <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/80 rounded-2xl border border-gray-200/80 dark:border-gray-700 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400">
                  <UserX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Inactive Customers (60+ Days)</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Customers with zero purchases recently</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">
                84 Inactive
              </span>
            </div>

            <div className="mt-4 p-3 bg-white dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600/50">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500 font-medium">Churn Probability Risk</span>
                <span className="font-bold text-orange-600">High (68%)</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mt-2">
                Estimated lost revenue of ₹1,18,000 if not re-engaged within the next 15 days.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">Automation Campaign Ready</span>
            <button
              type="button"
              onClick={() => navigate("/notifications")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white transition cursor-pointer shadow-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Launch Win-Back Offer</span>
            </button>
          </div>
        </div>

        {/* Incomplete Registrations Funnel */}
        <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-800/80 rounded-2xl border border-gray-200/80 dark:border-gray-700 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-sd-hover text-custom-bg dark:bg-custom-bg/20 dark:text-custom-bg">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Incomplete Registrations</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Drop-offs during customer signup flow</p>
                </div>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sd-hover text-custom-bg dark:bg-custom-bg/20 dark:text-custom-bg">
                28 Drop-offs
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Phone OTP Verification Step</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">14 users (50%)</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-custom-bg h-full rounded-full" style={{ width: "50%" }} />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-gray-500">Email Link Confirmation Step</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">9 users (32%)</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-custom-bg/70 h-full rounded-full" style={{ width: "32%" }} />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-gray-500">Primary Delivery Address Setup</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">5 users (18%)</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div className="bg-custom-bg/40 h-full rounded-full" style={{ width: "18%" }} />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <span className="text-[11px] text-gray-400">WhatsApp / SMS Reminders</span>
            <button
              type="button"
              onClick={() => navigate("/notifications")}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-custom-bg hover:bg-bg-hover text-white transition cursor-pointer shadow-xs"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Send Nudge Reminders</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAnalyticsSection;
