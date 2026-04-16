import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(undefined); // undefined = loading
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    fetch("/api/users/guest-status/", { credentials: "include" })
      .then(r => r.json())
      .then(data => {
        setIsGuest(data.is_guest);
        setUser(data.user ?? null);
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