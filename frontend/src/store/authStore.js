import { create } from 'zustand'
import { persist } from 'zustand/middleware'
 
const useAuthStore = create(
  persist(
    (set, get) => ({
      // ─── State ──────────────────────────────────────────────────
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
 
      // ─── Actions ─────────────────────────────────────────────────
 
      // Called after successful login/signup API response
      login: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
          error: null,
        }),
 
      // Update user profile fields (e.g. after profile edit)
      updateUser: (updatedFields) =>
        set((state) => ({
          user: { ...state.user, ...updatedFields },
        })),
 
      // Clear everything on logout
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        }),
 
      // Loading state helpers (used during API calls)
      setLoading: (bool) => set({ isLoading: bool }),
      setError: (msg) => set({ error: msg }),
      clearError: () => set({ error: null }),
 
      // Getter helper (useful in non-React files)
      getToken: () => get().token,
    }),
    {
      name: 'auth-storage',       // localStorage key
      partialize: (state) => ({   // only persist these fields
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export { useAuthStore }  
export default useAuthStore
