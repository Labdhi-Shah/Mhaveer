import axios from "axios";

const api = axios.create({
<<<<<<< HEAD
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
<<<<<<< Updated upstream
  withCredentials: true,
=======
=======
  baseURL: "http://localhost:5000/api", // Adjust port/URL according to your backend server
>>>>>>> 9031da5 (changes name)
>>>>>>> Stashed changes
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