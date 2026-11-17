import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Bot,
  Send,
  Trash2,
  Copy,
  Check,
  ShieldCheck,
  Download,
  Sparkles,
  TrendingUp,
  Package,
  ShoppingCart,
  Store,
  RefreshCw,
  MessageSquare,
  Settings,
  ExternalLink,
  X,
} from "lucide-react";
import { useTitle } from "../../context/TitleContext";
import axios from "axios";
import {
  sendChatMessage,
  getStoredChatHistory,
  saveStoredChatHistory,
  clearStoredChatHistory,
  fetchNodeHealth,
} from "../../utils/aiChatService";
import {
  getChatwootConfig,
  saveChatwootConfig,
  toggleChatwoot,
  loadChatwootSDK,
} from "../../utils/chatwootService";
import { AI_CHAT_API } from "../../contants/apiRoutes";

const PROMPT_CATEGORIES = [
  {
    title: "Sales & Revenue",
    icon: TrendingUp,
    prompts: [
      "What is our total revenue for the current month?",
      "Show average order value trends and comparison",
      "Which payment methods are generating the most volume?",
    ],
  },
  {
    title: "Orders & Fulfillment",
    icon: ShoppingCart,
    prompts: [
      "List the latest pending orders that need action",
      "What is the breakdown of order statuses this week?",
      "Show recent cancellation reasons and counts",
    ],
  },
  {
    title: "Inventory & Products",
    icon: Package,
    prompts: [
      "Which products have low stock below threshold?",
      "List the top 5 best-selling products by quantity",
      "Show recently added products and variants",
    ],
  },
  {
    title: "Store Management",
    icon: Store,
    prompts: [
      "How many total stores are active across regions?",
      "Which store has the highest order completion rate?",
    ],
  },
];

