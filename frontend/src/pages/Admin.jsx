import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function Admin() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [resetForId, setResetForId] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetStatus, setResetStatus] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    setLoading(true);
    try {
      const data = await api.getAdminStudents();
      setStudents(data.students);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function toggleExpand(id) {
    setExpandedId((prev) => (prev === id ? null : id));
    setResetForId(null);
    setResetStatus("");
    setResetSuccess(false);
  }

  function startReset(id) {
    setResetForId(id);
    setNewPassword("");
    setResetStatus("");
    setResetSuccess(false);
  }

  async function handleResetSubmit(e, userId) {
    e.preventDefault();
    setResetting(true);
    setResetStatus("");
    try {
      await api.adminResetPassword(userId, newPassword);
      setResetStatus("Password updated. Tell the student their new password directly.");
      setResetSuccess(true);
      setNewPassword("");
    } catch (err) {
      setResetStatus(err.message);
      setResetSuccess(false);
    } finally {
      setResetting(false);
    }
  }

  if (loading) return <p>Loading students...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="admin">
      <h1>Students</h1>
      <p className="discovery-subtitle">
        {students.length} registered student{students.length === 1 ? "" : "s"}. Click a row to
        see their test history or reset their password.
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

                      <div className="admin-reset-section">
                        {resetForId === s.id ? (
                          <form
                            className="admin-reset-form"
                            onSubmit={(e) => handleResetSubmit(e, s.id)}
                          >
                            <input
                              type="text"
                              placeholder="New password (min 4 chars)"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              minLength={4}
                              required
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button type="submit" disabled={resetting}>
                              {resetting ? "Saving..." : "Set new password"}
                            </button>
                            <button
                              type="button"
                              className="secondary-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setResetForId(null);
                              }}
                            >
                              Cancel
                            </button>
                          </form>
                        ) : (
                          <button
                            className="secondary-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              startReset(s.id);
                            }}
                          >
                            Reset password
                          </button>
                        )}
                        {resetStatus && (
                          <p className={resetSuccess ? "saved-msg" : "error"}>{resetStatus}</p>
                        )}
                      </div>
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