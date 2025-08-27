import { create } from "zustand";
import { persist, subscribeWithSelector } from "zustand/middleware";
import { User, LoginCredentials, RegisterCredentials } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  subscribeWithSelector(
    persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(`http://localhost:3001/api/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(credentials)
          });

          const data = await response.json();
          console.log('Login response:', data);

          if (!response.ok) {
            throw new Error(data.message || "Login failed");
          }

          console.log('Setting user and token:', data.data.user, data.data.token);
          set({
            user: data.data.user,
            token: data.data.token,
            isLoading: false,
            error: null
          });
          console.log('Login successful, user set');
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : "Login failed"
          });
          throw error;
        }
      },

      register: async (credentials: RegisterCredentials) => {
        set({ isLoading: true, error: null });

        try {
          const response = await fetch(
            `http://localhost:3001/api/auth/register`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(credentials)
            }
          );

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || "Registration failed");
          }

          set({
            user: data.data.user,
            token: data.data.token,
            isLoading: false,
            error: null
          });
        } catch (error) {
          set({
            isLoading: false,
            error:
              error instanceof Error ? error.message : "Registration failed"
          });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          error: null
        });
      },

      clearError: () => {
        set({ error: null });
      },

      setUser: (user: User) => {
        set({ user });
      }
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token
      })
    }
  ))
);
