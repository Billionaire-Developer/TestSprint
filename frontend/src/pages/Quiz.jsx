import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api";
import { getRandomFact } from "../facts";

const TIME_LIMIT_SECONDS = 10 * 60; // 10 minutes total for the whole test

export default function Quiz() {
  const { subject } = useParams();
  const navigate = useNavigate();

  const [phase, setPhase] = useState("checking"); // checking | taking | result | locked
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(TIME_LIMIT_SECONDS);
  const [fact, setFact] = useState("");
  const [isAway, setIsAway] = useState(false);
  const [awayCount, setAwayCount] = useState(0);

  const submitRef = useRef(() => {});

  useEffect(() => {
    async function checkStatus() {
      setPhase("checking");
      setError("");
      try {
        const status = await api.getQuizStatus(subject);
        if (status.locked) {
          setResult(status.lastResult);
          setFact(getRandomFact(subject));
          setPhase("locked");
          return;
        }

        const data = await api.getQuestions(subject);
        setQuestions(data.questions);
        setSecondsLeft(TIME_LIMIT_SECONDS);
        setAnswers({});
        setPhase("taking");
      } catch (err) {
        setError(err.message);
        setPhase("taking");
      }
    }
    checkStatus();
  }, [subject]);

  useEffect(() => {
    if (phase !== "taking" || questions.length === 0 || isAway) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          submitRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, questions.length, isAway]);

  // Detect tab-switching / window-blurring while taking the test — logs it
  // and blurs the questions until the student returns.
  useEffect(() => {
    if (phase !== "taking") return;

    function handleAway() {
      setIsAway(true);
      setAwayCount((c) => c + 1);
    }
    function handleBack() {
      setIsAway(false);
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) handleAway();
      else handleBack();
    });
    window.addEventListener("blur", handleAway);
    window.addEventListener("focus", handleBack);

    return () => {
      document.removeEventListener("visibilitychange", handleAway);
      window.removeEventListener("blur", handleAway);
      window.removeEventListener("focus", handleBack);
    };
  }, [phase]);

  function selectOption(questionId, option) {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const payload = questions.map((q) => ({
        question_id: q.id,
        selected_option: answers[q.id] || null
      }));
      const data = await api.submitQuiz(subject, payload);
      setResult(data);
      setFact(getRandomFact(subject));
      setPhase("result");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  submitRef.current = handleSubmit;

  const subjectTitle = subject.charAt(0).toUpperCase() + subject.slice(1);
  const username = api.getUsername();

  if (phase === "checking") return <p>Loading...</p>;

  if (error && phase === "taking" && questions.length === 0) {
    return <p className="error">{error}</p>;
  }

  if (phase === "locked" || phase === "result") {
    const heading = phase === "locked" ? `${subjectTitle} test — already attempted` : "Test complete";

    return (
      <div className="result-card">
        <h1>{heading}</h1>
        <p className="score">
          You scored {result.score} / {result.total}
        </p>
        {phase === "locked" && (
          <p className="locked-note">
            This test unlocks again if the questions are updated.
          </p>
        )}

        <div className="fact-box">
          <span className="fact-label">Did you know?</span>
          <p>{fact}</p>
        </div>

        {result.details && result.details.length > 0 && (
          <div className="review-list">
            <h2>Answer review</h2>
            {result.details.map((d, idx) => (
              <div
                key={d.question_id}
                className={d.is_correct ? "review-item review-correct" : "review-item review-wrong"}
              >
                <p className="review-question">
                  {idx + 1}. {d.question_text}
                </p>
                <p className="review-line">
                  Your answer:{" "}
                  <strong>
                    {d.selected_option ? `${d.selected_option} — ${d.options?.[d.selected_option] ?? ""}` : "No answer"}
                  </strong>
                </p>
                {!d.is_correct && (
                  <p className="review-line">
                    Correct answer:{" "}
                    <strong>
                      {d.correct_option} — {d.options?.[d.correct_option] ?? ""}
                    </strong>
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <button onClick={() => navigate("/")}>Back to dashboard</button>
      </div>
    );
  }

  const allAnswered = questions.every((q) => answers[q.id]);
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  const timeLow = secondsLeft <= 60;

  return (
    <div
      className="quiz quiz-wrapper"
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="watermark-layer" aria-hidden="true">
        {Array.from({ length: 24 }).map((_, i) => (
          <span key={i} className="watermark-text">
            {username} • {subjectTitle}
          </span>
        ))}
      </div>

      {isAway && (
        <div className="away-overlay">
          <p>Test paused — return to this tab to continue.</p>
        </div>
      )}

      <div className={isAway ? "quiz-content quiz-blurred" : "quiz-content"}>
        <div className="quiz-header">
          <h1>{subjectTitle} test</h1>
          <div className={timeLow ? "timer timer-low" : "timer"}>{timeDisplay}</div>
        </div>
        {awayCount > 0 && (
          <p className="away-warning">
            Tab switch detected ({awayCount}x) — this is visible in your test record.
          </p>
        )}
        {questions.map((q, idx) => (
          <div key={q.id} className="question-block no-select">
            <p className="question-text">
              {idx + 1}. {q.question_text}
            </p>
            <div className="options">
              {["a", "b", "c", "d"].map((letter) => (
                <label key={letter} className="option-label">
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    checked={answers[q.id] === letter.toUpperCase()}
                    onChange={() => selectOption(q.id, letter.toUpperCase())}
                  />
                  {q[`option_${letter}`]}
                </label>
              ))}
            </div>
          </div>
        ))}
        {error && <p className="error">{error}</p>}
        <button onClick={handleSubmit} disabled={!allAnswered || submitting}>
          {submitting ? "Submitting..." : "Submit test"}
        </button>
      </div>
    </div>
  );
}