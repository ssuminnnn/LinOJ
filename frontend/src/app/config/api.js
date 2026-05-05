const baseUrl = (
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? "https://linoj-backend.onrender.com" : "http://localhost:3001")
).replace(/\/+$/, "");

export const API_BASE_URL = baseUrl;
export const API_URL = `${baseUrl}/api`;
