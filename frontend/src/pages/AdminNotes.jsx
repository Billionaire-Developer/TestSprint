import React, { useEffect, useState } from "react";
import { api } from "../api";
import { CLASSES } from "../constants";

const SUBJECT_OPTIONS = ["physics", "chemistry", "biology", "math"];

const emptyForm = { id: null, subject: "physics", className: "", title: "", content: "" };

export default function AdminNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filterClass, setFilterClass] = useState("");
  const [filterSubject, setFilterSubject] = useState("");

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadNotes();
  }, [filterClass, filterSubject]);

  async function loadNotes() {
    setLoading(true);
    setError("");
    try {
      const data = await api.adminGetNotes(filterClass, filterSubject);
      setNotes(data.notes);
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

  function startEdit(note) {
    setForm({
      id: note.id,
      subject: note.subject,
      className: note.class_name,
      title: note.title,
      content: note.content
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
        await api.adminUpdateNote(form.id, form.subject, form.className, form.title, form.content);
      } else {
        await api.adminCreateNote(form.subject, form.className, form.title, form.content);
      }
      setShowForm(false);
      setForm(emptyForm);
      await loadNotes();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this note? This can't be undone.")) return;
    try {
      await api.adminDeleteNote(id);
      await loadNotes();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="admin">
      <h1>Manage Notes</h1>
      <p className="discovery-subtitle">
        Upload notes per class and subject. Students only see notes for their own class.
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
        <button onClick={startNew}>+ New note</button>
      </div>

      {showForm && (
        <form className="note-form" onSubmit={handleSubmit}>
          <h2>{form.id ? "Edit note" : "New note"}</h2>
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
              placeholder="e.g. Chapter 3 — Newton's Laws"
              required
            />
          </label>
          <label>
            Content
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Paste or write the note content here..."
              rows={12}
              required
            />
          </label>
          {formError && <p className="error">{formError}</p>}
          <div className="profile-form-actions">
            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : form.id ? "Save changes" : "Create note"}
            </button>
            <button type="button" className="secondary-btn" onClick={cancelForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p>Loading notes...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : notes.length === 0 ? (
        <p className="admin-no-attempts">No notes match this filter yet.</p>
      ) : (
        <div className="note-list">
          {notes.map((n) => (
            <div key={n.id} className="admin-note-row">
              <div>
                <p className="note-list-title">{n.title}</p>
                <p className="note-meta">
                  {n.class_name} · {n.subject} · updated{" "}
                  {new Date(n.updated_at).toLocaleDateString()}
                </p>
              </div>
              <div className="admin-note-actions">
                <button className="secondary-btn" onClick={() => startEdit(n)}>
                  Edit
                </button>
                <button className="link-btn" onClick={() => handleDelete(n.id)}>
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