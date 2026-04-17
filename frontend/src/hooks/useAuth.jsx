import { createContext, useContext, useEffect, useState } from "react";
import api from "../Api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(undefined);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    api.get("users/guest-status/")
      .then(res => {
        setIsGuest(res.data.is_guest);
        setUser(res.data.user ?? null);
      })
      .catch(() => { setIsGuest(true); setUser(null); });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isGuest, setUser, setIsGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);