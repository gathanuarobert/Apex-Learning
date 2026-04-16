import { useCallback, useState } from "react";
import { useAuth } from "./useAuth";

/**
 * Returns a wrapper that runs `action` only when authenticated.
 * If the user is a guest it opens the auth modal instead,
 * storing `action` so it can be replayed after login.
 *
 * Usage:
 *   const { guard, AuthModal } = useRequireAuth();
 *   <button onClick={guard(() => download(id))}>Download</button>
 *   <AuthModal />
 */
export function useRequireAuth() {
  const { isGuest, setUser, setIsGuest } = useAuth();
  const [pendingAction, setPendingAction] = useState(null);
  const [showModal, setShowModal]         = useState(false);

  const guard = useCallback(
    (action) => (e) => {
      if (!isGuest) return action(e);
      setPendingAction(() => action);
      setShowModal(true);
    },
    [isGuest]
  );

  const onLoginSuccess = useCallback((user) => {
    setUser(user);
    setIsGuest(false);
    setShowModal(false);
    pendingAction?.();
    setPendingAction(null);
  }, [pendingAction, setUser, setIsGuest]);

  return { guard, showModal, setShowModal, onLoginSuccess };
}