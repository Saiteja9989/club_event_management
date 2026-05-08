import API from './apiClient';

const studentApi = {
  getDashboardStats: () => API.get('/students/dashboard/stats'),
  getMyProfile: () => API.get('/students/profile'),
};

export default studentApi;