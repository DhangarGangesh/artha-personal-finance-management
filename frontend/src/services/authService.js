import api, { tokenStorage } from './api';

export const authService = {
  async login(email, password) {
    const res = await api.post('/auth/login', {
      email: email.trim(),
      password,
    });
    if (res.data?.token) {
      tokenStorage.set(res.data.token);
    }
    return res.data;
  },

  async register(name, email, password) {
    const res = await api.post('/auth/register', {
      name: name.trim(),
      email: email.trim(),
      password,
    });
    if (res.data?.token) {
      tokenStorage.set(res.data.token);
    }
    return res.data;
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data?.user;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // Best-effort logout
    } finally {
      tokenStorage.clear();
    }
  },
};

export default authService;
