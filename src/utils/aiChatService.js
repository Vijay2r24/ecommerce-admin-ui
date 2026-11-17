import axios from "axios";
import { apiGet } from "./ApiUtils";
import {
  GET_TOTAL_REVENUE,
  GET_TOTAL_ORDERS,
  GET_TOTAL_CUSTOMERS,
  GET_RECENT_ORDERS,
  GET_TOP_PRODUCTS,
  GETALLORDERS_API,
  GET_ALL_STORES,
  GET_ALL_STORES_API,
  GET_LOW_STOCK,
  GET_ALL_USERS,
} from "../contants/apiRoutes";
import dayjs from "dayjs";

const CHAT_STORAGE_KEY = "ecommerce_ai_chat_history";

/**
 * Format currency to Indian Rupee (INR)
 */
const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
};

const formatNumber = (num) => {
  const val = Number(num) || 0;
  return new Intl.NumberFormat("en-IN").format(val);
};

/**
 * Clean search query to extract search terms (e.g. "Aaryen Sk" from "Aaryen Sk user details i want")
 */
const extractSearchTerm = (text = "") => {
  return text
    .replace(/user\s*details/gi, "")
    .replace(/customer\s*details/gi, "")
    .replace(/order\s*details/gi, "")
    .replace(/product\s*details/gi, "")
    .replace(/details\s*of/gi, "")
    .replace(/details/gi, "")
    .replace(/user/gi, "")
    .replace(/customer/gi, "")
    .replace(/i\s*want/gi, "")
    .replace(/give\s*me/gi, "")
    .replace(/show\s*me/gi, "")
    .replace(/tell\s*me/gi, "")
    .replace(/show/gi, "")
    .replace(/find/gi, "")
    .replace(/search/gi, "")
    .replace(/who\s*is/gi, "")
    .replace(/info\s*on/gi, "")
    .replace(/info\s*about/gi, "")
    .replace(/info/gi, "")
    .replace(/about/gi, "")
    .replace(/for/gi, "")
    .replace(/please/gi, "")
    .replace(/[?!.]/g, "")
    .trim();
};

/**
 * Fetch live store snapshot dynamically using auth token
 */
export const fetchLiveStoreSnapshot = async (token) => {
  const snapshot = {
    users: [],
    orders: [],
    totalRevenue: null,
    totalOrders: null,
    totalCustomers: null,
    stores: [],
    lowStock: [],
  };

  try {
    const [
      usersRes,
      ordersRes,
      revRes,
      ordersCountRes,
      custCountRes,
      storesRes,
      stockRes,
    ] = await Promise.allSettled([
      apiGet(GET_ALL_USERS, {}, token),
      apiGet(GETALLORDERS_API, { limit: 50 }, token),
      apiGet(GET_TOTAL_REVENUE, {}, token),
      apiGet(GET_TOTAL_ORDERS, {}, token),
      apiGet(GET_TOTAL_CUSTOMERS, {}, token),
      apiGet(GET_ALL_STORES, {}, token),
      apiGet(GET_LOW_STOCK, {}, token),
    ]);

    if (usersRes.status === "fulfilled") {
      const data = usersRes.value?.data?.data || usersRes.value?.data || [];
      snapshot.users = Array.isArray(data)
        ? data.map((u) => ({
            id: u.UserID || u.id,
            name: `${u.FirstName || ""} ${u.LastName || ""}`.trim(),
            firstName: u.FirstName || "",
            lastName: u.LastName || "",
            email: u.Email || "",
            phone: u.MobileNumber || u.PhoneNumber || "",
            role: u.RoleName || u.Role || "Staff",
            status: u.IsActive !== false && u.Status !== "INACTIVE" ? "Active" : "Inactive",
            store: u.StoreName || "",
          }))
        : [];
    }

    if (ordersRes.status === "fulfilled") {
      const data = ordersRes.value?.data?.data || [];
      snapshot.orders = Array.isArray(data)
        ? data.map((o) => ({
            orderId: o.OrderRefID || o.OrderId || o.id,
            customerName: o.Customer
              ? `${o.Customer.FirstName || ""} ${o.Customer.LastName || ""}`.trim()
              : o.CustomerName || "",
            customerEmail: o.Customer?.Email || "",
            customerPhone: o.Customer?.MobileNumber || "",
            totalAmount: o.TotalAmount || o.Amount || 0,
            status: o.OrderStatus || o.Status || "Confirmed",
            date: o.OrderDate,
            items: Array.isArray(o.orderItems)
              ? o.orderItems.map((item) => `${item.ProductName || "Item"} (×${item.Quantity || 1})`)
              : [],
          }))
        : [];
    }

    if (revRes.status === "fulfilled") {
      snapshot.totalRevenue = revRes.value?.data?.data || null;
    }
    if (ordersCountRes.status === "fulfilled") {
      snapshot.totalOrders = ordersCountRes.value?.data?.data || null;
    }
    if (custCountRes.status === "fulfilled") {
      snapshot.totalCustomers = custCountRes.value?.data?.data || null;
    }
    if (storesRes.status === "fulfilled") {
      const stData = storesRes.value?.data?.data || [];
      snapshot.stores = Array.isArray(stData)
        ? stData.map((s) => ({
            name: s.StoreName,
            code: s.StoreCode,
            city: s.City,
            state: s.State,
          }))
        : [];
    }
    if (stockRes.status === "fulfilled") {
      const lsData = stockRes.value?.data?.data || [];
      snapshot.lowStock = Array.isArray(lsData)
        ? lsData.map((l) => ({
            productName: l.ProductName,
            quantity: l.Quantity || l.StockQuantity,
            store: l.StoreName,
          }))
        : [];
    }
  } catch (err) {
    console.error("Error fetching live store snapshot:", err);
  }

  return snapshot;
};

