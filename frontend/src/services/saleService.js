import api from './api'

export const saleService = {
  getAll: (params) => api.get('/sales/', { params }),
  getById: (id) => api.get(`/sales/${id}/`),
  create: (data) => api.post('/sales/', data),
  update: (id, data) => api.put(`/sales/${id}/`, data),
  delete: (id) => api.delete(`/sales/${id}/`),
  complete: (id) => api.post(`/sales/${id}/complete/`),
  cancel: (id) => api.post(`/sales/${id}/cancel/`),
  fromQuotation: (data) => api.post('/sales/from_quotation/', data),
  generatePDF: (id) => api.get(`/sales/${id}/generate_pdf/`),
  deleteBulk: (ids) => api.post('/sales/delete_bulk/', { ids }),
}
