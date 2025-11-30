import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState("user");
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load session on first mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;

        setUser(u);
        setRole(u.user_metadata?.role || "user");
        setMustChangePassword(u.user_metadata?.must_change_password || false);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          const u = session.user;

          setUser(u);
          setRole(u.user_metadata?.role || "user");
          setMustChangePassword(u.user_metadata?.must_change_password || false);
        } else {
          setUser(null);
          setRole("user");
          setMustChangePassword(false);
        }
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const logout = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        mustChangePassword,
        isUser: role === "user",
        isAdmin: role === "admin" || role === "super",
        isSuper: role === "super",
        loading,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
