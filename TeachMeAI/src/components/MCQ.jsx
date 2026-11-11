import React, { useState } from "react";
import "../styles/MCQ.css";

function MCQ({ questions }) {

    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [showResult, setShowResult] = useState(false);

    const currentQuestion = questions[currentIndex];

    const selectedAnswer = answers[currentIndex];

    const progress = ((currentIndex + 1) / questions.length) * 100;

    const handleAnswer = (optionId) => {

        if (selectedAnswer) return;

        setAnswers(prev => ({
            ...prev,
            [currentIndex]: optionId
        }));

    };

    const handleNext = () => {

        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setShowResult(true);
        }

    };

    const handlePrevious = () => {

        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }

    };

    const handleRetake = () => {

        setCurrentIndex(0);
        setAnswers({});
        setShowResult(false);

    };

    const score = questions.reduce((total, question, index) => {

        return total + (
            answers[index] === question.correctAnswer ? 1 : 0
        );

    }, 0);

    const percentage = Math.round((score / questions.length) * 100);

    if (!questions || questions.length === 0) {
        return (
            <div className="mcq-error">
                No MCQs were generated. Please try again.
            </div>
        );
    }

    // FINAL RESULT SCREEN

    if (showResult) {

        return (

            <div className="mcq-result">

                <div className="result-icon">🏆</div>

                <h2>Quiz Completed!</h2>

                <p className="result-subtitle">
                    You've completed all {questions.length} questions.
                </p>

                <div className="score-circle">

                    <div>
                        <strong>{percentage}%</strong>
                        <span>Your Score</span>
                    </div>

                </div>

                <h3>
                    {score} out of {questions.length} correct
                </h3>

                <p className="result-message">

                    {percentage >= 80
                        ? "Excellent work! You've understood the concepts really well."
                        : percentage >= 50
                            ? "Good effort! A little more revision will help."
                            : "Keep practising! Revisiting your study notes will help you improve."}

                </p>

                <button
                    className="mcq-retake-btn"
                    onClick={handleRetake}
                >
                    ↻ Retake Quiz
                </button>

            </div>

        );

    }

    return (

        <div className="mcq-container">

            {/* TOP INFORMATION */}

            <div className="mcq-top">

                <div>

                    <span className="mcq-label">
                        KNOWLEDGE CHECK
                    </span>

                    <h3>Test Your Understanding</h3>

                </div>

                <div className="mcq-counter">

                    Question {currentIndex + 1} / {questions.length}

                </div>

            </div>


            {/* PROGRESS BAR */}

            <div className="mcq-progress">

                <div
                    className="mcq-progress-fill"
                    style={{ width: `${progress}%` }}
                ></div>

            </div>


            {/* QUESTION */}

            <div className="mcq-question-section">

                <span className="question-number">
                    QUESTION {currentIndex + 1}
                </span>

                <h2>
                    {currentQuestion.question}
                </h2>

            </div>


            {/* OPTIONS */}

            <div className="mcq-options">

                {currentQuestion.options.map((option) => {

                    const isSelected = selectedAnswer === option.id;

                    const isCorrect =
                        option.id === currentQuestion.correctAnswer;

                    let optionClass = "";

                    if (selectedAnswer) {

                        if (isCorrect) {
                            optionClass = "correct-option";
                        } else if (isSelected) {
                            optionClass = "incorrect-option";
                        }

                    } else if (isSelected) {

                        optionClass = "selected-option";

                    }

                    return (

                        <button
                            key={option.id}
                            className={`mcq-option ${optionClass}`}
                            onClick={() => handleAnswer(option.id)}
                            disabled={!!selectedAnswer}
                        >

                            <span className="option-letter">
                                {option.id}
                            </span>

                            <span className="option-text">
                                {option.text}
                            </span>

                            {selectedAnswer && isCorrect && (

                                <span className="option-status">
                                    ✓
                                </span>

                            )}

                            {isSelected && !isCorrect && (

                                <span className="option-status">
                                    ✕
                                </span>

                            )}

                        </button>

                    );

                })}

            </div>


            {/* ANSWER FEEDBACK */}

            {selectedAnswer && (

                <div className={`mcq-feedback ${
                    selectedAnswer === currentQuestion.correctAnswer
                        ? "feedback-correct"
                        : "feedback-incorrect"
                }`}>

                    <h4>

                        {selectedAnswer === currentQuestion.correctAnswer
                            ? "✓ Correct Answer!"
                            : "✕ Not Quite!"}

                    </h4>

                    {selectedAnswer !== currentQuestion.correctAnswer && (

                        <p className="correct-answer-text">

                            Correct Answer: {
                                currentQuestion.correctAnswer
                            }

                        </p>

                    )}

                    <p>
                        {currentQuestion.explanation}
                    </p>

                </div>

            )}


            {/* NAVIGATION */}

            <div className="mcq-navigation">

                <button
                    className="mcq-prev-btn"
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                >
                    ← Previous
                </button>

                <button
                    className="mcq-next-btn"
                    onClick={handleNext}
                    disabled={!selectedAnswer}
                >

                    {currentIndex === questions.length - 1
                        ? "Finish Quiz →"
                        : "Next Question →"}

                </button>

            </div>

        </div>

    );

}

export default MCQ;