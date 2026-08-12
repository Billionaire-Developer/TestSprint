import React, { useEffect, useState } from "react";
import { api } from "../api";

function toEmbedUrl(url) {
  try {
    const u = new URL(url);

    if (
      u.hostname.includes("youtube.com") &&
      u.searchParams.get("v")
    ) {
      return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    }

    if (u.hostname === "youtu.be") {
      const id = u.pathname.replace("/", "");
      return `https://www.youtube.com/embed/${id}`;
    }

    if (
      u.hostname.includes("youtube.com") &&
      u.pathname.startsWith("/shorts/")
    ) {
      const id = u.pathname.split("/")[2];
      return `https://www.youtube.com/embed/${id}`;
    }

    if (
      u.hostname.includes("drive.google.com") &&
      u.pathname.includes("/file/d/")
    ) {
      const id = u.pathname
        .split("/file/d/")[1]
        .split("/")[0];

      return `https://drive.google.com/file/d/${id}/preview`;
    }
  } catch {
    return null;
  }

  return null;
}

export default function Videos() {
  const [subjects, setSubjects] = useState([]);
  const [activeSubject, setActiveSubject] = useState("");
  const [videos, setVideos] = useState([]);
  const [openVideo, setOpenVideo] = useState(null);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSubjects() {
      try {
        const data = await api.getVideoSubjects();

        setSubjects(data.subjects);

        if (data.subjects.length > 0) {
          setActiveSubject(data.subjects[0]);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingSubjects(false);
      }
    }

    loadSubjects();
  }, []);

  useEffect(() => {
    if (!activeSubject) return;

    async function loadVideos() {
      setLoadingVideos(true);
      setError("");
      setOpenVideo(null);

      try {
        const data = await api.getVideosForSubject(activeSubject);
        setVideos(data.videos);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingVideos(false);
      }
    }

    loadVideos();
  }, [activeSubject]);

  async function openVideoById(videoId) {
    setLoadingVideo(true);
    setError("");

    try {
      const data = await api.getVideo(activeSubject, videoId);
      setOpenVideo(data.video);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingVideo(false);
    }
  }

  return (
    <div className="notes-page">
      <h1>Videos</h1>

      <p className="discovery-subtitle">
        Short explainer videos from your teacher, for your class.
      </p>

      {loadingSubjects ? (
        <p>Loading...</p>
      ) : subjects.length === 0 ? (
        <p>No videos have been uploaded for your class yet.</p>
      ) : (
        <>
          <div className="discovery-tabs">
            {subjects.map((s) => (
              <button
                key={s}
                className={
                  s === activeSubject
                    ? "tab tab-active"
                    : "tab"
                }
                onClick={() => setActiveSubject(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {openVideo ? (
            <div className="note-detail">
              <button
                className="secondary-btn note-back-btn"
                onClick={() => setOpenVideo(null)}
              >
                ← Back to list
              </button>

              <h2>{openVideo.title}</h2>

              {openVideo.description && (
                <p className="note-meta">
                  {openVideo.description}
                </p>
              )}

              {toEmbedUrl(openVideo.video_url) ? (
                <div className="video-embed-wrapper">
                  <iframe
                    src={toEmbedUrl(openVideo.video_url)}
                    title={openVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <a
                  href={openVideo.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="video-external-link"
                >
                  ▶ Watch video (opens in a new tab)
                </a>
              )}
            </div>
          ) : loadingVideos ? (
            <p>Loading videos...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : videos.length === 0 ? (
            <p>No videos for this subject yet.</p>
          ) : (
            <div className="note-list">
              {videos.map((v) => (
                <button
                  key={v.id}
                  className="note-list-item"
                  onClick={() => openVideoById(v.id)}
                  disabled={loadingVideo}
                >
                  <span className="note-list-title">
                    ▶ {v.title}
                  </span>

                  <span className="note-list-date">
                    {new Date(
                      v.updated_at
                    ).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}