import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import PromptSection from '../components/PromptSection';
import { AppContext } from '../components/Context/AppContext';
import '../styles/PromptPage.css';

function PromptPage() {
    const navigate = useNavigate();
    const { pdfText, setAiResponse } = useContext(AppContext);

    const [loading, setLoading] = useState(false);
    const [loadinstage, setLoadingstage] = useState("idle");

    useEffect(() => {
        window.scrollTo(0, 0);

        const timer = setTimeout(() => {
            const cards = document.querySelector(".learningCards");

            if (cards) {
                const position =
                    cards.getBoundingClientRect().top +
                    window.scrollY -
                    100;

                window.scrollTo({
                    top: position,
                    behavior: "smooth"
                });
            }
        }, 1);

        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="prompt-page-bg">

            <div className="promptPage">
                <div className="promptPageContainer">

                    {/* TOP NAVIGATION */}
                    <div className="promptTopBar">
                        <button
                            className="backBtn"
                            onClick={() => navigate("/")}
                        >
                            ← Back to Upload
                        </button>
                    </div>

                    {/* HEADER */}
                    <Header />

                    {/* MAIN CONTENT */}
                    <div className="promptPageContent">

                        <h1>How would you like to learn?</h1>

                        <p>
                            Choose your learning style and let your AI teacher
                            explain your PDF.
                        </p>

                        <PromptSection
                            pdfText={pdfText}
                            setAiResponse={setAiResponse}
                            loading={loading}
                            setLoading={setLoading}
                            loadinstage={loadinstage}
                            setLoadingstage={setLoadingstage}
                        />

                    </div>

                </div>
            </div>

        </div>
    );
}

export default PromptPage;