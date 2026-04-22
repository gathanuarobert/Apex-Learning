import { createContext, useContext, useEffect, useState } from "react";
import api from "../Api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // undefined = still resolving, true/false = resolved
  const [user, setUser]         = useState(undefined);
  const [isGuest, setIsGuest]   = useState(undefined);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.get("users/guest-status/")
      .then(res => {
        setIsGuest(res.data.is_guest);
        setUser(res.data.user ?? null);
      })
      .catch(() => {
        setIsGuest(true);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, isGuest, isLoading, setUser, setIsGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);