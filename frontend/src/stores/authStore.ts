import { create } from 'zustand'
import { fetchPasswords } from '../api/fetchPasswords'

interface AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  loadingMessage: string
  setIsAuthenticated: (value: boolean) => void
  setIsLoading: (value: boolean) => void
  setLoadingMessage: (message: string) => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isLoading: true,
  loadingMessage: '',
  
  setIsAuthenticated: (value: boolean) => set({ isAuthenticated: value }),
  setIsLoading: (value: boolean) => set({ isLoading: value }),
  setLoadingMessage: (message: string) => set({ loadingMessage: message }),
  
  checkAuth: async () => {
    try {
      set({ isLoading: true, loadingMessage: 'Проверка авторизации...' })
      
      const result = await fetchPasswords()
      
      if (result === 401 || result === 403) {
        set({ isAuthenticated: false, isLoading: false })
        return
      }
      
      if (typeof result === 'string') {
        set({ isAuthenticated: true, isLoading: false })
        return
      }
      
      set({ isAuthenticated: false, isLoading: false })
    } catch (error) {
      console.error('Auth check failed:', error)
      set({ isAuthenticated: false, isLoading: false })
    }
  }
}))