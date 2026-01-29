import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const paymentApi = {
  getEventForPayment: (eventId) =>
    API.get(`/payments/event/${eventId}`),

  createOrder: (eventId) =>
    API.post("/payments/create-order", { eventId }),

  verifyPayment: (data) =>
    API.post("/payments/verify", data),
};

export default paymentApi;
