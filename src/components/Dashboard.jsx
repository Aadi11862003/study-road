import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  FaCheckCircle,
  FaRegCircle,
  FaBook,
  FaCode,
  FaBrain,
  FaReact,
  FaDatabase,
  FaTrash,
} from "react-icons/fa";
import "./Dashboard.css";
import ProgressChecker from "../ProgressChecker.jsx";
import { Link } from "react-router-dom"; // for navigating to QuizPage

// Helper function to get a representative icon for a topic
const getIconForTopic = (topic) => {
  const lowerTopic = topic.toLowerCase();
  if (lowerTopic.includes("dsa") || lowerTopic.includes("algorithms"))
    return <FaBook />;
  if (lowerTopic.includes("web")) return <FaCode />;
  if (lowerTopic.includes("machine learning") || lowerTopic.includes("ai"))
    return <FaBrain />;
  if (lowerTopic.includes("data science")) return <FaDatabase />;
  if (lowerTopic.includes("react")) return <FaReact />;
  return <FaBook />;
};

function Dashboard() {
  const [topic, setTopic] = useState("");
  const [days, setDays] = useState("");
  const [roadmaps, setRoadmaps] = useState({});
  const [currentTopic, setCurrentTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalDay, setModalDay] = useState(null);

  // --- Persistence with LocalStorage ---
  useEffect(() => {
    try {
      const savedRoadmaps = localStorage.getItem("roadmaps");
      if (savedRoadmaps) {
        const parsedRoadmaps = JSON.parse(savedRoadmaps);
        setRoadmaps(parsedRoadmaps);
        const firstTopic = Object.keys(parsedRoadmaps)[0];
        if (firstTopic) setCurrentTopic(firstTopic);
      }
    } catch (e) {
      console.error("Failed to parse roadmaps from localStorage", e);
    }
  }, []);

  useEffect(() => {
    if (Object.keys(roadmaps).length === 0) {
      localStorage.removeItem("roadmaps");
    } else {
      localStorage.setItem("roadmaps", JSON.stringify(roadmaps));
    }
  }, [roadmaps]);

  // --- API Call and Data Processing ---
  const handleGenerateRoadmap = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/generate-roadmap",
        { topic, days: parseInt(days) }
      );
      const newRoadmap = {
        ...response.data,
        roadmap: response.data.roadmap.map((day) => ({
          ...day,
          summary: day.tasks[0]?.text || "Review topics",
          isCompleted: false,
        })),
      };

      setRoadmaps((prev) => ({ ...prev, [topic]: newRoadmap }));
      setCurrentTopic(topic);
      setTopic("");
      setDays("");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to generate roadmap.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Interactivity Handlers ---
  const handleDeleteRoadmap = (topicToDelete) => {
    if (window.confirm(`Are you sure you want to delete "${topicToDelete}"?`)) {
      const { [topicToDelete]: _, ...remainingRoadmaps } = roadmaps;
      setRoadmaps(remainingRoadmaps);
      if (currentTopic === topicToDelete) {
        const nextTopic = Object.keys(remainingRoadmaps)[0] || "";
        setCurrentTopic(nextTopic);
      }
    }
  };

  const handleToggleDayComplete = (dayNumber) => {
    const updatedRoadmaps = { ...roadmaps };
    const day = updatedRoadmaps[currentTopic].roadmap.find(
      (d) => d.day === dayNumber
    );
    if (day) {
      day.isCompleted = !day.isCompleted;
      setRoadmaps(updatedRoadmaps);
    }
  };

  const handleToggleTaskInModal = (type, taskIndex) => {
    const updatedRoadmaps = { ...roadmaps };
    const day = updatedRoadmaps[currentTopic].roadmap.find(
      (d) => d.day === modalDay.day
    );
    if (type === "task") {
      day.tasks[taskIndex].completed = !day.tasks[taskIndex].completed;
    }
    setRoadmaps(updatedRoadmaps);
    setModalDay({ ...day });
  };

  const handleTogglePractice = (taskIndex) => {
    const updatedRoadmaps = { ...roadmaps };
    const day = updatedRoadmaps[currentTopic].roadmap.find(
      (d) => d.day === modalDay.day
    );
    day.practiceQuestions[taskIndex].completed =
      !day.practiceQuestions[taskIndex].completed;
    setRoadmaps(updatedRoadmaps);
    setModalDay({ ...day });
  };

  // --- Derived State ---
  const currentRoadmap = roadmaps[currentTopic];
  const progress = useMemo(() => {
    if (!currentRoadmap) return 0;
    const completedDays = currentRoadmap.roadmap.filter(
      (day) => day.isCompleted
    ).length;
    return (completedDays / currentRoadmap.roadmap.length) * 100;
  }, [currentRoadmap]);

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2>Roadmaps</h2>
        <nav>
          <ul>
            {Object.keys(roadmaps).map((topicName) => (
              <li
                key={topicName}
                className={topicName === currentTopic ? "active" : ""}
                onClick={() => setCurrentTopic(topicName)}
              >
                {getIconForTopic(topicName)}
                <span>{topicName}</span>
                <button
                  className="delete-roadmap-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRoadmap(topicName);
                  }}
                >
                  <FaTrash />
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="new-roadmap-form">
          <h4>Create New Roadmap</h4>
          <form onSubmit={handleGenerateRoadmap}>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic (e.g., DSA)"
              required
            />
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              placeholder="Days"
              min="1"
              max="90"
              required
            />
            <button type="submit" disabled={isLoading}>
              {isLoading ? "Generating..." : "Create"}
            </button>
          </form>
          {error && <p className="error-message">{error}</p>}
        </div>

        {/* ✅ Quiz Navigation Button */}
        <Link to="/quiz">
          <button className="quiz-nav-btn">Go to Quiz</button>
        </Link>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {isLoading && !currentRoadmap && (
          <div className="loading-placeholder">
            <div className="spinner"></div>
            <p>Crafting your roadmap...</p>
          </div>
        )}

        {!currentRoadmap && !isLoading && (
          <div className="empty-state">
            <h2>Welcome to Your AI Roadmap Generator!</h2>
            <p>Create a new roadmap using the form on the left to get started.</p>
          </div>
        )}

        {currentRoadmap && (
          <>
            <header className="content-header">
              <h1>{currentRoadmap.topic} Roadmap</h1>
              <div className="user-profile-icon"></div>
            </header>

            <div className="days-grid">
              {currentRoadmap.roadmap.map((day) => (
                <div
                  key={day.day}
                  className="day-card"
                  onClick={() => setModalDay(day)}
                >
                  <div className="day-card-header">
                    <h3>Day {day.day}</h3>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleDayComplete(day.day);
                      }}
                    >
                      {day.isCompleted ? (
                        <FaCheckCircle className="check-icon completed" />
                      ) : (
                        <FaRegCircle className="check-icon" />
                      )}
                    </div>
                  </div>
                  <p className="day-card-summary">{day.summary}</p>
                </div>
              ))}
            </div>

            <ProgressChecker roadmapData={currentRoadmap.roadmap} />
          </>
        )}
      </main>

      {/* Modal */}
      {modalDay && (
        <div className="modal-backdrop" onClick={() => setModalDay(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Day {modalDay.day} Details</h2>
            <div className="modal-section">
              <h4>📋 Daily Tasks</h4>
              <ul>
                {modalDay.tasks.map((task, index) => (
                  <li
                    key={index}
                    onClick={() => handleToggleTaskInModal("task", index)}
                    className={task.completed ? "completed" : ""}
                  >
                    <div className="checkbox">{task.completed && "✔"}</div>
                    <span>{task.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            {modalDay.practiceQuestions?.length > 0 && (
              <div className="modal-section">
                <h4>💻 Practice Exercises</h4>
                <ul>
                  {modalDay.practiceQuestions.map(
                    (q, index) =>
                      q.text && (
                        <li
                          key={index}
                          onClick={() => handleTogglePractice(index)}
                          className={q.completed ? "completed" : ""}
                        >
                          <div className="checkbox">{q.completed && "✔"}</div>
                          <span>{q.text}</span>
                        </li>
                      )
                  )}
                </ul>
              </div>
            )}
            <button
              className="modal-close-btn"
              onClick={() => setModalDay(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
