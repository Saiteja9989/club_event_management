// src/api/authApi.js
// Handles authentication (login & register) - public endpoints
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api/auth',
});

const authApi = {
  // POST /api/auth/register - Register new student
  register: (data) => API.post('/register', data),

  // POST /api/auth/login - Login and get JWT
  login: (data) => API.post('/login', data),

    forgotPassword: (email) =>
    API.post('/forgot-password', { email }),

  resetPassword: (token, password,confirmPassword) =>
    API.post(`/reset-password/${token}`, { password, confirmPassword }),
};

export default authApi;