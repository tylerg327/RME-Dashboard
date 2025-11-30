import React, { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../context/AuthContext";

export const Layout = ({ children }) => {
  const { loading } = useAuth();
  const [theme, setTheme] = useState("light");

  // Apply theme to <body>
  useEffect(() => {
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  if (loading) return null; // don’t render layout until auth is ready

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  return (
    <div className="app-layout">
      <Sidebar theme={theme} onToggleTheme={toggleTheme} />
      <div className="app-content">{children}</div>
    </div>
  );
};
