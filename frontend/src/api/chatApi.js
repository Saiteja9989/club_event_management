import API from './apiClient';

export default {
  chat: (messages) => API.post('/chat', { messages }),
};
