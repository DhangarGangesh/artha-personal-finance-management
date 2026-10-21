import api from './api';

export const financeService = {
  // User personal finance dashboard
  async getDashboard() {
    const res = await api.get('/dashboard');
    return res.data;
  },

  // Transactions
  async getTransactions(params = {}) {
    const query = new URLSearchParams();
    if (params.category) query.set('category', params.category);
    if (params.type) query.set('type', params.type);
    if (params.startDate) {
      query.set('startDate', params.startDate);
      query.set('from', params.startDate);
    }
    if (params.endDate) {
      query.set('endDate', params.endDate);
      query.set('to', params.endDate);
    }
    const searchVal = params.q || params.search;
    if (searchVal) {
      query.set('q', searchVal);
      query.set('search', searchVal);
    }
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);

    const queryString = query.toString();
    const url = `/transactions${queryString ? `?${queryString}` : ''}`;
    const res = await api.get(url);
    return res.data;
  },

  async getCategories() {
    const res = await api.get('/transactions/categories');
    return res.data;
  },

  async createTransaction(data) {
    const res = await api.post('/transactions', data);
    return res.data;
  },

  async updateTransaction(id, data) {
    const res = await api.put(`/transactions/${id}`, data);
    return res.data;
  },

  async deleteTransaction(id) {
    const res = await api.del(`/transactions/${id}`);
    return res.data;
  },

  // Budgets
  async getBudgets(asOf) {
    const url = asOf ? `/budgets?asOf=${asOf}` : '/budgets';
    const res = await api.get(url);
    return res.data;
  },

  async setBudget(data) {
    const res = await api.post('/budgets', data);
    return res.data;
  },

  async deleteBudget(id) {
    const res = await api.del(`/budgets/${id}`);
    return res.data;
  },

  // Goals
  async getGoals(asOf) {
    const url = asOf ? `/goals?asOf=${asOf}` : '/goals';
    const res = await api.get(url);
    return res.data;
  },

  async createGoal(data) {
    const res = await api.post('/goals', data);
    return res.data;
  },

  async updateGoal(id, data) {
    const res = await api.put(`/goals/${id}`, data);
    return res.data;
  },

  async contributeToGoal(id, amount, note = '') {
    const res = await api.post(`/goals/${id}/contributions`, { amount, note });
    return res.data;
  },

  async deleteGoal(id) {
    const res = await api.del(`/goals/${id}`);
    return res.data;
  },

  // Analytics & Python Regression
  async getAnalytics(asOf) {
    const url = asOf ? `/analytics?asOf=${asOf}` : '/analytics';
    const res = await api.get(url);
    return res.data;
  },

  async getRegression(asOf) {
    const url = asOf ? `/regression?asOf=${asOf}` : '/regression';
    const res = await api.get(url);
    return res.data;
  },

  // Alerts & Insights
  async getAlerts(asOf) {
    const url = asOf ? `/alerts?asOf=${asOf}` : '/alerts';
    const res = await api.get(url);
    return res.data;
  },
};

export default financeService;
