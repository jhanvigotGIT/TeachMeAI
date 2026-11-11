import React, { useContext, useState, useRef, useEffect } from 'react'
import "../styles/Promptsec.css"
import { generatePDFExplanation } from "../services/geminiService";
import LoadingIndicator from './LoadingIndicator';
import { useNavigate } from 'react-router-dom';
import { AppContext } from './Context/AppContext';
import { FaMicrophone, FaStop } from "react-icons/fa";

function PromptSection({ pdfText, setAiResponse, loading, setLoading, loadinstage, setLoadingstage }) {

    const navigate = useNavigate();
    const { setMessages } = useContext(AppContext);

    const [usePrompt, setuserPrompt] = useState("");
    const [selectedStyle, setSelectedStyle] = useState("");
    const [isListening, setIsListening] = useState(false);

    const teachMeBtnRef = useRef(null);
    const recognitionRef = useRef(null);

    const learningStyles = [
        {
            id: "exam",
            icon: "🎓",
            title: "Exam Preparation",
            description: "Focus on important topics and exam-ready answers.",
            prompt: "Prepare me for my exam. Focus on important topics, key concepts and exam-oriented answers."
        },
        {
            id: "detailed",
            icon: "📚",
            title: "Detailed Notes",
            description: "Get complete explanations with examples.",
            prompt: "Explain every topic in detail with examples and clear explanations."
        },
        {
            id: "quick",
            icon: "⚡",
            title: "Quick Revision",
            description: "Revise the entire PDF through concise points.",
            prompt: "Give me a quick revision of the entire PDF, covering all important points without unnecessary details."
        },
        {
            id: "deep",
            icon: "🧠",
            title: "Deep Understanding",
            description: "Understand concepts, logic and practical applications.",
            prompt: "Teach me deeply and make sure I understand every concept, including the reasoning and practical applications."
        },
        {
            id: "interview",
            icon: "💼",
            title: "Interview Preparation",
            description: "Prepare using important interview questions.",
            prompt: "Prepare me for interviews based on this PDF. Include important questions and their answers."
        }
    ];

    // VOICE INPUT

    const startVoiceInput = () => {

        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            alert("Voice input is not supported in this browser. Please use Google Chrome.");
            return;
        }

        const recognition = new SpeechRecognition();

        recognition.lang = "en-IN";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognitionRef.current = recognition;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event) => {

            const transcript = event.results[0][0].transcript;

            setuserPrompt(previous =>
                previous ? previous.trimEnd() + " " + transcript : transcript
            );

            setSelectedStyle("");
        };

        recognition.onerror = (event) => {
            console.error("Voice input error:", event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
            recognitionRef.current = null;
        };

        try {
            recognition.start();
        } catch (error) {
            console.error("Unable to start voice input:", error);
            setIsListening(false);
        }
    };

    const stopVoiceInput = () => {

        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }

        setIsListening(false);
    };

    // Stop microphone if component is removed

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const handleStyleSelect = (style) => {
        setSelectedStyle(style.id);
        setuserPrompt(style.prompt);

        setTimeout(() => {
            teachMeBtnRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "end"
            });

            window.scrollBy({
                top: 167,
                behavior: "smooth"
            });

        }, 300);
    };

    const handleTeachMe = async () => {

        if (!usePrompt.trim()) {
            alert("Please tell me how you want to learn.");
            return;
        }

        try {

            setLoading(true);
            setLoadingstage("generating");

            const response = await generatePDFExplanation(
                pdfText,
                usePrompt
            );

            setAiResponse(response);

            setMessages([{
                role: "assistant",
                text: response,
            }]);

            // Show success state
            setLoadingstage("done");

            // Keep success popup visible briefly
            await new Promise(resolve => setTimeout(resolve, 1200));

            setLoading(false);
            navigate("/summary");

        } catch (error) {

            setLoading(false);
            setLoadingstage("idle");

            console.error(error);
            alert(error.message);
        }
    };

    return (
        <div className='promptSection'>

            <div className="learningCards">

                {learningStyles.map((style) => (
                    <button
                        type="button"
                        key={style.id}
                        className={`learningCard ${selectedStyle === style.id ? "selected" : ""}`}
                        onClick={() => handleStyleSelect(style)}
                        aria-pressed={selectedStyle === style.id}
                    >
                        <span className="learningIcon">{style.icon}</span>

                        <h3>{style.title}</h3>

                        <p>{style.description}</p>
                    </button>
                ))}

            </div>

            <div className="customPromptSection">

                <h3>Create Your Own Learning Experience</h3>

                <p>
                    Have something specific in mind? Tell your AI teacher.
                </p>

                {/* TEXTAREA WITH VOICE INPUT */}

                <div style={{ position: "relative", width: "100%" }}>

                    <textarea
                        value={usePrompt}
                        onChange={(e) => {
                            setuserPrompt(e.target.value);
                            setSelectedStyle("");
                        }}
                        placeholder={
                            isListening
                                ? "Listening... Speak your instructions 🎙️"
                                : "Tell your AI teacher how you'd like to learn..."
                        }
                        rows="3"
                        style={{
                            paddingRight: "60px",
                            boxSizing: "border-box"
                        }}
                    />

                    <button
                        type="button"
                        onClick={isListening ? stopVoiceInput : startVoiceInput}
                        title={isListening ? "Stop listening" : "Speak your instructions"}
                        aria-label={isListening ? "Stop voice input" : "Start voice input"}
                     style={{
    position: "absolute",
    right: "12px",
    bottom: "12px",
    background: isListening
        ? "#e53935"
        : "linear-gradient(135deg, #5146e5, #8175ff)",
    color: "white",
    border: "2px solid white",
    borderRadius: "50%",
    width: "44px",
    height: "44px",
    cursor: "pointer",
    fontSize: "20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    boxShadow: isListening
        ? "0 0 0 5px rgba(229, 57, 53, 0.18)"
        : "0 4px 12px rgba(81, 70, 229, 0.4)",
    transition: "all 0.25s ease"
}}
                    >
                       {isListening ? <FaStop /> : <FaMicrophone />}
                    </button>

                </div>

            </div>

            <button
                ref={teachMeBtnRef}
                className="teachMeBtn"
                onClick={handleTeachMe}
                disabled={loading}
            >
                TEACH ME <span className="teachArrow">→</span>
            </button>

            {loading && (
                <LoadingIndicator loadinstage={loadinstage} />
            )}

        </div>
    );
}

export default PromptSection;