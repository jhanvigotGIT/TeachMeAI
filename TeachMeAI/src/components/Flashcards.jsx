import React, { useState } from "react";
import "../styles/Flashcards.css";

function Flashcards({ cards }) {

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    if (!cards || cards.length === 0) {
        return <p>No flashcards available.</p>;
    }

    const currentCard = cards[currentIndex];

    const nextCard = () => {
        setIsFlipped(false);

        setTimeout(() => {
            setCurrentIndex((prev) =>
                (prev + 1) % cards.length
            );
        }, 150);
    };

    const previousCard = () => {
        setIsFlipped(false);

        setTimeout(() => {
            setCurrentIndex((prev) =>
                (prev - 1 + cards.length) % cards.length
            );
        }, 150);
    };

    const shuffleCards = () => {

        const randomIndex = Math.floor(
            Math.random() * cards.length
        );

        setIsFlipped(false);
        setCurrentIndex(randomIndex);

    };

    return (

        <div className="flashcards-container">

            <div className="flashcards-top">

                <div>
                    <span className="flashcards-label">
                        YOUR STUDY DECK
                    </span>

                    <h2>Flashcards</h2>

                    <p>
                        Test your understanding, one card at a time.
                    </p>
                </div>

                <div className="flashcard-count">
                    {currentIndex + 1} / {cards.length}
                </div>

            </div>


            <div
                className="flashcard-scene"
                onClick={() => setIsFlipped(!isFlipped)}
            >

                <div className={`flashcard ${isFlipped ? "flipped" : ""}`}>

                    <div className="flashcard-face flashcard-front">

                        <span className="flashcard-type">
                            QUESTION
                        </span>

                        <h2>
                            {currentCard.question}
                        </h2>

                        <span className="flip-hint">
                            Click anywhere to reveal answer ↗
                        </span>

                    </div>


                    <div className="flashcard-face flashcard-back">

                        <span className="flashcard-type">
                            ANSWER
                        </span>

                        <p>
                            {currentCard.answer}
                        </p>

                        <span className="flip-hint">
                            Click to return to question ↗
                        </span>

                    </div>

                </div>

            </div>


            <div className="flashcard-progress">

                <div
                    className="flashcard-progress-fill"
                    style={{
                        width: `${((currentIndex + 1) / cards.length) * 100}%`
                    }}
                ></div>

            </div>


            <div className="flashcard-controls">

                <button
                    className="flashcard-nav"
                    onClick={previousCard}
                >
                    ← Previous
                </button>

                <button
                    className="flashcard-shuffle"
                    onClick={shuffleCards}
                >
                    ⇄ Shuffle
                </button>

                <button
                    className="flashcard-nav next"
                    onClick={nextCard}
                >
                    Next →
                </button>

            </div>


            <p className="flashcard-footer">
                💡 Tip: Try answering the question before flipping the card.
            </p>

        </div>

    );

}

export default Flashcards;