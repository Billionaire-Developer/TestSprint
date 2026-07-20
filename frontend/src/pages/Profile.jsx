import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);

  const [schoolName, setSchoolName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError("");
    try {
      const data = await api.getProfile();
      setProfile(data.user);
      setSchoolName(data.user.school_name || "");
      setPhoneNumber(data.user.phone_number || "");
      api.setCachedClass(data.user.class_name || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function startEditing() {
    setError("");
    setEditing(true);
  }

  function cancelEditing() {
    setSchoolName(profile.school_name || "");
    setPhoneNumber(profile.phone_number || "");
    setError("");
    setEditing(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.updateProfile(undefined, schoolName, phoneNumber);
      setProfile({
        ...profile,
        school_name: schoolName,
        phone_number: phoneNumber
      });
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading profile...</p>;
  if (error && !profile) return <p className="error">{error}</p>;

  return (
    <div className="profile-card">
      <div className="profile-avatar">{(profile.username || "?").charAt(0).toUpperCase()}</div>
      <h1>{profile.username}</h1>

      {!editing ? (
        <div className="profile-view">
          <div className="profile-row">
            <span className="profile-label">Class</span>
            <span className="profile-value">{profile.class_name || "Not set"}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">School</span>
            <span className="profile-value">{profile.school_name || "Not set"}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Mobile number</span>
            <span className="profile-value">{profile.phone_number || "Not set"}</span>
          </div>
          {error && <p className="error">{error}</p>}
          <button onClick={startEditing}>Edit profile</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="profile-form">
          <label>
            Class
            <input value={profile.class_name || "Not set"} disabled />
          </label>
          <p className="profile-lock-note">Your class can only be changed by an admin.</p>
          <label>
            School
            <input
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="e.g. Greenwood High School"
            />
          </label>
          <label>
            Mobile number
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. 080xxxxxxxx"
            />
          </label>
          {error && <p className="error">{error}</p>}
          <div className="profile-form-actions">
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>
            <button type="button" className="secondary-btn" onClick={cancelEditing}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}