/**
 * Dynamic Query Engine: Processes user text dynamically using live store APIs
 */
const processDynamicQuery = (userPrompt, store) => {
  const p = userPrompt.trim().toLowerCase();
  const cleanTerm = extractSearchTerm(userPrompt).toLowerCase();

  // 1. ALL USERS / DIRECTORY LISTING
  // e.g. "i want all users list", "all users", "list users", "users list", "show users", "staff list"
  const isAllUsersList =
    p.includes("all users") ||
    p.includes("users list") ||
    p.includes("list of users") ||
    p.includes("list users") ||
    p.includes("show users") ||
    p.includes("get users") ||
    p.includes("user list") ||
    p.includes("all staff") ||
    p.includes("all team");

  if (isAllUsersList) {
    if (store.users.length === 0) {
      return `👥 **Registered Users:** No user records were returned from the backend. Please ensure your login token is active.`;
    }
    let reply = `👥 **Registered Store Users & Staff (${store.users.length} total):**\n\n`;
    store.users.forEach((u, i) => {
      reply += `${i + 1}. **${u.name}** — **${u.role || "Staff"}**\n`;
      reply += `   • Email: \`${u.email || "N/A"}\` | Phone: \`${u.phone || "N/A"}\`\n`;
      reply += `   • Status: ${u.status === "Active" ? "Active ✅" : "Inactive ❌"} | Store: *${u.store || "All Stores"}* | ID: \`${u.id || "N/A"}\`\n\n`;
    });
    reply += `*Tip: Ask for specific user details like "Lavanya A user details i want" to inspect their associated orders.*`;
    return reply;
  }

  // 2. SPECIFIC USER SEARCH (e.g. "Aaryen Sk user details i want", "who is Aaryen", "details of X")
  const isSpecificSearch =
    p.includes("user detail") ||
    p.includes("customer detail") ||
    p.includes("details i want") ||
    p.includes("details of") ||
    p.startsWith("who is") ||
    (cleanTerm.length >= 3 && !["all", "list", "order", "orders", "store", "stores"].includes(cleanTerm));

  if (isSpecificSearch) {
    // Search registered system users
    const matchedUser = store.users.find((u) => {
      const name = (u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const phone = (u.phone || "").toLowerCase();

      if (cleanTerm && (name.includes(cleanTerm) || email.includes(cleanTerm) || phone.includes(cleanTerm))) {
        return true;
      }
      // Match by individual words (e.g. "Aaryen" or "Sk")
      const words = cleanTerm.split(/\s+/).filter((w) => w.length >= 2);
      if (words.length > 0 && words.some((w) => name.includes(w) || email.includes(w))) {
        return true;
      }
      return false;
    });

    if (matchedUser) {
      let card = `👤 **User Details: ${matchedUser.name}**\n\n`;
      card += `• **Full Name:** **${matchedUser.name}**\n`;
      card += `• **Role:** ${matchedUser.role}\n`;
      card += `• **Email:** \`${matchedUser.email || "N/A"}\`\n`;
      card += `• **Phone:** \`${matchedUser.phone || "N/A"}\`\n`;
      card += `• **Status:** ${matchedUser.status === "Active" ? "Active ✅" : "Inactive ❌"}\n`;
      if (matchedUser.store) card += `• **Assigned Store:** ${matchedUser.store}\n`;
      if (matchedUser.id) card += `• **User ID:** \`${matchedUser.id}\`\n`;
      return card;
    }

    // Search in customer orders
    const matchedCustomer = store.orders.find((o) => {
      const name = (o.customerName || "").toLowerCase();
      const email = (o.customerEmail || "").toLowerCase();
      const phone = (o.customerPhone || "").toLowerCase();

      if (cleanTerm && (name.includes(cleanTerm) || email.includes(cleanTerm) || phone.includes(cleanTerm))) {
        return true;
      }
      const words = cleanTerm.split(/\s+/).filter((w) => w.length >= 2);
      if (words.length > 0 && words.some((w) => name.includes(w))) {
        return true;
      }
      return false;
    });

    if (matchedCustomer) {
      const custOrders = store.orders.filter(
        (o) => o.customerName.toLowerCase() === matchedCustomer.customerName.toLowerCase()
      );

      let card = `👤 **Customer Found: ${matchedCustomer.customerName}**\n\n`;
      card += `• **Customer Name:** **${matchedCustomer.customerName}**\n`;
      card += `• **Email:** \`${matchedCustomer.customerEmail || "N/A"}\`\n`;
      card += `• **Phone:** \`${matchedCustomer.customerPhone || "N/A"}\`\n`;
      card += `• **Total Orders Placed:** **${custOrders.length} order(s)**\n\n`;
      card += `**Recent Orders:**\n`;
      custOrders.slice(0, 3).forEach((o, i) => {
        card += `${i + 1}. \`${o.orderId}\` — **${formatCurrency(o.totalAmount || 0)}** (${o.status}) on ${dayjs(o.date).format("DD MMM, YYYY")}\n`;
      });
      return card;
    }
  }

  // 2. SPECIFIC ORDER LOOKUP (e.g. "order ORD-1234", "order details")
  if (p.includes("ord-") || p.includes("order detail") || p.startsWith("find order")) {
    const matchedOrder = store.orders.find((o) => {
      const id = (o.orderId || "").toLowerCase();
      return id.includes(cleanTerm) || (cleanTerm && (o.customerName || "").toLowerCase().includes(cleanTerm));
    });

    if (matchedOrder) {
      let card = `📦 **Order Details: \`${matchedOrder.orderId}\`**\n\n`;
      card += `• **Customer:** **${matchedOrder.customerName || "Customer"}**\n`;
      card += `• **Total Amount:** **${formatCurrency(matchedOrder.totalAmount || 0)}**\n`;
      card += `• **Status:** \`${matchedOrder.status}\`\n`;
      card += `• **Date Placed:** ${dayjs(matchedOrder.date).format("DD MMM, YYYY HH:mm")}\n`;
      if (matchedOrder.items.length > 0) {
        card += `• **Items:** ${matchedOrder.items.join(", ")}\n`;
      }
      return card;
    }
  }

  // 3. ORDERS COUNT / HOW MANY ORDERS
  if (
    p.includes("how many order") ||
    p.includes("tell how many order") ||
    p.includes("total order") ||
    p.includes("order count") ||
    p.includes("number of order")
  ) {
    const total =
      store.totalOrders?.currentTotalOrders ??
      store.totalOrders?.totalOrders ??
      store.orders.length;
    const prev = store.totalOrders?.previousTotalOrders ?? 0;
    const change = store.totalOrders?.totalOrderPercentageChange ?? "0%";

    let reply = `📦 **Total Orders Summary:**\n\n`;
    reply += `• **Current Orders:** **${formatNumber(total)}** orders\n`;
    if (prev > 0 || change !== "0%") {
      reply += `• **Previous Period:** **${formatNumber(prev)}** (${change})\n`;
    }
    reply += `• **Recent Orders Sample:** ${store.orders.length} orders loaded\n\n`;
    reply += `*Tip: Ask "show recent orders" to view individual orders.*`;
    return reply;
  }

  // 4. RECENT ORDERS LIST
  if (
    p.includes("recent order") ||
    p.includes("latest order") ||
    p.includes("show order") ||
    p.includes("list order") ||
    p.includes("pending order")
  ) {
    if (store.orders.length === 0) return `📦 **No recent orders found.**`;
    let res = `📋 **Recent Orders (${Math.min(store.orders.length, 5)}):**\n\n`;
    store.orders.slice(0, 5).forEach((o, i) => {
      res += `${i + 1}. **\`${o.orderId}\`** — **${o.customerName || "Customer"}**\n`;
      res += `   • Amount: **${formatCurrency(o.totalAmount || 0)}** | Status: \`${o.status}\`\n`;
    });
    return res;
  }

  // 5. REVENUE / SALES / EARNINGS
  if (p.includes("revenue") || p.includes("sale") || p.includes("income") || p.includes("earning")) {
    const rev =
      store.totalRevenue?.totalCurrentRevenue ??
      store.totalRevenue?.totalRevenue ??
      0;
    const prev = store.totalRevenue?.previousRevenue ?? 0;
    const change = store.totalRevenue?.totalRevenuePercentageChange ?? "0%";

    let reply = `💰 **Store Revenue Overview:**\n\n`;
    reply += `• **Current Revenue:** **${formatCurrency(rev)}**\n`;
    if (prev > 0 || change !== "0%") {
      reply += `• **Previous Period:** **${formatCurrency(prev)}** (${change})\n`;
    }
    return reply;
  }

  // 6. REGISTERED USERS / CUSTOMERS COUNT
  if (
    p.includes("how many customer") ||
    p.includes("total customer") ||
    p.includes("customer count") ||
    p.includes("how many user") ||
    p.includes("total user")
  ) {
    const custCount =
      store.totalCustomers?.currentRegisteredTotalCutomers ??
      store.totalCustomers?.currentRegisteredTotalCustomers ??
      store.totalCustomers?.totalCustomers ??
      store.users.length;
    return `👥 **Registered Users & Customers:**\n\n• **Total Registered:** **${formatNumber(custCount)}**\n• **Active Staff/Users:** **${store.users.length}** accounts`;
  }

  // 7. LOW STOCK / INVENTORY
  if (p.includes("low stock") || p.includes("stock") || p.includes("inventory") || p.includes("out of stock")) {
    if (store.lowStock.length === 0) {
      return `✅ **Inventory Health:** All products have healthy stock levels above minimum thresholds.`;
    }
    let res = `⚠️ **Low Stock Alert (${store.lowStock.length} items):**\n\n`;
    store.lowStock.slice(0, 6).forEach((item, i) => {
      res += `${i + 1}. **${item.productName || "Product"}** — **${item.quantity || 0} units** left at *${item.store || "Store"}*\n`;
    });
    return res;
  }

  // 8. STORES LIST
  if (p.includes("store") || p.includes("branch") || p.includes("location")) {
    if (store.stores.length === 0) return `🏪 **No active stores found.**`;
    let res = `🏪 **Active Stores (${store.stores.length}):**\n\n`;
    store.stores.slice(0, 8).forEach((st, i) => {
      res += `${i + 1}. **${st.name || "Store"}** — ${st.city || st.state || "Online"}\n`;
    });
    return res;
  }

  // 9. GREETINGS / OVERVIEW / GENERAL PROMPTS
  const rev = store.totalRevenue?.totalCurrentRevenue ?? store.totalRevenue?.totalRevenue ?? 0;
  const orders = store.totalOrders?.currentTotalOrders ?? store.totalOrders?.totalOrders ?? store.orders.length;
  const cust = store.totalCustomers?.currentRegisteredTotalCutomers ?? store.users.length;

  return `📊 **Store Executive Summary:**\n\n` +
    `• 💰 **Total Revenue:** **${formatCurrency(rev)}**\n` +
    `• 📦 **Total Orders:** **${formatNumber(orders)}** orders\n` +
    `• 👥 **Registered Users/Staff:** **${formatNumber(cust)}**\n` +
    `• 🏪 **Active Stores:** **${store.stores.length}** locations\n\n` +
    `You can ask me:\n` +
    `• *"Aaryen Sk user details i want"*\n` +
    `• *"Please tell how many orders"*\n` +
    `• *"Show recent orders"*\n` +
    `• *"What is our revenue"*\n` +
    `• *"Check low stock items"*`;
};

/**
 * Fetch available Node.js LLM models and health
 */
export const fetchNodeHealth = async () => {
  const nodeBase = (import.meta.env.VITE_NODE_AI_URL || "http://localhost:5005/api/chat").replace(/\/api\/chat\/?$/, "");
  try {
    const res = await axios.get(`${nodeBase}/health`, { timeout: 4000 });
    return res.data;
  } catch {
    return null;
  }
};

/**
 * Main send message function: Calls Node.js LLM server (Gemini & Groq) using bearer token,
 * with resilient client-side fallback if the Node server is offline.
 */
export const sendChatMessage = async (
  userMessage,
  conversationHistory = [],
  provider = "auto"
) => {
  const token = localStorage.getItem("token") || "";
  const nodeAiUrl =
    import.meta.env.VITE_NODE_AI_URL || "http://localhost:5005/api/chat";
  const tenantDomain =
    import.meta.env.VITE_TENANT_DOMAIN || "ecommerce-qa.admin.b2yinfy.com";

  // 1. Primary: Send request to Node.js AI LLM Server (Groq / Gemini)
  try {
    const formattedToken = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;
    const response = await axios.post(
      nodeAiUrl,
      {
        message: userMessage,
        provider: provider || "auto",
        conversationHistory: (conversationHistory || []).slice(-6),
      },
      {
        headers: {
          Authorization: formattedToken,
          "tenant-domain": tenantDomain,
          "Content-Type": "application/json",
        },
        timeout: 25000,
      }
    );

    if (
      response.data &&
      (response.data.status === "SUCCESS" || response.status === 200) &&
      response.data.data?.reply
    ) {
      return {
        success: true,
        text: response.data.data.reply,
        model: response.data.data.model || "Node.js LLM Service",
        provider: response.data.data.provider,
      };
    }
  } catch (nodeError) {
    console.warn(
      "Node.js AI server unreachable or returned error, switching to direct store API resolver:",
      nodeError?.message || nodeError
    );
  }

  // 2. Fallback: Query live store APIs directly with session token
  try {
    const storeSnapshot = await fetchLiveStoreSnapshot(token);
    const replyText = processDynamicQuery(userMessage, storeSnapshot);
    return {
      success: true,
      text: replyText,
      model: "Live Store Snapshot Engine",
    };
  } catch (err) {
    console.error("sendChatMessage fallback error:", err);
    return {
      success: false,
      text: `⚠️ An error occurred while retrieving data (${err?.message || "Error"}). Please ensure you are logged in.`,
    };
  }
};

/**
 * Local storage persistence
 */
export const getStoredChatHistory = () => {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveStoredChatHistory = (messages) => {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  } catch (err) {
    console.error("Failed to save chat history", err);
  }
};

export const clearStoredChatHistory = () => {
  try {
    localStorage.removeItem(CHAT_STORAGE_KEY);
  } catch (err) {
    console.error("Failed to clear chat history", err);
  }
};
