import { useState, useEffect, useMemo, useRef } from "react";
import SelectWithIcon from "../../components/SelectWithIcon";
import {
  TrendingUp,
  ShoppingCart,
  Users,
  Package,
  ArrowUp,
  ArrowDown,
  Star,
  Clock,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  BarChart2,
  CheckCircle2,
  IndianRupee,
  Store,
  LayoutDashboard,
  Heart,
  Truck,
  RotateCcw,
  Boxes,
  ShieldCheck,
  Layers,
  Activity,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTitle } from "../../context/TitleContext";
import DateTimeRangePickerComponent from "../../components/CustomDatePicker";
import { useStores } from "../../context/AllDataContext";
import {
  GET_TOTAL_REVENUE,
  GET_TOTAL_ORDERS,
  GET_TOTAL_CUSTOMERS,
  GET_RECENT_ORDERS,
  GET_TOP_PRODUCTS,
  GETALLORDERS_API,
  GET_STORE_REVENUE_GRAPH,
  GET_STORE_ORDERS_GRAPH,
  GET_LOW_STOCK,
} from "../../contants/apiRoutes";
import { apiGet } from "../../utils/ApiUtils";
import { isFeatureCodeEnabled } from "../../utils/permissionUtils";
import { ENABLED_FEATURE_CODES } from "../../contants/constants";
import { showEmsg } from "../../utils/ShowEmsg";
import Loader from "../../components/Loader";
import SkeletonLoader from "../../components/SkeletonLoader";

// Modular Dashboard Approach Sections
import ActionNeededSection from "./components/ActionNeededSection";
import SalesAnalyticsSection from "./components/SalesAnalyticsSection";
import CustomerAnalyticsSection from "./components/CustomerAnalyticsSection";
import AbandonedCartsSection from "./components/AbandonedCartsSection";
import FulfilmentAnalyticsSection from "./components/FulfilmentAnalyticsSection";
import ReturnsCancellationsSection from "./components/ReturnsCancellationsSection";
import ProductInventorySection from "./components/ProductInventorySection";
import AccountPlanSection from "./components/AccountPlanSection";
import {
  LOCALE,
  ORDER_STATUS,
  DASHBOARD_DEFAULT_LIMIT,
  CURRENCY,
  STATUS,
} from "../../contants/constants";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
} from "recharts";

dayjs.extend(weekOfYear);

/** Max stores sent to graph APIs and shown on revenue/orders charts */
const DASHBOARD_GRAPH_MAX_STORES = 10;

const formatChartCurrency = (value) =>
  `\u20B9${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`;

const GRAPH_REVENUE_KEYS = [
  "revenue",
  "Revenue",
  "totalRevenue",
  "TotalRevenue",
  "amount",
  "Amount",
  "storeRevenue",
  "StoreRevenue",
  "value",
  "Value",
];
const GRAPH_ORDER_KEYS = [
  "orders",
  "Orders",
  "totalOrders",
  "TotalOrders",
  "orderCount",
  "OrderCount",
  "count",
  "Count",
  "value",
  "Value",
];

/** UUID store ids contain `_`; never use `split('_')[1]` on `revenue_<uuid>`. */
function storeIdFromSeriesDataKey(dataKey) {
  if (typeof dataKey !== "string") return "";
  if (dataKey.startsWith("revenue_")) return dataKey.slice("revenue_".length);
  if (dataKey.startsWith("orders_")) return dataKey.slice("orders_".length);
  return "";
}

function seriesValueFromTooltipEntry(entry) {
  if (!entry) return 0;
  const raw =
    entry.value ??
    (entry.payload && entry.dataKey != null
      ? entry.payload[entry.dataKey]
      : undefined);
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function pickNumberField(obj, keys) {
  if (!obj || typeof obj !== "object") return 0;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "")
      return Number(obj[k]) || 0;
  }
  return 0;
}

function extractGraphEnvelope(res) {
  const body = res?.data;
  if (!body || typeof body !== "object") return { kind: "none" };
  const inner = Object.prototype.hasOwnProperty.call(body, "data")
    ? body.data
    : body;
  if (Array.isArray(inner)) return { kind: "array", rows: inner };
  if (inner && typeof inner === "object") {
    const storeKeys = Object.keys(inner).filter(
      (k) => Array.isArray(inner[k]) && /^[0-9a-f-]{36}$/i.test(k)
    );
    if (storeKeys.length)
      return { kind: "byStore", obj: inner, storeKeys };
  }
  return { kind: "none" };
}

function labelFromPoint(p) {
  if (p == null || typeof p !== "object") return "";
  if (p.label != null) return String(p.label).trim();
  if (p.Label != null) return String(p.Label).trim();
  if (p.timeLabel != null) return String(p.timeLabel).trim();
  const raw =
    p.timestamp ??
    p.Timestamp ??
    p.date ??
    p.Date ??
    p.time ??
    p.Time ??
    p.bucketStart ??
    p.BucketStart ??
    p.startTime ??
    p.StartTime ??
    "";
  return raw ? String(raw).trim() : "";
}

function storeFromPoint(p) {
  if (!p || typeof p !== "object") return null;
  const sid = p.storeId ?? p.StoreID ?? p.StoreId ?? p.store_id ?? null;
  return sid != null && sid !== "" ? String(sid) : null;
}

function flattenGraphRows(parsed, valueKeys) {
  const out = [];
  if (parsed.kind === "array") {
    for (const p of parsed.rows || []) {
      out.push({
        label: labelFromPoint(p),
        storeId: storeFromPoint(p),
        value: pickNumberField(p, valueKeys),
      });
    }
    return out;
  }
  if (parsed.kind === "byStore") {
    for (const sid of parsed.storeKeys) {
      for (const p of parsed.obj[sid] || []) {
        out.push({
          label: labelFromPoint(p),
          storeId: sid,
          value: pickNumberField(p, valueKeys),
        });
      }
    }
    return out;
  }
  return out;
}

/** Pull `{ interval, graph }` from various API envelope shapes */
function extractGraphPayload(res) {
  const root = res?.data;
  if (!root || typeof root !== "object") return null;
  let inner = root.data ?? root.Data;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    if (Array.isArray(inner.graph) || Array.isArray(inner.Graph))
      return inner;
    const nested = inner.data ?? inner.Data;
    if (
      nested &&
      typeof nested === "object" &&
      (Array.isArray(nested.graph) || Array.isArray(nested.Graph))
    )
      return nested;
  }
  return null;
}

/** Backend shape: { data: { interval, graph: [{ startTime, endTime, stores: [{ storeId, revenue|orders }] }] } } */
function extractIntervalGraphRows(res, metric) {
  const payload = extractGraphPayload(res);
  if (!payload || typeof payload !== "object") return [];
  const graph = payload.graph ?? payload.Graph;
  if (!Array.isArray(graph)) return [];

  const out = [];
  for (const bucket of graph) {
    const labelRaw =
      bucket?.startTime ??
      bucket?.StartTime ??
      bucket?.start ??
      "";
    if (!labelRaw) continue;

    const stores = bucket.stores ?? bucket.Stores ?? [];
    for (const s of stores) {
      const storeId = String(
        s?.storeId ?? s?.StoreID ?? s?.StoreId ?? ""
      ).trim();
      let value = 0;
      if (metric === "revenue") {
        value = Number(s?.revenue ?? s?.Revenue ?? 0) || 0;
      } else {
        value =
          Number(
            s?.orders ??
              s?.Orders ??
              s?.orderCount ??
              s?.OrderCount ??
              s?.totalOrders ??
              s?.TotalOrders ??
              0
          ) || 0;
      }
      out.push({
        label: String(labelRaw).trim(),
        storeId: storeId || null,
        value,
      });
    }
  }

  // Add a synthetic zero-value endpoint using the last bucket's endTime
  // so the chart line extends to the full range end
  const lastBucket = graph[graph.length - 1];
  const endTimeRaw = lastBucket?.endTime ?? lastBucket?.EndTime ?? lastBucket?.end ?? "";
  if (endTimeRaw) {
    const lastStores = lastBucket?.stores ?? lastBucket?.Stores ?? [];
    for (const s of lastStores) {
      const storeId = String(s?.storeId ?? s?.StoreID ?? s?.StoreId ?? "").trim();
      out.push({ label: String(endTimeRaw).trim(), storeId: storeId || null, value: 0 });
    }
  }

  return out;
}

function graphLabelFormat(start, end) {
  const diffMinutes = end.diff(start, "minute");
  const diffDays = end.diff(start, "day", true);
  if (diffMinutes <= 60) return "HH:mm";
  if (diffMinutes <= 360) return "HH:mm";
  if (diffDays <= 1) return "HH:mm";
  if (diffDays <= 3) return "D MMM HH:mm";
  if (diffDays <= 14) return "D MMM";
  if (diffDays <= 60) return "D MMM";
  return "D MMM YY";
}

function mergeKeyForLabel(label) {
  const d = dayjs(label);
  if (d.isValid()) return d.valueOf();
  return label;
}

function mergeRevenueOrdersGraphRows(revRows, ordRows, selectedStoreIds) {
  const multi = selectedStoreIds.length > 1;
  const map = new Map();

  const getRow = (labelRaw) => {
    const sk = mergeKeyForLabel(labelRaw);
    if (!map.has(sk)) {
      // Use ISO `labelRaw` as chart `label` so Recharts never gets duplicate X categories
      // when the same calendar day appears in multiple buckets.
      const row = { _sk: sk, label: String(labelRaw).trim() };
      if (multi) {
        selectedStoreIds.forEach((id) => {
          row[`revenue_${id}`] = 0;
          row[`orders_${id}`] = 0;
        });
      } else {
        row.revenue = 0;
        row.orders = 0;
      }
      map.set(sk, row);
    }
    return map.get(sk);
  };

  const applyRev = (row, storeId, v) => {
    if (!multi) {
      const only = selectedStoreIds[0];
      if (only && storeId && storeId !== only) return;
      row.revenue = (row.revenue || 0) + v;
      return;
    }
    if (storeId && selectedStoreIds.includes(storeId)) {
      const k = `revenue_${storeId}`;
      row[k] = (row[k] || 0) + v;
      return;
    }
    row._rAgg = (row._rAgg || 0) + v;
    selectedStoreIds.forEach((id) => {
      row[`revenue_${id}`] = row._rAgg;
    });
  };

  const applyOrd = (row, storeId, v) => {
    if (!multi) {
      const only = selectedStoreIds[0];
      if (only && storeId && storeId !== only) return;
      row.orders = (row.orders || 0) + v;
      return;
    }
    if (storeId && selectedStoreIds.includes(storeId)) {
      const k = `orders_${storeId}`;
      row[k] = (row[k] || 0) + v;
      return;
    }
    row._oAgg = (row._oAgg || 0) + v;
    selectedStoreIds.forEach((id) => {
      row[`orders_${id}`] = row._oAgg;
    });
  };

  for (const r of revRows) {
    if (!r.label) continue;
    const row = getRow(r.label);
    applyRev(row, r.storeId, r.value);
  }
  for (const r of ordRows) {
    if (!r.label) continue;
    const row = getRow(r.label);
    applyOrd(row, r.storeId, r.value);
  }

  const sorted = [...map.values()].sort((a, b) => {
    const av = typeof a._sk === "number" ? a._sk : 0;
    const bv = typeof b._sk === "number" ? b._sk : 0;
    if (av && bv && av !== bv) return av - bv;
    return String(a.label).localeCompare(String(b.label));
  });

  return sorted.map(({ _sk, _rAgg, _oAgg, ...rest }) => ({ ...rest }));
}

