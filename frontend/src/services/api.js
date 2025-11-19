import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = JSON.parse(localStorage.getItem('auth-storage') || '{}')?.state?.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(
            `${api.defaults.baseURL}/users/auth/refresh/`,
            { refresh: refreshToken }
          )
          
          const { access } = response.data
          
          // Update token in storage
          const authStorage = JSON.parse(localStorage.getItem('auth-storage') || '{}')
          authStorage.state.token = access
          localStorage.setItem('auth-storage', JSON.stringify(authStorage))
          
          originalRequest.headers.Authorization = `Bearer ${access}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Token refresh failed, logout user
        localStorage.removeItem('auth-storage')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api
