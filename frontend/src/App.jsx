import React from "react";
import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { api } from "./api";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import ChooseClass from "./pages/ChooseClass.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Quiz from "./pages/Quiz.jsx";
import History from "./pages/History.jsx";
import Discovery from "./pages/Discovery.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import Profile from "./pages/Profile.jsx";
import Admin from "./pages/Admin.jsx";

function ProtectedRoute({ children }) {
  return api.isLoggedIn() ? children : <Navigate to="/login" replace />;
}

function ClassRoute({ children }) {
  if (!api.isLoggedIn()) return <Navigate to="/login" replace />;
  if (!api.getCachedClass()) return <Navigate to="/choose-class" replace />;
  return children;
}

function AdminRoute({ children }) {
  if (!api.isLoggedIn()) return <Navigate to="/login" replace />;
  if (!api.isAdmin()) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const navigate = useNavigate();
  const loggedIn = api.isLoggedIn();

  function handleLogout() {
    api.logout();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">Quiz Platform</Link>
        {loggedIn && (
          <nav className="nav-links">
            <span className="hello">Hi, {api.getUsername()}</span>
            <Link to="/profile">Profile</Link>
            <Link to="/discovery">Discovery</Link>
            <Link to="/leaderboard">Leaderboard</Link>
            <Link to="/history">History</Link>
            {api.isAdmin() && <Link to="/admin">Admin</Link>}
            <button onClick={handleLogout} className="link-btn">Log out</button>
          </nav>
        )}
      </header>

      <main className="content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/choose-class"
            element={
              <ProtectedRoute>
                <ChooseClass />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<ClassRoute><Dashboard /></ClassRoute>} />
          <Route path="/quiz/:subject" element={<ClassRoute><Quiz /></ClassRoute>} />
          <Route path="/leaderboard" element={<ClassRoute><Leaderboard /></ClassRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/discovery" element={<ProtectedRoute><Discovery /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
        </Routes>
      </main>
    </div>
  );
}