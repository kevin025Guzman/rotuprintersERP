import api from './api'

export const productService = {
  getAll: (params) => api.get('/inventory/products/', { params }),
  getById: (id) => api.get(`/inventory/products/${id}/`),
  create: (data) => api.post('/inventory/products/', data),
  update: (id, data) => api.put(`/inventory/products/${id}/`, data),
  delete: (id) => api.delete(`/inventory/products/${id}/`),
  getLowStock: () => api.get('/inventory/products/low_stock/'),
  getOutOfStock: () => api.get('/inventory/products/out_of_stock/'),
}

export const categoryService = {
  getAll: () => api.get('/inventory/categories/'),
  create: (data) => api.post('/inventory/categories/', data),
}

export const stockMovementService = {
  getAll: (params) => api.get('/inventory/movements/', { params }),
  create: (data) => api.post('/inventory/movements/', data),
}
