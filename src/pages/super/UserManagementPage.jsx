import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../context/AuthContext";

// Your Edge Function URL
const FUNCTION_URL =
  "https://gmtfrwpbpmgodurqijhu.supabase.co/functions/v1/user-admin";

export const UserManagementPage = () => {
  const { user, isSuper } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New user form fields
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");

  // On page load → fetch users
  useEffect(() => {
    loadUsers();
  }, []);

  // =========================================================
  // CALL EDGE FUNCTION WRAPPER
  // =========================================================
  async function callFunction(action, payload) {
    setSaving(true);

    try {
      // Correct Supabase v2 token retrieval
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`, // ← FIXED
        },
        body: JSON.stringify({ action, payload }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Unknown error");
      }

      return data;

    } catch (err) {
      alert(err.message);
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // LOAD USERS (via EDGE FUNCTION — not browser admin API)
  // =========================================================
  async function loadUsers() {
    setLoading(true);

    const response = await callFunction("listUsers", {});
    if (!response || !response.users) {
      console.error("Failed to load users");
      setLoading(false);
      return;
    }

    const formatted = response.users.map((u) => ({
      id: u.id,
      email: u.email,
      role: u.user_metadata?.role || "user",
      mustChange: u.user_metadata?.must_change_password || false,
      lastSignIn: u.last_sign_in_at || "Never",
    }));

    setUsers(formatted);
    setLoading(false);
  }

  // =========================================================
  // CREATE USER
  // =========================================================
  async function createUser() {
    if (!newEmail || !newPassword) {
      alert("Email and password required");
      return;
    }

    await callFunction("createUser", {
      email: newEmail,
      password: newPassword,
      role: newRole,
    });

    setNewEmail("");
    setNewPassword("");
    setNewRole("user");
    loadUsers();
  }

  // =========================================================
  // UPDATE ROLE
  // =========================================================
  async function updateRole(uid, role) {
    await callFunction("updateRole", { uid, role });
    loadUsers();
  }

  // =========================================================
  // FORCE PASSWORD RESET
  // =========================================================
  async function forceReset(uid) {
    await callFunction("forceReset", { uid });
    loadUsers();
  }

  // =========================================================
  // DELETE USER
  // =========================================================
  async function deleteUser(uid) {
    if (!window.confirm("Delete this user?")) return;

    await callFunction("deleteUser", { uid });
    loadUsers();
  }

  // Prevent modifying your own account
  function isMyAccount(uid) {
    return user && user.id === uid;
  }

  if (!isSuper) {
    return <h2>You do not have permission to view this page.</h2>;
  }

  if (loading) return <p>Loading users...</p>;

  return (
    <div className="card">
      <h1>User Management</h1>
      <p className="info-text">Only SUPER users can access this page.</p>

      {/* CREATE USER */}
      <h3 style={{ marginTop: "25px" }}>Create New User</h3>

      <div className="flex" style={{ gap: "10px", marginTop: "10px" }}>
        <input
          type="email"
          placeholder="Email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Temp Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <select value={newRole} onChange={(e) => setNewRole(e.target.value)}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
          <option value="super">Super</option>
        </select>

        <button className="btn-primary" disabled={saving} onClick={createUser}>
          Create User
        </button>
      </div>

      {/* USER TABLE */}
      <h3 style={{ marginTop: "30px" }}>All Users</h3>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Must Change</th>
              <th>Last Sign-In</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>

                {/* Editable role */}
                <td>
                  <select
                    value={u.role}
                    disabled={isMyAccount(u.id) || saving}
                    onChange={(e) => updateRole(u.id, e.target.value)}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="super">Super</option>
                  </select>
                </td>

                {/* Must Change Password */}
                <td style={{ textAlign: "center" }}>
                  {u.mustChange ? "Yes" : "No"}
                  {!isMyAccount(u.id) && (
                    <button
                      className="table-btn"
                      disabled={saving}
                      onClick={() => forceReset(u.id)}
                    >
                      Force Reset
                    </button>
                  )}
                </td>

                <td>{u.lastSignIn}</td>

                {/* Delete */}
                <td>
                  {isMyAccount(u.id) ? (
                    <i>Your Account</i>
                  ) : (
                    <button
                      className="table-btn btn-danger"
                      disabled={saving}
                      onClick={() => deleteUser(u.id)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
