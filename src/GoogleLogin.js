import React, { useEffect, useState } from "react";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, provider } from "./firebase"; // ✅ Make sure the path is correct


export default function GoogleLogin({ onUserChange }) {
  const [user, setUser] = useState(null);

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      onUserChange(result.user);
    } catch (err) {
      console.error("Login error", err);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    onUserChange(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      onUserChange(currentUser);
    });
    return () => unsubscribe();
  }, [onUserChange]);

  return (
    <div className="flex items-center gap-4 p-4">
      {user ? (
        <>
          <img src={user.photoURL} alt="avatar" className="h-8 w-8 rounded-full" />
          <span className="text-sm font-medium">{user.displayName}</span>
          <button onClick={handleLogout} className="text-red-500 text-sm">
            Logout
          </button>
        </>
      ) : (
        <button
          onClick={handleLogin}
          className="px-4 py-2 bg-blue-600 text-white rounded shadow"
        >
          Sign in with Google
        </button>
      )}
    </div>
  );
}
