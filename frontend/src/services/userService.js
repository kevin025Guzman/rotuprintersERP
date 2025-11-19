import api from './api'

export const userService = {
  getAll: (params) => api.get('/users/', { params }),
  getById: (id) => api.get(`/users/${id}/`),
  create: (data) => api.post('/users/auth/register/', data),
  update: (id, data) => api.put(`/users/${id}/`, data),
  delete: (id) => api.delete(`/users/${id}/`),
  getProfile: () => api.get('/users/me/'),
  updateProfile: (data) => api.put('/users/update_profile/', data),
  changePassword: (data) => api.post('/users/change_password/', data),
}
