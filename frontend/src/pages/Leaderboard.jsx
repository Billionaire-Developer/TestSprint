import React, { useEffect, useState } from "react";
import { api } from "../api";

const SUBJECTS = [
  { key: "physics", label: "Physics" },
  { key: "math", label: "Mathematics" },
  { key: "chemistry", label: "Chemistry" },
  { key: "biology", label: "Biology" }
];

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard() {
  const [activeSubject, setActiveSubject] = useState(SUBJECTS[0].key);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const currentUsername = api.getUsername();

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await api.getLeaderboard(activeSubject);
        setRows(data.leaderboard);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [activeSubject]);

  return (
    <div className="leaderboard">
      <h1>Leaderboard</h1>
      <p className="discovery-subtitle">Best score per student, per subject.</p>

      <div className="discovery-tabs">
        {SUBJECTS.map((s) => (
          <button
            key={s.key}
            className={s.key === activeSubject ? "tab tab-active" : "tab"}
            onClick={() => setActiveSubject(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
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
    </div>
  );
}