import { createContext, useContext, useEffect, useState } from "react";

import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() =>
    localStorage.getItem("access_token"),
  );

  const [refreshToken, setRefreshToken] = useState(() =>
    localStorage.getItem("refresh_token"),
  );

  const [user, setUser] = useState(() => {
    const email = localStorage.getItem("user_email");
    return email ? { email, role: null } : null;
  });

  const [isLoadingUser, setIsLoadingUser] = useState(() =>
    Boolean(localStorage.getItem("access_token")),
  );

  // Load user profile and role
  useEffect(() => {
    if (!accessToken) {
      setIsLoadingUser(false);
      return;
    }

    let cancelled = false;

    const fetchUserProfile = async () => {
      try {
        setIsLoadingUser(true);

        const response = await api.get("/accounts/profile/");

        if (!cancelled) {
          setUser(response.data);
        }
      } catch (error) {
        console.error("User profile fetch error:", error);

        if (!cancelled) {
          setUser((currentUser) => ({
            ...currentUser,
            role: null,
          }));
        }
      } finally {
        if (!cancelled) {
          setIsLoadingUser(false);
        }
      }
    };

    fetchUserProfile();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const login = (tokens, email) => {
  localStorage.setItem("access_token", tokens.access);
  localStorage.setItem("refresh_token", tokens.refresh);
  localStorage.setItem("user_email", email);

  setIsLoadingUser(true);
  setAccessToken(tokens.access);
  setRefreshToken(tokens.refresh);
  setUser({ email, role: null });
};

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_email");

    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setIsLoadingUser(false);
  };

  const isAuthenticated = Boolean(accessToken);

  const isAdmin = user?.role === "ADMIN";
  const isOperations = user?.role === "OPERATIONS";

  const canAccessAdmin = isAdmin || isOperations;

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        refreshToken,
        user,
        isAuthenticated,
        isLoadingUser,
        isAdmin,
        isOperations,
        canAccessAdmin,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
