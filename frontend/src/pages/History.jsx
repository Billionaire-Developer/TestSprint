import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api";

const BADGE_DEFS = [
  { key: "first", label: "First Steps", icon: "🎯", check: (results) => results.length >= 1 },
  { key: "perfect", label: "Perfect Score", icon: "🌟", check: (results) => results.some((r) => r.score === r.total_questions) },
  { key: "rounded", label: "Well Rounded", icon: "🧭", check: (results) => new Set(results.map((r) => r.subject)).size >= 3 },
  { key: "dedicated", label: "Dedicated", icon: "🔥", check: (results) => results.length >= 5 }
];

function ProgressChart({ points }) {
  const width = 300;
  const height = 100;
  const padding = 10;

  if (points.length < 2) return null;

  const stepX = (width - padding * 2) / (points.length - 1);
  const coords = points.map((p, i) => {
    const x = padding + i * stepX;
    const y = height - padding - (p.percent / 100) * (height - padding * 2);
    return { x, y };
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="progress-chart">
      <polyline
        points={coords.map((c) => `${c.x},${c.y}`).join(" ")}
        fill="none"
        stroke="#4f5bd5"
        strokeWidth="2"
      />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r="3" fill="#4f5bd5" />
      ))}
    </svg>
  );
}

export default function History() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getHistory();
        setResults(data.results);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const earnedBadges = useMemo(() => BADGE_DEFS.filter((b) => b.check(results)), [results]);

  const bySubject = useMemo(() => {
    const map = {};
    for (const r of results) {
      if (!map[r.subject]) map[r.subject] = [];
      map[r.subject].push(r);
    }
    Object.keys(map).forEach((subject) => {
      map[subject] = map[subject]
        .slice()
        .sort((a, b) => new Date(a.taken_at) - new Date(b.taken_at))
        .map((r) => ({ ...r, percent: (r.score / r.total_questions) * 100 }));
    });
    return map;
  }, [results]);

  if (loading) return <p>Loading history...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="history">
      <h1>Your test history</h1>

      {results.length === 0 ? (
        <p>You haven't taken any tests yet.</p>
      ) : (
        <>
          <div className="badge-row">
            {BADGE_DEFS.map((b) => {
              const earned = earnedBadges.some((e) => e.key === b.key);
              return (
                <div key={b.key} className={earned ? "badge badge-earned" : "badge badge-locked"}>
                  <span className="badge-icon">{b.icon}</span>
                  <span className="badge-label">{b.label}</span>
                </div>
              );
            })}
          </div>

          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Score</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.id}>
                    <td>{r.subject}</td>
                    <td>
                      {r.score} / {r.total_questions}
                    </td>
                    <td>{new Date(r.taken_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="progress-heading">Progress over time</h2>
          {Object.entries(bySubject).map(([subject, attempts]) =>
            attempts.length >= 2 ? (
              <div key={subject} className="progress-block">
                <p className="progress-subject-label">
                  {subject.charAt(0).toUpperCase() + subject.slice(1)}
                </p>
                <ProgressChart points={attempts} />
              </div>
            ) : null
          )}
          {Object.values(bySubject).every((a) => a.length < 2) && (
            <p className="admin-no-attempts">
              Take a subject more than once (after it's updated) to see your progress chart.
            </p>
          )}
        </>
      )}
    </div>
  );
}