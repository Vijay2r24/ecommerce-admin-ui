import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load server/.env regardless of where node was launched from
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

// Middleware
app.use(cors());
app.use(express.json());

const ECOMMERCE_API_BASE_URL =
  process.env.ECOMMERCE_API_BASE_URL ||
  "https://ecommerce-qa-be.admin.b2yinfy.com/api/admin";

const DEFAULT_TENANT_DOMAIN =
  process.env.DEFAULT_TENANT_DOMAIN || "ecommerce-qa.admin.b2yinfy.com";

// LLM Configuration (Mutable for dynamic /api/config updates)
let GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
let GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";

let GROQ_API_KEY = process.env.GROQ_API_KEY || "";
let GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";

let PREFERRED_LLM_PROVIDER = (
  process.env.PREFERRED_LLM_PROVIDER || "auto"
).toLowerCase();

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
 * Extract person or entity search term from user query
 * (e.g., "Aaryen Sk user details i want" -> "aaryen sk")
 */
const extractSearchTerm = (text = "") => {
  return text
    .replace(/all\s*users\s*list/gi, "")
    .replace(/all\s*user\s*list/gi, "")
    .replace(/users\s*list/gi, "")
    .replace(/user\s*list/gi, "")
    .replace(/all\s*users/gi, "")
    .replace(/all\s*orders\s*list/gi, "")
    .replace(/orders\s*list/gi, "")
    .replace(/all\s*orders/gi, "")
    .replace(/user\s*details/gi, "")
    .replace(/customer\s*details/gi, "")
    .replace(/order\s*details/gi, "")
    .replace(/product\s*details/gi, "")
    .replace(/details\s*of/gi, "")
    .replace(/details\s*for/gi, "")
    .replace(/details/gi, "")
    .replace(/i\s*want/gi, "")
    .replace(/give\s*me/gi, "")
    .replace(/show\s*me/gi, "")
    .replace(/tell\s*me/gi, "")
    .replace(/who\s*is/gi, "")
    .replace(/info\s*on/gi, "")
    .replace(/info\s*about/gi, "")
    .replace(/info/gi, "")
    .replace(/find/gi, "")
    .replace(/search/gi, "")
    .replace(/users/gi, "")
    .replace(/user/gi, "")
    .replace(/customers/gi, "")
    .replace(/customer/gi, "")
    .replace(/please/gi, "")
    .replace(/list/gi, "")
    .replace(/every/gi, "")
    .replace(/[?!.:,]/g, "")
    .trim()
    .toLowerCase();
};

/**
 * Fetch live store snapshot from backend using the incoming user session token
 */
