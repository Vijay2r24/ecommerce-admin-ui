import React from "react";
import {
  CreditCard,
  Calendar,
  Layers,
  Bell,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Cpu,
  ShoppingBag,
  Store,
  Users,
  MessageSquare,
} from "lucide-react";

const CONNECTED_APPS = [
  {
    name: "Payment Gateway Engine",
    provider: "Razorpay / Stripe Direct",
    category: "Payments",
    status: "Active",
    uptime: "99.99%",
    icon: CreditCard,
    iconColor: "text-blue-600 bg-blue-50 dark:bg-blue-950/40",
  },
  {
    name: "AI Customer Support",
    provider: "Chatwoot + Node.js LLM (Groq & Gemini)",
    category: "Support",
    status: "Active",
    uptime: "100%",
    icon: MessageSquare,
    iconColor: "text-purple-600 bg-purple-50 dark:bg-purple-950/40",
  },
  {
    name: "Courier Logistics API",
    provider: "Blue Dart / Delhivery Auto-Dispatch",
    category: "Shipping",
    status: "Active",
    uptime: "99.8%",
    icon: Zap,
    iconColor: "text-amber-600 bg-amber-50 dark:bg-amber-950/40",
  },
  {
    name: "Transactional SMS & WhatsApp",
    provider: "Twilio / Meta Cloud API",
    category: "Messaging",
    status: "Active",
    uptime: "99.95%",
    icon: Bell,
    iconColor: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
  },
];

const RECENT_AUDIT_NOTIFICATIONS = [
  {
    id: "notif-1",
    title: "Store Performance Threshold Met",
    description: "Main Flagship Store crossed ₹1,00,000 in monthly revenue.",
    time: "2 hours ago",
    type: "success",
  },
  {
    id: "notif-2",
    title: "Staff Account Role Modified",
    description: "Admin granted store management permissions to testing staff.",
    time: "5 hours ago",
    type: "info",
  },
  {
    id: "notif-3",
    title: "Daily Data & Catalog Backup",
    description: "Cloud snapshot created and verified across databases.",
    time: "Yesterday, 04:00 AM",
    type: "info",
  },
  {
    id: "notif-4",
    title: "Monthly Subscription Receipt #INV-8821",
    description: "Enterprise tier payment successfully charged to card ending in 4242.",
    time: "3 days ago",
    type: "success",
  },
];

export const AccountPlanSection = ({
  navigate,
  t,
}) => {
  const planTier = "Growth Enterprise Tier";
  const renewalDate = "Dec 28, 2026";
  const daysLeft = 46;

  const usageLimits = [
    { name: "Active Stores", used: 4, limit: 5, unit: "stores", icon: Store, pct: 80, color: "bg-custom-bg" },
    { name: "Monthly Orders Quota", used: 756, limit: 1000, unit: "orders", icon: ShoppingBag, pct: 75.6, color: "bg-emerald-600" },
    { name: "Staff User Seats", used: 4, limit: 10, unit: "users", icon: Users, pct: 40, color: "bg-blue-600" },
    { name: "Product Catalog SKUs", used: 128, limit: 500, unit: "products", icon: Layers, pct: 25.6, color: "bg-custom-bg/70" },
  ];

  return (
    <div className="space-y-6 mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-custom-bg" />
            <span>Account & Plan Usage</span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Subscription limits, renewal status, connected app ecosystems, and system logs
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/subscription")}
          className="text-xs font-semibold text-custom-bg hover:text-bg-hover flex items-center gap-1"
        >
          <span>Billing & Plan Details</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Row 1: Plan Tier & Quota Usage Meters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tier Status Card (1 col) */}
        <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-white rounded-2xl p-5 shadow-lg border border-gray-700/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase font-bold tracking-wider text-custom-bg">Active Plan</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ● Active &amp; Verified
              </span>
            </div>

            <div className="mt-4">
              <h3 className="text-2xl font-black tracking-tight">{planTier}</h3>
              <p className="text-xs text-gray-300 mt-1">Multi-store ecommerce with AI and live analytics</p>
            </div>

            <div className="mt-6 p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300">Next Renewal Date</span>
                <span className="font-bold">{renewalDate}</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1.5">
                <span className="text-gray-300">Days Remaining</span>
                <span className="font-bold text-emerald-400">{daysLeft} days left</span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/upgrade-plan")}
              className="flex-1 py-2 text-center text-xs font-bold rounded-xl bg-custom-bg text-white hover:bg-bg-hover transition shadow-sm cursor-pointer"
            >
              Upgrade Tier
            </button>
            <button
              type="button"
              onClick={() => navigate("/subscription")}
              className="py-2 px-3 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer"
            >
              Invoices
            </button>
          </div>
        </div>

        {/* Plan Quotas & Limits (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-custom-bg" />
                <span>Subscription Resource Quotas</span>
              </h3>
              <span className="text-xs text-gray-400">Resets monthly</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              {usageLimits.map((quota) => {
                const IconComp = quota.icon;
                const isNearLimit = quota.pct >= 80;

                return (
                  <div key={quota.name} className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-700/40 border border-gray-100 dark:border-gray-600/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <IconComp className="w-4 h-4 text-gray-500" />
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{quota.name}</span>
                      </div>
                      <span className={`text-[11px] font-bold ${isNearLimit ? "text-amber-600" : "text-gray-500"}`}>
                        {quota.pct}%
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1.5 mb-2">
                      <span className="text-lg font-black text-gray-900 dark:text-white">{quota.used}</span>
                      <span className="text-xs text-gray-400">/ {quota.limit} {quota.unit}</span>
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-gray-600 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isNearLimit ? "bg-amber-500" : quota.color
                        }`}
                        style={{ width: `${quota.pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500">
            <span>Need more capacity? Upgrading to Enterprise Unlimited unlocks unlimited stores &amp; orders.</span>
            <button
              type="button"
              onClick={() => navigate("/upgrade-plan")}
              className="text-custom-bg font-bold hover:underline"
            >
              Compare Plans →
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Connected Integrations & Audit Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* App Installs & Connected Integrations */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-custom-bg" />
                <span>Connected App Ecosystem &amp; Integrations</span>
              </h3>
              <span className="text-xs font-semibold text-emerald-600">4 Active</span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700 mt-2">
              {CONNECTED_APPS.map((app) => {
                const IconComp = app.icon;
                return (
                  <div key={app.name} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${app.iconColor}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white">{app.name}</h4>
                        <span className="text-[11px] text-gray-400">{app.provider}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>{app.status}</span>
                      </span>
                      <span className="block text-[10px] text-gray-400 mt-0.5">Uptime: {app.uptime}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
            <span className="text-gray-400">All webhooks responding &lt; 85ms</span>
            <button
              type="button"
              onClick={() => navigate("/chat")}
              className="text-custom-bg font-semibold hover:underline"
            >
              Manage AI &amp; Webhooks
            </button>
          </div>
        </div>

        {/* Recent Audit Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xs border border-gray-100 dark:border-gray-700 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-amber-500" />
                <span>Recent System Notifications &amp; Audits</span>
              </h3>
              <span className="text-xs text-gray-400">Live feed</span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-700 mt-2">
              {RECENT_AUDIT_NOTIFICATIONS.map((item) => (
                <div key={item.id} className="py-2.5 flex flex-col gap-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{item.title}</span>
                    <span className="text-[10px] text-gray-400">{item.time}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
            <span className="text-gray-400">Audit logs retained for 90 days</span>
            <button
              type="button"
              onClick={() => navigate("/notifications")}
              className="text-custom-bg font-semibold hover:underline"
            >
              View Full Audit History →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPlanSection;
