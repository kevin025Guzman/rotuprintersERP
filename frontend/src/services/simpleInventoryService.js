import axios from 'axios';

const API_URL = '/api/simple-inventory';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const simpleInventoryService = {
  // Productos
  getProducts: async (params = {}) => {
    const response = await axios.get(`${API_URL}/products/`, {
      headers: getAuthHeaders(),
      params,
    });
    return response.data;
  },

  getProduct: async (id) => {
    const response = await axios.get(`${API_URL}/products/${id}/`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  createProduct: async (productData) => {
    const response = await axios.post(
      `${API_URL}/products/`,
      productData,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  updateProduct: async (id, productData) => {
    const response = await axios.put(
      `${API_URL}/products/${id}/`,
      productData,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await axios.delete(`${API_URL}/products/${id}/`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  adjustStock: async (productId, quantity, notes = '') => {
    const response = await axios.post(
      `${API_URL}/products/${productId}/adjust_stock/`,
      { quantity, notes },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  // Movimientos de inventario
  getStockMovements: async (params = {}) => {
    const response = await axios.get(`${API_URL}/stock-movements/`, {
      headers: getAuthHeaders(),
      params,
    });
    return response.data;
  },
};
