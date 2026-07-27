import axios from "axios";

const rawBaseURL = import.meta.env.VITE_API_URL || "https://mhaveer.onrender.com";
const cleanBaseURL = rawBaseURL.endsWith("/") ? rawBaseURL.slice(0, -1) : rawBaseURL;

const api = axios.create({
  baseURL: `${cleanBaseURL}/api`,
  withCredentials: true,
});

// Interceptor to attach JWT token to headers automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;