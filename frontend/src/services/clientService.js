import api from './api'

export const clientService = {
  getAll: (params) => api.get('/clients/', { params }),
  getById: (id) => api.get(`/clients/${id}/`),
  create: (data) => api.post('/clients/', data),
  update: (id, data) => api.put(`/clients/${id}/`, data),
  partialUpdate: (id, data) => api.patch(`/clients/${id}/`, data),
  delete: (id) => api.delete(`/clients/${id}/`),
}
