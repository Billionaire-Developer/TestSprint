import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function Notes() {
  const [subjects, setSubjects] = useState([]);
  const [activeSubject, setActiveSubject] = useState("");
  const [notes, setNotes] = useState([]);
  const [openNote, setOpenNote] = useState(null);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loadingNote, setLoadingNote] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSubjects() {
      try {
        const data = await api.getNoteSubjects();
        setSubjects(data.subjects);
        if (data.subjects.length > 0) setActiveSubject(data.subjects[0]);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingSubjects(false);
      }
    }
    loadSubjects();
  }, []);

  useEffect(() => {
    if (!activeSubject) return;
    async function loadNotes() {
      setLoadingNotes(true);
      setError("");
      setOpenNote(null);
      try {
        const data = await api.getNotesForSubject(activeSubject);
        setNotes(data.notes);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingNotes(false);
      }
    }
    loadNotes();
  }, [activeSubject]);

  async function openNoteById(noteId) {
    setLoadingNote(true);
    setError("");
    try {
      const data = await api.getNote(activeSubject, noteId);
      setOpenNote(data.note);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingNote(false);
    }
  }

  return (
    <div className="notes-page">
      <h1>Notes</h1>
      <p className="discovery-subtitle">
        Class notes from your teacher, for your class. Feel free to copy these for revision.
      </p>

      {loadingSubjects ? (
        <p>Loading...</p>
      ) : subjects.length === 0 ? (
        <p>No notes have been uploaded for your class yet.</p>
      ) : (
        <>
          <div className="discovery-tabs">
            {subjects.map((s) => (
              <button
                key={s}
                className={s === activeSubject ? "tab tab-active" : "tab"}
                onClick={() => setActiveSubject(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {openNote ? (
            <div className="note-detail">
              <button className="secondary-btn note-back-btn" onClick={() => setOpenNote(null)}>
                ← Back to list
              </button>
              <h2>{openNote.title}</h2>
              <p className="note-meta">
                Last updated {new Date(openNote.updated_at).toLocaleDateString()}
              </p>
              <div className="note-content">{openNote.content}</div>
            </div>
          ) : loadingNotes ? (
            <p>Loading notes...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : notes.length === 0 ? (
            <p>No notes for this subject yet.</p>
          ) : (
            <div className="note-list">
              {notes.map((n) => (
                <button
                  key={n.id}
                  className="note-list-item"
                  onClick={() => openNoteById(n.id)}
                  disabled={loadingNote}
                >
                  <span className="note-list-title">{n.title}</span>
                  <span className="note-list-date">
                    {new Date(n.updated_at).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}