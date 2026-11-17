const CHATWOOT_TOKEN_KEY = "ecommerce_chatwoot_website_token";
const CHATWOOT_URL_KEY = "ecommerce_chatwoot_base_url";

export const getChatwootConfig = () => {
  return {
    websiteToken:
      localStorage.getItem(CHATWOOT_TOKEN_KEY) ||
      import.meta.env.VITE_CHATWOOT_WEBSITE_TOKEN ||
      "",
    baseUrl:
      localStorage.getItem(CHATWOOT_URL_KEY) ||
      import.meta.env.VITE_CHATWOOT_BASE_URL ||
      "https://app.chatwoot.com",
  };
};

export const saveChatwootConfig = ({ websiteToken, baseUrl }) => {
  if (websiteToken) {
    localStorage.setItem(CHATWOOT_TOKEN_KEY, websiteToken.trim());
  } else {
    localStorage.removeItem(CHATWOOT_TOKEN_KEY);
  }
  if (baseUrl) {
    localStorage.setItem(CHATWOOT_URL_KEY, baseUrl.trim());
  } else {
    localStorage.removeItem(CHATWOOT_URL_KEY);
  }
};

/**
 * Identify the logged in admin user in Chatwoot using session token and details
 */
export const syncChatwootUser = () => {
  if (typeof window === "undefined" || !window.$chatwoot) return;

  try {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const tenantId = localStorage.getItem("tenantID");
    const role = localStorage.getItem("sessionRoleName");
    const userDetailsStr = localStorage.getItem("userDetails");
    const userDetails = userDetailsStr ? JSON.parse(userDetailsStr) : {};

    const fullName = `${userDetails.FirstName || ""} ${userDetails.LastName || ""}`.trim() || "Admin User";
    const email = userDetails.Email || userDetails.email || "";
    const phone = userDetails.MobileNumber || userDetails.phone || "";

    if (userId) {
      window.$chatwoot.setUser(userId, {
        name: fullName,
        email: email,
        phone_number: phone,
      });

      window.$chatwoot.setCustomAttributes({
        tenant_id: tenantId || "",
        role: role || "Admin",
        auth_token: token || "",
        app_domain: window.location.hostname,
      });
    }
  } catch (err) {
    console.error("Failed to sync user with Chatwoot", err);
  }
};

/**
 * Load and run Chatwoot SDK
 */
export const loadChatwootSDK = () => {
  if (typeof window === "undefined") return;

  const { websiteToken, baseUrl } = getChatwootConfig();
  if (!websiteToken) return;

  // Prevent multiple script injections
  if (window.chatwootSDK) {
    syncChatwootUser();
    return;
  }

  const existingScript = document.getElementById("chatwoot-sdk");
  if (existingScript) return;

  const script = document.createElement("script");
  script.id = "chatwoot-sdk";
  script.src = `${baseUrl.replace(/\/$/, "")}/packs/js/sdk.js`;
  script.defer = true;
  script.async = true;

  script.onload = () => {
    if (window.chatwootSDK) {
      window.chatwootSDK.run({
        websiteToken,
        baseUrl: baseUrl.replace(/\/$/, ""),
      });
    }
  };

  document.head.appendChild(script);

  window.addEventListener("chatwoot:ready", () => {
    syncChatwootUser();
  });
};

/**
 * Toggle Chatwoot widget open/close
 */
export const toggleChatwoot = (state) => {
  if (typeof window !== "undefined" && window.$chatwoot) {
    if (state === "open") {
      window.$chatwoot.toggle("open");
    } else if (state === "close") {
      window.$chatwoot.toggle("close");
    } else {
      window.$chatwoot.toggle();
    }
  }
};

/**
 * Reset Chatwoot session on logout
 */
export const resetChatwoot = () => {
  if (typeof window !== "undefined" && window.$chatwoot) {
    window.$chatwoot.reset();
  }
};