async function fetchStoreContext(token, tenantDomain) {
  const headers = {
    Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
    "tenant-domain": tenantDomain || DEFAULT_TENANT_DOMAIN,
    Accept: "application/json",
  };

  const clientConfig = { headers, timeout: 8000 };

  const snapshot = {
    users: [],
    orders: [],
    revenue: null,
    totalOrders: null,
    customers: null,
    stores: [],
    lowStock: [],
  };

  try {
    const [
      usersRes,
      ordersRes,
      revRes,
      ordCountRes,
      custCountRes,
      storesRes,
      stockRes,
    ] = await Promise.allSettled([
      axios.get(`${ECOMMERCE_API_BASE_URL}/getAllUsers?pageSize=100`, clientConfig),
      axios.get(`${ECOMMERCE_API_BASE_URL}/getAllOrders?limit=50&pageSize=50`, clientConfig),
      axios.get(`${ECOMMERCE_API_BASE_URL}/getTotalRevenue`, clientConfig),
      axios.get(`${ECOMMERCE_API_BASE_URL}/getTotalOrders`, clientConfig),
      axios.get(`${ECOMMERCE_API_BASE_URL}/getTotalCustomers`, clientConfig),
      axios.get(`${ECOMMERCE_API_BASE_URL}/getStoresForUser`, clientConfig),
      axios.get(`${ECOMMERCE_API_BASE_URL}/getLowStockProducts`, clientConfig),
    ]);

    // Parse Users
    if (usersRes.status === "fulfilled" && usersRes.value?.data) {
      const rawUsers =
        usersRes.value.data.data ||
        usersRes.value.data.users ||
        (Array.isArray(usersRes.value.data) ? usersRes.value.data : []);
      const uList = Array.isArray(rawUsers) ? rawUsers : [];
      snapshot.users = uList.map((u) => {
        const storeNames = Array.isArray(u.Stores)
          ? u.Stores.map((s) => s.StoreName).filter(Boolean).join(", ")
          : u.StoreName || "";
        return {
          id: u.UserID || u.id,
          firstName: u.FirstName || "",
          lastName: u.LastName || "",
          name:
            `${u.FirstName || ""} ${u.LastName || ""}`.trim() ||
            u.Username ||
            u.Name ||
            "Unnamed User",
          email: u.Email || "",
          phone: u.MobileNumber || u.PhoneNumber || "",
          role: u.RoleName || u.Role || "Staff",
          status:
            u.IsActive !== false && u.Status !== "INACTIVE"
              ? "Active"
              : "Inactive",
          stores: storeNames || "All Stores",
        };
      });
    }

    // Parse Orders
    if (ordersRes.status === "fulfilled" && ordersRes.value?.data) {
      const rawOrders =
        ordersRes.value.data.data ||
        ordersRes.value.data.orders ||
        (Array.isArray(ordersRes.value.data) ? ordersRes.value.data : []);
      const oList = Array.isArray(rawOrders) ? rawOrders : [];
      snapshot.orders = oList.map((o) => {
        const custName = o.FirstName
          ? `${o.FirstName} ${o.LastName || ""}`.trim()
          : o.Customer
          ? `${o.Customer.FirstName || ""} ${o.Customer.LastName || ""}`.trim()
          : o.CustomerName || "Customer";
        return {
          orderId: o.OrderID || o.OrderRefID || o.id,
          orderRefId: o.OrderRefID || o.OrderID || o.id,
          customerName: custName,
          customerEmail: o.Email || o.Customer?.Email || "",
          customerPhone: o.PhoneNumber || o.Customer?.MobileNumber || "",
          amount: o.TotalAmount || o.Amount || 0,
          status: o.OrderStatus || o.Status || "PENDING",
          date: o.OrderDate || o.createdAt,
          itemCount:
            o.totalQuantity ||
            (Array.isArray(o.orderItems) ? o.orderItems.length : 1),
        };
      });
    }

    // Parse Metric Counts
    if (revRes.status === "fulfilled")
      snapshot.revenue = revRes.value?.data?.data || revRes.value?.data;
    if (ordCountRes.status === "fulfilled")
      snapshot.totalOrders =
        ordCountRes.value?.data?.data || ordCountRes.value?.data;
    if (custCountRes.status === "fulfilled")
      snapshot.customers =
        custCountRes.value?.data?.data || custCountRes.value?.data;

    // Parse Stores
    if (storesRes.status === "fulfilled" && storesRes.value?.data) {
      const rawStores =
        storesRes.value.data.data ||
        (Array.isArray(storesRes.value.data) ? storesRes.value.data : []);
      const sList = Array.isArray(rawStores) ? rawStores : [];
      snapshot.stores = sList.map((s) => ({
        id: s.StoreID || s.id,
        name: s.StoreName || "Store",
        city: s.City || "",
        state: s.State || "",
        code: s.StoreCode || "",
        status: s.IsActive !== false ? "Active" : "Inactive",
      }));
    }

    // Parse Low Stock Products
    if (stockRes.status === "fulfilled" && stockRes.value?.data) {
      const rawStock =
        stockRes.value.data.data ||
        (Array.isArray(stockRes.value.data) ? stockRes.value.data : []);
      const lsList = Array.isArray(rawStock) ? rawStock : [];
      snapshot.lowStock = lsList.map((item) => ({
        productName: item.ProductName || item.name || "Product",
        quantity: item.Quantity ?? item.StockQuantity ?? 0,
        store: item.StoreName || "Store",
      }));
    }
  } catch (err) {
    console.error("Error collecting store context in Node.js:", err.message);
  }

  return snapshot;
}

/**
 * Build System Instruction with Live Context for LLMs
 */
