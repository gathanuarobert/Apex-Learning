// src/Api.js
import axios from "axios";

// ------------------- BASE AXIOS -------------------
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  // ✅ Sends HttpOnly cookies automatically on every request
  withCredentials: true,
});

// ------------------- INTERCEPTORS -------------------

// ✅ No Authorization header — token travels in HttpOnly cookie automatically.
// We only attach the CSRF token which Django requires for POST/PATCH/DELETE.
api.interceptors.request.use(
  (config) => {
    const csrfToken = getCookie("csrftoken");
    if (csrfToken) {
      config.headers["X-CSRFToken"] = csrfToken;
    }

    // Let axios set Content-Type automatically for FormData
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ------------------- RESPONSE INTERCEPTOR -------------------

let isRefreshing = false;
let refreshQueue = [];

function processQueue(error) {
  refreshQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve()
  );
  refreshQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isCancel(error)) return Promise.reject(error);

    const originalRequest = error.config;
    const httpStatus = error.response?.status;

    // ── 401: Token expired / missing ──────────────────────────────────────
    if (httpStatus === 401 && !originalRequest._retry) {
      // ✅ Never attempt a refresh if the failing request IS an auth endpoint.
      // This prevents an infinite redirect loop.
      const isAuthEndpoint =
        originalRequest.url?.includes("token/refresh") ||
        originalRequest.url?.includes("users/login") ||
        originalRequest.url?.includes("users/register");

      if (isAuthEndpoint) {
        handleLogout();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        // ✅ No body needed — refresh token is in the HttpOnly cookie
        await api.post("users/token/refresh/");
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        handleLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ------------------- HELPERS -------------------

function handleLogout() {
  // ✅ No localStorage to clear — cookies are cleared by the backend /logout/ endpoint
  window.location.href = "/login";
}

// Reads a cookie by name — used to get Django's csrftoken
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

// ------------------- USERS -------------------
export const registerUser = (userData) => api.post("users/register/", userData);
export const loginUser    = (credentials) => api.post("users/login/", credentials);
export const logoutUser   = () => api.post("users/logout/");
export const addChildren  = (childrenIds) =>
  api.post("users/add-children/", { children: childrenIds });
export const getCurrentUser = () => api.get("users/me/");

// ------------------- PAYMENTS -------------------
export const initiateWalletDeposit   = (data) => api.post("payments/wallet/deposit/initiate/", data);
export const initiateOneTimePurchase = (data) => api.post("payments/purchase/resource/initiate/", data);
export const walletPurchase          = (data) => api.post("payments/wallet/purchase/", data);
export const mpesaCallback           = (data) => api.post("payments/mpesa-callback/", data);

// ------------------- RESOURCES -------------------
export const getNotes      = () => api.get("resources/notes/");
export const getExams      = () => api.get("resources/exams/");
export const getPastPapers = () => api.get("resources/past-papers/");
export const getNews       = () => api.get("resources/news/");
export const getLibrary    = () => api.get("resources/library/my-downloads/");

// ------------------- M-PESA -------------------
const getTimestamp = () => {
  const now = new Date();
  return now.toISOString().replace(/[-:]/g, "").split(".")[0];
};

export const getMpesaToken = async () => {
  const response = await api.post("mpesa/token/");
  return response.data.access_token;
};

export const initiateMpesaPayment = async (phoneNumber, amount, resourceTitle) => {
  const payload = {
    BusinessShortCode: import.meta.env.VITE_MPESA_SHORTCODE,
    Timestamp:         getTimestamp(),
    TransactionType:   "CustomerPayBillOnline",
    Amount:            amount,
    PartyA:            phoneNumber,
    PartyB:            import.meta.env.VITE_MPESA_SHORTCODE,
    PhoneNumber:       phoneNumber,
    CallBackURL:       `${import.meta.env.VITE_API_BASE_URL}payments/mpesa-callback/`,
    AccountReference:  resourceTitle,
    TransactionDesc:   `Payment for ${resourceTitle}`,
  };
  const response = await api.post("payments/mpesa-stkpush/", payload);
  return response.data;
};

export default api;