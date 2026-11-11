import React from 'react';
import "../styles/loading.css";

function LoadingIndicator({ loadinstage }) {

    const isDone = loadinstage === "done";

    const getStatus = () => {
        if (isDone) {
            return "Lesson generated successfully!";
        }

        switch (loadinstage) {
            case "pdf":
                return "Reading your PDF...";
            case "prompt":
                return "Understanding your learning preferences...";
            case "generating":
                return "Creating your personalized lesson...";
            default:
                return "Preparing your lesson...";
        }
    };

    return (
        <div className="loadingOverlay">

            <div className={`loadingModal ${isDone ? "successModal" : ""}`}>

                <div className="aiVisual">

                    {!isDone ? (
                        <>
                            <div className="outerRing"></div>
                            <div className="middleRing"></div>

                            <div className="aiCore">
                                <svg viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    strokeLinecap="round"
                                    strokeLinejoin="round">

                                    <rect x="4" y="7" width="16" height="13" rx="4" />
                                    <path d="M12 3v4" />
                                    <path d="M9 12h.01M15 12h.01" />
                                    <path d="M9 16h6" />
                                    <path d="M2 12v3M22 12v3" />

                                </svg>
                            </div>
                        </>
                    ) : (
                        <div className="successIcon">
                            <svg viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round">

                                <path d="M5 12.5l4.5 4.5L19 7" />

                            </svg>
                        </div>
                    )}

                </div>

                <h2>
                    {isDone ? "Your lesson is ready!" : "Your lesson is taking shape"}
                </h2>

                <p className="loadingDescription">
                    {isDone
                        ? "Your personalized learning experience has been created successfully. Let's start learning!"
                        : "Your AI teacher is preparing a personalized learning experience."
                    }
                </p>

                <div className={`loadingStatus ${isDone ? "successStatus" : ""}`}>

                    <span className="statusIndicator"></span>

                    <span>{getStatus()}</span>

                </div>

                <div className={`bufferTrack ${isDone ? "successTrack" : ""}`}>
                    <div className={`bufferProgress ${isDone ? "successProgress" : ""}`}></div>
                </div>

                <p className="loadingFooter">
                    {isDone
                        ? "Taking you to your lesson..."
                        : "This may take a few moments. Hang tight!"
                    }
                </p>

            </div>

        </div>
    );
}

export default LoadingIndicator;