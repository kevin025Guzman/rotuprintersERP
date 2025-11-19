import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (username, password) => {
        try {
          const response = await api.post('/users/auth/login/', { username, password })
          const { access, refresh, user } = response.data
          
          set({
            user,
            token: access,
            isAuthenticated: true,
          })
          
          localStorage.setItem('refresh_token', refresh)
          api.defaults.headers.common['Authorization'] = `Bearer ${access}`
          
          return { success: true }
        } catch (error) {
          return {
            success: false,
            error: error.response?.data?.detail || 'Error al iniciar sesión'
          }
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
        localStorage.removeItem('refresh_token')
        delete api.defaults.headers.common['Authorization']
      },

      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData }
        }))
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