function buildSystemInstruction(storeSnapshot) {
  return `You are an expert AI assistant for this Ecommerce Admin dashboard.
You have real-time access to the store database retrieved securely using the user's active session token.

LIVE STORE DATABASE SNAPSHOT:
-----------------------
• Users & Staff: ${JSON.stringify(storeSnapshot.users.slice(0, 30), null, 2)}
• Recent Orders: ${JSON.stringify(storeSnapshot.orders.slice(0, 20), null, 2)}
• Revenue Metrics: ${JSON.stringify(storeSnapshot.revenue, null, 2)}
• Orders Count: ${JSON.stringify(storeSnapshot.totalOrders, null, 2)}
• Customers Count: ${JSON.stringify(storeSnapshot.customers, null, 2)}
• Active Stores: ${JSON.stringify(storeSnapshot.stores, null, 2)}
• Low Stock Alerts: ${JSON.stringify(storeSnapshot.lowStock, null, 2)}
-----------------------

STRICT INSTRUCTIONS:
1. Answer the user prompt directly, conversationally, and accurately based on the prompt text and live store data.
2. If the user asks for a LIST OF ALL USERS (e.g. "i want all users list", "show all users", "users list"):
   Output the full list of ALL users with their names, roles, emails, phone numbers, stores, and active statuses in a clean numbered list! Do NOT output just one user!
3. If the user asks for a specific person or user details (e.g. "Aaryen Sk user details i want"), search both Users and Orders records and output their full profile (Name, Role, Email, Phone, Status, User ID, Store, plus any order records).
4. If they ask about orders, revenue, inventory, or stores, use the real numerical data from the snapshot. Format currencies using ₹ (INR) or standard numbers.
5. Output structured, readable Markdown with bold headings, emojis, and bullet points.`;
}

/**
 * Intelligent Dynamic Query Resolver
 * Answers questions dynamically from store data based on text
 */
