import { create } from 'zustand'
import { persist } from 'zustand/middleware'
<<<<<<< HEAD

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: (user, token) => set({ user, token, error: null }),
      logout: () => set({ user: null, token: null }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (s) => ({ user: s.user, token: s.token }),
=======
 
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
>>>>>>> fc462d48ce69bd682d378efa519605f533f2b8e7
    }
  )
)

<<<<<<< HEAD
export default useAuthStore
=======
export { useAuthStore }  
export default useAuthStore
>>>>>>> fc462d48ce69bd682d378efa519605f533f2b8e7
