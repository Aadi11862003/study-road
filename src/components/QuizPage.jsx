import React, { useState } from "react";
import "./QuizPage.css";
import axios from "axios";

const QuizPage = () => {
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [quizList, setQuizList] = useState([]); // store all quizzes
  const [selectedQuiz, setSelectedQuiz] = useState(null); // currently opened quiz
  const [answers, setAnswers] = useState({}); // user answers
  const [submitted, setSubmitted] = useState(false); // quiz submitted flag
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch Quiz from backend
  const fetchQuiz = async () => {
    if (!topic.trim()) {
      alert("Please enter a topic!");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/quiz/generateQuiz", {
        topic,
        count,
      });

      const newQuiz = {
        id: Date.now(),
        topic: res.data.topic,
        questions: res.data.questions || [],
      };

      setQuizList([...quizList, newQuiz]);
      setSelectedQuiz(newQuiz); // open immediately after generating
      setTopic("");
      setCount(5);
      setAnswers({});
      setSubmitted(false);
      setScore(0);
    } catch (err) {
      console.error("Error generating quiz:", err);
      alert("Error generating quiz!");
    } finally {
      setLoading(false);
    }
  };

  // Delete Quiz
  const deleteQuiz = (id) => {
    setQuizList(quizList.filter((q) => q.id !== id));
    if (selectedQuiz?.id === id) {
      setSelectedQuiz(null); // clear if deleted quiz was open
    }
  };

  // Handle Answer Selection
  const handleAnswer = (qIndex, option) => {
    setAnswers({ ...answers, [qIndex]: option });
  };

  // Submit Quiz
  const handleSubmit = () => {
    let newScore = 0;
    selectedQuiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) {
        newScore++;
      }
    });
    setScore(newScore);
    setSubmitted(true);
  };

  return (
    <div className="quiz-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>📚 My Quizzes</h2>
        {quizList.length === 0 ? (
          <p>No quizzes yet</p>
        ) : (
          quizList.map((quiz) => (
            <div
              key={quiz.id}
              className={`quiz-item ${
                selectedQuiz?.id === quiz.id ? "active" : ""
              }`}
              onClick={() => {
                setSelectedQuiz(quiz);
                setAnswers({});
                setSubmitted(false);
                setScore(0);
              }}
            >
              <span>{quiz.topic}</span>
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteQuiz(quiz.id);
                }}
              >
                ❌
              </button>
            </div>
          ))
        )}
      </div>

      {/* Main Content */}
      <div className="main-content">
        <h1>AI Quiz Generator</h1>

        {/* Form */}
        <div className="quiz-form">
          <input
            type="text"
            placeholder="Enter topic (e.g. React, Java, AI)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          <input
            type="number"
            min="1"
            max="20"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
          <button onClick={fetchQuiz} disabled={loading}>
            {loading ? "Generating..." : "Generate Quiz"}
          </button>
        </div>

        {/* Show selected quiz */}
        {selectedQuiz ? (
          <div className="quiz-details">
            <h2>📘 {selectedQuiz.topic} Quiz</h2>
            {selectedQuiz.questions.map((q, i) => (
              <div key={i} className="question-card">
                <h3>
                  {i + 1}. {q.question}
                </h3>
                <div className="options">
                  {q.options.map((opt, j) => (
                    <label
                      key={j}
                      className={`option 
                        ${submitted && q.correctAnswer === opt ? "correct" : ""} 
                        ${
                          submitted &&
                          answers[i] === opt &&
                          q.correctAnswer !== opt
                            ? "wrong"
                            : ""
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name={`q-${i}`}
                        value={opt}
                        disabled={submitted}
                        checked={answers[i] === opt}
                        onChange={() => handleAnswer(i, opt)}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
                {submitted && (
                  <p className="explanation">💡 {q.explanation}</p>
                )}
              </div>
            ))}

            {!submitted ? (
              <button className="submit-btn" onClick={handleSubmit}>
                Submit Quiz
              </button>
            ) : (
              <h2 className="score">
                ✅ You scored {score} / {selectedQuiz.questions.length}
              </h2>
            )}
          </div>
        ) : (
          <p>Select a quiz from the left or generate a new one.</p>
        )}
      </div>
    </div>
  );
};

export default QuizPage;
