import React, { useEffect, useState } from "react";
import { api } from "../api";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard() {
  const [subjects, setSubjects] = useState([]);
  const [activeSubject, setActiveSubject] = useState("");
  const [rows, setRows] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [error, setError] = useState("");
  const currentUsername = api.getUsername();

  useEffect(() => {
    async function loadSubjects() {
      try {
        const data = await api.getQuizSubjects();
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
    async function loadRows() {
      setLoadingRows(true);
      setError("");
      try {
        const data = await api.getLeaderboard(activeSubject);
        setRows(data.leaderboard);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingRows(false);
      }
    }
    loadRows();
  }, [activeSubject]);

  return (
    <div className="leaderboard">
      <h1>Leaderboard</h1>
      <p className="discovery-subtitle">Best score per student, per subject, for your class.</p>

      {loadingSubjects ? (
        <p>Loading...</p>
      ) : subjects.length === 0 ? (
        <p>No tests available for your class yet.</p>
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

          {loadingRows ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : rows.length === 0 ? (
            <p>No attempts yet for this subject.</p>
          ) : (
            <div className="leaderboard-list">
              {rows.map((r, idx) => (
                <div
                  key={idx}
                  className={
                    r.username === currentUsername
                      ? "leaderboard-row leaderboard-me"
                      : "leaderboard-row"
                  }
                >
                  <span className="leaderboard-rank">{MEDALS[idx] || `#${idx + 1}`}</span>
                  <span className="leaderboard-name">{r.username}</span>
                  <span className="leaderboard-score">
                    {r.best_score} / {r.total_questions}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}