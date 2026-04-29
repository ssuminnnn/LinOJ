const baseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/+$/, "");

export const API_BASE_URL = baseUrl;
export const API_URL = `${baseUrl}/api`;
