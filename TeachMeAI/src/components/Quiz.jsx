import React, { useState } from "react";
import "../styles/Quiz.css";

function Quiz({ questions = [] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [checked, setChecked] = useState({});
    const [showResults, setShowResults] = useState(false);

    if (!questions.length) {
        return <p className="quiz-empty">No questions available.</p>;
    }

    const currentQuestion = questions[currentIndex];
    const currentAnswer = answers[currentIndex] || "";
    const isChecked = checked[currentIndex];

    const normalize = (value) =>
        String(value || "")
            .toLowerCase()
            .trim()
            .replace(/[.,!?;:'"]/g, "")
            .replace(/\s+/g, " ");

    const isCorrect = (question, answer) => {
        if (!answer) return false;

        if (question.type === "mcq" || question.type === "true_false") {
            return normalize(answer) === normalize(question.correctAnswer);
        }

        const acceptedAnswers = [
            question.correctAnswer,
            ...(question.acceptedAnswers || [])
        ];

        return acceptedAnswers.some(
            item => normalize(item) === normalize(answer)
        );
    };

    const handleAnswer = (answer) => {
        if (isChecked) return;

        setAnswers(prev => ({
            ...prev,
            [currentIndex]: answer
        }));
    };

    const checkAnswer = () => {
        if (!currentAnswer.trim()) return;

        setChecked(prev => ({
            ...prev,
            [currentIndex]: true
        }));
    };

    const nextQuestion = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setShowResults(true);
        }
    };

    const previousQuestion = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const retakeQuiz = () => {
        setCurrentIndex(0);
        setAnswers({});
        setChecked({});
        setShowResults(false);
    };

    const score = questions.reduce((total, question, index) => {
        if (question.type === "short_answer") return total;

        return total + (
            checked[index] &&
            isCorrect(question, answers[index]) ? 1 : 0
        );
    }, 0);

    const gradedQuestions = questions.filter(
        question => question.type !== "short_answer"
    ).length;

    const attemptedQuestions = questions.filter(
        (question, index) =>
            checked[index] && question.type !== "short_answer"
    ).length;

    if (showResults) {
        return (
            <div className="quiz-results">
                <div className="quiz-result-icon">🏆</div>

                <h2>Quiz Completed!</h2>

                <div className="quiz-score">
                    {score} / {gradedQuestions}
                </div>

                <p>
                    You answered {score} out of {gradedQuestions} automatically
                    graded questions correctly.
                </p>

                <p className="quiz-result-note">
                    Short-answer questions are self-evaluated and are not
                    included in the score.
                </p>

                <button className="quiz-retake" onClick={retakeQuiz}>
                    ↻ Retake Quiz
                </button>
            </div>
        );
    }

    const progress = ((currentIndex + 1) / questions.length) * 100;

    return (
        <div className="quiz-container">

            <div className="quiz-top">
                <span className="quiz-count">
                    Question {currentIndex + 1} of {questions.length}
                </span>

                <span className="quiz-progress-text">
                    {Math.round(progress)}% completed
                </span>
            </div>

            <div className="quiz-progress">
                <div
                    className="quiz-progress-fill"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className="quiz-question-area">

                <span className="quiz-type">
                    {currentQuestion.type === "mcq" && "Multiple Choice"}
                    {currentQuestion.type === "true_false" && "True or False"}
                    {currentQuestion.type === "fill_blank" && "Fill in the Blank"}
                    {currentQuestion.type === "short_answer" && "Short Answer"}
                </span>

                <h3>{currentQuestion.question}</h3>

                {(currentQuestion.type === "mcq" ||
                    currentQuestion.type === "true_false") && (

                    <div className="quiz-options">
                        {currentQuestion.options?.map(option => {
                            const selected =
                                currentAnswer === option.id;

                            const correct =
                                normalize(option.id) ===
                                normalize(currentQuestion.correctAnswer);

                            let optionClass = "";

                            if (isChecked && correct) {
                                optionClass = "correct";
                            } else if (isChecked && selected && !correct) {
                                optionClass = "incorrect";
                            } else if (selected) {
                                optionClass = "selected";
                            }

                            return (
                                <button
                                    key={option.id}
                                    className={`quiz-option ${optionClass}`}
                                    onClick={() => handleAnswer(option.id)}
                                    disabled={isChecked}
                                >
                                    <span className="quiz-option-id">
                                        {option.id}
                                    </span>

                                    <span>{option.text}</span>

                                    {isChecked && correct && " ✓"}
                                    {isChecked && selected && !correct && " ✕"}
                                </button>
                            );
                        })}
                    </div>
                )}

                {currentQuestion.type === "fill_blank" && (
                    <input
                        type="text"
                        className="quiz-input"
                        placeholder="Type your answer here..."
                        value={currentAnswer}
                        onChange={e => handleAnswer(e.target.value)}
                        disabled={isChecked}
                    />
                )}

                {currentQuestion.type === "short_answer" && (
                    <textarea
                        className="quiz-textarea"
                        placeholder="Write your answer here..."
                        value={currentAnswer}
                        onChange={e => handleAnswer(e.target.value)}
                        disabled={isChecked}
                    />
                )}

                {isChecked && (
                    <div className={`quiz-feedback ${
                        currentQuestion.type === "short_answer"
                            ? "self-check"
                            : isCorrect(currentQuestion, currentAnswer)
                                ? "feedback-correct"
                                : "feedback-incorrect"
                    }`}>
                        <strong>
                            {currentQuestion.type === "short_answer"
                                ? "Compare your answer:"
                                : isCorrect(currentQuestion, currentAnswer)
                                    ? "Correct Answer!"
                                    : "Incorrect Answer"}
                        </strong>

                        <p>
                            <b>Correct answer:</b>{" "}
                            {currentQuestion.type === "mcq"
                                ? currentQuestion.options?.find(
                                    option =>
                                        normalize(option.id) ===
                                        normalize(currentQuestion.correctAnswer)
                                )?.text
                                : currentQuestion.correctAnswer}
                        </p>

                        {currentQuestion.explanation && (
                            <p>{currentQuestion.explanation}</p>
                        )}
                    </div>
                )}

                {!isChecked && (
                    <button
                        className="quiz-check"
                        onClick={checkAnswer}
                        disabled={!currentAnswer.trim()}
                    >
                        {currentQuestion.type === "short_answer"
                            ? "Show Answer"
                            : "Check Answer"}
                    </button>
                )}
            </div>

            <div className="quiz-navigation">

                <button
                    className="quiz-previous"
                    onClick={previousQuestion}
                disabled={currentIndex === 0}
            >
                ← Previous
            </button>

            <button
                className="quiz-next"
                onClick={nextQuestion}
                disabled={!isChecked}
            >
                {currentIndex === questions.length - 1
                    ? "Finish Quiz"
                    : "Next Question →"}
            </button>

        </div>

    </div>
);

}

export default Quiz;