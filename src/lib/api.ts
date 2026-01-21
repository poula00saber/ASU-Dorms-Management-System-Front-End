// src/lib/api.ts
import axios from "axios";

export const API_BASE = "https://localhost:7152";

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
    loginResponse.dormLocationId.toString()
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
}// src/lib/api.ts
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
  if (!(options.body instanceof FormData) && 
      !options.headers?.['Content-Type'] && 
      options.method !== 'DELETE') { // Don't set Content-Type for DELETE
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
      credentials: "include",
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