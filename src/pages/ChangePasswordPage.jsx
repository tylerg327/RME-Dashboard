import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export const ChangePasswordPage = () => {
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      // 1. Update password
      const { error: passError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (passError) throw passError;

      // 2. Clear "must_change_password"
      const { data: { user }, error: metaError } =
        await supabase.auth.getUser();

      if (metaError) throw metaError;

      const { error: updateMetaError } =
        await supabase.auth.updateUser({
          data: { must_change_password: false },
        });

      if (updateMetaError) throw updateMetaError;

      // 3. Redirect home
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Set a New Password</h2>
        <p>You must change your password before continuing.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            New Password
            <input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </label>

          {error && <div className="error-text">{error}</div>}

          <button
            type="submit"
            className="btn-primary"
            disabled={saving}
          >
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
};