function resolveDynamicQuery(userPrompt, snapshot) {
  const p = userPrompt.toLowerCase().trim();
  const searchTerm = extractSearchTerm(userPrompt);

  // 1. ALL USERS / USERS DIRECTORY LISTING
  // e.g. "i want all users list", "all users", "list users", "users list", "show all users", "get users list"
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
    if (snapshot.users.length === 0) {
      return `👥 **Registered Users:** No user records were returned from the backend. Please ensure your login token is active.`;
    }
    let reply = `👥 **Registered Store Users & Staff (${snapshot.users.length} total):**\n\n`;
    snapshot.users.forEach((u, i) => {
      reply += `${i + 1}. **${u.name}** — **${u.role}**\n`;
      reply += `   • Email: \`${u.email || "N/A"}\` | Phone: \`${u.phone || "N/A"}\`\n`;
      reply += `   • Status: ${u.status === "Active" ? "Active ✅" : "Inactive ❌"} | Store: *${u.stores || "All Stores"}* | ID: \`${u.id}\`\n\n`;
    });
    reply += `*Tip: Ask for specific user details like "Lavanya A user details i want" to inspect their associated orders.*`;
    return reply;
  }

  // 2. SPECIFIC USER DETAILS QUERY
  // Matches prompts like: "Aaryen Sk user details i want", "who is Aaryen Sk", "find user john"
  const isSpecificUserQuery =
    (p.includes("user details") ||
      p.includes("customer details") ||
      p.includes("details of") ||
      p.includes("who is") ||
      p.includes("details for")) ||
    (searchTerm.length >= 3 && !["all", "list", "order", "orders", "store", "stores", "stock", "revenue"].includes(searchTerm));

  if (isSpecificUserQuery && searchTerm.length >= 2) {
    // Search in snapshot.users
    const matchedUsers = snapshot.users.filter((u) => {
      const fullName = (u.name || "").toLowerCase();
      const fName = (u.firstName || "").toLowerCase();
      const lName = (u.lastName || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const phone = (u.phone || "").toLowerCase();
      const id = String(u.id || "").toLowerCase();

      return (
        fullName.includes(searchTerm) ||
        fName.includes(searchTerm) ||
        lName.includes(searchTerm) ||
        email.includes(searchTerm) ||
        phone.includes(searchTerm) ||
        id === searchTerm ||
        searchTerm.includes(fullName) ||
        (fName.length >= 3 && searchTerm.includes(fName)) ||
        (lName.length >= 3 && searchTerm.includes(lName))
      );
    });

    // Also search in orders customers
    const matchedCustomersInOrders = snapshot.orders.filter((o) => {
      const custName = (o.customerName || "").toLowerCase();
      const custEmail = (o.customerEmail || "").toLowerCase();
      const custPhone = (o.customerPhone || "").toLowerCase();
      return (
        custName.includes(searchTerm) ||
        custEmail.includes(searchTerm) ||
        custPhone.includes(searchTerm) ||
        searchTerm.includes(custName)
      );
    });

    if (matchedUsers.length > 0) {
      if (matchedUsers.length === 1) {
        const u = matchedUsers[0];
        let reply = `👤 **User Profile: ${u.name}**\n\n`;
        reply += `• **Full Name:** **${u.name}**\n`;
        reply += `• **Role:** ${u.role}\n`;
        reply += `• **Email:** \`${u.email || "Not Provided"}\`\n`;
        reply += `• **Phone:** \`${u.phone || "Not Provided"}\`\n`;
        reply += `• **Status:** ${u.status === "Active" ? "Active ✅" : "Inactive ❌"}\n`;
        reply += `• **Assigned Store(s):** ${u.stores || "All Stores"}\n`;
        reply += `• **User ID:** \`${u.id || "N/A"}\`\n`;

        const userOrders = snapshot.orders.filter(
          (o) =>
            (o.customerEmail &&
              u.email &&
              o.customerEmail.toLowerCase() === u.email.toLowerCase()) ||
            (o.customerName &&
              u.name &&
              o.customerName.toLowerCase() === u.name.toLowerCase())
        );

        if (userOrders.length > 0) {
          reply += `\n📦 **Associated Orders (${userOrders.length}):**\n`;
          userOrders.slice(0, 3).forEach((ord) => {
            reply += `• **#${ord.orderRefId || ord.orderId}** — ${formatCurrency(ord.amount)} | Status: \`${ord.status}\`\n`;
          });
        }
        return reply;
      }

      // If multiple matching users, list all matches cleanly
      let reply = `👥 **Matching Users for "${searchTerm}" (${matchedUsers.length} found):**\n\n`;
      matchedUsers.forEach((u, i) => {
        reply += `${i + 1}. **${u.name}** (${u.role})\n`;
        reply += `   • Email: \`${u.email}\` | Phone: \`${u.phone || "N/A"}\`\n`;
        reply += `   • Status: ${u.status === "Active" ? "Active ✅" : "Inactive ❌"} | Store: *${u.stores}*\n\n`;
      });
      return reply;
    }

    if (matchedCustomersInOrders.length > 0) {
      const cust = matchedCustomersInOrders[0];
      let reply = `👤 **Customer Profile: ${cust.customerName}**\n\n`;
      reply += `• **Customer Name:** **${cust.customerName}**\n`;
      reply += `• **Role:** Customer / Buyer\n`;
      reply += `• **Email:** \`${cust.customerEmail || "Not Provided"}\`\n`;
      reply += `• **Phone:** \`${cust.customerPhone || "Not Provided"}\`\n`;
      reply += `\n📦 **Recent Orders for this Customer:**\n`;
      matchedCustomersInOrders.slice(0, 4).forEach((ord) => {
        reply += `• **#${ord.orderRefId || ord.orderId}** — ${formatCurrency(ord.amount)} | Status: \`${ord.status}\`\n`;
      });
      return reply;
    }

    if (p.includes("user details") || p.includes("details")) {
      let reply = `🔍 **No exact user profile found matching:** *"${searchTerm}"*\n\n`;
      if (snapshot.users.length > 0) {
        reply += `**Available Users in System (${snapshot.users.length}):**\n`;
        snapshot.users.slice(0, 6).forEach((u, i) => {
          reply += `${i + 1}. **${u.name}** (${u.role}) — \`${u.email}\`\n`;
        });
        reply += `\n*Tip: Try asking for user details by typing the full name or email from above.*`;
      } else {
        reply += `Please verify that user records are loaded and your login session is active.`;
      }
      return reply;
    }
  }

  // 3. ORDERS & FULFILLMENT QUERIES
  if (
    p.includes("how many orders") ||
    p.includes("total orders") ||
    p.includes("order count") ||
    p.includes("all orders") ||
    p.includes("orders list") ||
    p.includes("list orders") ||
    p.includes("recent orders") ||
    p.includes("pending orders") ||
    (p.includes("order") &&
      (p.includes("list") ||
        p.includes("show") ||
        p.includes("tell") ||
        p.includes("many")))
  ) {
    const totalOrdersCount =
      snapshot.totalOrders?.currentTotalOrders ??
      snapshot.totalOrders?.totalOrders ??
      snapshot.orders.length;
    const prevOrdersCount = snapshot.totalOrders?.previousTotalOrders ?? 0;
    const pctChange = snapshot.totalOrders?.totalOrderPercentageChange || "0%";

    let reply = `📦 **Store Orders Overview:**\n\n`;
    reply += `• **Total Orders Recorded:** **${formatNumber(totalOrdersCount)}**\n`;
    if (prevOrdersCount > 0) {
      reply += `• **Previous Period:** ${formatNumber(prevOrdersCount)} (${pctChange})\n`;
    }

    if (snapshot.orders.length > 0) {
      reply += `\n📋 **Recent Orders Activity (${Math.min(snapshot.orders.length, 8)} shown):**\n`;
      snapshot.orders.slice(0, 8).forEach((ord, i) => {
        reply += `${i + 1}. **#${ord.orderRefId || ord.orderId}** — ${formatCurrency(ord.amount)} | Customer: **${ord.customerName}** | Status: \`${ord.status}\`\n`;
      });
    }

    return reply;
  }

  // 4. REVENUE & FINANCIALS
  if (
    p.includes("revenue") ||
    p.includes("sales") ||
    p.includes("earnings") ||
    p.includes("income") ||
    p.includes("turnover")
  ) {
    const currentRev =
      snapshot.revenue?.totalCurrentRevenue ??
      snapshot.revenue?.totalRevenue ??
      0;
    const prevRev = snapshot.revenue?.previousRevenue ?? 0;
    const revPct = snapshot.revenue?.totalRevenuePercentageChange || "0%";

    let reply = `💰 **Store Revenue Performance:**\n\n`;
    reply += `• **Current Total Revenue:** **${formatCurrency(currentRev)}**\n`;
    if (prevRev > 0) {
      reply += `• **Previous Period Revenue:** ${formatCurrency(prevRev)} (${revPct})\n`;
    }
    const totalOrdersCount =
      snapshot.totalOrders?.currentTotalOrders ?? snapshot.orders.length;
    if (totalOrdersCount > 0 && currentRev > 0) {
      const aov = Math.round(Number(currentRev) / Number(totalOrdersCount));
      reply += `• **Average Order Value (AOV):** ${formatCurrency(aov)}\n`;
    }
    return reply;
  }

  // 5. INVENTORY & LOW STOCK
  if (
    p.includes("low stock") ||
    p.includes("stock") ||
    p.includes("inventory") ||
    p.includes("threshold")
  ) {
    if (snapshot.lowStock.length === 0) {
      return `✅ **Inventory Health:** All monitored products have healthy stock levels above minimum thresholds.`;
    }
    let reply = `⚠️ **Low Stock Alert (${snapshot.lowStock.length} items below threshold):**\n\n`;
    snapshot.lowStock.slice(0, 10).forEach((item, i) => {
      reply += `${i + 1}. **${item.productName}** — **${item.quantity} units left** (*${item.store}*)\n`;
    });
    return reply;
  }

  // 6. STORES & LOCATIONS
  if (p.includes("store") || p.includes("branch") || p.includes("location")) {
    if (snapshot.stores.length === 0) {
      return `🏪 **Store Locations:** No active stores configured in your user scope.`;
    }
    let reply = `🏪 **Active Stores (${snapshot.stores.length}):**\n\n`;
    snapshot.stores.forEach((st, i) => {
      const loc = [st.city, st.state].filter(Boolean).join(", ") || "Active";
      reply += `${i + 1}. **${st.name}** — ${loc} (Status: \`${st.status}\`)\n`;
    });
    return reply;
  }

  // 7. CUSTOMER COUNT & GROWTH
  if (
    p.includes("how many customers") ||
    p.includes("customer growth") ||
    p.includes("total customers") ||
    p.includes("registered customers")
  ) {
    const custCount =
      snapshot.customers?.currentRegisteredTotalCutomers ??
      snapshot.customers?.totalCustomers ??
      snapshot.users.length;
    const prevCust = snapshot.customers?.previousRegisteredTotalCustomers ?? 0;
    const custPct = snapshot.customers?.totalCustomerPercentageChange || "0%";

    let reply = `👥 **Customer Growth Metrics:**\n\n`;
    reply += `• **Registered Customers/Users:** **${formatNumber(custCount)}**\n`;
    if (prevCust > 0) {
      reply += `• **Previous Period:** ${formatNumber(prevCust)} (${custPct})\n`;
    }
    return reply;
  }

  // 8. FRIENDLY GREETINGS
  const isGreeting =
    /^(hi+|hey+|hello+|hola+|namaste+|good\s*(morning|afternoon|evening)|howdy)\b/i.test(p) ||
    p === "hi" ||
    p === "hii" ||
    p === "hello" ||
    p === "hey";

  if (isGreeting) {
    return (
      `👋 **Hello! Welcome to your Ecommerce Store AI Assistant.**\n\n` +
      `I am ready to help you manage and analyze your store. Here are some things you can ask me:\n` +
      `• 👥 *"I want all users list"* — View all registered staff & their stores\n` +
      `• 👤 *"Lavanya A user details i want"* — Inspect user profile & recent orders\n` +
      `• 📦 *"Please tell how many orders"* — Check current order count & activity\n` +
      `• 💰 *"What is our total revenue"* — Review sales metrics & growth\n` +
      `• ⚠️ *"Show low stock products"* — Check inventory below threshold\n` +
      `• 🏪 *"List active stores"* — See all physical & online outlets\n\n` +
      `What would you like to check today?`
    );
  }

  // 9. DEFAULT EXECUTIVE DASHBOARD BRIEFING
  const rev =
    snapshot.revenue?.totalCurrentRevenue ?? snapshot.revenue?.totalRevenue ?? 0;
  const orders =
    snapshot.totalOrders?.currentTotalOrders ?? snapshot.orders.length;
  const cust =
    snapshot.customers?.currentRegisteredTotalCutomers ?? snapshot.users.length;

  return (
    `📊 **Store Executive Summary (Node.js Service):**\n\n` +
    `• 💰 **Total Revenue:** **${formatCurrency(rev)}**\n` +
    `• 📦 **Total Orders:** **${formatNumber(orders)}** orders\n` +
    `• 👥 **Registered Users/Staff:** **${formatNumber(cust)}**\n` +
    `• 🏪 **Active Stores:** **${snapshot.stores.length}** locations\n` +
    `• ⚠️ **Low Stock Items:** **${snapshot.lowStock.length}** flagged\n\n` +
    `You can ask me dynamically:\n` +
    `• *"I want all users list"*\n` +
    `• *"Aaryen Sk user details i want"*\n` +
    `• *"Please tell how many orders"*\n` +
    `• *"What is our total revenue"* \n` +
    `• *"Show low stock products"*\n` +
    `• *"List active stores"*`
  );
}

