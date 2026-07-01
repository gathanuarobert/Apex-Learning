import { createContext, useContext, useEffect, useState } from "react";
import api from "../Api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(undefined);
  const [isGuest, setIsGuest]   = useState(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAuthStatus = () => {
  return api.get("users/guest-status/")
    .then(res => {
      setIsGuest(res.data.is_guest);
      setUser(res.data.user ?? null);
    })
    .catch(() => {
      // No session = guest, not an error worth logging out over
      setIsGuest(true);
      setUser(null);
    })
    .finally(() => setIsLoading(false));
};
  useEffect(() => {
    fetchAuthStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isGuest, isLoading, setUser, setIsGuest, refetchAuth: fetchAuthStatus }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);