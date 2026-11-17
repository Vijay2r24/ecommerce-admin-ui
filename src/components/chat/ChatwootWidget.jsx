import { useEffect } from "react";
import { loadChatwootSDK, syncChatwootUser, getChatwootConfig } from "../../utils/chatwootService";

const ChatwootWidget = () => {
  useEffect(() => {
    const { websiteToken } = getChatwootConfig();
    const token = localStorage.getItem("token");

    if (websiteToken && token) {
      loadChatwootSDK();
    }

    const handleStorage = (e) => {
      if (e.key === "token" || e.key === "ecommerce_chatwoot_website_token") {
        loadChatwootSDK();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return null; // Chatwoot injects its own floating UI bubble via SDK
};

export default ChatwootWidget;
