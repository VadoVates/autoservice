import axios from "axios";

// Wykryj czy jesteśmy na localhost czy w sieci
const getApiUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:8000";
    }
    // Dla dostępu z sieci lokalnej
    return "http://192.168.0.107:8000";
  }
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
};

export const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});
