// src/api.js
import axios from "axios";

// ------------------- BASE AXIOS -------------------
const api = axios.create({
  baseURL: "http://localhost:8000/api/", // Django backend URL
});

// ------------------- INTERCEPTORS -------------------

// Attach access token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired tokens (refresh)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh");
        if (!refreshToken) {
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
          window.location.href = "/login";
          return Promise.reject(error);
        }

        // ⚠️ use plain axios, not api, to avoid expired token in headers
        const { data } = await axios.post("http://localhost:8000/api/token/refresh/", {
          refresh: refreshToken,
        });

        // Save new token
        localStorage.setItem("access", data.access);

        // Update default headers for future requests
        api.defaults.headers.Authorization = `Bearer ${data.access}`;

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

// ------------------- USERS -------------------
export const registerUser = (userData) => api.post("users/register/", userData);
export const loginUser = (credentials) => api.post("users/login/", credentials);
export const addChildren = (childrenIds) =>
  api.post("users/add-children/", { children: childrenIds });
export const getCurrentUser = () => api.get("users/me/");

// ------------------- PAYMENTS -------------------
export const initiateWalletDeposit = (data) =>
  api.post("payments/wallet/deposit/initiate/", data);
export const initiateOneTimePurchase = (data) =>
  api.post("payments/purchase/resource/initiate/", data);
export const walletPurchase = (data) =>
  api.post("payments/wallet/purchase/", data);
export const mpesaCallback = (data) =>
  api.post("payments/mpesa-callback/", data);

// ------------------- RESOURCES -------------------
export const getNotes = () => api.get("resources/notes/");
export const getExams = () => api.get("resources/exams/");
export const getPastPapers = () => api.get("resources/past-papers/");
export const getNews = () => api.get("resources/news/");
export const getLibrary = () => api.get("resources/library/my-downloads/");
// ------------------- M-PESA -------------------
const getTimestamp = () => {
  const now = new Date();
  return now.toISOString().replace(/[-:]/g, "").split(".")[0];
};

export const getMpesaToken = async () => {
  const response = await api.post("mpesa/token/");
  return response.data.access_token;
};

export const initiateMpesaPayment = async (
  phoneNumber,
  amount,
  resourceTitle
) => {
  const payload = {
    BusinessShortCode: process.env.MPESA_SHORTCODE,
    Password: process.env.MPESA_PASSWORD,
    Timestamp: getTimestamp(),
    TransactionType: "CustomerPayBillOnline",
    Amount: amount,
    PartyA: phoneNumber,
    PartyB: process.env.MPESA_SHORTCODE,
    PhoneNumber: phoneNumber,
    CallBackURL: "http://localhost:8000/api/payments/mpesa-callback/",
    AccountReference: resourceTitle,
    TransactionDesc: `Payment for ${resourceTitle}`,
  };

  const response = await api.post("payments/mpesa-stkpush/", payload);
  return response.data;
};

export default api;
