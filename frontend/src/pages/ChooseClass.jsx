import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { CLASSES, SCHOOLS } from "../constants";

export default function ChooseClass() {
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedClass || !selectedSchool) return;
    setSaving(true);
    setError("");
    try {
      await api.updateProfile(selectedClass, selectedSchool, undefined);
      api.setCachedClass(selectedClass);
      api.setCachedSchool(selectedSchool);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="auth-card">
      <h1>Tell us about yourself</h1>
      <p className="discovery-subtitle">
        This determines which tests you'll see. You can only set these once —
        if either is wrong, ask your teacher to fix it.
      </p>
      <form onSubmit={handleSubmit}>
        <label>
          Class
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            required
          >
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
        <label>
          School
          <select
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
            required
          >
            <option value="" disabled>
              Select your school
            </option>
            {SCHOOLS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={!selectedClass || !selectedSchool || saving}>
          {saving ? "Saving..." : "Continue"}
        </button>
      </form>
    </div>
  );
}