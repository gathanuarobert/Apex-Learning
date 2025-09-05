import axios from "axios";

// ------------------- BASE AXIOS -------------------
const api = axios.create({
  baseURL: "http://localhost:8000/api/", // Django backend URL
  withCredentials: true, // only needed if using session/cookie auth
});

// ------------------- USERS -------------------
export const registerUser = (userData) => api.post("users/register/", userData);

export const loginUser = (credentials) => api.post("users/login/", credentials);

// Add children (parent only)
export const addChildren = (childrenIds, token) =>
  api.post(
    "users/add-children/",
    { children: childrenIds },
    { headers: { Authorization: `Bearer ${token}` } }
  );

// Fetch current user (for auth state)
export const getCurrentUser = (token) =>
  api.get("users/me/", { headers: { Authorization: `Bearer ${token}` } });

// ------------------- PAYMENTS -------------------

// Wallet Top-Up / Purchase
export const initiateWalletDeposit = (data) =>
  api.post("payments/wallet/deposit/initiate/", data);

export const initiateOneTimePurchase = (data) =>
  api.post("payments/purchase/resource/initiate/", data);

export const walletPurchase = (data) =>
  api.post("payments/wallet/purchase/", data);

export const mpesaCallback = (data) => api.post("payments/mpesa-callback/", data);

// ------------------- RESOURCES -------------------
export const getNotes = () => api.get("resources/notes/");
export const getExams = () => api.get("resources/exams/");
export const getPastPapers = () => api.get("resources/past-papers/");
export const getNews = () => api.get("resources/news/");
export const getLibrary = () => api.get("resources/library/");

// ------------------- M-PESA STK PUSH -------------------

// Replace with your backend API for token generation
const MPESA_API_BASE_URL = "http://localhost:8000/api"; 

// Utility to get current timestamp in YYYYMMDDHHMMSS
const getTimestamp = () => {
  const now = new Date();
  return now.toISOString().replace(/[-:]/g, "").split(".")[0];
};

// Get M-Pesa token from backend
export const getMpesaToken = async () => {
  try {
    const response = await axios.post(`${MPESA_API_BASE_URL}/mpesa/token/`);
    return response.data.access_token;
  } catch (error) {
    console.error("Error fetching M-Pesa token:", error);
    throw error;
  }
};

// Initiate M-Pesa STK Push
export const initiateMpesaPayment = async (phoneNumber, amount, resourceTitle) => {
  try {
    const token = await getMpesaToken();
    const payload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: process.env.MPESA_PASSWORD,
      Timestamp: getTimestamp(),
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: phoneNumber,
      CallBackURL: `${MPESA_API_BASE_URL}/payments/mpesa-callback/`,
      AccountReference: resourceTitle,
      TransactionDesc: `Payment for ${resourceTitle}`,
    };

    const response = await axios.post(
      `${MPESA_API_BASE_URL}/payments/mpesa-stkpush/`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error("Error initiating M-Pesa payment:", error);
    throw error;
  }
};

export default api;
