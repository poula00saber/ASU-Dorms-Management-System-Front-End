import { API_BASE } from "../lib/api";

export const resolvePhotoUrl = (photoPath?: string) => {
  if (!photoPath) return "";

  // replace backslashes + encode spaces and special chars
  const normalized = encodeURI(photoPath.replace(/\\/g, "/"));

  // لو already full url
  if (normalized.startsWith("http")) {
    return normalized;
  }

  return `${API_BASE}${normalized.startsWith("/") ? "" : "/"}${normalized}`;
};
