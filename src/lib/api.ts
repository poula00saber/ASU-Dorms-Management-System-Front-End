// src/lib/api.ts
import axios from "axios";

// API Base URL Configuration
// Priority: Runtime config > VITE_API_URL env var > default localhost
// For Cloudflare Tunnel: Set VITE_API_URL in .env.local or .env.production
const getApiBase = (): string => {
  // Check for runtime configuration (set by deployment scripts or index.html)
  // Only use if it's not empty
  if (
    typeof window !== "undefined" &&
    (window as any).__API_CONFIG__?.baseUrl &&
    (window as any).__API_CONFIG__.baseUrl.trim() !== ""
  ) {
    const url = (window as any).__API_CONFIG__.baseUrl
      .replace(/\/$/, "")
      .replace(/\/swagger$/, "");
    console.log("🌐 Using runtime config API URL:", url);
    return url;
  }

  // Check for Vite environment variable (for Cloudflare Tunnel URL)
  // @ts-ignore - Vite injects this at build time
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== "") {
    // Remove trailing slash and /swagger if present
    const url = envUrl.replace(/\/$/, "").replace(/\/swagger$/, "");
    console.log("🌐 Using VITE_API_URL:", url);
    return url;
  }

  // Default to local development
  console.log("🌐 Using default localhost API URL");
  return "https://localhost:7152";
};

export const API_BASE = getApiBase();

// Always log the API base URL for debugging
console.log("══════════════════════════════════════════════");
console.log("🌐 API Base URL:", API_BASE);
console.log("🔧 Environment:", import.meta.env.MODE);
console.log("══════════════════════════════════════════════");

export interface UserInfo {
  userId: number;
  username: string;
  role: string;
  dormLocationId: number;
  dormLocationName: string;
  accessibleDormLocationIds: number[];
  accessibleDormLocations: Record<number, string>;
}

export function saveUserInfo(loginResponse: any) {
  const userInfo: UserInfo = {
    userId: loginResponse.userId,
    username: loginResponse.username,
    role: loginResponse.role,
    dormLocationId: loginResponse.dormLocationId,
    dormLocationName: loginResponse.dormLocationName,
    accessibleDormLocationIds: loginResponse.accessibleDormLocationIds || [
      loginResponse.dormLocationId,
    ],
    accessibleDormLocations: loginResponse.accessibleDormLocations || {
      [loginResponse.dormLocationId]: loginResponse.dormLocationName,
    },
  };

  localStorage.setItem("userInfo", JSON.stringify(userInfo));
  localStorage.setItem("authToken", loginResponse.token);
  localStorage.setItem("token", loginResponse.token); // Legacy support

  // Set initial selected dorm to primary location
  localStorage.setItem(
    "selectedDormId",
    loginResponse.dormLocationId.toString(),
  );
}

export function getUserInfo(): UserInfo | null {
  const userInfoStr = localStorage.getItem("userInfo");
  if (!userInfoStr) return null;
  return JSON.parse(userInfoStr);
}

export function getActiveDormLocationId(): number {
  const userInfo = getUserInfo();
  if (!userInfo) return 0;

  // If user has multiple accessible dorms, get selected one
  if (userInfo.accessibleDormLocationIds.length > 1) {
    const selectedDormId = localStorage.getItem("selectedDormId");
    if (selectedDormId) {
      const dormId = parseInt(selectedDormId);
      // Verify user can access this dorm
      if (userInfo.accessibleDormLocationIds.includes(dormId)) {
        return dormId;
      }
    }
  }

  // Default to primary location
  return userInfo.dormLocationId;
}

export function setActiveDormLocationId(dormId: number) {
  localStorage.setItem("selectedDormId", dormId.toString());
} // src/lib/api.ts
// src/lib/api.ts - UPDATED fetchAPI function
// In your api.ts - Update fetchAPI function
// In your api.ts - Update fetchAPI function
export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  console.log("🚨🚨🚨 fetchAPI FUNCTION IS BEING CALLED! 🚨🚨🚨");
  console.log("Endpoint:", endpoint);

  const token =
    localStorage.getItem("authToken") || localStorage.getItem("token");
  const userInfo = getUserInfo();

  const headers: HeadersInit = {
    // DO NOT set Content-Type here if body is FormData
    // It will be set automatically by the browser with correct boundary
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const selectedDormId = localStorage.getItem("selectedDormId");

  if (selectedDormId && userInfo) {
    const dormIdNum = parseInt(selectedDormId);
    const canAccess = userInfo.accessibleDormLocationIds.includes(dormIdNum);

    if (canAccess) {
      headers["X-Selected-Dorm-Id"] = selectedDormId;
    } else {
      headers["X-Selected-Dorm-Id"] = userInfo.dormLocationId.toString();
    }
  } else if (userInfo?.dormLocationId) {
    headers["X-Selected-Dorm-Id"] = userInfo.dormLocationId.toString();
  }

  // Only set Content-Type if it's JSON and not FormData
  if (
    !(options.body instanceof FormData) &&
    !options.headers?.["Content-Type"] &&
    options.method !== "DELETE"
  ) {
    // Don't set Content-Type for DELETE
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      // Don't use credentials: "include" with Cloudflare tunnels
      // It causes CORS issues. Use "same-origin" or "omit" instead
      credentials: "omit",
      mode: "cors",
    });

    console.log("📥 Response status:", response.status);
    console.log("📥 Response headers:", response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error:", errorText);
      throw new Error(errorText || `HTTP error! status: ${response.status}`);
    }

    // Check if response has content (DELETE might return empty)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      console.log("✅ API Success - Data received:", data);
      return data;
    } else {
      // For DELETE or other non-JSON responses
      console.log("✅ API Success - No JSON data (likely DELETE)");
      return null;
    }
  } catch (error) {
    console.error("💥 fetchAPI Error:", error);
    throw error;
  }
}
