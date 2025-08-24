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
import "./App.css";
import ProgressChecker from "./ProgressChecker"; // Import the new component

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

function App() {
  // Form state for creating a new roadmap
  const [topic, setTopic] = useState("");
  const [days, setDays] = useState("");

  // Main application state
  const [roadmaps, setRoadmaps] = useState({}); // Stores all generated roadmaps
  const [currentTopic, setCurrentTopic] = useState(""); // The currently viewed roadmap's topic
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modalDay, setModalDay] = useState(null); // Which day's details to show in the modal

  // --- Persistence with LocalStorage ---

  // Load roadmaps from localStorage on initial component mount
  useEffect(() => {
    try {
      const savedRoadmaps = localStorage.getItem("roadmaps");
      if (savedRoadmaps) {
        const parsedRoadmaps = JSON.parse(savedRoadmaps);
        setRoadmaps(parsedRoadmaps);
        // Set the current topic to the first one available
        const firstTopic = Object.keys(parsedRoadmaps)[0];
        if (firstTopic) {
          setCurrentTopic(firstTopic);
        }
      }
    } catch (e) {
      console.error("Failed to parse roadmaps from localStorage", e);
    }
  }, []);

  // Save to localStorage whenever the roadmaps state changes
  useEffect(() => {
    // If the roadmaps object becomes empty, remove the item from storage
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
        // Add a summary and completion status to each day for the UI
        roadmap: response.data.roadmap.map((day) => ({
          ...day,
          summary: day.tasks[0]?.text || "Review topics", // Use first task as summary
          isCompleted: false, // Initial completion status for the day
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

  // Handler for deleting a roadmap
  const handleDeleteRoadmap = (topicToDelete) => {
    if (
      window.confirm(
        `Are you sure you want to delete the "${topicToDelete}" roadmap?`
      )
    ) {
      const { [topicToDelete]: _, ...remainingRoadmaps } = roadmaps;
      setRoadmaps(remainingRoadmaps);

      // If the deleted roadmap was the one being viewed, reset the view
      if (currentTopic === topicToDelete) {
        const nextTopic = Object.keys(remainingRoadmaps)[0] || "";
        setCurrentTopic(nextTopic);
      }
    }
  };

  // Toggles the completion status of an entire day (the checkmark on the card)
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

  // Toggles completion of a task inside the modal
  const handleToggleTaskInModal = (type, taskIndex) => {
    const updatedRoadmaps = { ...roadmaps };
    const day = updatedRoadmaps[currentTopic].roadmap.find(
      (d) => d.day === modalDay.day
    );
    if (type === "task") {
      day.tasks[taskIndex].completed = !day.tasks[taskIndex].completed;
    }
    setRoadmaps(updatedRoadmaps);
    setModalDay({ ...day }); // Refresh modal content
  };

  // Toggles completion of a practice exercise inside the modal
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

  // --- Derived State for Rendering ---
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
      {/* --- Sidebar --- */}
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
                    e.stopPropagation(); // Prevent the li's onClick from firing
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
      </aside>

      {/* --- Main Content --- */}
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
            <p>
              Create a new roadmap using the form on the left to get started.
            </p>
          </div>
        )}

        {currentRoadmap && (
          <>
            <header className="content-header">
              <div>
                <h1>{currentRoadmap.topic} Roadmap</h1>
              </div> 
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

            {/* Render the ProgressChecker component and pass the required data */}
            <ProgressChecker roadmapData={currentRoadmap.roadmap} />
          </>
        )}
      </main>

      {/* --- Details Modal --- */}
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
            {modalDay.practiceQuestions &&
              modalDay.practiceQuestions.length > 0 && (
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

export default App;
