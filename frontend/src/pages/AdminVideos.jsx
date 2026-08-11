import React, { useEffect, useState } from "react";
import { api } from "../api";
import { CLASSES } from "../constants";

const SUBJECT_OPTIONS = ["physics", "chemistry", "biology", "math"];

const emptyForm = {
  id: null,
  subject: "physics",
  className: "",
  title: "",
  videoUrl: "",
  description: ""
};

export default function AdminVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filterClass, setFilterClass] = useState("");
  const [filterSubject, setFilterSubject] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadVideos();
  }, [filterClass, filterSubject]);

  async function loadVideos() {
    setLoading(true);
    setError("");
    try {
      const data = await api.adminGetVideos(filterClass, filterSubject);
      setVideos(data.videos);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function startNew() {
    setForm(emptyForm);
    setFormError("");
    setShowForm(true);
  }

  function startEdit(video) {
    setForm({
      id: video.id,
      subject: video.subject,
      className: video.class_name,
      title: video.title,
      videoUrl: video.video_url,
      description: video.description || ""
    });
    setFormError("");
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setForm(emptyForm);
    setFormError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.className) {
      setFormError("Please select a class");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      if (form.id) {
        await api.adminUpdateVideo(
          form.id,
          form.subject,
          form.className,
          form.title,
          form.videoUrl,
          form.description
        );
      } else {
        await api.adminCreateVideo(
          form.subject,
          form.className,
          form.title,
          form.videoUrl,
          form.description
        );
      }
      setShowForm(false);
      setForm(emptyForm);
      await loadVideos();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this video? This can't be undone.")) return;
    try {
      await api.adminDeleteVideo(id);
      await loadVideos();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="admin">
      <h1>Manage Videos</h1>
      <p className="discovery-subtitle">
        Paste a YouTube (set to "Unlisted") or Google Drive link — this app doesn't
        host video files directly, it just embeds the link.
      </p>

      <div className="notes-filters">
        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
          <option value="">All classes</option>
          {CLASSES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)}>
          <option value="">All subjects</option>
          {SUBJECT_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <button onClick={startNew}>+ New video</button>
      </div>

      {showForm && (
        <form className="note-form" onSubmit={handleSubmit}>
          <h2>{form.id ? "Edit video" : "New video"}</h2>
          <div className="note-form-row">
            <label>
              Class
              <select
                value={form.className}
                onChange={(e) => setForm({ ...form, className: e.target.value })}
                required
              >
                <option value="" disabled>
                  Select class
                </option>
                {CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Subject
              <select
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              >
                {SUBJECT_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Title
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Balancing chemical equations — explained"
              required
            />
          </label>
          <label>
            Video link (YouTube or Google Drive)
            <input
              value={form.videoUrl}
              onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
              placeholder="https://youtu.be/..."
              required
            />
          </label>
          <label>
            Short description (optional)
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="One line about what this covers"
            />
          </label>
          {formError && <p className="error">{formError}</p>}
          <div className="profile-form-actions">
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : form.id ? "Save changes" : "Create video"}
            </button>
            <button type="button" className="secondary-btn" onClick={cancelForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Loading videos...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : videos.length === 0 ? (
        <p className="admin-no-attempts">No videos match this filter yet.</p>
      ) : (
        <div className="note-list">
          {videos.map((v) => (
            <div key={v.id} className="admin-note-row">
              <div>
                <p className="note-list-title">▶ {v.title}</p>
                <p className="note-meta">
                  {v.class_name} · {v.subject} · updated{" "}
                  {new Date(v.updated_at).toLocaleDateString()}
                </p>
              </div>
              <div className="admin-note-actions">
                <button className="secondary-btn" onClick={() => startEdit(v)}>
                  Edit
                </button>
                <button className="link-btn" onClick={() => handleDelete(v.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}