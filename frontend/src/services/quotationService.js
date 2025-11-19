import api from './api'

export const quotationService = {
  getAll: (params) => api.get('/quotations/', { params }),
  getById: (id) => api.get(`/quotations/${id}/`),
  create: (data) => api.post('/quotations/', data),
  update: (id, data) => api.put(`/quotations/${id}/`, data),
  delete: (id) => api.delete(`/quotations/${id}/`),
  approve: (id) => api.post(`/quotations/${id}/approve/`),
  reject: (id) => api.post(`/quotations/${id}/reject/`),
}
