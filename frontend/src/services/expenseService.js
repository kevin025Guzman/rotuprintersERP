import api from './api'

export const expenseService = {
  getAll: (params) => api.get('/expenses/', { params }),
  create: (data) => api.post('/expenses/', data),
  update: (id, data) => api.put(`/expenses/${id}/`, data),
  delete: (id) => api.delete(`/expenses/${id}/`),
  bulkDelete: (ids) => api.post('/expenses/delete_bulk/', { ids }),
  exportPdf: (params) => api.get('/expenses/export_pdf/', { params }),
}
