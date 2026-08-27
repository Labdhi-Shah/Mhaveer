import axios from "axios";

const rawBaseURL = import.meta.env.VITE_API_URL;
if (!rawBaseURL) {
  console.warn("VITE_API_URL is not defined in environment variables.");
}
const cleanBaseURL = rawBaseURL && rawBaseURL.endsWith("/") ? rawBaseURL.slice(0, -1) : (rawBaseURL || "");


const api = axios.create({
  baseURL: `${cleanBaseURL}/api`,
  withCredentials: true,
});

// jwt na token atomatic hendel thy che 
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

// Interceptor to handle automatic retries and 401 Unauthorized errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Auto-logout on 401 Unauthorized
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("loginTime");
      localStorage.removeItem("attendanceId");
      window.location.href = "/login";
      return Promise.reject(error);
    }


    // Auto-retry network errors or 5xx server errors (Render cold starts)
    if (!config || !config.retry) {
      config.retry = 3; // Retry up to 3 times
      config.retryCount = 0;
    }

    const shouldRetry = !error.response || (error.response.status >= 500 && error.response.status <= 599);
    if (shouldRetry && config.retryCount < config.retry) {
      config.retryCount += 1;
      console.warn(`API Request Failed. Retrying... (${config.retryCount}/${config.retry})`);

      // Exponential backoff
      const backoff = new Promise((resolve) => {
        setTimeout(() => resolve(), config.retryCount * 1000);
      });

      await backoff;
      return api(config);
    }

    return Promise.reject(error);
  }
);

export default api;