import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Bot,
  Send,
  X,
  Minimize2,
  Maximize2,
  Trash2,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  MessageSquare,
  ShieldCheck,
  ExternalLink,
  Key,
} from "lucide-react";
import {
  sendChatMessage,
  getStoredChatHistory,
  saveStoredChatHistory,
  clearStoredChatHistory,
} from "../../utils/aiChatService";

const QUICK_SUGGESTIONS = [
  "Show today's total revenue and orders",
  "List recent orders with their status",
  "Check low stock products",
  "How many active stores are in our system?",
];

const AiChatWidget = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [hasUnread, setHasUnread] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initialize messages from localStorage
  useEffect(() => {
    const saved = getStoredChatHistory();
    if (saved && saved.length > 0) {
      setMessages(saved);
    } else {
      setMessages([
        {
          id: "welcome-1",
          sender: "bot",
          text: `👋 **Hello! Welcome to your Store AI Assistant.**\n\nI can help you analyze revenue, inspect recent orders, review inventory, or answer questions about your admin dashboard.\n\nAll requests are secured with your active login token. What would you like to explore today?`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, []);

  // Save messages to localStorage when updated
  useEffect(() => {
    if (messages.length > 0) {
      saveStoredChatHistory(messages);
    }
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized, isLoading]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, isMinimized]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      const result = await sendChatMessage(text, updatedMessages);
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: result.text,
        model: result.model,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isError: !result.success,
      };

      setMessages((prev) => [...prev, botMsg]);
      if (!isOpen) {
        setHasUnread(true);
      }
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
          text: "Conversation cleared. How may I help you now?",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  };

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Helper to format text with bold markdown, code, and line breaks
  const renderFormattedMessage = (content) => {
    if (!content) return null;
    const lines = content.split("\n");

    return lines.map((line, lIdx) => {
      // Split by bold (**bold**) and inline code (`code`)
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

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-900"
          title={t("CHAT_BOARD.TITLE") || "AI Chat Board"}
          aria-label="Open AI Chat Board"
        >
          <Bot className="w-7 h-7 transition-transform group-hover:rotate-6" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white dark:border-gray-900" />
          </span>
          {hasUnread && (
            <span className="absolute -bottom-1 -left-1 flex h-3.5 w-3.5 rounded-full bg-rose-500 border-2 border-white" />
          )}
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div
          className={`flex flex-col bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden transition-all duration-300 ease-in-out ${
            isMinimized
              ? "w-80 h-14"
              : "w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-sm truncate">
                    {t("CHAT_BOARD.TITLE") || "AI Chat Board"}
                  </h3>
                  <span className="inline-flex items-center px-1.5 py-0.2 text-[10px] font-medium bg-emerald-400/20 text-emerald-100 rounded-full border border-emerald-300/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
                    Token API
                  </span>
                </div>
                {!isMinimized && (
                  <p className="text-[11px] text-indigo-100/80 truncate">
                    Logged-in session authenticated
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 text-white/80">
              <button
                onClick={() => navigate("/chat")}
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition"
                title="Open full page view"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition"
                title={t("CHAT_BOARD.CLEAR") || "Clear Chat"}
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? (
                  <Maximize2 className="w-4 h-4" />
                ) : (
                  <Minimize2 className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-white transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content (hidden when minimized) */}
          {!isMinimized && (
            <>
              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-gray-50/60 dark:bg-gray-950/40 text-sm">
                {messages.map((msg, idx) => {
                  const isUser = msg.sender === "user";
                  return (
                    <div
                      key={msg.id || idx}
                      className={`flex flex-col ${
                        isUser ? "items-end" : "items-start"
                      } group`}
                    >
                      <div
                        className={`relative max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm text-sm break-words transition-all ${
                          isUser
                            ? "bg-indigo-600 text-white rounded-br-none"
                            : msg.isError
                            ? "bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-800 rounded-bl-none"
                            : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-700/60 rounded-bl-none"
                        }`}
                      >
                        {renderFormattedMessage(msg.text)}

                        {/* Copy button for bot replies */}
                        {!isUser && (
                          <button
                            onClick={() => handleCopy(msg.text, idx)}
                            className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 p-1 rounded-md bg-white dark:bg-gray-700 shadow border border-gray-200 dark:border-gray-600 text-gray-500 hover:text-indigo-600 dark:text-gray-300 transition"
                            title="Copy reply"
                          >
                            {copiedIndex === idx ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1 px-1 text-[10px] text-gray-400">
                        <span>{msg.timestamp}</span>
                        {msg.model && !isUser && (
                          <span className="px-1.5 py-0.2 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-mono text-[9px] border border-indigo-200/50 dark:border-indigo-800/50">
                            {msg.model}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                    </div>
                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-bl-none px-4 py-2.5 shadow-sm">
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
                        <span className="ml-1 text-xs">
                          {t("CHAT_BOARD.TYPING") || "AI Assistant is thinking..."}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Suggestions Chips */}
              {messages.length <= 2 && (
                <div className="px-3 py-2 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-1.5 flex-shrink-0">
                  {QUICK_SUGGESTIONS.map((item, qIdx) => (
                    <button
                      key={qIdx}
                      onClick={() => handleSend(item)}
                      disabled={isLoading}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 transition text-left truncate max-w-full disabled:opacity-50"
                    >
                      💡 {item}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Area */}
              <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
                <div className="relative flex items-center gap-2">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                      t("CHAT_BOARD.PLACEHOLDER") ||
                      "Type a message... (Press Enter to send)"
                    }
                    disabled={isLoading}
                    className="w-full resize-none text-sm px-3.5 py-2.5 pr-12 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-gray-900 transition max-h-24 disabled:opacity-60"
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!inputValue.trim() || isLoading}
                    className="absolute right-2 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 disabled:hover:bg-indigo-600 transition shadow-sm"
                    title={t("CHAT_BOARD.SEND") || "Send"}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-gray-400 dark:text-gray-500">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    Bearer token authenticated
                  </span>
                  <span>Shift+Enter for newline</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AiChatWidget;
