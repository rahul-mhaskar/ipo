import React, { useEffect, useState } from "react";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, provider } from "./firebase";

export default function GoogleLogin({ onUserChange }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (onUserChange) onUserChange(currentUser);
    });
    return () => unsubscribe();
  }, [onUserChange]);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      if (onUserChange) onUserChange(result.user);
    } catch (err) {
      console.error("Login error", err);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    if (onUserChange) onUserChange(null);
  };

  return (
    <div className="flex items-center gap-4 p-4">
      {user ? (
        <>
          <img src={user?.photoURL} alt="avatar" className="h-8 w-8 rounded-full" />
          <span className="text-sm font-medium">{user?.displayName || user?.email}</span>
          <button onClick={handleLogout} className="text-red-500 text-sm" aria-label="Logout">
            Logout
          </button>
        </>
      ) : (
        <button
          onClick={handleLogin}
          className="px-4 py-2 bg-blue-600 text-white rounded shadow"
          aria-label="Sign in with Google"
        >
          Sign in with Google
        </button>
      )}
    </div>
  );
}
