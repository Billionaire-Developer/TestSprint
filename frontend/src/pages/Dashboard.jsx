import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRandomFact } from "../facts";
import { api } from "../api";

export default function Dashboard() {
  const [fact] = useState(() => getRandomFact());
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const className = api.getCachedClass();

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getQuizSubjects();
        setSubjects(data.subjects);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="dashboard">
      <h1>Choose a test</h1>
      <p className="discovery-subtitle">Class: {className}</p>
      <div className="fact-box">
        <span className="fact-label">Did you know?</span>
        <p>{fact}</p>
      </div>

      {loading ? (
        <p>Loading your tests...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : subjects.length === 0 ? (
        <p>No tests have been assigned to your class yet — check back later.</p>
      ) : (
        <div className="subject-grid">
          {subjects.map((s) => (
            <Link key={s} to={`/quiz/${s}`} className="subject-card">
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}