const FALLBACK_STATUS_DATA = [
  { name: "Pending",    value: 0, color: "#FCD34D" },
  { name: "Processing", value: 0, color: "#60A5FA" },
  { name: "Shipped",    value: 0, color: "#818CF8" },
  { name: "Delivered",  value: 0, color: "#34D399" },
  { name: "Cancelled",  value: 0, color: "#FB923C" },
  { name: "Returned",   value: 0, color: "#F472B6" },
];

/** Placeholder while chart data loads — avoids bar-shaped pulses that look like a bar chart. */
function LineChartSkeleton({
  strokeClass = "text-indigo-300",
  heightClass = "h-[250px]",
}) {
  return (
    <div
      className={`${heightClass} relative rounded-lg bg-slate-50/90 flex flex-col items-center justify-center gap-3 px-2`}
      role="status"
      aria-label="Loading chart"
    >
      <svg
        className={`w-full max-w-4xl h-28 animate-pulse ${strokeClass}`}
        viewBox="0 0 400 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path
          d="M0,80 C60,25 120,90 180,45 S280,15 340,55 L400,35"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-[11px] text-slate-400">Loading chart…</span>
    </div>
  );
}


const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <text x={cx} y={cy - 10} textAnchor="middle" fill="#111827" className="text-sm" style={{ fontSize: 13, fontWeight: 600 }}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#6b7280" style={{ fontSize: 12 }}>
        {value} orders
      </text>
      <text x={cx} y={cy + 30} textAnchor="middle" fill="#6b7280" style={{ fontSize: 11 }}>
        ({(percent * 100).toFixed(1)}%)
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={innerRadius - 4} outerRadius={innerRadius - 2} startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
};


const DASHBOARD_PRESETS = [
  {
    id: "today",
    label: "Today",
    getRange: () => ({
      start: dayjs().startOf("day"),
      end: dayjs().endOf("day"),
    }),
  },
  {
    id: "last7Days",
    label: "Last 7 Days",
    getRange: () => ({
      start: dayjs().subtract(7, "day").startOf("day"),
      end: dayjs().endOf("day"),
    }),
  },
  {
    id: "last30Days",
    label: "Last 30 Days",
    getRange: () => ({
      start: dayjs().subtract(30, "day").startOf("day"),
      end: dayjs().endOf("day"),
    }),
  },
  {
    id: "thisMonth",
    label: "This Month",
    getRange: () => ({
      start: dayjs().startOf("month"),
      end: dayjs().endOf("day"),
    }),
  },
];

