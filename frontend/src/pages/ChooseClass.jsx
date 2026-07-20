import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { CLASSES } from "../constants";

export default function ChooseClass() {
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      await api.updateProfile(selected, undefined, undefined);
      api.setCachedClass(selected);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="auth-card">
      <h1>Which class are you in?</h1>
      <p className="discovery-subtitle">
        This determines which tests you'll see. You can only set this once —
        if it's wrong, ask your teacher to fix it.
      </p>
      <form onSubmit={handleSubmit}>
        <label>
          Class
          <select value={selected} onChange={(e) => setSelected(e.target.value)} required>
            <option value="" disabled>
              Select your class
            </option>
            {CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={!selected || saving}>
          {saving ? "Saving..." : "Continue"}
        </button>
      </form>
    </div>
  );
}