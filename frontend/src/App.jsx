import React from "react";
import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { api } from "./api";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Quiz from "./pages/Quiz.jsx";
import History from "./pages/History.jsx";
import Discovery from "./pages/Discovery.jsx";
import Profile from "./pages/Profile.jsx";

function ProtectedRoute({ children }) {
  return api.isLoggedIn() ? children : <Navigate to="/login" replace />;
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
        <Link to="/" className="brand">TestSprint</Link>
        {loggedIn && (
          <nav className="nav-links">
            <span className="hello">Hello {api.getUsername()}</span>
            <Link to="/profile">Profile</Link>
            <Link to="/discovery">Discovery</Link>
            <Link to="/history">History</Link>
            <button onClick={handleLogout} className="link-btn">Log out</button>
          </nav>
        )}
      </header>

      <main className="content">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz/:subject"
            element={
              <ProtectedRoute>
                <Quiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/discovery"
            element={
              <ProtectedRoute>
                <Discovery />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}