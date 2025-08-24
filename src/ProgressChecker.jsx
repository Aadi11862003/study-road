import React from 'react';
import './ProgressChecker.css'; // Import the dedicated CSS file

const ProgressChecker = ({ roadmapData }) => {
  // If there's no roadmap data, don't render anything
  if (!roadmapData || roadmapData.length === 0) {
    return null;
  }

  // --- Calculate Progress Statistics ---
  const totalDays = roadmapData.length;
  const completedDays = roadmapData.filter(day => day.isCompleted).length;
  const daysRemaining = totalDays - completedDays;
  const progressPercentage = totalDays > 0 ? (completedDays / totalDays) * 100 : 0;
  
  // --- Motivational Message Logic ---
  const getMotivationalMessage = () => {
    if (progressPercentage === 100) {
      return "Congratulations! You've completed the roadmap!";
    }
    if (progressPercentage > 75) {
      return "Almost there! Keep up the incredible momentum!";
    }
    if (progressPercentage > 25) {
      return "Great progress! Consistency is paying off.";
    }
    return "Every step forward is a victory. Let's get started!";
  };


  return (
    <div className="progress-checker-card">
      <h3>Progress Overview</h3>
      
      <div className="progress-stats">
        <div className="stat-item">
          <span className="stat-number">{completedDays}</span>
          <span className="stat-label">Completed</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{daysRemaining}</span>
          <span className="stat-label">Remaining</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{totalDays}</span>
          <span className="stat-label">Total Days</span>
        </div>
      </div>

      <div className="progress-bar-container-large">
        <div 
          className="progress-bar-large" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      <p className="progress-percentage-text">{Math.round(progressPercentage)}% Complete</p>
      
      <p className="motivational-quote">
        {getMotivationalMessage()}
      </p>
    </div>
  );
};

export default ProgressChecker;