/**
 * Call Groq LLM (e.g. GPT OSS 120B, Qwen 3.8 27B)
 */
async function callGroqLLM(prompt, systemInstruction, history = [], modelName) {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured in server/.env");
  }

  const groq = new Groq({ apiKey: GROQ_API_KEY });

  const formattedHistory = (history || []).slice(-6).map((m) => ({
    role: m.sender === "user" ? "user" : "assistant",
    content: m.text || "",
  }));

  const messages = [
    { role: "system", content: systemInstruction },
    ...formattedHistory,
    { role: "user", content: prompt },
  ];

  // Try candidate models in order: requested -> configured -> openai/gpt-oss-120b -> qwen/qwen3.8-27b -> openai/gpt-oss-20b
  const candidateModels = [
    modelName,
    GROQ_MODEL,
    "openai/gpt-oss-120b",
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-20b",
  ].filter(Boolean);

  let lastError = null;
  for (const m of candidateModels) {
    try {
      const completion = await groq.chat.completions.create({
        messages,
        model: m,
        temperature: 0.3,
        max_tokens: 1024,
      });

      const reply = completion.choices[0]?.message?.content || "";
      if (reply) {
        return { reply, model: `Groq (${m})` };
      }
    } catch (err) {
      console.warn(`Groq model ${m} attempt failed:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error("All candidate Groq models failed.");
}

/**
 * Call Google Gemini LLM (e.g. Gemini 1.5 Flash, Gemini 1.5 Pro)
 */
async function callGeminiLLM(prompt, systemInstruction, modelName) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured in server/.env");
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const modelToUse = modelName || GEMINI_MODEL || "gemini-1.5-flash";
  const model = genAI.getGenerativeModel({ model: modelToUse });

  const promptWithContext = `${systemInstruction}\n\nUSER PROMPT: "${prompt}"`;
  const result = await model.generateContent(promptWithContext);
  const reply = result.response.text();

  return { reply, model: `Google Gemini (${modelToUse})` };
}

/**
 * Health check endpoint
 */
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    service: "Node.js LLM Service",
    port: PORT,
    providers: {
      groq: {
        configured: Boolean(GROQ_API_KEY),
        model: GROQ_MODEL,
      },
      gemini: {
        configured: Boolean(GEMINI_API_KEY),
        model: GEMINI_MODEL,
      },
    },
    activeProvider: GROQ_API_KEY
      ? "groq"
      : GEMINI_API_KEY
      ? "gemini"
      : "local_store_engine",
  });
});

/**
 * List available models endpoint
 */
app.get("/api/models", (req, res) => {
  res.json({
    status: "SUCCESS",
    data: [
      {
        id: "auto",
        name: "Auto (Best Available Node.js LLM)",
        provider: "Auto",
        configured: Boolean(GROQ_API_KEY || GEMINI_API_KEY),
      },
      {
        id: "groq",
        name: `Groq (${GROQ_MODEL})`,
        provider: "Groq",
        configured: Boolean(GROQ_API_KEY),
        model: GROQ_MODEL,
      },
      {
        id: "gemini",
        name: `Google Gemini (${GEMINI_MODEL})`,
        provider: "Google",
        configured: Boolean(GEMINI_API_KEY),
        model: GEMINI_MODEL,
      },
    ],
  });
});

/**
 * Endpoint to save / update AI Backend configuration directly to server/.env
 * POST /api/config
 */
app.post("/api/config", (req, res) => {
  try {
    const { groqApiKey, geminiApiKey, groqModel, geminiModel, preferredProvider } = req.body;

    if (groqApiKey !== undefined) GROQ_API_KEY = groqApiKey.trim();
    if (geminiApiKey !== undefined) GEMINI_API_KEY = geminiApiKey.trim();
    if (groqModel !== undefined) GROQ_MODEL = groqModel.trim();
    if (geminiModel !== undefined) GEMINI_MODEL = geminiModel.trim();
    if (preferredProvider !== undefined) PREFERRED_LLM_PROVIDER = preferredProvider.trim();

    // Persist to server/.env
    const envPath = path.resolve(__dirname, ".env");
    const envContent = `PORT=${PORT}
ECOMMERCE_API_BASE_URL=${ECOMMERCE_API_BASE_URL}
DEFAULT_TENANT_DOMAIN=${DEFAULT_TENANT_DOMAIN}

# LLM Providers (Google Gemini & Groq)
GEMINI_API_KEY=${GEMINI_API_KEY}
GEMINI_MODEL=${GEMINI_MODEL}

GROQ_API_KEY=${GROQ_API_KEY}
GROQ_MODEL=${GROQ_MODEL}

PREFERRED_LLM_PROVIDER=${PREFERRED_LLM_PROVIDER}
`;
    fs.writeFileSync(envPath, envContent, "utf8");

    return res.json({
      status: "SUCCESS",
      message: "Node.js LLM configuration updated successfully.",
      data: {
        groqConfigured: Boolean(GROQ_API_KEY),
        geminiConfigured: Boolean(GEMINI_API_KEY),
        groqModel: GROQ_MODEL,
        geminiModel: GEMINI_MODEL,
        preferredProvider: PREFERRED_LLM_PROVIDER,
      },
    });
  } catch (err) {
    console.error("Failed to update config:", err);
    return res.status(500).json({ status: "FAILURE", message: err.message });
  }
});

/**
 * Main AI Chat Endpoint
 * POST /api/chat
 */
app.post("/api/chat", async (req, res) => {
  try {
    const {
      message,
      prompt,
      provider = "auto",
      model: requestedModel,
      conversationHistory = [],
    } = req.body;
    const userPrompt = message || prompt;

    if (!userPrompt || typeof userPrompt !== "string") {
      return res.status(400).json({
        status: "FAILURE",
        message: "A valid 'message' or 'prompt' string is required.",
      });
    }

    // Extract authorization token from headers
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        status: "FAILURE",
        message: "Missing Authorization header with session Bearer token.",
      });
    }

    const tenantDomain = req.headers["tenant-domain"] || DEFAULT_TENANT_DOMAIN;

    // 1. Fetch live store database snapshot using the user's session token
    const storeSnapshot = await fetchStoreContext(authHeader, tenantDomain);
    const systemInstruction = buildSystemInstruction(storeSnapshot);

    const targetProvider = (provider || PREFERRED_LLM_PROVIDER).toLowerCase();

    // 2. Attempt GROQ LLM if requested or in auto mode with GROQ_API_KEY available
    if (
      (targetProvider === "groq" ||
        (targetProvider === "auto" && GROQ_API_KEY)) &&
      GROQ_API_KEY
    ) {
      try {
        const groqResult = await callGroqLLM(
          userPrompt,
          systemInstruction,
          conversationHistory,
          requestedModel
        );
        return res.json({
          status: "SUCCESS",
          data: {
            reply: groqResult.reply,
            model: groqResult.model,
            provider: "groq",
          },
        });
      } catch (groqErr) {
        console.warn("Groq LLM call error:", groqErr.message);
        // If Gemini is also configured, try Gemini before falling back
        if (GEMINI_API_KEY) {
          try {
            const geminiResult = await callGeminiLLM(
              userPrompt,
              systemInstruction,
              requestedModel
            );
            return res.json({
              status: "SUCCESS",
              data: {
                reply: geminiResult.reply,
                model: `${geminiResult.model} (Groq fallback)`,
                provider: "gemini",
              },
            });
          } catch (gErr) {
            console.warn("Gemini fallback also failed:", gErr.message);
          }
        }
      }
    }

    // 3. Attempt Google Gemini LLM if requested or in auto mode with GEMINI_API_KEY available
    if (
      (targetProvider === "gemini" ||
        (targetProvider === "auto" && GEMINI_API_KEY)) &&
      GEMINI_API_KEY
    ) {
      try {
        const geminiResult = await callGeminiLLM(
          userPrompt,
          systemInstruction,
          requestedModel
        );
        return res.json({
          status: "SUCCESS",
          data: {
            reply: geminiResult.reply,
            model: geminiResult.model,
            provider: "gemini",
          },
        });
      } catch (geminiErr) {
        console.warn("Gemini LLM call error:", geminiErr.message);
        // If Groq is also configured, try Groq
        if (GROQ_API_KEY) {
          try {
            const groqResult = await callGroqLLM(
              userPrompt,
              systemInstruction,
              conversationHistory,
              requestedModel
            );
            return res.json({
              status: "SUCCESS",
              data: {
                reply: groqResult.reply,
                model: `${groqResult.model} (Gemini fallback)`,
                provider: "groq",
              },
            });
          } catch (grErr) {
            console.warn("Groq fallback also failed:", grErr.message);
          }
        }
      }
    }

    // 4. Fallback: Process query dynamically using Node.js Intelligent Store Engine
    const dynamicReply = resolveDynamicQuery(userPrompt, storeSnapshot);

    const note =
      targetProvider === "groq" && !GROQ_API_KEY
        ? "\n\n*(⚡ Note: GROQ_API_KEY is not set in server/.env. Answer generated by Node.js Live Store Engine. Add your key to activate Llama 3.3).* "
        : targetProvider === "gemini" && !GEMINI_API_KEY
        ? "\n\n*(✨ Note: GEMINI_API_KEY is not set in server/.env. Answer generated by Node.js Live Store Engine. Add your key to activate Gemini).* "
        : "";

    return res.json({
      status: "SUCCESS",
      data: {
        reply: `${dynamicReply}${note}`,
        model: "Node.js Live Store Engine",
        provider: "node-store-engine",
      },
    });
  } catch (error) {
    console.error("Error in Node.js /api/chat:", error);
    return res.status(500).json({
      status: "FAILURE",
      message: error.message || "Internal server error in Node.js LLM service.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Node.js AI LLM Server running on http://localhost:${PORT}`);
  console.log(`📡 Connected to Ecommerce Backend: ${ECOMMERCE_API_BASE_URL}`);
  console.log(
    `⚡ Groq Model: ${GROQ_MODEL} (${GROQ_API_KEY ? "CONFIGURED ✅" : "NOT SET (add GROQ_API_KEY to server/.env) ⚠️"})`
  );
  console.log(
    `✨ Gemini Model: ${GEMINI_MODEL} (${GEMINI_API_KEY ? "CONFIGURED ✅" : "NOT SET (add GEMINI_API_KEY to server/.env) ⚠️"})\n`
  );
});
