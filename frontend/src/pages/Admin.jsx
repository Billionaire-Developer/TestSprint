import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { CLASSES, SCHOOLS } from "../constants";

function downloadCsv(students) {
  const rows = [["Username", "Class", "School", "Phone", "Subject", "Score", "Total", "Date"]];

  for (const s of students) {
    if (s.attempts.length === 0) {
      rows.push([s.username, s.class_name || "", s.school_name || "", s.phone_number || "", "", "", "", ""]);
    } else {
      for (const a of s.attempts) {
        rows.push([
          s.username,
          s.class_name || "",
          s.school_name || "",
          s.phone_number || "",
          a.subject,
          a.score,
          a.total_questions,
          new Date(a.taken_at).toLocaleString()
        ]);
      }
    }
  }

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `test-scores-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function Admin() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");
  const [collapsedSchools, setCollapsedSchools] = useState({});

  const [resetForId, setResetForId] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetStatus, setResetStatus] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [classForId, setClassForId] = useState(null);
  const [newClass, setNewClass] = useState("");
  const [classStatus, setClassStatus] = useState("");
  const [classSuccess, setClassSuccess] = useState(false);
  const [savingClass, setSavingClass] = useState(false);

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
    setClassForId(null);
    setClassStatus("");
    setClassSuccess(false);
  }

  function toggleSchoolCollapse(school) {
    setCollapsedSchools((prev) => ({ ...prev, [school]: !prev[school] }));
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

  function startClassChange(id, currentClass) {
    setClassForId(id);
    setNewClass(currentClass || "");
    setClassStatus("");
    setClassSuccess(false);
  }

  async function handleClassSubmit(e, userId) {
    e.preventDefault();
    setSavingClass(true);
    setClassStatus("");
    try {
      await api.adminSetClass(userId, newClass);
      setStudents((prev) =>
        prev.map((s) => (s.id === userId ? { ...s, class_name: newClass } : s))
      );
      setClassStatus("Class updated.");
      setClassSuccess(true);
    } catch (err) {
      setClassStatus(err.message);
      setClassSuccess(false);
    } finally {
      setSavingClass(false);
    }
  }

  const grouped = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = query
      ? students.filter(
          (s) =>
            s.username.toLowerCase().includes(query) ||
            (s.class_name || "").toLowerCase().includes(query)
        )
      : students;

    const groups = {};
    for (const school of SCHOOLS) groups[school] = [];
    groups["Unassigned"] = [];

    for (const s of filtered) {
      const key = s.school_name && SCHOOLS.includes(s.school_name) ? s.school_name : "Unassigned";
      groups[key].push(s);
    }

    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => (a.class_name || "").localeCompare(b.class_name || ""));
    }

    return groups;
  }, [students, search]);

  if (loading) return <p>Loading students...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="admin">
      <div className="admin-header-row">
        <div>
          <h1>Students</h1>
          <p className="discovery-subtitle">
            {students.length} registered student{students.length === 1 ? "" : "s"}, grouped by school.
          </p>
        </div>
        <button className="secondary-btn" onClick={() => downloadCsv(students)}>
          Export all scores (CSV)
        </button>
      </div>

      <input
        className="admin-search"
        type="text"
        placeholder="Search by username or class..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {Object.entries(grouped).map(([school, group]) => {
        if (group.length === 0) return null;
        const collapsed = collapsedSchools[school];

        return (
          <div key={school} className="school-group">
            <button className="school-group-header" onClick={() => toggleSchoolCollapse(school)}>
              <span>{collapsed ? "▶" : "▼"} {school}</span>
              <span className="school-group-count">{group.length}</span>
            </button>

            {!collapsed && (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Class</th>
                      <th>Phone</th>
                      <th>Signed up</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.map((s) => (
                      <React.Fragment key={s.id}>
                        <tr onClick={() => toggleExpand(s.id)} className="admin-row">
                          <td>{s.username}</td>
                          <td>{s.class_name || "—"}</td>
                          <td>{s.phone_number || "—"}</td>
                          <td>{new Date(s.created_at).toLocaleDateString()}</td>
                        </tr>
                        {expandedId === s.id && (
                          <tr>
                            <td colSpan={4} className="admin-expand-cell">
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
                                <p className="admin-section-label">Password</p>
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
                                {resetForId === s.id && resetStatus && (
                                  <p className={resetSuccess ? "saved-msg" : "error"}>
                                    {resetStatus}
                                  </p>
                                )}
                              </div>

                              <div className="admin-reset-section">
                                <p className="admin-section-label">Class</p>
                                {classForId === s.id ? (
                                  <form
                                    className="admin-reset-form"
                                    onSubmit={(e) => handleClassSubmit(e, s.id)}
                                  >
                                    <select
                                      value={newClass}
                                      onChange={(e) => setNewClass(e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
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
                                    <button type="submit" disabled={savingClass}>
                                      {savingClass ? "Saving..." : "Set class"}
                                    </button>
                                    <button
                                      type="button"
                                      className="secondary-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setClassForId(null);
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
                                      startClassChange(s.id, s.class_name);
                                    }}
                                  >
                                    Change class
                                  </button>
                                )}
                                {classForId === s.id && classStatus && (
                                  <p className={classSuccess ? "saved-msg" : "error"}>
                                    {classStatus}
                                  </p>
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
            )}
          </div>
        );
      })}
    </div>
  );
}