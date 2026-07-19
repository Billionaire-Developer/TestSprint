import React from "react";
import { Link } from "react-router-dom";

const SUBJECTS = [
  { key: "physics", label: "Physics" },
  { key: "math", label: "Mathematics" },
  { key: "chemistry", label: "Chemistry"},
  { key: "biology", label: "Biology"}
];

export default function Dashboard() {
  return (
    <div className="dashboard">
      <h1>Choose a test</h1>
      <div className="subject-grid">
        {SUBJECTS.map((s) => (
          <Link key={s.key} to={`/quiz/${s.key}`} className="subject-card">
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
