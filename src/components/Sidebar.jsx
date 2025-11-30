import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const Sidebar = ({ theme = "light", onToggleTheme }) => {
  const { role, isAdmin, isSuper, logout } = useAuth();
  const location = useLocation();

  // ----------------------------
  // Sidebar section definitions
  // ----------------------------
  const sections = [
    {
      key: "oncall",
      title: "On-Call Logs",
      items: [
        { label: "Dashboard", path: "/oncall/dashboard" },
        { label: "Add Event", path: "/oncall/add" },
        ...(isAdmin ? [{ label: "Admin", path: "/oncall/admin" }] : []),
      ],
      defaultOpen: true,
    },

    {
      key: "metrics",
      title: "Metrics Logs",
      items: [
        { label: "Shipping Loop Fullness", path: "/metrics/loop-fullness" },
      ],
      defaultOpen: true,
    },

    {
      key: "toggler",
      title: "Bit Toggler",
      items: isAdmin ? [{ label: "Open Toggler", path: "/tools/toggler" }] : [],
      defaultOpen: false,
    },

    {
      key: "heatmap",
      title: "Heatmap Tools",
      items: isAdmin
        ? [{ label: "Heatmap Dashboard", path: "/tools/heatmap" }]
        : [],
      defaultOpen: false,
    },

    {
      key: "super",
      title: "Super Tools",
      items: isSuper
        ? [{ label: "User Management", path: "/super/users" }]
        : [],
      defaultOpen: false,
    },
  ];

  const [openGroups, setOpenGroups] = useState({});

  // Set initial open/closed states when role changes
  useEffect(() => {
    const initial = {};
    sections.forEach((section) => {
      initial[section.key] = section.defaultOpen;
    });
    setOpenGroups(initial);
  }, [role, isAdmin, isSuper]);

  const toggleGroup = (key) => {
    setOpenGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="sidebar">
      {/* Section Renderer */}
      {sections.map(
        (section) =>
          section.items.length > 0 && (
            <div key={section.key} className="sidebar-section">
              <div
                className="sidebar-section-title"
                onClick={() => toggleGroup(section.key)}
              >
                <span>📁</span> {section.title}
              </div>

              {openGroups[section.key] && (
                <div className="sidebar-items">
                  {section.items.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={
                        location.pathname === item.path
                          ? "sidebar-item active"
                          : "sidebar-item"
                      }
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
      )}

      {/* FOOTER */}
      <div className="sidebar-footer">
        {onToggleTheme && (
          <button className="btn-theme-toggle" onClick={onToggleTheme}>
            {theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          </button>
        )}

        <button className="btn-logout" onClick={logout}>
          Sign Out
        </button>
      </div>
    </div>
  );
};
