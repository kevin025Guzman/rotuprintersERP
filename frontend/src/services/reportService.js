import api from './api'

export const reportService = {
  getDashboardStats: () => api.get('/reports/dashboard/'),
  getSalesReport: (params) => api.get('/reports/sales/', { params }),
  getInventoryReport: () => api.get('/reports/inventory/'),
  getQuotationsReport: () => api.get('/reports/quotations/'),
  getClientsReport: () => api.get('/reports/clients/'),
}
