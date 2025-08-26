import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./components/Dashboard.jsx";
import QuizPage from "./components/QuizPage";
import Assist from "./components/AIAssistant.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/quiz" element={<QuizPage />} />
        <Route path="/assist" element={<Assist />} />
      </Routes>
    </Router>
  );
}

export default App;