const AiChatBoard = () => {
  const { t } = useTranslation();
  const { setTitle } = useTitle();

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("auto");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [chatwootConfig, setChatwootConfigState] = useState(getChatwootConfig());
  const [isChatwootModalOpen, setIsChatwootModalOpen] = useState(false);
  const [tempWebsiteToken, setTempWebsiteToken] = useState(chatwootConfig.websiteToken);
  const [tempBaseUrl, setTempBaseUrl] = useState(chatwootConfig.baseUrl);

  // Node.js LLM Backend Keys Modal
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [groqKeyInput, setGroqKeyInput] = useState("");
  const [geminiKeyInput, setGeminiKeyInput] = useState("");
  const [backendHealth, setBackendHealth] = useState(null);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSuccessMsg, setConfigSuccessMsg] = useState("");

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchNodeHealth().then((data) => {
      if (data) setBackendHealth(data);
    });
  }, []);

  useEffect(() => {
    setTitle(t("CHAT_BOARD.TITLE") || "AI Chat Board");
    const saved = getStoredChatHistory();
    if (saved && saved.length > 0) {
      setMessages(saved);
    } else {
      setMessages([
        {
          id: "welcome-1",
          sender: "bot",
          text: `👋 **Welcome to your Store AI Assistant Chat Board!**\n\nI can query your ecommerce backend directly using your logged-in session token.\n\nYou can ask about orders, inventory, sales analytics, store performance, or choose one of the prompt templates on the left.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
    return () => setTitle("");
  }, [setTitle, t]);

  useEffect(() => {
    if (messages.length > 0) {
      saveStoredChatHistory(messages);
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    setInputValue("");
    setIsLoading(true);

    try {
      const result = await sendChatMessage(text, updated, selectedProvider);
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: result.text,
        model: result.model,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isError: !result.success,
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: "bot",
          text: "An unexpected error occurred while communicating with the AI service. Please try again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    if (window.confirm(t("CHAT_BOARD.CLEAR_CONFIRM") || "Clear all chat messages?")) {
      clearStoredChatHistory();
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          sender: "bot",
          text: "Conversation cleared. How can I assist you?",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  };

  const handleSaveChatwoot = () => {
    saveChatwootConfig({
      websiteToken: tempWebsiteToken,
      baseUrl: tempBaseUrl,
    });
    setChatwootConfigState({
      websiteToken: tempWebsiteToken.trim(),
      baseUrl: tempBaseUrl.trim() || "https://app.chatwoot.com",
    });
    setIsChatwootModalOpen(false);
    loadChatwootSDK();
  };

  const handleSaveBackendConfig = async () => {
    setIsSavingConfig(true);
    setConfigSuccessMsg("");
    try {
      const nodeBase = (
        import.meta.env.VITE_NODE_AI_URL || "http://localhost:5005/api/chat"
      ).replace(/\/api\/chat\/?$/, "");
      const res = await axios.post(`${nodeBase}/api/config`, {
        ...(groqKeyInput ? { groqApiKey: groqKeyInput } : {}),
        ...(geminiKeyInput ? { geminiApiKey: geminiKeyInput } : {}),
      });
      if (res.data?.status === "SUCCESS") {
        setConfigSuccessMsg("API Keys saved securely to Node.js backend!");
        const health = await fetchNodeHealth();
        if (health) setBackendHealth(health);
        setTimeout(() => {
          setIsModelModalOpen(false);
          setConfigSuccessMsg("");
        }, 1200);
      }
    } catch (err) {
      alert("Failed to update backend keys: " + (err.message || "Error"));
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleExportChat = () => {
    const chatText = messages
      .map((m) => `[${m.timestamp}] ${m.sender === "user" ? "USER" : "AI"}:\n${m.text}\n`)
      .join("\n---\n\n");
    const blob = new Blob([chatText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ai-chat-export-${new Date().toISOString().split("T")[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderFormattedMessage = (content) => {
    if (!content) return null;
    const lines = content.split("\n");

    return lines.map((line, lIdx) => {
      const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);

      return (
        <p key={lIdx} className={line.trim() === "" ? "h-2" : "min-h-[1.25rem] leading-relaxed"}>
          {parts.map((part, pIdx) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={pIdx} className="font-semibold text-gray-900 dark:text-white">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            if (part.startsWith("`") && part.endsWith("`")) {
              return (
                <code
                  key={pIdx}
                  className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-indigo-600 dark:text-indigo-300 text-xs font-mono"
                >
                  {part.slice(1, -1)}
                </code>
              );
            }
            return <span key={pIdx}>{part}</span>;
          })}
        </p>
      );
    });
  };

  const isTokenPresent = Boolean(localStorage.getItem("token"));

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Top Banner / Header Card */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center flex-shrink-0 shadow-inner">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                  {t("CHAT_BOARD.TITLE") || "AI Chat Board"}
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                  {isTokenPresent ? "Token Authenticated" : "Guest Mode"}
                </span>
              </div>
              <p className="text-sm text-indigo-100/80 mt-1">
                {t("CHAT_BOARD.SUBTITLE") ||
                  "Interact with your store assistant using authenticated token APIs"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (chatwootConfig.websiteToken) {
                  toggleChatwoot("open");
                } else {
                  setIsChatwootModalOpen(true);
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl backdrop-blur border transition shadow-sm ${
                chatwootConfig.websiteToken
                  ? "bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-400/40 text-emerald-100"
                  : "bg-indigo-500/20 hover:bg-indigo-500/30 border-indigo-400/40 text-indigo-100"
              }`}
              title="Launch Chatwoot AI Assistant"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {chatwootConfig.websiteToken ? "Launch Chatwoot AI" : "Setup Chatwoot AI"}
            </button>
            <button
              onClick={handleExportChat}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur border border-white/20 text-white transition shadow-sm"
              title="Download chat history"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
            <button
              onClick={handleClearChat}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl bg-white/10 hover:bg-rose-500/30 backdrop-blur border border-white/20 text-white transition shadow-sm"
              title={t("CHAT_BOARD.CLEAR") || "Clear Chat"}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {t("CHAT_BOARD.CLEAR") || "Clear"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Prompts Sidebar + Chat Window */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Quick Prompts & API Info (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Connection Status Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-400 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              API Connection
            </h3>
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                <span>Auth Token:</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                  {isTokenPresent ? "Bearer Active" : "Missing"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                <span>AI Backend:</span>
                <span className="font-mono font-medium text-indigo-600 dark:text-indigo-400">
                  Node.js (:5005)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                <span>Models Supported:</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  Groq & Gemini
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                <span>Active Selection:</span>
                <span className="font-medium text-purple-600 dark:text-purple-400 capitalize">
                  {selectedProvider === "auto" ? "Auto (Groq / Gemini)" : `${selectedProvider} LLM`}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                <span>Mode:</span>
                <span className="font-medium text-indigo-600 dark:text-indigo-400">
                  Dynamic Token APIs
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span>Active APIs:</span>
                <span className="text-gray-700 dark:text-gray-200 font-medium">
                  Users, Orders, Revenue, Stores, Stock
                </span>
              </div>
            </div>
          </div>

          {/* Chatwoot AI Integration Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-800 dark:text-gray-200">
                    Chatwoot AI
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    Omnichannel Customer Support
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setTempWebsiteToken(chatwootConfig.websiteToken);
                  setTempBaseUrl(chatwootConfig.baseUrl);
                  setIsChatwootModalOpen(true);
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-gray-750 transition"
                title="Configure Chatwoot"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                <span>Widget Status:</span>
                <span className={`font-medium ${chatwootConfig.websiteToken ? "text-emerald-500" : "text-amber-500"}`}>
                  {chatwootConfig.websiteToken ? "Configured Active ✅" : "Needs Token"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-700">
                <span>User Sync:</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  Token Authenticated
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span>Base URL:</span>
                <span className="font-mono text-[11px] text-gray-500 truncate max-w-[150px]">
                  {chatwootConfig.baseUrl.replace(/^https?:\/\//, "")}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                if (chatwootConfig.websiteToken) {
                  toggleChatwoot("open");
                } else {
                  setIsChatwootModalOpen(true);
                }
              }}
              className="w-full py-2 px-3 text-xs font-medium rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              {chatwootConfig.websiteToken ? "Open Chatwoot AI Widget" : "Setup Website Token"}
            </button>
          </div>

          {/* Prompt Templates */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Quick Prompt Templates
            </div>

            <div className="space-y-3">
              {PROMPT_CATEGORIES.map((cat, cIdx) => {
                const Icon = cat.icon;
                return (
                  <div key={cIdx} className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200">
                      <Icon className="w-3.5 h-3.5 text-indigo-500" />
                      {cat.title}
                    </div>
                    <div className="space-y-1">
                      {cat.prompts.map((p, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={() => handleSend(p)}
                          disabled={isLoading}
                          className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg bg-gray-50 hover:bg-indigo-50 dark:bg-gray-750 dark:hover:bg-indigo-950/40 text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-300 transition border border-gray-100 dark:border-gray-700/60 disabled:opacity-50"
                        >
                          → {p}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Chat Thread (8 cols) */}
        <div className="lg:col-span-8 flex flex-col h-[700px] bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50/50 dark:bg-gray-900/30">
            {messages.map((msg, idx) => {
              const isUser = msg.sender === "user";
              return (
                <div
                  key={msg.id || idx}
                  className={`flex items-start gap-3 ${
                    isUser ? "flex-row-reverse" : "flex-row"
                  } group`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-sm ${
                      isUser
                        ? "bg-indigo-600 text-white"
                        : "bg-gradient-to-tr from-purple-600 to-indigo-600 text-white"
                    }`}
                  >
                    {isUser ? "U" : <Bot className="w-4 h-4 text-white" />}
                  </div>

                  <div
                    className={`relative max-w-[80%] rounded-2xl px-4 py-3 shadow-sm text-sm break-words ${
                      isUser
                        ? "bg-indigo-600 text-white rounded-tr-none"
                        : msg.isError
                        ? "bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800 rounded-tl-none"
                        : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700/60 rounded-tl-none"
                    }`}
                  >
                    {renderFormattedMessage(msg.text)}

                    <div className="flex items-center justify-between gap-4 mt-2 pt-1 border-t border-black/5 dark:border-white/5 text-[10px] text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <span>{msg.timestamp}</span>
                        {msg.model && !isUser && (
                          <span className="px-1.5 py-0.2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-mono text-[9px] border border-indigo-200/50 dark:border-indigo-800/50">
                            {msg.model}
                          </span>
                        )}
                      </span>
                      {!isUser && (
                        <button
                          onClick={() => handleCopy(msg.text, idx)}
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                          title="Copy reply"
                        >
                          {copiedIndex === idx ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-500" />
                              <span className="text-emerald-500">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                    <span
                      className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                    <span className="ml-2 text-xs">
                      {t("CHAT_BOARD.TYPING") || "AI Assistant is querying backend..."}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            {/* Model Engine Selector */}
            <div className="flex items-center gap-1.5 mb-2.5">
              <span className="text-[11px] font-medium text-gray-400 mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Model Engine:
              </span>
              <button
                type="button"
                onClick={() => setSelectedProvider("auto")}
                className={`text-[11px] px-2.5 py-0.5 rounded-lg font-medium transition ${
                  selectedProvider === "auto"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                🤖 Auto (Node.js LLM)
              </button>
              <button
                type="button"
                onClick={() => setSelectedProvider("groq")}
                className={`text-[11px] px-2.5 py-0.5 rounded-lg font-medium transition ${
                  selectedProvider === "groq"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                ⚡ Groq Cloud
              </button>
              <button
                type="button"
                onClick={() => setSelectedProvider("gemini")}
                className={`text-[11px] px-2.5 py-0.5 rounded-lg font-medium transition ${
                  selectedProvider === "gemini"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                ✨ Google Gemini 1.5
              </button>

              <button
                type="button"
                onClick={() => setIsModelModalOpen(true)}
                className="ml-auto text-[11px] px-2 py-0.5 rounded-lg font-medium text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-750 transition flex items-center gap-1 border border-gray-200 dark:border-gray-700"
                title="Configure Groq and Gemini API Keys on Node.js Backend"
              >
                <Settings className="w-3 h-3 text-indigo-500" />
                <span>Backend Keys</span>
              </button>
            </div>
            <div className="relative flex items-center">
              <textarea
                ref={inputRef}
                rows={2}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  t("CHAT_BOARD.PLACEHOLDER") ||
                  "Type a prompt or question... (Press Enter to send)"
                }
                disabled={isLoading}
                className="w-full resize-none text-sm px-4 py-3 pr-14 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-900 transition disabled:opacity-60"
              />
              <button
                onClick={() => handleSend()}
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-3 p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 disabled:hover:bg-indigo-600 transition shadow-sm"
                title={t("CHAT_BOARD.SEND") || "Send"}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-2 px-1 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Session token attached to request headers
              </span>
              <span>Press Enter to send, Shift+Enter for new line</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chatwoot Configuration Modal */}
      {isChatwootModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Connect Chatwoot AI
                  </h3>
                  <p className="text-xs text-gray-400">
                    Live Chat & AI Captain Integration
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsChatwootModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-750 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Enter your Chatwoot <strong>Website Token</strong> (found in Chatwoot &gt; Settings &gt; Inboxes &gt; Web Widget) to enable Chatwoot AI live chat.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Chatwoot Base URL
                </label>
                <input
                  type="text"
                  value={tempBaseUrl}
                  onChange={(e) => setTempBaseUrl(e.target.value)}
                  placeholder="https://app.chatwoot.com"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  Website Token <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={tempWebsiteToken}
                  onChange={(e) => setTempWebsiteToken(e.target.value)}
                  placeholder="e.g. abc123def456..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setTempWebsiteToken("");
                  saveChatwootConfig({ websiteToken: "", baseUrl: "" });
                  setChatwootConfigState({ websiteToken: "", baseUrl: "https://app.chatwoot.com" });
                  setIsChatwootModalOpen(false);
                }}
                className="px-3 py-2 text-xs font-medium text-gray-400 hover:text-rose-500"
              >
                Clear
              </button>
              <button
                onClick={() => setIsChatwootModalOpen(false)}
                className="px-4 py-2 text-xs font-medium rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveChatwoot}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm"
              >
                Save &amp; Connect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Node.js LLM Backend Keys Modal */}
      {isModelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Node.js LLM Models (Groq &amp; Gemini)
                  </h3>
                  <p className="text-xs text-gray-400">
                    Saved securely on backend (<code className="text-indigo-600 font-mono">server/.env</code>)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModelModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-750 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {configSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                {configSuccessMsg}
              </div>
            )}

            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-700/60 text-xs space-y-1.5 text-gray-600 dark:text-gray-300">
              <div className="flex justify-between items-center">
                <span>⚡ Groq Status:</span>
                <span className={`font-semibold ${backendHealth?.providers?.groq?.configured ? "text-emerald-500" : "text-amber-500"}`}>
                  {backendHealth?.providers?.groq?.configured ? "Configured & Active ✅" : "Key Not Set ⚠️"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>✨ Gemini Status:</span>
                <span className={`font-semibold ${backendHealth?.providers?.gemini?.configured ? "text-emerald-500" : "text-amber-500"}`}>
                  {backendHealth?.providers?.gemini?.configured ? "Configured & Active ✅" : "Key Not Set ⚠️"}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
                  <span>Groq API Key (Llama 3.3 70B)</span>
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5"
                  >
                    Get Free Key <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </label>
                <input
                  type="password"
                  value={groqKeyInput}
                  onChange={(e) => setGroqKeyInput(e.target.value)}
                  placeholder="gsk_..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
                  <span>Google Gemini API Key (1.5 Flash)</span>
                  <a
                    href="https://aistudio.google.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5"
                  >
                    Get Free Key <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </label>
                <input
                  type="password"
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700 text-xs">
              <span className="text-[11px] text-gray-400">
                Saved directly to Node.js server
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsModelModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBackendConfig}
                  disabled={isSavingConfig || (!groqKeyInput && !geminiKeyInput)}
                  className="px-4 py-2 font-medium rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50 shadow-sm"
                >
                  {isSavingConfig ? "Saving..." : "Save to Backend"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiChatBoard;
