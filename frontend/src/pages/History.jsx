import React, { useEffect, useState } from "react";
import { api } from "../api";

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

  if (loading) return <p>Loading history...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="history">
      <h1>Your test history</h1>
      {results.length === 0 ? (
        <p>You haven't taken any tests yet.</p>
      ) : (
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
      )}
    </div>
  );
}