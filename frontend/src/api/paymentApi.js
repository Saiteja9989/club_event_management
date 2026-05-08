import API from './apiClient';

const paymentApi = {
  getEventForPayment: (eventId) =>
    API.get(`/payments/event/${eventId}`),

  createOrder: (eventId) =>
    API.post("/payments/create-order", { eventId }),

  verifyPayment: (data) =>
    API.post("/payments/verify", data),
};

export default paymentApi;