const DASHBOARD_TABS = [
  { id: "overview", label: "Executive Overview", icon: LayoutDashboard },
  { id: "action_needed", label: "Action Needed", icon: AlertCircle, badge: "6 Urgent" },
  { id: "sales", label: "Sales Analytics", icon: TrendingUp },
  { id: "customers", label: "Customer Analytics", icon: Users },
  { id: "abandoned_carts", label: "Carts & Wishlists", icon: Heart },
  { id: "fulfilment", label: "Fulfilment Analytics", icon: Truck },
  { id: "returns", label: "Returns & Cancellations", icon: RotateCcw },
  { id: "inventory", label: "Product & Inventory", icon: Boxes },
  { id: "account_plan", label: "Account & Plan", icon: ShieldCheck },
  { id: "all_sections", label: "All Sections (Full View)", icon: Layers },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { setTitle } = useTitle();

  // CustomTooltip component with access to stores and storeColors
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const revenue = payload.find(p => p.dataKey === "revenue");
      const orders  = payload.find(p => p.dataKey === "orders");
      const storeDataRaw = payload.filter(
        (p) =>
          typeof p.dataKey === "string" &&
          (p.dataKey.startsWith("revenue_") || p.dataKey.startsWith("orders_"))
      );
      const storeData = storeDataRaw.filter(
        (p, i, arr) => arr.findIndex((x) => x.dataKey === p.dataKey) === i
      );
      const hasStoreData = storeData.length > 0;
      const totalRevenue = hasStoreData
        ? storeData
            .filter((p) => p.dataKey.startsWith("revenue_"))
            .reduce((s, p) => s + seriesValueFromTooltipEntry(p), 0)
        : seriesValueFromTooltipEntry(revenue);
      const totalOrders = hasStoreData
        ? storeData
            .filter((p) => p.dataKey.startsWith("orders_"))
            .reduce((s, p) => s + seriesValueFromTooltipEntry(p), 0)
        : seriesValueFromTooltipEntry(orders);

      return (
        <div 
          className="bg-white border border-gray-100 rounded-xl shadow-2xl text-xs overflow-hidden" 
          style={{
            minWidth:200,
            maxWidth:260,
            pointerEvents:"auto",
            position:"relative",
            zIndex:10000
          }}
        >
          <div className="bg-gradient-to-r from-indigo-50 to-amber-50 px-3 py-1.5 border-b border-gray-100 flex items-center gap-1.5">
            <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span className="font-semibold text-gray-600 text-[11px] truncate">
              {(() => {
                const d = dayjs(label);
                return d.isValid()
                  ? d.format(graphLabelFormat(dateRange.start, dateRange.end))
                  : label;
              })()}
            </span>
          </div>
          {/* Body */}
          <div className="px-3 py-2 space-y-1.5 tooltip-scroll" style={{maxHeight:250,overflowY:"auto",pointerEvents:"auto",WebkitOverflowScrolling:"touch"}}>
            {hasStoreData ? (
              <>
                {storeData.map((item, i) => {
                  const storeId = storeIdFromSeriesDataKey(item.dataKey);
                  const storeName =
                    item.name ||
                    stores.find((s) => s.value === storeId)?.label ||
                    `Store ${storeId}`;
                  const isRevenue = item.dataKey.startsWith("revenue_");
                  const color = storeColors[storeId] || "#6366F1";
                  const num = seriesValueFromTooltipEntry(item);
                  return (
                    <div key={i} className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-gray-500 truncate">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{backgroundColor:color}}/>
                        <span className="truncate">{storeName}</span>
                      </span>
                      <span className="font-semibold flex-shrink-0" style={{color}}>
                        {isRevenue
                          ? `\u20B9${num.toLocaleString("en-IN")}`
                          : num.toLocaleString("en-IN")}
                      </span>
                    </div>
                  );
                })}
                <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between gap-3">
                  <span className="text-gray-400 font-medium">Total</span>
                  <span className="font-bold text-indigo-700">
                    {totalRevenue > 0 ? `\u20B9${Number(totalRevenue).toLocaleString("en-IN")}` : totalOrders}
                  </span>
                </div>
              </>
            ) : (
              <>
                {revenue && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-gray-500">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 flex-shrink-0"/>Revenue
                    </span>
                    <span className="font-bold text-indigo-700">{"\u20B9"}{seriesValueFromTooltipEntry(revenue).toLocaleString("en-IN")}</span>
                  </div>
                )}
                {orders && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-1.5 text-gray-500">
                      <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"/>Orders
                    </span>
                    <span className="font-bold text-amber-600">{seriesValueFromTooltipEntry(orders).toLocaleString("en-IN")}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // State for API data
  const [metrics, setMetrics] = useState([
    {
      title: t("DASHBOARD.TOTALREVENUE"),
      value: "\u20B90",
      change: "+0%",
      trend: "up",
      icon: IndianRupee,
      color: "bg-green-100 text-green-600",
      comparisonText: t("DASHBOARD.COMPARISONTEXT"),
      featureCode: ENABLED_FEATURE_CODES.DASHBOARD_TOTAL_REVENUE,
    },
    {
      title: t("DASHBOARD.TOTALORDERS"),
      value: "0",
      change: "+0%",
      trend: "up",
      icon: ShoppingCart,
      color: "bg-blue-100 text-blue-600",
      comparisonText: t("DASHBOARD.COMPARISONTEXT"),
      featureCode: ENABLED_FEATURE_CODES.DASHBOARD_TOTAL_ORDERS,
    },
    {
      title: t("DASHBOARD.TOTALCUSTOMERS"),
      value: "0",
      change: "+0%",
      trend: "up",
      icon: Users,
      color: "bg-purple-100 text-purple-600",
      comparisonText: t("DASHBOARD.COMPARISONTEXT"),
      featureCode: ENABLED_FEATURE_CODES.DASHBOARD_TOTAL_CUSTOMERS,
    },
    {
      title: t("DASHBOARD.AVERAGEORDERS"),
      value: "\u20B90",
      change: "+0%",
      trend: "up",
      icon: TrendingUp,
      color: "bg-orange-100 text-orange-600",
      comparisonText: t("DASHBOARD.COMPARISONTEXT"),
      featureCode: ENABLED_FEATURE_CODES.DASHBOARD_TOTAL_REVENUE,
    },
  ]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isInitialLoad = useRef(true);
  const [error, setError] = useState(null);

  // Date range and preset state persisted in localStorage (default: Last 30 Days)
  const [activePreset, setActivePreset] = useState(() => {
    return localStorage.getItem("dashboard_date_preset") || "last30Days";
  });

  const [dateRange, setDateRange] = useState(() => {
    try {
      const savedPreset = localStorage.getItem("dashboard_date_preset");
      const savedRange = localStorage.getItem("dashboard_date_range");
      if (savedPreset && savedPreset !== "custom") {
        const found = DASHBOARD_PRESETS.find((p) => p.id === savedPreset);
        if (found) return found.getRange();
      }
      if (savedRange) {
        const parsed = JSON.parse(savedRange);
        if (parsed.start && parsed.end) {
          const s = dayjs(parsed.start);
          const e = dayjs(parsed.end);
          if (s.isValid() && e.isValid()) {
            return { start: s, end: e };
          }
        }
      }
    } catch {
      // fallback
    }
    return {
      start: dayjs().subtract(30, "day").startOf("day"),
      end: dayjs().endOf("day"),
    };
  });

  const [chartViewMode, setChartViewMode] = useState("combined"); // "combined", "revenue", "orders"
  const [activeDashboardTab, setActiveDashboardTab] = useState("overview");
  const [allOrdersList, setAllOrdersList] = useState([]);
  const [metricsDetails, setMetricsDetails] = useState({
    revenue: {},
    orders: {},
    customers: {},
    averageOrder: {},
  });

  const [displayText, setDisplayText] = useState("");
  const [nTopProductsPage, setTopProductsPage] = useState(1);
  const [nSelectedProduct, setSelectedProduct] = useState(null);
  const [bShowProductModal, setShowProductModal] = useState(false);

  const paginatedTopProducts = topProducts;
  const [activeStatusIndex, setActiveStatusIndex] = useState(0);
  const [orderStatusData, setOrderStatusData] = useState(FALLBACK_STATUS_DATA);
  const [chartData, setChartData] = useState(() => {
    const start = dayjs().subtract(3, "hour");
    const end   = dayjs();
    const rSeed = [42000,31000,58000,47000,51000,73000,89000,64000,95000,110000,87000,120000,134000,158000,72000,88000];
    const oSeed = [38,28,52,41,45,67,81,59,88,102,79,115,128,147,63,77];
    const points = [];
    let cursor = end.clone();
    while (cursor.isAfter(start)) {
      points.unshift({ label: cursor.format("HH:mm") });
      cursor = cursor.subtract(30, "minute");
    }
    return points.map((p, i) => ({ label: p.label, revenue: rSeed[i % rSeed.length], orders: oSeed[i % oSeed.length] }));
  });

  // Store comparison data
  const [comparisonData, setComparisonData] = useState({});

  // ── Dynamic color generator — truly random, enforced minimum hue distance ──
  const generateDistinctColors = (count) => {
    const colors = [];
    const usedHues = [];
    const minDistance = Math.max(30, Math.floor(300 / count));
    for (let i = 0; i < count; i++) {
      let hue, attempts = 0;
      do {
        hue = Math.floor(Math.random() * 360);
        attempts++;
      } while (
        attempts < 100 &&
        usedHues.some(h => Math.min(Math.abs(h - hue), 360 - Math.abs(h - hue)) < minDistance)
      );
      usedHues.push(hue);
      const sat = Math.floor(Math.random() * 20) + 60;
      const lit = Math.floor(Math.random() * 15) + 48;
      colors.push(`hsl(${hue}, ${sat}%, ${lit}%)`);
    }
    return colors;
  };

  const [chartLoading, setChartLoading] = useState(false);

  const { data: storesData, fetchAll: fetchStores } = useStores();
  const didFetchStoresRef = useRef(false);
  useEffect(() => {
    // `fetchStores` comes from context and its identity may change on every context state update.
    // Guard ensures we only call once to prevent continuous re-fetch loops.
    if (didFetchStoresRef.current) return;
    didFetchStoresRef.current = true;
    fetchStores();
  }, [fetchStores]);

  const stores = useMemo(() => {
    const rows = Array.isArray(storesData) ? storesData : [];
    const mapped = rows
      .map((s) => {
        const value =
          s?.StoreID ??
          s?.storeId ??
          s?.StoreId ??
          s?.id ??
          s?.value ??
          null;
        const label =
          s?.StoreName ??
          s?.storeName ??
          s?.Name ??
          s?.label ??
          null;
        if (!value || !label) return null;
        return { value: String(value), label: String(label) };
      })
      .filter(Boolean);

    // Keep a fallback so the UI doesn't break if API returns empty.
    return mapped.length
      ? mapped
      : [
          { value: "1", label: "Main Store" },
          { value: "2", label: "Branch A" },
          { value: "3", label: "Branch B" },
          { value: "4", label: "Online Store" },
          { value: "5", label: "Outlet C" },
        ];
  }, [storesData]);
  const [selectedStores, setSelectedStores] = useState([]);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [ordersSelectedStores, setOrdersSelectedStores] = useState([]);
  const [ordersComparisonMode, setOrdersComparisonMode] = useState(false);

  // Palette state — declared after selectedStores/ordersSelectedStores
  const [storePalette, setStorePalette] = useState(() => generateDistinctColors(20));

  useEffect(() => {
    const count = Math.max(selectedStores.length, ordersSelectedStores.length, 5);
    setStorePalette(generateDistinctColors(count + 5));
  }, [selectedStores.length, ordersSelectedStores.length]);

  const getStoreColor = (storeId) => {
    const idx = stores.findIndex(s => s.value === storeId);
    const i = idx >= 0 ? idx : 0;
    return storePalette[i % storePalette.length];
  };
  const getOrdersStoreColor = getStoreColor;
  const storeColors = new Proxy({}, { get: (_, id) => getStoreColor(id) });
  
  // Orders dialog state
  const [showOrdersDialog, setShowOrdersDialog] = useState(false);
  
  // Customers dialog state
  const [showCustomersDialog, setShowCustomersDialog] = useState(false);
  
  // Average Order dialog state
  const [showAverageOrderDialog, setShowAverageOrderDialog] = useState(false);

  // Helper function to get selected store names
  const getSelectedStoreNames = () => {
    if (selectedStores.length === 0) {
      return 'All Stores';
    }
    if (comparisonMode || selectedStores.length > 1) {
      return selectedStores.map(id => 
        stores.find(store => store.value === id)?.label || 'Unknown'
      ).join(', ');
    }
    return stores.find(store => store.value === selectedStores[0])?.label || 'All Stores';
  };

  const getComparisonChartData = () => chartData;

  const getOrdersComparisonChartData = () => chartData;

  // Generates fallback dummy data shaped to the date range.
  // When multiple stores are selected, emit `revenue_<id>` / `orders_<id>` so comparison Line charts match real API rows.
  const generateFallbackData = (start, end, storeIdList = []) => {
    const diffMinutes = end.diff(start, "minute");
    const diffDays    = end.diff(start, "day", true);
    const rSeed = [42000,31000,58000,47000,51000,73000,89000,64000,95000,110000,87000,120000,134000,158000,72000,88000];
    const oSeed = [38,28,52,41,45,67,81,59,88,102,79,115,128,147,63,77];

    let stepAmount, stepUnit, fmt;
    if (diffMinutes <= 60)       { stepAmount = 10; stepUnit = "minute"; fmt = "HH:mm"; }
    else if (diffMinutes <= 360) { stepAmount = 30; stepUnit = "minute"; fmt = "HH:mm"; }
    else if (diffDays <= 1)      { stepAmount = 1;  stepUnit = "hour";   fmt = "HH:mm"; }
    else if (diffDays <= 3)      { stepAmount = 4;  stepUnit = "hour";   fmt = "D MMM HH:mm"; }
    else if (diffDays <= 14)     { stepAmount = 1;  stepUnit = "day";    fmt = "D MMM"; }
    else if (diffDays <= 60)     { stepAmount = 7;  stepUnit = "day";    fmt = "D MMM"; }
    else                         { stepAmount = 1;  stepUnit = "month";  fmt = "MMM YY"; }

    // Build backwards from end so last label = current time
    const points = [];
    let cursor = end.clone();
    while (cursor.isAfter(start) || cursor.isSame(start)) {
      points.unshift({ label: cursor.format(fmt), revenue: 0, orders: 0 });
      cursor = cursor.subtract(stepAmount, stepUnit);
      if (points.length > 200) break;
    }

    const ids = (storeIdList || []).filter(Boolean);
    return points.map((p, i) => {
      const row = { label: p.label };
      if (ids.length > 1) {
        ids.forEach((id, j) => {
          const mult = 0.55 + (((j + i) % 7) * 0.06);
          row[`revenue_${id}`] = Math.floor(rSeed[(i + j) % rSeed.length] * mult);
          row[`orders_${id}`] = Math.floor(oSeed[(i + j) % oSeed.length] * mult);
        });
      } else {
        row.revenue = rSeed[i % rSeed.length];
        row.orders = oSeed[i % oSeed.length];
      }
      return row;
    });
  };

  const formatChartTickLabel = (value) => {
    const d = dayjs(value);
    if (!d.isValid()) return String(value ?? "");
    const start = dateRange?.start;
    const end = dateRange?.end;
    if (!start || !end) return String(value);
    return d.format(graphLabelFormat(dayjs(start), dayjs(end)));
  };

  const getChartGranularityLabel = (start, end) => {
    const diffMinutes = end.diff(start, "minute");
    const diffDays    = end.diff(start, "day", true);
    if (diffMinutes <= 60)  return "10-min intervals";
    if (diffMinutes <= 360) return "30-min intervals";
    if (diffDays <= 1)      return "Hourly";
    if (diffDays <= 3)      return "4-hour intervals";
    if (diffDays <= 14)     return "Daily";
    if (diffDays <= 60)     return "Weekly";
    return "Monthly";
  };
  // Format date to ISO string for API (handles dayjs, Date, ISO string, timestamps)
  const formatDateToAPI = (date) => {
    if (date == null) return null;
    const d = dayjs(date);
    if (!d.isValid()) return null;
    return d.toISOString();
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency: CURRENCY,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format number
  const formatNumber = (num) => {
    return new Intl.NumberFormat(LOCALE).format(num);
  };

  // Generate display text for date range
  const generateDisplayText = (start, end) => {
    if (!start || !end) return t("DASHBOARD.SELECT_DATE_RANGE");
    
    const isSameminute = start.isSame(end, 'minute');
    
    if (isSameminute) {
      return `${start.format("MMM D, YYYY")} ${start.format("HH:mm")} - ${end.format("HH:mm")}`;
    } else {
      return `${start.format("MMM D, YYYY HH:mm")} - ${end.format("MMM D, YYYY HH:mm")}`;
    }
  };

  // Update display text when date range changes
  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      setDisplayText(generateDisplayText(dateRange.start, dateRange.end));
    }
  }, [dateRange]);

  const handleSelectPreset = (presetId) => {
    const preset = DASHBOARD_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    const range = preset.getRange();
    setActivePreset(presetId);
    setDateRange(range);
    localStorage.setItem("dashboard_date_preset", presetId);
    localStorage.setItem(
      "dashboard_date_range",
      JSON.stringify({
        start: range.start.toISOString(),
        end: range.end.toISOString(),
      })
    );
  };

  // Handle date range change from DateTimeRangePickerComponent
  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
    setActivePreset("custom");
    localStorage.setItem("dashboard_date_preset", "custom");
    if (newRange?.start && newRange?.end) {
      localStorage.setItem(
        "dashboard_date_range",
        JSON.stringify({
          start: dayjs(newRange.start).toISOString(),
          end: dayjs(newRange.end).toISOString(),
        })
      );
    }
  };

  // Handle clear dates - resets to default Last 30 Days preset
  const handleClearDates = () => {
    handleSelectPreset("last30Days");
  };

  // Calculate percentage change and trend
  const calculateMetrics = (current, previous, title, comparisonText) => {
    if (
      current === undefined ||
      current === null ||
      previous === undefined ||
      previous === null
    ) {
      return {
        value:
          title.includes("Revenue") || title.includes("Average")
            ? formatCurrency(0)
            : formatNumber(0),
        change: "0%",
        trend: "neutral",
        comparisonText,
      };
    }

    const currentNum =
      typeof current === "string"
        ? parseFloat(current.replace(/[^0-9.-]+/g, "")) || 0
        : Number(current) || 0;

    const previousNum =
      typeof previous === "string"
        ? parseFloat(previous.replace(/[^0-9.-]+/g, "")) || 0
        : Number(previous) || 0;

    if (previousNum === 0) {
      return {
        value:
          title.includes("Revenue") || title.includes("Average")
            ? formatCurrency(currentNum)
            : formatNumber(currentNum),
        change: "—",
        trend: "neutral",
        comparisonText,
      };
    }

    const percentageChange = ((currentNum - previousNum) / previousNum) * 100;
    const trend =
      percentageChange > 0 ? "up" : percentageChange < 0 ? "down" : "neutral";

    return {
      value:
        title.includes("Revenue") || title.includes("Average")
          ? formatCurrency(currentNum)
          : formatNumber(currentNum),
      change: `${percentageChange > 0 ? "+" : ""}${percentageChange.toFixed(
        2
      )}%`,
      trend,
      comparisonText,
    };
  };

  const buildChartData = async (start, end, token) => {
    setChartLoading(true);
    try {
      // Only include storeIds when specific stores are selected (not 'all')
      let storesForGraph = [];
      if (selectedStores.length > 0 && !selectedStores.includes('all')) {
        storesForGraph = selectedStores.filter(Boolean).slice(0, DASHBOARD_GRAPH_MAX_STORES);
      }

      const startISO =
        formatDateToAPI(start) ?? formatDateToAPI(dateRange.start);
      const endISO = formatDateToAPI(end) ?? formatDateToAPI(dateRange.end);
      if (!startISO || !endISO) {
        setChartData(
          generateFallbackData(
            dayjs(dateRange.start),
            dayjs(dateRange.end),
            storesForGraph
          )
        );
        return;
      }

      const params = {
        startDate: startISO,
        endDate: endISO,
      };

      // Only add storeIds if stores are selected
      if (storesForGraph.length > 0) {
        params.storeIds = storesForGraph.join(",");
      }

      const [revRes, ordRes] = await Promise.all([
        apiGet(GET_STORE_REVENUE_GRAPH, params, token),
        apiGet(GET_STORE_ORDERS_GRAPH, params, token),
      ]);

      const revInterval = extractIntervalGraphRows(revRes, "revenue");
      const ordInterval = extractIntervalGraphRows(ordRes, "orders");
      const revRows =
        revInterval.length > 0
          ? revInterval
          : flattenGraphRows(
              extractGraphEnvelope(revRes),
              GRAPH_REVENUE_KEYS
            );
      const ordRows =
        ordInterval.length > 0
          ? ordInterval
          : flattenGraphRows(
              extractGraphEnvelope(ordRes),
              GRAPH_ORDER_KEYS
            );

      if (!revRows.length && !ordRows.length) {
        setChartData(generateFallbackData(start, end, storesForGraph));
        return;
      }

      const merged = mergeRevenueOrdersGraphRows(
        revRows,
        ordRows,
        storesForGraph
      );

      setChartData(
        merged.length > 0 ? merged : generateFallbackData(start, end, storesForGraph)
      );
    } catch {
      setChartData(
        generateFallbackData(
          start,
          end,
          selectedStores.filter(Boolean).slice(0, DASHBOARD_GRAPH_MAX_STORES)
        )
      );
    } finally {
      setChartLoading(false);
    }
  };

  // Fetch all dashboard data using promises
  const fetchDashboardData = async () => {
    try {
      if (isInitialLoad.current) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      const { start, end } = dateRange;

      // Prepare query parameters for date range with formatted dates
      const dateParams = {
        startDate: formatDateToAPI(start),
        endDate: formatDateToAPI(end),
      };

      // Only include storeId/storeIds when specific stores are selected (not 'all')
      if (selectedStores.length > 0 && !selectedStores.includes('all')) {
        // Pass selected store IDs only
        const storeIdsArray = selectedStores.filter(Boolean).slice(0, DASHBOARD_GRAPH_MAX_STORES);
        if (storeIdsArray.length === 1) {
          dateParams.storeId = storeIdsArray[0];
        } else if (storeIdsArray.length > 1) {
          dateParams.storeIds = storeIdsArray;
        }
      }
      // If 'all' is selected or no stores selected, dateParams will only have dates (no storeId)

      // Get token from localStorage
      const token = localStorage.getItem("token");

      // Create all API promises
      const promises = [
        // Total Revenue - uses query params
        apiGet(GET_TOTAL_REVENUE, dateParams, token)
          .then((response) => ({
            data: response?.data?.data || {},
            type: "revenue",
          }))
          .catch((error) => {
            return {
              type: "revenue",
              data: {
                totalCurrentRevenue: 0,
                previousRevenue: 0,
                totalRevenuePercentageChange: "0%",
              },
            };
          }),

        // Total Orders - uses query params
        apiGet(GET_TOTAL_ORDERS, dateParams, token)
          .then((response) => ({
            data: response?.data?.data || {},
            type: "orders",
          }))
          .catch((error) => {
            return {
              type: "orders",
              data: {
                currentTotalOrders: 0,
                previousTotalOrders: 0,
                totalOrderPercentageChange: "0%",
              },
            };
          }),

        // Total Customers - uses query params
        apiGet(GET_TOTAL_CUSTOMERS, dateParams, token)
          .then((response) => ({
            data: response?.data?.data || {},
            type: "customers",
          }))
          .catch((error) => {
            return {
              type: "customers",
              data: {
                currentRegisteredTotalCutomers: 0,
                previousRegisteredTotalCustomers: 0,
                totalCustomerPercentageChange: "0%",
              },
            };
          }),

        // Recent Orders - pass date range and store parameters
        apiGet(GET_RECENT_ORDERS, { ...dateParams, limit: DASHBOARD_DEFAULT_LIMIT }, token)
          .then((response) => ({
            data: response?.data?.data || {},
            type: "recentOrders",
          }))
          .catch((error) => {
            return { type: "recentOrders", data: [] };
          }),

        // Top Products - pass date range and store parameters with limit
        apiGet(GET_TOP_PRODUCTS, { ...dateParams, limit: 4 }, token)
          .then((response) => ({
            data: response?.data?.data || {},
            type: "topProducts",
          }))
          .catch((error) => {
            return { type: "topProducts", data: [] };
          }),

        // All Orders for consistent status distribution and recent orders date alignment
        apiGet(GETALLORDERS_API, { ...dateParams, pageNumber: 1, pageSize: 500 }, token)
          .then((response) => ({
            data: response?.data?.data || response?.data || [],
            type: "allOrders",
          }))
          .catch(() => ({ type: "allOrders", data: [] })),

        // Low stock products inventory query
        apiGet(GET_LOW_STOCK, {}, token)
          .then((response) => ({
            data: response?.data?.data || response?.data || [],
            type: "lowStock",
          }))
          .catch(() => ({ type: "lowStock", data: [] })),
      ];

      // Execute all API calls in parallel
      const results = await Promise.all(promises);

      // Process results
      let revenueData = {
        totalCurrentRevenue: 0,
        previousRevenue: 0,
        totalRevenuePercentageChange: "0%",
      };
      let ordersData = {
        currentTotalOrders: 0,
        previousTotalOrders: 0,
        totalOrderPercentageChange: "0%",
      };
      let customersData = {
        currentRegisteredTotalCutomers: 0,
        previousRegisteredTotalCustomers: 0,
        totalCustomerPercentageChange: "0%",
      };
      let recentOrdersData = [];
      let topProductsData = [];
      let allOrdersData = [];
      let lowStockData = [];

      results.forEach((result) => {
        switch (result.type) {
          case "revenue":
            revenueData = result.data;
            break;
          case "orders":
            ordersData = result.data;
            break;
          case "customers":
            customersData = result.data;
            break;
          case "recentOrders":
            recentOrdersData = Array.isArray(result.data)
              ? result.data
              : result.data.recentOrders || [];
            break;
          case "topProducts":
            topProductsData = Array.isArray(result.data)
              ? result.data
              : result.data.topProducts || [];
            break;
          case "allOrders":
            allOrdersData = Array.isArray(result.data) ? result.data : [];
            break;
          case "lowStock":
            lowStockData = Array.isArray(result.data) ? result.data : [];
            break;
        }
      });

      // Generate comparison text based on date range
      const comparisonText = generateComparisonText(start, end);

      // Calculate metrics using actual API data
      const revenueMetrics = calculateMetrics(
        revenueData.totalCurrentRevenue,
        revenueData.previousRevenue,
        "Total Revenue",
        comparisonText
      );
      const ordersMetrics = calculateMetrics(
        ordersData.currentTotalOrders,
        ordersData.previousTotalOrders,
        "Total Orders",
        comparisonText
      );

      const customersMetrics = calculateMetrics(
        customersData.currentRegisteredTotalCutomers,
        customersData.previousRegisteredTotalCustomers,
        "Total Customers",
        comparisonText
      );

      // Calculate average order value
      const averageOrderValue =
        ordersData.currentTotalOrders > 0
          ? revenueData.totalCurrentRevenue / ordersData.currentTotalOrders
          : 0;

      const previousAverageOrderValue =
        ordersData.previousTotalOrders > 0
          ? revenueData.previousRevenue / ordersData.previousTotalOrders
          : 0;

      const averageOrderMetrics = calculateMetrics(
        averageOrderValue,
        previousAverageOrderValue,
        "Average Order",
        comparisonText
      );

      // Save raw metric details for analytical widgets
      setMetricsDetails({
        revenue: revenueMetrics,
        orders: ordersMetrics,
        customers: customersMetrics,
        averageOrder: averageOrderMetrics,
      });
      setAllOrdersList(allOrdersData);

      // Update metrics state with actual API data
      setMetrics([
        {
          title: t("DASHBOARD.TOTALREVENUE"),
          value: revenueMetrics.value,
          change: revenueMetrics.change,
          trend: revenueMetrics.trend,
          icon: IndianRupee,
          color: "bg-green-100 text-green-600",
          comparisonText: revenueMetrics.comparisonText,
        },
        {
          title: t("DASHBOARD.TOTALORDERS"),
          value: ordersMetrics.value,
          change: ordersMetrics.change,
          trend: ordersMetrics.trend,
          icon: ShoppingCart,
          color: "bg-blue-100 text-blue-600",
          comparisonText: ordersMetrics.comparisonText,
        },
        {
          title: t("DASHBOARD.TOTALCUSTOMERS"),
          value: customersMetrics.value,
          change: customersMetrics.change,
          trend: customersMetrics.trend,
          icon: Users,
          color: "bg-purple-100 text-purple-600",
          comparisonText: customersMetrics.comparisonText,
        },
        {
          title: t("DASHBOARD.AVERAGEORDERS"),
          value: averageOrderMetrics.value,
          change: averageOrderMetrics.change,
          trend: averageOrderMetrics.trend,
          icon: TrendingUp,
          color: "bg-orange-100 text-orange-600",
          comparisonText: averageOrderMetrics.comparisonText,
        },
      ]);

      // Update top products with actual API response structure
      setTopProducts(
        topProductsData.map((item) => {
          const product = item.ProductVariant?.Product || {};
          const variantImages = item.variantImages || [];

          return {
            name:
              product.ProductName ||
              t("DASHBOARD.TOP_PRODUCTS.UNKNOWN_PRODUCT"),
            sales: parseInt(item.totalOrderItemQuantity) || 0,
            revenue: formatCurrency(parseInt(item.totalPrice) || 0),
            rating: item.averageRating || 0,
            stock: item.totalStock || 0,
            image: variantImages[0]?.documentUrl,
            category:
              product.Category || t("DASHBOARD.PRODUCT_MODAL.CATEGORY_DEFAULT"),
            // Store the original item for modal details
            originalData: item,
          };
        })
      );

      // Low stock items: prioritize live GET_LOW_STOCK data, fallback to topProducts
      let lowStockList = [];
      if (Array.isArray(lowStockData) && lowStockData.length > 0) {
        lowStockList = lowStockData.map((item) => ({
          name: item.ProductName || item.name || t("DASHBOARD.TOP_PRODUCTS.UNKNOWN_PRODUCT"),
          stock: item.Quantity ?? item.StockQuantity ?? item.stock ?? item.totalStock ?? 0,
          threshold: 10,
        }));
      } else {
        lowStockList = topProductsData
          .filter((item) => (item.totalStock || 0) < 10)
          .map((item) => {
            const product = item.ProductVariant?.Product || {};
            return {
              name:
                product.ProductName ||
                t("DASHBOARD.TOP_PRODUCTS.UNKNOWN_PRODUCT"),
              stock: item.totalStock || 0,
              threshold: 10,
            };
          });
      }
      setLowStockItems(lowStockList);

      // Order status distribution consistent with date-range filtered allOrders
      const ALL_STATUSES = [
        { name: "Pending",    color: "#FCD34D" },
        { name: "Processing", color: "#60A5FA" },
        { name: "Shipped",    color: "#818CF8" },
        { name: "Delivered",  color: "#34D399" },
        { name: "Cancelled",  color: "#FB923C" },
        { name: "Returned",   color: "#F472B6" },
      ];
      const counts = {};
      allOrdersData.forEach((order) => {
        const rawStatus =
          order.OrderItem?.[0]?.OrderItemStatus?.OrderStatus ||
          order.orderItems?.[0]?.OrderStatus ||
          order.OrderStatus ||
          order.status ||
          "Pending";
        const matched = ALL_STATUSES.find(
          (s) => s.name.toLowerCase() === String(rawStatus).toLowerCase()
        )?.name || "Pending";
        counts[matched] = (counts[matched] || 0) + 1;
      });
      const dynamicStatus = ALL_STATUSES.map(({ name, color }) => ({
        name,
        value: counts[name] || 0,
        color,
      }));
      setOrderStatusData(dynamicStatus);

      // Recent orders strictly aligned with selected date range
      const combinedOrders = allOrdersData.length > 0 ? allOrdersData : recentOrdersData;
      const ordersWithinRange = combinedOrders.filter((order) => {
        if (!order.OrderDate && !order.createdAt) return true;
        const d = dayjs(order.OrderDate || order.createdAt);
        if (!d.isValid()) return true;
        return (
          d.valueOf() >= dayjs(start).startOf("day").valueOf() &&
          d.valueOf() <= dayjs(end).endOf("day").valueOf()
        );
      });
      // Sort newest first
      ordersWithinRange.sort(
        (a, b) =>
          new Date(b.OrderDate || b.createdAt || 0) -
          new Date(a.OrderDate || a.createdAt || 0)
      );

      setRecentOrders(
        ordersWithinRange.slice(0, 10).map((order) => ({
          id:
            order.OrderRefID ||
            order.OrderID ||
            order.id ||
            `ORD-${Math.random().toString(36).substr(2, 7)}`,
          customer: order.Customer
            ? `${order.Customer.FirstName || ""} ${order.Customer.LastName || ""}`.trim() ||
              "Customer"
            : order.CustomerName || "Customer",
          date: order.OrderDate
            ? dayjs(order.OrderDate).format("YYYY-MM-DD")
            : dayjs().format("YYYY-MM-DD"),
          amount: formatCurrency(order.TotalAmount || order.totalAmount || 0),
          status:
            order.OrderItem?.[0]?.OrderItemStatus?.OrderStatus ||
            order.orderItems?.[0]?.OrderStatus ||
            order.OrderStatus ||
            order.status ||
            STATUS.PENDING,
          items: order.OrderItem?.length || order.orderItems?.length || 1,
        }))
      );

      // Build chart data for the selected range using real API data
      await buildChartData(start, end, token);

    } catch (err) {
      // Only show error for non-plan-restriction errors
      const status = err?.response?.status;
      if (status !== 403) {
        setError(err?.response?.data?.message || t("COMMON.API_ERROR"));
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      isInitialLoad.current = false;
    }
  };

  // Generate comparison text based on date range
const generateComparisonText = (startDate, endDate) => {
  if (!startDate || !endDate) return t("DASHBOARD.COMPARISONTEXT");
  const start = dayjs(startDate);
  const end   = dayjs(endDate);
  const diffMinutes = end.diff(start, "minute");
  const diffHours   = end.diff(start, "hour",  true);
  const diffDays    = end.diff(start, "day",   true);
  if (diffMinutes < 60)          return t("DASHBOARD.VSLASTMINUTES", { count: diffMinutes });
  if (diffHours  <= 1)           return t("DASHBOARD.VSLASTHOUR");
  if (diffHours  <= 2)           return t("DASHBOARD.VSLAST2HOURS");
  if (diffHours  <= 3)           return t("DASHBOARD.VSLAST3HOURS");
  if (diffHours  <= 6)           return t("DASHBOARD.VSLAST6HOURS");
  if (diffHours  <= 12)          return t("DASHBOARD.VSLAST12HOURS");
  if (diffHours  <= 24)          return t("DASHBOARD.VSLAST24HOURS");
  if (Math.round(diffDays) === 1)   return t("DASHBOARD.VSPREVIOUSDAY");
  if (Math.round(diffDays) === 7)   return t("DASHBOARD.VSLASTWEEK");
  if (Math.round(diffDays) === 30)  return t("DASHBOARD.VSLASTMONTH");
  if (Math.round(diffDays) === 90)  return t("DASHBOARD.VSLAST3MONTHS");
  if (Math.round(diffDays) === 365) return t("DASHBOARD.VSLASTYEAR");
  return t("DASHBOARD.VSLASTXDAYS", { count: Math.round(diffDays) });
};
  // Set title and fetch data on component mount
  useEffect(() => {
    setTitle(t("DASHBOARD.TITLE"));
    fetchDashboardData();

    return () => setTitle("");
  }, [setTitle, t]);

  // Fetch data when date range changes
  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      fetchDashboardData();
    }
  }, [dateRange]);

  // Fetch data when selected stores changes
  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      fetchDashboardData();
    }
  }, [selectedStores]);

  // Debug selectedStores changes
  useEffect(() => {
    console.log('selectedStores changed:', selectedStores);
    console.log('comparisonMode:', comparisonMode);
  }, [selectedStores, comparisonMode]);

  // Update comparison mode when selected stores change
  useEffect(() => {
    setComparisonMode(selectedStores.length > 1);
  }, [selectedStores]);

  // Update orders comparison mode when selected stores change
  useEffect(() => {
    const newMode = ordersSelectedStores.length > 1;
    console.log('=== ORDERS COMPARISON MODE UPDATE ===');
    console.log('ordersSelectedStores:', ordersSelectedStores);
    console.log('ordersSelectedStores.length:', ordersSelectedStores.length);
    console.log('Setting ordersComparisonMode to:', newMode);
    setOrdersComparisonMode(newMode);
  }, [ordersSelectedStores]);

  useEffect(() => {
    if (!dateRange.start || !dateRange.end) return;
    const { start, end } = dateRange;
    const token = localStorage.getItem("token");
    buildChartData(start, end, token);
  }, [selectedStores, comparisonMode]);

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-2 pb-8">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-48" />
          <div className="h-10 bg-gray-200 rounded animate-pulse w-72" />
        </div>

        {/* Metrics Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-24 mb-2" />
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-16" />
                </div>
                <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse" />
              </div>
              <div className="mt-4 flex items-center">
                <div className="h-3 w-3 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-12 ml-2" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-16 ml-2" />
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Top Products Skeleton */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
            </div>
            <div className="flex flex-col gap-2 p-3 flex-1">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="flex items-center bg-white rounded-lg shadow-sm px-3 py-2 min-h-[70px]">
                  <div className="h-10 w-10 bg-gray-200 rounded animate-pulse mr-4" />
                  <div className="flex-1 min-w-0">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-32 mb-2" />
                    <div className="flex items-center gap-2">
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-16" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-12" />
                    </div>
                  </div>
                  <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders Skeleton */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
            </div>
            <div className="flex-1 w-full overflow-x-auto">
              <table className="w-full min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-16" />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-16" />
                    </th>
                    <th className="px-4 py-3 text-right">
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-12" />
                    </th>
                    <th className="px-4 py-3 text-left">
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-12" />
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {[...Array(5)].map((_, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-20" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-16 ml-auto" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-6 bg-gray-200 rounded-full animate-pulse w-16" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-2 pb-8">
      {/* Refresh indicator - shows on filter changes without full reload */}
      {isRefreshing && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white border border-gray-200 rounded-lg shadow-md px-3 py-2 text-sm text-gray-600">
          <div className="h-4 w-4 border-2 border-custom-bg border-t-transparent rounded-full animate-spin" />
          {t("DASHBOARD.UPDATING")}
        </div>
      )}
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
          <span className="text-red-700">{error}</span>
          <button
            onClick={fetchDashboardData}
            className="ml-auto px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
          >
            {t("COMMON.RETRY")}
          </button>
        </div>
      )}

      {/* Product Modal */}
      {bShowProductModal && nSelectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-xs w-full p-0 relative animate-fade-in-up overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-indigo-50 via-white to-gray-50">
              <h2 className="text-sm font-bold text-gray-900">
                {t("PRODUCTS.PRODUCTS_DETAILS")}
              </h2>
              <button
                className="text-gray-400 hover:text-indigo-600 text-xl font-bold transition-colors"
                onClick={() => setShowProductModal(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="flex flex-col items-center px-4 py-4">
              <img
                src={
                  nSelectedProduct.image ||
                  "https://via.placeholder.com/96x96?text=Img"
                }
                alt={nSelectedProduct.name}
                className="h-28 w-28 rounded-lg object-cover border-2 border-indigo-100 shadow mb-2"
              />
              <h3 className="text-sm font-semibold text-gray-900 mb-0.5 text-center">
                {nSelectedProduct.name}
              </h3>
              <span className="inline-block mb-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {nSelectedProduct.category ||
                  t("DASHBOARD.PRODUCT_MODAL.CATEGORY_DEFAULT")}
              </span>
              <div className="flex items-center gap-0.5 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      nSelectedProduct.rating >= star
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                    fill={nSelectedProduct.rating >= star ? "#facc15" : "none"}
                  />
                ))}
                <span className="ml-1 text-xs text-gray-500">
                  {nSelectedProduct.rating}
                </span>
              </div>
              <hr className="w-full border-t border-gray-200 my-2" />
              <div className="grid grid-cols-2 gap-2 w-full mt-1 mb-1">
                <div className="flex flex-col items-center">
                  <IndianRupee className="h-4 w-4 text-green-500 mb-0.5" />
                  <span className="text-[11px] text-gray-500">
                    {t("DASHBOARD.PRODUCT_MODAL.REVENUE")}
                  </span>
                  <span className="font-semibold text-gray-800 text-sm">
                    {nSelectedProduct.revenue}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <TrendingUp className="h-4 w-4 text-blue-500 mb-0.5" />
                  <span className="text-[11px] text-gray-500">
                    {t("DASHBOARD.PRODUCT_MODAL.SALES")}
                  </span>
                  <span className="font-semibold text-gray-800 text-sm">
                    {formatNumber(nSelectedProduct.sales)}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <Package className="h-4 w-4 text-gray-500 mb-0.5" />
                  <span className="text-[11px] text-gray-500">
                    {t("DASHBOARD.PRODUCT_MODAL.STOCK")}
                  </span>
                  <span
                    className={`font-semibold text-sm ${
                      nSelectedProduct.stock < 10
                        ? "text-red-600"
                        : "text-gray-800"
                    }`}
                  >
                    {nSelectedProduct.stock}
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <Clock className="h-4 w-4 text-indigo-400 mb-0.5" />
                  <span className="text-[11px] text-gray-500">
                    {t("COMMON.STATUS")}
                  </span>
                  <span className="font-semibold text-sm text-gray-800">
                    {nSelectedProduct.stock < 10
                      ? t("DASHBOARD.PRODUCT_MODAL.LOW_STOCK")
                      : t("DASHBOARD.PRODUCT_MODAL.IN_STOCK")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header with Presets, Store Selector, and Date Range Picker */}
      <div className="mb-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500">{t("DASHBOARD.DESCRIPTION")}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 justify-end">
            {/* Quick Date Presets */}
            <div className="inline-flex items-center gap-1 bg-gray-100 p-1 rounded-lg border border-gray-200">
              {DASHBOARD_PRESETS.map((preset) => {
                const isActive = activePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`px-2.5 py-1.5 rounded-md text-xs transition-all ${
                      isActive
                        ? "bg-white text-indigo-700 font-semibold shadow-xs"
                        : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Global Store Selector (All stores combined by default) */}
            <div className="w-64">
              <SelectWithIcon
                id="global-store-selection"
                name="global-store-selection"
                Icon={Store}
                value={selectedStores}
                onChange={(e) => {
                  const val = Array.isArray(e.target.value) ? e.target.value : (e.target.value || []);
                  const raw = (Array.isArray(val) ? val : []).map((id) => String(id));
                  if (raw.length > DASHBOARD_GRAPH_MAX_STORES) {
                    showEmsg(
                      t("SELECT.MAX_SELECTIONS_REACHED", { max: DASHBOARD_GRAPH_MAX_STORES }),
                      "warning"
                    );
                  }
                  const normalized = raw.slice(0, DASHBOARD_GRAPH_MAX_STORES);
                  setSelectedStores(normalized);
                  setOrdersSelectedStores(normalized);
                  setComparisonMode(normalized.length > 1);
                  setOrdersComparisonMode(normalized.length > 1);
                }}
                options={stores}
                multiple={true}
                maxSelections={DASHBOARD_GRAPH_MAX_STORES}
                placeholder="All Stores (Combined)"
                maxVisibleItems={2}
              />
            </div>

            {/* Date Range Picker */}
            <div className="w-72 flex items-stretch">
              <DateTimeRangePickerComponent
                dateRange={dateRange}
                setDateRange={handleDateRangeChange}
                displayText={displayText}
                handleClearDates={handleClearDates}
                t={t}
                maxDate={dayjs()}
                allowFutureDates={false}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 8-Approach Analytics Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-100 p-2 mb-6 overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {DASHBOARD_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeDashboardTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveDashboardTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? "bg-custom-bg text-white shadow-sm font-semibold hover:bg-bg-hover"
                    : "text-gray-600 hover:text-custom-bg hover:bg-sd-hover/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-gray-500"}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                      isActive ? "bg-white/20 text-white" : "bg-sd-hover text-custom-bg"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. Executive Overview Tab */}
      {activeDashboardTab === "overview" && (
        <>
          {/* Metrics Cards with Sparklines & Clean Change Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {metrics.filter(m => !m.featureCode || isFeatureCodeEnabled(m.featureCode)).map((metric, index) => {
          const sparkData = (chartData && chartData.length > 1)
            ? chartData.map((d, i) => {
                let val = 0;
                if (index === 0) val = d.revenue || 0;
                else if (index === 1) val = d.orders || 0;
                else if (index === 2) val = (d.orders || 0) * 0.7 + i * 2;
                else val = d.orders > 0 ? (d.revenue || 0) / d.orders : 0;
                return { val };
              })
            : [];

          const sparkColor =
            index === 0 ? "#10b981" :
            index === 1 ? "#3b82f6" :
            index === 2 ? "#8b5cf6" : "#f59e0b";

          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col justify-between"
            >
              <div>
                <button
                  type="button"
                  onClick={() => {
                    if (metric.title === "Total Orders" || metric.title === t("DASHBOARD.TOTALORDERS")) {
                      navigate("/orders");
                    }
                  }}
                  className="w-full text-left cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        {metric.title}
                      </p>
                      <p className="mt-1.5 text-2xl font-bold text-gray-900 tracking-tight">
                        {metric.value}
                      </p>
                    </div>
                    <div className={`p-2.5 rounded-xl ${metric.color} shadow-xs`}>
                      <metric.icon className="h-5 w-5" />
                    </div>
                  </div>
                </button>

                {/* Sparkline mini chart */}
                {sparkData.length > 1 && (
                  <div className="h-8 mt-2.5 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sparkData}>
                        <Line
                          type="monotone"
                          dataKey="val"
                          stroke={sparkColor}
                          strokeWidth={2}
                          dot={false}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-gray-50 flex items-center text-xs">
                {metric.trend === "up" ? (
                  <ArrowUp className="h-3 w-3 text-emerald-600 font-bold" />
                ) : metric.trend === "down" ? (
                  <ArrowDown className="h-3 w-3 text-rose-600 font-bold" />
                ) : (
                  <span className="h-3 w-3 text-gray-400 font-bold text-center leading-3">—</span>
                )}
                <span
                  className={`ml-1 font-semibold ${
                    metric.trend === "up"
                      ? "text-emerald-600"
                      : metric.trend === "down"
                      ? "text-rose-600"
                      : "text-gray-500"
                  }`}
                >
                  {metric.change}
                </span>
                <span className="ml-1.5 text-gray-400 truncate">
                  {metric.comparisonText}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Needed Section */}
      <ActionNeededSection
        orders={allOrdersList}
        lowStockItems={lowStockItems}
        navigate={navigate}
        formatCurrency={formatCurrency}
        t={t}
      />

      {/* Combined Revenue & Orders Trend + Order Status Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Combined Revenue & Orders Chart */}
        {(isFeatureCodeEnabled(ENABLED_FEATURE_CODES.DASHBOARD_REVENUE_GRAPH) ||
          isFeatureCodeEnabled(ENABLED_FEATURE_CODES.DASHBOARD_ORDERS_GRAPH)) && (
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-gray-900">Revenue & Orders Trend</h2>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                      {getChartGranularityLabel(dateRange.start, dateRange.end)}
                    </span>
                    {selectedStores.length === 0 && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-sd-hover text-custom-bg font-semibold">
                        All Stores Combined
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {comparisonMode
                      ? `Comparing ${selectedStores.length} stores`
                      : "Correlated revenue generation and order volume over time"}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* View Mode Toggle */}
                  <div className="inline-flex rounded-lg bg-gray-100 p-0.5 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => setChartViewMode("combined")}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        chartViewMode === "combined"
                          ? "bg-white text-gray-900 font-semibold shadow-xs"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      Combined
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartViewMode("revenue")}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        chartViewMode === "revenue"
                          ? "bg-white text-custom-bg font-semibold shadow-xs"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      Revenue
                    </button>
                    <button
                      type="button"
                      onClick={() => setChartViewMode("orders")}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        chartViewMode === "orders"
                          ? "bg-white text-emerald-700 font-semibold shadow-xs"
                          : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      Orders
                    </button>
                  </div>

                  {/* Summary Badges */}
                  <div className="flex items-center gap-1.5 text-right">
                    {(chartViewMode === "combined" || chartViewMode === "revenue") && (
                      <div className="bg-sd-hover rounded-lg px-2.5 py-1 text-right">
                        <span className="text-[10px] text-custom-bg/80 font-medium uppercase mr-1">Rev:</span>
                        <span className="text-xs font-bold text-custom-bg">
                          ₹{(() => {
                            const data = getComparisonChartData();
                            if (comparisonMode && selectedStores.length > 0) {
                              return data.reduce((total, item) => {
                                return selectedStores.reduce((sum, storeId) => {
                                  return sum + (item[`revenue_${storeId}`] || 0);
                                }, total);
                              }, 0).toLocaleString("en-IN");
                            }
                            return data.reduce((s, d) => s + (d.revenue || 0), 0).toLocaleString("en-IN");
                          })()}
                        </span>
                      </div>
                    )}
                    {(chartViewMode === "combined" || chartViewMode === "orders") && (
                      <div className="bg-emerald-50 rounded-lg px-2.5 py-1 text-right">
                        <span className="text-[10px] text-emerald-500 font-medium uppercase mr-1">Ord:</span>
                        <span className="text-xs font-bold text-emerald-700">
                          {(() => {
                            const data = getComparisonChartData();
                            if (comparisonMode && selectedStores.length > 0) {
                              return data.reduce((total, item) => {
                                return selectedStores.reduce((sum, storeId) => {
                                  return sum + (item[`orders_${storeId}`] || 0);
                                }, total);
                              }, 0).toLocaleString();
                            }
                            return data.reduce((s, d) => s + (d.orders || 0), 0).toLocaleString();
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {chartLoading ? (
                <LineChartSkeleton strokeClass="text-custom-bg/40" heightClass="h-[280px]" />
              ) : !chartData || chartData.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center gap-1.5 text-gray-400">
                  <BarChart2 className="w-8 h-8 text-gray-300" />
                  <p className="text-xs">No graph activity for the selected date range</p>
                </div>
              ) : (
                (() => {
                  const chartDataForRender = getComparisonChartData();
                  const minWidth = Math.max(500, chartDataForRender.length * 48);
                  const YAXIS_W = 56;
                  const CHART_MARGIN = { top: 15, right: chartViewMode === "combined" ? 48 : 20, left: 10, bottom: 20 };

                  return (
                    <div style={{ display: "flex", height: 280 }}>
                      {/* Fixed Left Y-Axis for Revenue */}
                      {(chartViewMode === "combined" || chartViewMode === "revenue") && (
                        <div style={{ width: YAXIS_W, flexShrink: 0 }}>
                          <ResponsiveContainer width={YAXIS_W} height={280}>
                            <LineChart data={chartDataForRender} margin={{ top: CHART_MARGIN.top, right: 0, left: 0, bottom: CHART_MARGIN.bottom }}>
                              <YAxis
                                yAxisId="rev"
                                tickFormatter={formatChartCurrency}
                                tick={{ fontSize: 9, fill: "#FF5A5F" }}
                                axisLine={false}
                                tickLine={false}
                                width={YAXIS_W}
                              />
                              <Line yAxisId="rev" dataKey="revenue" stroke="transparent" dot={false} isAnimationActive={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Scrollable chart area */}
                      <div style={{ flex: 1, overflowX: "auto", overflowY: "hidden", scrollbarWidth: "thin", scrollbarColor: "#e2e8f0 transparent" }}>
                        <div style={{ minWidth, height: 280 }}>
                          <ResponsiveContainer width="100%" height={280}>
                            <ComposedChart data={chartDataForRender} margin={CHART_MARGIN}>
                              <defs>
                                <linearGradient id="dashboardRevenueGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#FF5A5F" stopOpacity={0.25} />
                                  <stop offset="95%" stopColor="#FF5A5F" stopOpacity={0.0} />
                                </linearGradient>
                                <linearGradient id="dashboardOrdersGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                              <XAxis
                                dataKey="label"
                                tick={{ fontSize: 9, fill: "#94a3b8" }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={formatChartTickLabel}
                                interval={0}
                              />
                              {(chartViewMode === "combined" || chartViewMode === "revenue") && (
                                <YAxis yAxisId="rev" hide />
                              )}
                              {(chartViewMode === "combined" || chartViewMode === "orders") && (
                                <YAxis
                                  yAxisId="ord"
                                  orientation="right"
                                  tick={{ fontSize: 9, fill: "#10b981" }}
                                  axisLine={false}
                                  tickLine={false}
                                  width={36}
                                />
                              )}
                              <Tooltip
                                content={<CustomTooltip />}
                                cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }}
                                wrapperStyle={{ zIndex: 9999, pointerEvents: "auto" }}
                                allowEscapeViewBox={{ x: false, y: true }}
                              />

                              {/* Multi-store Comparison Mode */}
                              {comparisonMode && selectedStores.length > 1 ? (
                                selectedStores.map((storeId) => (
                                  <Line
                                    key={storeId}
                                    yAxisId="rev"
                                    type="monotone"
                                    dataKey={`revenue_${storeId}`}
                                    stroke={storeColors[storeId]}
                                    strokeWidth={2.5}
                                    dot={{ fill: storeColors[storeId], r: 3 }}
                                    activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
                                    name={stores.find((s) => s.value === storeId)?.label || `Store ${storeId}`}
                                    isAnimationActive
                                    animationDuration={600}
                                  />
                                ))
                              ) : (
                                <>
                                  {/* Revenue Series */}
                                  {(chartViewMode === "combined" || chartViewMode === "revenue") && (
                                    <Area
                                      yAxisId="rev"
                                      type="monotone"
                                      dataKey="revenue"
                                      stroke="#FF5A5F"
                                      strokeWidth={2.5}
                                      fill="url(#dashboardRevenueGrad)"
                                      name="Revenue"
                                      dot={{ fill: "#FF5A5F", r: 3 }}
                                      activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
                                    />
                                  )}
                                  {/* Orders Series */}
                                  {(chartViewMode === "combined" || chartViewMode === "orders") && (
                                    <Line
                                      yAxisId="ord"
                                      type="monotone"
                                      dataKey="orders"
                                      stroke="#10b981"
                                      strokeWidth={2.5}
                                      name="Orders"
                                      dot={{ fill: "#10b981", r: 3 }}
                                      activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
                                    />
                                  )}
                                </>
                              )}

                              {(comparisonMode || chartViewMode === "combined") && (
                                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: 8 }} iconSize={8} verticalAlign="bottom" height={24} />
                              )}
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        )}

        {/* Order Status Donut Chart */}
        {isFeatureCodeEnabled(ENABLED_FEATURE_CODES.DASHBOARD_ORDER_STATUS_COUNT) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between">
            <div>
              <div className="mb-3">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{t("ORDERS.FILTERS.ORDER_STATUS")}</h2>
                <p className="text-xs text-gray-400 mt-0.5">{t("DASHBOARD.DISTRIBUTION_BY_STATUS")}</p>
              </div>

              <div className="flex justify-center mb-1">
                <span className="text-xs text-gray-400">
                  Total{" "}
                  <span className="font-bold text-gray-700">
                    {orderStatusData.reduce((s, d) => s + d.value, 0).toLocaleString()}
                  </span>{" "}
                  orders
                </span>
              </div>

              <div className="flex-1 flex items-center justify-center">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      activeIndex={activeStatusIndex}
                      activeShape={renderActiveShape}
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={72}
                      dataKey="value"
                      onMouseEnter={(_, index) => setActiveStatusIndex(index)}
                      strokeWidth={0}
                      isAnimationActive={true}
                      animationDuration={600}
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-2 pt-3 border-t border-gray-50">
              {orderStatusData.map((item, idx) => {
                const total = orderStatusData.reduce((s, d) => s + d.value, 0);
                const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
                return (
                  <div
                    key={item.name}
                    className="flex items-center gap-1.5 text-xs cursor-pointer group"
                    onMouseEnter={() => setActiveStatusIndex(idx)}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-transform group-hover:scale-125"
                      style={{ background: item.color }}
                    />
                    <span className="text-gray-500 truncate">{item.name}</span>
                    <span className="ml-auto font-semibold text-gray-700">{item.value}</span>
                    <span className="text-gray-300 mx-0.5">·</span>
                    <span className="text-gray-400">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Products */}
        {isFeatureCodeEnabled(ENABLED_FEATURE_CODES.DASHBOARD_TOP_PRODUCTS) && (
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[420px] mt-6 md:mt-0">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">
                {t("DASHBOARD.TOP_PRODUCTS.TOP_PRODUCTS")}
              </h2>
            </div>
            <div className="flex flex-col gap-2 p-3 flex-1">
              {paginatedTopProducts.length > 0 ? (
                paginatedTopProducts.map((product, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row items-center bg-white rounded-lg shadow-sm px-3 py-2 transition min-h-[70px]"
                  >
                    <div className="flex-shrink-0 mb-2 md:mb-0 md:mr-4">
                      <img
                        src={
                          product.image ||
                          "https://via.placeholder.com/48x48?text=Img"
                        }
                        alt={product.name}
                        className="h-10 w-10 rounded object-cover border"
                      />
                    </div>
                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-900 truncate max-w-[10rem]">
                          {product.name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-700">
                          {product.category ||
                            t("DASHBOARD.PRODUCT_MODAL.CATEGORY_DEFAULT")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              product.rating >= star
                                ? "text-yellow-400"
                                : "text-gray-300"
                            }`}
                            fill={product.rating >= star ? "#facc15" : "none"}
                          />
                        ))}
                        <span className="ml-1 text-sm text-gray-500">
                          {product.rating}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 mt-1 text-xs text-gray-500">
                        <span className="flex items-center">
                          <IndianRupee className="inline h-4 w-4 mr-1 text-green-400" />
                          {product.revenue}
                        </span>
                        <span className="flex items-center">
                          <TrendingUp className="inline h-4 w-4 mr-1 text-blue-400" />
                          {t("DASHBOARD.TOP_PRODUCTS.SALES", {
                            count: product.sales,
                          })}
                        </span>
                        <span className="flex items-center">
                          <Package className="inline h-4 w-4 mr-1 text-gray-400" />
                          {t("DASHBOARD.TOP_PRODUCTS.IN_STOCK", {
                            count: product.stock,
                          })}
                        </span>
                        {product.stock < 10 && (
                          <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                            {t("DASHBOARD.TOP_PRODUCTS.LOW_STOCK")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-full md:w-auto mt-2 md:mt-0 md:ml-4 flex flex-col items-end gap-2">
                      <button
                        className="w-full md:w-auto px-2.5 py-1 rounded bg-custom-bg text-white text-[10px] font-medium hover:bg-bg-hover transition"
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowProductModal(true);
                        }}
                      >
                        {t("DASHBOARD.TOP_PRODUCTS.VIEW")}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col justify-center items-center h-40">
                  <div className="mb-3 relative">
                    <div className="relative w-16 h-16">
                      {/* Shopping cart with animated items */}
                      <svg 
                        className="absolute inset-0 w-16 h-16 text-gray-300" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={1.5} 
                          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
                        />
                      </svg>
                      
                      {/* Animated product items floating above cart */}
                      <div className="absolute -top-2 -right-2">
                        <svg 
                          className="w-6 h-6 text-gray-400 animate-bounce" 
                          fill="currentColor" 
                          viewBox="0 0 24 24"
                          style={{ animationDelay: '0ms' }}
                        >
                          <rect x="4" y="4" width="16" height="16" rx="2" />
                        </svg>
                      </div>
                      
                      <div className="absolute -top-4 -left-2">
                        <svg 
                          className="w-5 h-5 text-gray-400 animate-bounce" 
                          fill="currentColor" 
                          viewBox="0 0 24 24"
                          style={{ animationDelay: '200ms' }}
                        >
                          <rect x="5" y="5" width="14" height="14" rx="2" />
                        </svg>
                      </div>
                      
                      <div className="absolute top-0 left-0">
                        <svg 
                          className="w-4 h-4 text-gray-400 animate-bounce" 
                          fill="currentColor" 
                          viewBox="0 0 24 24"
                          style={{ animationDelay: '400ms' }}
                        >
                          <rect x="6" y="6" width="12" height="12" rx="2" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Subtle rotating ring around the cart */}
                    <div className="absolute inset-0 w-20 h-20 -m-2">
                      <svg 
                        className="w-full h-full text-gray-200 animate-spin" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        style={{ animationDuration: '3s' }}
                      >
                        <circle 
                          cx="12" 
                          cy="12" 
                          r="10" 
                          strokeWidth="1" 
                          strokeDasharray="2 4"
                          opacity="0.5"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm">
                    {t("DASHBOARD.NO_TOP_PRODUCTS")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        {/* Recent Orders */}
        {isFeatureCodeEnabled(ENABLED_FEATURE_CODES.DASHBOARD_RECENT_ORDERS) && (
        <div className="mb-6 md:mb-0 -z-8">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col h-[420px]">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t("DASHBOARD.RECENT_ORDERS.RECENT_ORDERS")}
              </h2>
            </div>
            <div className="flex-1 w-full overflow-x-auto">
              {recentOrders.length > 0 ? (
                <table className="w-full min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800 top-0 z-10">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider align-middle">
                        {t("DASHBOARD.RECENT_ORDERS.CUSTOMER")}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider align-middle">
                        {t("DASHBOARD.RECENT_ORDERS.ORDER_ID")}
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider align-middle">
                        {t("DASHBOARD.RECENT_ORDERS.AMOUNT")}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider align-middle">
                        {t("COMMON.STATUS")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-100 dark:divide-gray-700">
                    {recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition h-10"
                      >
                        <td className="px-4 py-3 align-middle whitespace-nowrap">
                          <span
                            className="inline-block align-middle h-7 w-7 rounded-full bg-sd-hover text-custom-bg font-bold text-xs text-center leading-7 mr-2"
                            style={{ minWidth: "1.75rem" }}
                          >
                            {order.customer
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                          <span className="inline-block align-middle text-xs text-gray-900 dark:text-gray-100 max-w-[8rem] truncate">
                            {order.customer}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700 dark:text-gray-300 align-middle whitespace-nowrap max-w-[8rem] truncate">
                          {order.id}
                        </td>
                        <td className="px-4 py-3 text-xs font-medium text-gray-900 dark:text-gray-100 text-right align-middle whitespace-nowrap">
                          {order.amount}
                        </td>
                        <td className="px-4 py-3 align-middle whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-sm font-semibold
                      ${
                        order.status === ORDER_STATUS.DELIVERED
                          ? STATUS.DELIVERED
                          : ""
                      } 
                      ${
                        order.status === ORDER_STATUS.PROCESSING
                          ? STATUS.PROCESSING
                          : ""
                      }
                      ${
                        order.status === ORDER_STATUS.SHIPPED
                          ? STATUS.SHIPPED
                          : ""
                      }
                      ${
                        order.status === ORDER_STATUS.CANCELLED
                          ? STATUS.CANCELLED
                          : ""
                      }
                       ${
                         order.status === ORDER_STATUS.PENDING
                           ? STATUS.PENDING
                           : ""
                       }
                    `}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col justify-center items-center h-40">
                  <div className="mb-3 relative">
                    <div className="relative w-16 h-16">
                      {/* Document/Order icon with animated elements */}
                      <svg 
                        className="absolute inset-0 w-16 h-16 text-gray-300" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={1.5} 
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                        />
                      </svg>
                      
                      {/* Animated order items */}
                      <div className="absolute -top-2 -right-2">
                        <svg 
                          className="w-5 h-5 text-gray-400 animate-pulse" 
                          fill="currentColor" 
                          viewBox="0 0 24 24"
                          style={{ animationDelay: '0ms' }}
                        >
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      </div>
                      
                      <div className="absolute -top-4 -left-2">
                        <svg 
                          className="w-4 h-4 text-gray-400 animate-pulse" 
                          fill="currentColor" 
                          viewBox="0 0 24 24"
                          style={{ animationDelay: '300ms' }}
                        >
                          <circle cx="12" cy="12" r="2" />
                        </svg>
                      </div>
                      
                      {/* Animated checkmark for completed orders */}
                      <div className="absolute bottom-0 right-0">
                        <svg 
                          className="w-6 h-6 text-green-400 animate-bounce" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                          style={{ animationDelay: '600ms' }}
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M5 13l4 4L19 7" 
                          />
                        </svg>
                      </div>
                    </div>
                    
                    {/* Subtle rotating ring around document */}
                    <div className="absolute inset-0 w-20 h-20 -m-2">
                      <svg 
                        className="w-full h-full text-gray-200 animate-spin" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                        style={{ animationDuration: '4s' }}
                      >
                        <circle 
                          cx="12" 
                          cy="12" 
                          r="10" 
                          strokeWidth="1" 
                          strokeDasharray="3 3"
                          opacity="0.4"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm">
                    {t("DASHBOARD.NO_RECENT_ORDERS")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
        </>
      )}

      {/* 2. Action Needed Lens */}
      {activeDashboardTab === "action_needed" && (
        <ActionNeededSection
          orders={allOrdersList}
          lowStockItems={lowStockItems}
          navigate={navigate}
          formatCurrency={formatCurrency}
          t={t}
        />
      )}

      {/* 3. Sales Analytics Lens */}
      {activeDashboardTab === "sales" && (
        <SalesAnalyticsSection
          chartData={chartData}
          revenueMetrics={metricsDetails.revenue}
          ordersMetrics={metricsDetails.orders}
          averageOrderMetrics={metricsDetails.averageOrder}
          stores={stores}
          selectedStores={selectedStores}
          comparisonMode={comparisonMode}
          storeColors={storeColors}
          formatCurrency={formatCurrency}
          t={t}
        />
      )}

      {/* 4. Customer Analytics Lens */}
      {activeDashboardTab === "customers" && (
        <CustomerAnalyticsSection
          customersMetrics={metricsDetails.customers}
          navigate={navigate}
          formatCurrency={formatCurrency}
          t={t}
        />
      )}

      {/* 5. Abandoned Carts & Wishlists Lens */}
      {activeDashboardTab === "abandoned_carts" && (
        <AbandonedCartsSection
          navigate={navigate}
          formatCurrency={formatCurrency}
          t={t}
        />
      )}

      {/* 6. Fulfilment Analytics Lens */}
      {activeDashboardTab === "fulfilment" && (
        <FulfilmentAnalyticsSection
          orders={allOrdersList}
          navigate={navigate}
          t={t}
        />
      )}

      {/* 7. Returns & Cancellations Lens */}
      {activeDashboardTab === "returns" && (
        <ReturnsCancellationsSection
          orders={allOrdersList}
          navigate={navigate}
          formatCurrency={formatCurrency}
          t={t}
        />
      )}

      {/* 8. Product & Inventory Insights Lens */}
      {activeDashboardTab === "inventory" && (
        <ProductInventorySection
          topProducts={topProducts}
          lowStockItems={lowStockItems}
          navigate={navigate}
          formatCurrency={formatCurrency}
          t={t}
        />
      )}

      {/* 9. Account & Plan Usage Lens */}
      {activeDashboardTab === "account_plan" && (
        <AccountPlanSection
          navigate={navigate}
          t={t}
        />
      )}

      {/* 10. All Sections (Full View) Stacked */}
      {activeDashboardTab === "all_sections" && (
        <div className="space-y-8">
          <ActionNeededSection
            orders={allOrdersList}
            lowStockItems={lowStockItems}
            navigate={navigate}
            formatCurrency={formatCurrency}
            t={t}
          />
          <SalesAnalyticsSection
            chartData={chartData}
            revenueMetrics={metricsDetails.revenue}
            ordersMetrics={metricsDetails.orders}
            averageOrderMetrics={metricsDetails.averageOrder}
            stores={stores}
            selectedStores={selectedStores}
            comparisonMode={comparisonMode}
            storeColors={storeColors}
            formatCurrency={formatCurrency}
            t={t}
          />
          <CustomerAnalyticsSection
            customersMetrics={metricsDetails.customers}
            navigate={navigate}
            formatCurrency={formatCurrency}
            t={t}
          />
          <AbandonedCartsSection
            navigate={navigate}
            formatCurrency={formatCurrency}
            t={t}
          />
          <FulfilmentAnalyticsSection
            orders={allOrdersList}
            navigate={navigate}
            t={t}
          />
          <ReturnsCancellationsSection
            orders={allOrdersList}
            navigate={navigate}
            formatCurrency={formatCurrency}
            t={t}
          />
          <ProductInventorySection
            topProducts={topProducts}
            lowStockItems={lowStockItems}
            navigate={navigate}
            formatCurrency={formatCurrency}
            t={t}
          />
          <AccountPlanSection
            navigate={navigate}
            t={t}
          />
        </div>
      )}

      {/* Orders Graph Dialog */}
      {showOrdersDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Orders Graph</h2>
                <p className="text-sm text-gray-500 mt-1">
                  <span className="text-amber-400 font-medium">{getChartGranularityLabel(dateRange.start, dateRange.end)}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Store Dropdown */}
                <select
                  value={selectedStores[0] || 'all'}
                  onChange={(e) => setSelectedStores([e.target.value])}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900"
                >
                  {stores.map((store) => (
                    <option key={store.value} value={store.value}>
                      {store.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowOrdersDialog(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Dialog Content */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Total Orders</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <span className="text-amber-400 font-medium">{getChartGranularityLabel(dateRange.start, dateRange.end)}</span>
                  </p>
                </div>
                <div className="bg-amber-50 rounded-lg px-3 py-1.5 text-right">
                  <p className="text-[10px] text-amber-500 font-medium uppercase tracking-wide">Total</p>
                  <p className="text-sm font-bold text-amber-600">
                    {chartData.reduce((s, d) => s + d.orders, 0).toLocaleString()}
                  </p>
                </div>
              </div>

              {chartLoading ? (
                <LineChartSkeleton strokeClass="text-amber-300" heightClass="h-[200px]" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false}/>
                    <XAxis dataKey="label" tick={{fontSize:10,fill:"#94a3b8"}} axisLine={false} tickLine={false} interval="preserveStartEnd" tickFormatter={formatChartTickLabel}/>
                    <YAxis tick={{fontSize:10,fill:"#94a3b8"}} axisLine={false} tickLine={false} width={28}/>
                    <Tooltip content={<CustomTooltip />} cursor={{stroke:"#f59e0b",strokeWidth:1,strokeDasharray:"4 3"}} wrapperStyle={{zIndex:50,pointerEvents:"auto"}} contentStyle={{pointerEvents:"auto"}}/>
                    <Area type="monotone" dataKey="orders" stroke="#f59e0b" strokeWidth={2.5}
                      fill="url(#areaOrders)" dot={false}
                      activeDot={{r:6,fill:"#f59e0b",stroke:"#fff",strokeWidth:2.5}}
                      isAnimationActive animationDuration={600}/>
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Dialog Footer */}
            <div className="flex justify-end p-4 border-t border-gray-200">
              <button
                onClick={() => setShowOrdersDialog(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors duration-150"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customers Graph Dialog */}
      {showCustomersDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Customers Graph</h2>
                <p className="text-sm text-gray-500 mt-1">
                  <span className="text-green-400 font-medium">{getChartGranularityLabel(dateRange.start, dateRange.end)}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Store Dropdown */}
                <select
                  value={selectedStores[0] || 'all'}
                  onChange={(e) => setSelectedStores([e.target.value])}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-900"
                >
                  {stores.map((store) => (
                    <option key={store.value} value={store.value}>
                      {store.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowCustomersDialog(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Dialog Content */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Total Customers</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <span className="text-green-400 font-medium">{getChartGranularityLabel(dateRange.start, dateRange.end)}</span>
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg px-3 py-1.5 text-right">
                  <p className="text-[10px] text-green-500 font-medium uppercase tracking-wide">Total</p>
                  <p className="text-sm font-bold text-green-600">
                    {metrics.find(m => m.title === "Total Customers")?.value?.toLocaleString() || "0"}
                  </p>
                </div>
              </div>

              {chartLoading ? (
                <LineChartSkeleton strokeClass="text-green-300" heightClass="h-[200px]" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="areaCustomers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3}/>
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false}/>
                    <XAxis dataKey="label" tick={{fontSize:10,fill:"#94a3b8"}} axisLine={false} tickLine={false} interval="preserveStartEnd" tickFormatter={formatChartTickLabel}/>
                    <YAxis tick={{fontSize:10,fill:"#94a3b8"}} axisLine={false} tickLine={false} width={28}/>
                    <Tooltip content={<CustomTooltip />} cursor={{stroke:"#22c55e",strokeWidth:1,strokeDasharray:"4 3"}} wrapperStyle={{zIndex:50,pointerEvents:"auto"}} contentStyle={{pointerEvents:"auto"}}/>
                    <Area type="monotone" dataKey="orders" stroke="#22c55e" strokeWidth={2.5}
                      fill="url(#areaCustomers)" dot={false}
                      activeDot={{r:6,fill:"#22c55e",stroke:"#fff",strokeWidth:2.5}}
                      isAnimationActive animationDuration={600}/>
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Dialog Footer */}
            <div className="flex justify-end p-4 border-t border-gray-200">
              <button
                onClick={() => setShowCustomersDialog(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors duration-150"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Average Order Graph Dialog */}
      {showAverageOrderDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4">
            {/* Dialog Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Average Order Graph</h2>
                <p className="text-sm text-gray-500 mt-1">
                  <span className="text-purple-400 font-medium">{getChartGranularityLabel(dateRange.start, dateRange.end)}</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                {/* Store Dropdown */}
                <select
                  value={selectedStores[0] || 'all'}
                  onChange={(e) => setSelectedStores([e.target.value])}
                  className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-gray-900"
                >
                  {stores.map((store) => (
                    <option key={store.value} value={store.value}>
                      {store.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowAverageOrderDialog(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Dialog Content */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Average Order Value</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    <span className="text-purple-400 font-medium">{getChartGranularityLabel(dateRange.start, dateRange.end)}</span>
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg px-3 py-1.5 text-right">
                  <p className="text-[10px] text-purple-500 font-medium uppercase tracking-wide">Average</p>
                  <p className="text-sm font-bold text-purple-600">
                    {"\u20B9"}{metrics.find(m => m.title === "Average Order")?.value?.toLocaleString("en-IN") || "0"}
                  </p>
                </div>
              </div>

              {chartLoading ? (
                <LineChartSkeleton strokeClass="text-purple-300" heightClass="h-[200px]" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart
                    data={chartData.map(d => ({
                      ...d,
                      avgOrder: d.orders > 0 ? Math.round(d.revenue / d.orders) : 0
                    }))}
                    margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false}/>
                    <XAxis dataKey="label" tick={{fontSize:10,fill:"#94a3b8"}} axisLine={false} tickLine={false} interval="preserveStartEnd" tickFormatter={formatChartTickLabel}/>
                    <YAxis tickFormatter={formatChartCurrency} tick={{fontSize:10,fill:"#94a3b8"}} axisLine={false} tickLine={false} width={42}/>
                    <Tooltip
                      formatter={(value) => [`\u20B9${Number(value).toLocaleString("en-IN")}`, "Avg Order Value"]}
                      cursor={{stroke:"#a855f7",strokeWidth:1,strokeDasharray:"4 3"}}
                      wrapperStyle={{zIndex:50,pointerEvents:"auto"}}
                      contentStyle={{pointerEvents:"auto"}}
                    />
                    <Line type="monotone" dataKey="avgOrder" stroke="#a855f7" strokeWidth={2.5}
                      dot={false}
                      activeDot={{r:6,fill:"#a855f7",stroke:"#fff",strokeWidth:2.5}}
                      isAnimationActive animationDuration={600}/>
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Dialog Footer */}
            <div className="flex justify-end p-4 border-t border-gray-200">
              <button
                onClick={() => setShowAverageOrderDialog(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors duration-150"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
