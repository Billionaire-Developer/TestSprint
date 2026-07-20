import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function Admin() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getAdminStudents();
        setStudents(data.students);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function toggleExpand(id) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  if (loading) return <p>Loading students...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="admin">
      <h1>Students</h1>
      <p className="discovery-subtitle">
        {students.length} registered student{students.length === 1 ? "" : "s"}. Click a row to
        see their test history.
      </p>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Class</th>
              <th>School</th>
              <th>Phone</th>
              <th>Signed up</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <React.Fragment key={s.id}>
                <tr onClick={() => toggleExpand(s.id)} className="admin-row">
                  <td>{s.username}</td>
                  <td>{s.class_name || "—"}</td>
                  <td>{s.school_name || "—"}</td>
                  <td>{s.phone_number || "—"}</td>
                  <td>{new Date(s.created_at).toLocaleDateString()}</td>
                </tr>
                {expandedId === s.id && (
                  <tr>
                    <td colSpan={5} className="admin-expand-cell">
                      {s.attempts.length === 0 ? (
                        <p className="admin-no-attempts">No tests taken yet.</p>
                      ) : (
                        <table className="admin-subtable">
                          <thead>
                            <tr>
                              <th>Subject</th>
                              <th>Score</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {s.attempts.map((a, idx) => (
                              <tr key={idx}>
                                <td>{a.subject}</td>
                                <td>
                                  {a.score} / {a.total_questions}
                                </td>
                                <td>{new Date(a.taken_at).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}