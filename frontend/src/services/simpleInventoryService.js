import api from './api';

const BASE_URL = '/simple-inventory';

export const simpleInventoryService = {
  // Productos
  getProducts: async (params = {}) => {
    const response = await api.get(`${BASE_URL}/products/`, { params });
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  },

  getProduct: async (id) => {
    const response = await api.get(`${BASE_URL}/products/${id}/`);
    return response.data;
  },

  createProduct: async (productData) => {
    const response = await api.post(
      `${BASE_URL}/products/`,
      productData
    );
    return response.data;
  },

  updateProduct: async (id, productData) => {
    const response = await api.put(
      `${BASE_URL}/products/${id}/`,
      productData
    );
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await api.delete(`${BASE_URL}/products/${id}/`);
    return response.data;
  },

  adjustStock: async (productId, quantity, notes = '') => {
    const response = await api.post(
      `${BASE_URL}/products/${productId}/adjust_stock/`,
      { quantity, notes }
    );
    return response.data;
  },

  // Movimientos de inventario
  getStockMovements: async (params = {}) => {
    const response = await api.get(`${BASE_URL}/stock-movements/`, { params });
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
  },
};
