import React, { useContext, useEffect, useState, useRef } from 'react'
import "../styles/ResponseBox.css"
import ReactMarkdown from "react-markdown";
import { generateStudyNotesPDF } from "../services/studyNotesPDF";
import remarkGfm from "remark-gfm";

import { AppContext } from './Context/AppContext';
import { IoSend } from "react-icons/io5";
import { IoMdPerson } from "react-icons/io";
import { RiRobot2Fill } from "react-icons/ri";
import { askGemini } from '../services/geminiService';
import { generateSpeech } from "../services/kokoroTTS";
import ToolModal from "./ToolModal";
import Flashcards from "./Flashcards";
import MCQ from "./MCQ";
import Quiz from "./Quiz";
import { FaMicrophone, FaStop } from "react-icons/fa";

function ResponseBox({ aiResponse }) {

    const [displayText, setDisplayText] = useState("");
    const [showActions, setShowActions] = useState(false);
    const [userInput, setUserInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isTyping, setisTyping] = useState(false);

    const audioRef = useRef(null);
    const audioUrlRef = useRef("");
    const speechRunId = useRef(0);

    const [speechStatus, setSpeechStatus] = useState("stopped");
    const [speechSpeed, setSpeechSpeed] = useState(0.9);

    // VOICE INPUT
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    const { messages, setMessages, pdfText, setAiResponse } = useContext(AppContext);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState("");
    const [modalFlashcards, setModalFlashcards] = useState([]);
    const [modalMCQs, setModalMCQs] = useState([]);
    const [modalContent, setModalContent] = useState("");
    const [modalLoading, setModalLoading] = useState(false);
    const [toolTypewriter, setToolTypewriter] = useState("");
    const [modalQuiz, setModalQuiz] = useState([]);


    // AI response typewriter effect
    useEffect(() => {

        if (!aiResponse) {
            setDisplayText("");
            return;
        }

        setShowActions(false);
        setDisplayText("");

        let index = 0;

        const interval = setInterval(() => {

            setDisplayText(aiResponse.slice(0, index));

            index += 10;

            if (index >= aiResponse.length) {
                clearInterval(interval);
                setShowActions(true);
            }

        }, 5);

        return () => clearInterval(interval);

    }, [aiResponse]);


    // Tool content typewriter effect
    useEffect(() => {

        if (!modalContent) return;

        setToolTypewriter("");

        let index = 0;

        const interval = setInterval(() => {

            setToolTypewriter(modalContent.slice(0, index));

            index += 4;

            if (index >= modalContent.length) {
                clearInterval(interval);
            }

        }, 8);

        return () => clearInterval(interval);

    }, [modalContent]);


    // VOICE NARRATION — KOKORO SKY VOICE

    const speakText = async (text) => {

        const runId = ++speechRunId.current;

        // Stop previous audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
            audioRef.current = null;
        }

        // Release previous audio URL
        if (audioUrlRef.current) {
            URL.revokeObjectURL(audioUrlRef.current);
            audioUrlRef.current = "";
        }

        // Clean Markdown and formatting symbols
        const cleanText = text

            .replace(/```[\s\S]*?```/g, " ")
            .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
            .replace(/^\s{0,3}#{1,6}\s*/gm, "")
            .replace(/^\s*([-_*])\1{2,}\s*$/gm, "")
            .replace(/\*\*(.*?)\*\*/gs, "$1")
            .replace(/\*(.*?)\*/gs, "$1")
            .replace(/__(.*?)__/gs, "$1")
            .replace(/_(.*?)_/gs, "$1")
            .replace(/~~(.*?)~~/gs, "$1")
            .replace(/`([^`]+)`/g, "$1")
            .replace(/^\s*[-*+•]\s+/gm, "")
            .replace(/^\s*>\s?/gm, "")
            .replace(/^\s*\|?[\s:|-]+\|?\s*$/gm, "")
            .replace(/\|/g, " ")
            .replace(/<[^>]*>/g, "")
            .replace(/[●○■□◆◇▪▫►▶→←★☆✓✔️]/g, "")
            .replace(/[#*_~`]/g, "")
            .replace(/-{2,}/g, " ")
            .replace(/[ \t]+/g, " ")
            .replace(/\n{2,}/g, ". ")
            .replace(/\s+([,.!?;:])/g, "$1")
            .trim();

        if (!cleanText) {
            setSpeechStatus("stopped");
            return;
        }

        try {

            setSpeechStatus("loading");

            // Generate speech using Kokoro Sky voice
            const generatedAudio = await generateSpeech(cleanText, 1);

            // Ignore outdated generation requests
            if (runId !== speechRunId.current) {
                return;
            }

            const audioBlob = generatedAudio.toBlob();
            const audioUrl = URL.createObjectURL(audioBlob);

            audioUrlRef.current = audioUrl;

            const audio = new Audio(audioUrl);

            audioRef.current = audio;

            // Apply selected playback speed
            audio.playbackRate = speechSpeed;

            audio.onended = () => {

                if (runId !== speechRunId.current) return;

                setSpeechStatus("stopped");

                audioRef.current = null;

                if (audioUrlRef.current) {
                    URL.revokeObjectURL(audioUrlRef.current);
                    audioUrlRef.current = "";
                }

            };

            audio.onerror = () => {

                if (runId !== speechRunId.current) return;

                console.error("Kokoro audio playback failed.");

                setSpeechStatus("stopped");

                audioRef.current = null;

                if (audioUrlRef.current) {
                    URL.revokeObjectURL(audioUrlRef.current);
                    audioUrlRef.current = "";
                }

            };

            await audio.play();

            if (runId === speechRunId.current) {
                setSpeechStatus("playing");
            }

        }

        catch (error) {

            if (runId !== speechRunId.current) return;

            console.error("Kokoro narration error:", error);

            setSpeechStatus("stopped");

            alert(
                "Unable to generate narration. Please check your connection and try again."
            );

        }

    };


    const pauseSpeech = () => {

        if (audioRef.current && !audioRef.current.paused) {

            audioRef.current.pause();

            setSpeechStatus("paused");

        }

    };


    const resumeSpeech = async () => {

        if (audioRef.current && audioRef.current.paused) {

            try {

                await audioRef.current.play();

                setSpeechStatus("playing");

            }

            catch (error) {

                console.error("Unable to resume narration:", error);

            }

        }

    };


    const stopSpeech = () => {

        // Invalidate any ongoing generation
        speechRunId.current++;

        if (audioRef.current) {

            audioRef.current.pause();

            audioRef.current.src = "";

            audioRef.current = null;

        }

        if (audioUrlRef.current) {

            URL.revokeObjectURL(audioUrlRef.current);

            audioUrlRef.current = "";

        }

        setSpeechStatus("stopped");

    };


    // CHANGE SPEED WITHOUT RESTARTING NARRATION

    const changeSpeechSpeed = (speed) => {

        setSpeechSpeed(speed);

        if (audioRef.current) {

            audioRef.current.playbackRate = speed;

        }

    };


    // VOICE INPUT — SPEECH TO TEXT

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

            setUserInput(previous =>
                previous ? previous + " " + transcript : transcript
            );

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

        }

        catch (error) {

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


    // Copy response
    const copyResponse = async () => {

        if (!aiResponse) return;

        await navigator.clipboard.writeText(aiResponse);

        alert("Copied to clipboard!");

    };


    // PDF download
    const downloadPDf = () => {

        if (!showActions) {
            alert("Please wait until your AI lesson is completely generated.");
            return;
        }

        try {

            generateStudyNotesPDF(messages, aiResponse);

        }

        catch (error) {

            console.error("PDF Download Error:", error);

            alert("Unable to generate PDF. Please try again.");

        }

    };


    // Generate learning tools
    const openTool = async (title) => {

        if (title === "📚 Flashcards") {

            window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: "smooth"
            });

        }

        if (title === "❓ MCQs") {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }

        setModalTitle(title);

        setIsModalOpen(true);

        setModalLoading(true);

        setModalContent("");
        setModalFlashcards([]);
        setModalMCQs([]);
        setModalQuiz([]);

        setToolTypewriter("");

        try {

            let prompt = "";

            switch (title) {

                case "📚 Flashcards":

                    prompt = `
You are an expert educational flashcard creator.

Based ONLY on the uploaded PDF, generate exactly 15 useful revision flashcards.

Requirements:

1. Each flashcard must have one clear question.
2. Each answer must explain the concept accurately.
3. Keep questions concise.
4. Keep answers informative but not unnecessarily long.
5. Cover different important concepts from the PDF.
6. Avoid duplicate questions.
7. Do not add numbering or Markdown.

IMPORTANT:
Return ONLY valid JSON in this exact structure:

{
  "flashcards": [
    {
      "question": "What is ...?",
      "answer": "..."
    },
    {
      "question": "What is ...?",
      "answer": "..."
    }
  ]
}

Return all 15 flashcards.
Do not include Markdown code fences or any additional text.
`;

                    break;


                case "❓ MCQs":

                    prompt = `
You are an expert educational assessment creator.

Based ONLY on the uploaded PDF, generate exactly 15 high-quality multiple choice questions.

REQUIREMENTS:

1. Questions must test understanding of important concepts.
2. Cover different topics from the PDF.
3. Avoid duplicate or repetitive questions.
4. Each question must have exactly FOUR options.
5. Only ONE option must be correct.
6. Options must be plausible and meaningful.
7. Avoid questions that are too obvious.
8. Include a short explanation of the correct answer.
9. Do not introduce information that is not present in the PDF.

IMPORTANT:
Return ONLY valid JSON in the following exact structure:

{
  "questions": [
    {
      "question": "What is the main purpose of ...?",
      "options": [
        {
          "id": "A",
          "text": "First option"
        },
        {
          "id": "B",
          "text": "Second option"
        },
        {
          "id": "C",
          "text": "Third option"
        },
        {
          "id": "D",
          "text": "Fourth option"
        }
      ],
      "correctAnswer": "B",
      "explanation": "A short explanation of why option B is correct."
    }
  ]
}

Generate exactly 15 questions.

The correctAnswer must contain only the option letter: A, B, C, or D.

Do not include Markdown code fences.
Do not include any additional text outside the JSON.
`;

                    break;


                case "📝 Quiz":

                    prompt = `
Create an interactive quiz based on the PDF content.

Generate exactly 15 questions.

Distribute them as follows:
- 6 Multiple Choice Questions
- 3 True or False Questions
- 3 Fill in the Blank Questions
- 3 Short Answer Questions

Return ONLY valid JSON. Do not include markdown code blocks or additional text.

Use this exact JSON structure:

{
  "questions": [
    {
      "type": "mcq",
      "question": "Question text",
      "options": [
        {"id": "A", "text": "Option A"},
        {"id": "B", "text": "Option B"},
        {"id": "C", "text": "Option C"},
        {"id": "D", "text": "Option D"}
      ],
      "correctAnswer": "B",
      "explanation": "Explanation of the correct answer."
    },
    {
      "type": "true_false",
      "question": "Statement to evaluate",
      "options": [
        {"id": "True", "text": "True"},
        {"id": "False", "text": "False"}
      ],
      "correctAnswer": "True",
      "explanation": "Explanation."
    },
    {
      "type": "fill_blank",
      "question": "Complete this sentence: ______",
      "correctAnswer": "correct answer",
      "acceptedAnswers": ["alternative answer"],
      "explanation": "Explanation."
    },
    {
      "type": "short_answer",
      "question": "Write a short answer explaining...",
      "correctAnswer": "Expected answer",
      "explanation": "Explanation."
    }
  ]
}

Important:
- Questions must test actual understanding of the PDF.
- Avoid repetitive questions.
- Make questions progressively challenging.
- All answers must be factually correct according to the PDF.
- Use concise explanations.
- For fill-in-the-blank questions, keep the missing answer unambiguous.
- Return exactly 15 questions.
`;

                    break;


                case "🔑 Key Points":

                    prompt = `
You are an expert academic note-maker.

Analyze the uploaded PDF and create comprehensive, well-organized revision notes.

STRICT RULES:
1. Use ONLY information available in the PDF.
2. Do not miss important concepts, definitions, facts or explanations.
3. Avoid unnecessary repetition.
4. Use simple, student-friendly language.
5. Keep the notes concise but informative.

FOLLOW THIS STRUCTURE:

# Key Points

## 1. Overview
Briefly explain what the PDF or topic is about.

## 2. Important Concepts
Explain all major concepts using separate headings.

## 3. Important Definitions
List important terms and their meanings.

## 4. Processes and Working
Explain important processes, steps, mechanisms or working principles in the correct order.

## 5. Important Facts
Include important facts, characteristics, advantages, disadvantages and applications wherever relevant.

## 6. Formulas and Examples
Include relevant formulas, examples, calculations or code snippets if they appear in the PDF.

## 7. Quick Revision
End with the most important points students should remember.

IMPORTANT:
- Include only sections relevant to the PDF.
- Use bullet points and numbered lists wherever appropriate.
- Highlight important terms using **bold**.
- Use tables when they make comparisons easier.
- Do not make the notes unnecessarily long.
- Do not skip important topics just to keep the response short.

Return properly formatted Markdown.
`;

                    break;


                case "🧠 Mind Map":

                    prompt = `
You are an expert at creating educational mind maps.

Create a detailed, easy-to-understand hierarchical mind map using the uploaded PDF.

IMPORTANT:
Use ONLY information from the PDF.

FOLLOW THIS STRUCTURE:

# Mind Map

## CENTRAL TOPIC
Identify the main subject of the PDF.

Then organize the information hierarchically:

- Main Topic 1
    - Subtopic 1
        - Important concept
        - Definition
        - Explanation
    - Subtopic 2
        - Important points

- Main Topic 2
    - Subtopic 1
        - Related concepts
        - Important facts
    - Subtopic 2
        - Applications
        - Examples

- Main Topic 3
    - Important concepts
    - Processes
    - Characteristics

Continue this structure until all important topics from the PDF are covered.

RULES:
1. Start with the central topic.
2. Divide it into major branches.
3. Divide each branch into smaller subtopics.
4. Show relationships between related concepts using arrows (→).
5. Keep each point short and meaningful.
6. Use indentation to clearly show hierarchy.
7. Highlight important keywords using **bold**.
8. Avoid lengthy paragraphs.
9. Do not invent connections or information.
10. Cover all important sections of the PDF.

The final result should look like a properly organized text-based mind map, not a normal summary.

Return properly formatted Markdown.
`;

                    break;


                default:

                    prompt = "Explain this PDF.";

            }


            console.log(title);
            console.log(prompt);
            console.log("PDF text received by tool:", pdfText.length);
            console.log("Selected tool:", title);

            const reply = await askGemini(pdfText, prompt);


            // FLASHCARDS RESPONSE
            if (title === "📚 Flashcards") {

                const cleanedReply = reply
                    .replace(/```json/gi, "")
                    .replace(/```/g, "")
                    .trim();

                const start = cleanedReply.indexOf("{");
                const end = cleanedReply.lastIndexOf("}");

                if (start === -1 || end === -1) {
                    throw new Error("Invalid flashcard response. Please try again.");
                }

                const parsedData = JSON.parse(
                    cleanedReply.substring(start, end + 1)
                );

                if (
                    !parsedData.flashcards ||
                    !Array.isArray(parsedData.flashcards) ||
                    parsedData.flashcards.length === 0
                ) {
                    throw new Error("No flashcards were generated.");
                }

                setModalFlashcards(
                    parsedData.flashcards.filter(
                        card => card.question && card.answer
                    )
                );

            }


            // MCQ RESPONSE
            else if (title === "❓ MCQs") {

                const cleanedReply = reply
                    .replace(/```json/gi, "")
                    .replace(/```/g, "")
                    .trim();

                const start = cleanedReply.indexOf("{");
                const end = cleanedReply.lastIndexOf("}");

                if (start === -1 || end === -1) {
                    throw new Error("Invalid MCQ response. Please try again.");
                }

                const parsedData = JSON.parse(
                    cleanedReply.substring(start, end + 1)
                );

                if (
                    !parsedData.questions ||
                    !Array.isArray(parsedData.questions) ||
                    parsedData.questions.length === 0
                ) {
                    throw new Error("No MCQs were generated. Please try again.");
                }

                const validQuestions = parsedData.questions.filter(question => {

                    return (
                        question.question &&
                        Array.isArray(question.options) &&
                        question.options.length === 4 &&
                        question.options.every(option =>
                            option.id &&
                            option.text
                        ) &&
                        ["A", "B", "C", "D"].includes(question.correctAnswer) &&
                        question.explanation
                    );

                });

                if (validQuestions.length === 0) {
                    throw new Error("The generated MCQs have an invalid format.");
                }

                setModalMCQs(validQuestions);

            }


            // QUIZ RESPONSE
            else if (title === "📝 Quiz") {

                console.log("RAW QUIZ RESPONSE:", reply);

                const cleanedReply = reply
                    .replace(/```json/gi, "")
                    .replace(/```/g, "")
                    .trim();

                const start = cleanedReply.indexOf("{");
                const end = cleanedReply.lastIndexOf("}");

                if (start === -1 || end === -1) {
                    throw new Error("Gemini did not return valid quiz JSON.");
                }

                const jsonText = cleanedReply.substring(start, end + 1);

                const parsedQuiz = JSON.parse(jsonText);

                if (
                    !parsedQuiz.questions ||
                    !Array.isArray(parsedQuiz.questions) ||
                    parsedQuiz.questions.length === 0
                ) {
                    throw new Error("No quiz questions were generated.");
                }

                const validQuestions = parsedQuiz.questions.filter(question => {

                    if (!question.question || !question.correctAnswer) {
                        return false;
                    }

                    if (
                        question.type === "mcq" ||
                        question.type === "true_false"
                    ) {
                        return (
                            Array.isArray(question.options) &&
                            question.options.length >= 2 &&
                            question.options.every(option =>
                                option.id && option.text
                            )
                        );
                    }

                    if (
                        question.type === "fill_blank" ||
                        question.type === "short_answer"
                    ) {
                        return true;
                    }

                    return false;

                });

                if (validQuestions.length === 0) {
                    throw new Error("The generated quiz has an invalid format.");
                }

                console.log("VALID QUIZ QUESTIONS:", validQuestions);

                setModalQuiz(validQuestions);

            }


            // OTHER TOOLS
            else {

                setModalContent(reply);

            }

            setModalLoading(false);

        }

        catch (error) {

            console.error("QUIZ/TOOL ERROR:", error);

            setModalLoading(false);

            setModalContent(error.message);

        }

    };


    // Follow-up chat
    const handleSend = async () => {

        if (!userInput.trim()) return;

        const currentQuestion = userInput;

        setisTyping(true);

        setAiResponse("");
        setDisplayText("");
        setShowActions(false);

        const updatedMessages = [
            ...messages,
            {
                role: "user",
                text: currentQuestion
            }
        ];

        setMessages(updatedMessages);

        setUserInput("");

        setLoading(true);

        try {

            setAiResponse("");
            setDisplayText("");

            const reply = await askGemini(
                pdfText,
                currentQuestion
            );

            setAiResponse(reply);

            setisTyping(false);

            setMessages([
                ...updatedMessages,
                {
                    role: "assistant",
                    text: reply
                }
            ]);

        }

        catch (error) {

            setisTyping(false);

            console.log(error);

            setMessages([
                ...updatedMessages,
                {
                    role: "assistant",
                    text: "Something went wrong. Please try again."
                }
            ]);

        }

        finally {

            setLoading(false);

        }

    };


    return (

        <div className='responseBox'>

            <div className='response-header'>

                <h2>🤖AI TEACHER</h2>

                <div className='response-actions'>

                    <button
                        className='copy-btn'
                        onClick={copyResponse}
                    >
                        📋Copy
                    </button>

                    <button
                        className='download-btn'
                        onClick={downloadPDf}
                    >
                        📄Download
                    </button>

                </div>

            </div>


            <div className='responseCon'>

                <div className="pdf-content">

                    {aiResponse && (

                        <div className="message-header">
                            🤖 <span>AI Teacher</span>
                        </div>

                    )}

                    {messages.length > 0 ? (

                        messages.map((msg, index) => (

                            <div
                                key={index}
                                className={
                                    msg.role === "user"
                                        ? "user-message"
                                        : "ai-message"
                                }
                            >

                                <div className="message-header">

                                    {msg.role === "user" ? (

                                        <strong>
                                            <IoMdPerson className='message-icon' />
                                            You
                                        </strong>

                                    ) : (

                                        <strong>
                                            <RiRobot2Fill className='message-icon' />
                                            AI Teacher
                                        </strong>

                                    )}

                                </div>


                                <ReactMarkdown remarkPlugins={[remarkGfm]}>

                                    {msg.role === "assistant" &&
                                        index === messages.length - 1 &&
                                        !isTyping
                                        ? displayText
                                        : msg.text}

                                </ReactMarkdown>


                                {msg.role === "assistant" && msg.text && !isTyping && (

                                    <div className="voice-controls">

                                        <button
                                            onClick={() => speakText(msg.text)}
                                            disabled={
                                                speechStatus === "loading" ||
                                                speechStatus === "playing" ||
                                                speechStatus === "paused"
                                            }
                                        >
                                            {speechStatus === "loading"
                                                ? "⏳ Loading voice..."
                                                : "▶️ Listen"}
                                        </button>

                                        <button
                                            onClick={pauseSpeech}
                                            disabled={speechStatus !== "playing"}
                                        >
                                            ⏸️ Pause
                                        </button>

                                        <button
                                            onClick={resumeSpeech}
                                            disabled={speechStatus !== "paused"}
                                        >
                                            ▶️ Resume
                                        </button>

                                        <button
                                            onClick={stopSpeech}
                                            disabled={speechStatus === "stopped"}
                                        >
                                            ⏹️ Stop
                                        </button>

                                        <select
                                            value={speechSpeed}
                                            onChange={(e) =>
                                                changeSpeechSpeed(Number(e.target.value))
                                            }
                                            className="speech-speed"
                                        >
                                            <option value="0.75">0.75× Slow</option>
                                            <option value="0.9">0.9× Relaxed</option>
                                            <option value="1">1× Normal</option>
                                            <option value="1.25">1.25×</option>
                                            <option value="1.5">1.5×</option>
                                            <option value="2">2× Fast</option>
                                        </select>

                                    </div>

                                )}


                                {isTyping &&
                                    index === messages.length - 1 &&
                                    msg.role === "user" && (

                                        <div className="ai-message">

                                            <div className="message-header">

                                                <strong>
                                                    <RiRobot2Fill className="message-icon" />
                                                    AI Teacher
                                                </strong>

                                            </div>

                                            <p className="typing">
                                                Typing...
                                            </p>

                                        </div>

                                    )}

                            </div>

                        ))

                    ) : (

                        <p>
                            Upload a PDF and click
                            <strong> TEACH ME </strong>
                            to begin learning.
                        </p>

                    )}

                </div>


                {showActions && (

                    <>

                        <div className="dotted-line"></div>


                        <div className="tools-section">

                            <h3>✨ Continue Learning</h3>

                            <p>
                                Choose how you'd like to study this topic next.
                            </p>


                            <div className="tool-grid">

                                <div
                                    className="tool-card"
                                    onClick={() => openTool("📚 Flashcards")}
                                >

                                    <div className="tool-icon">📚</div>

                                    <h4>FlashCards</h4>

                                    <p>
                                        Quickly revise important concepts.
                                    </p>

                                </div>


                                <div
                                    className="tool-card"
                                    onClick={() => openTool("❓ MCQs")}
                                >

                                    <div className="tool-icon">❓</div>

                                    <h4>MCQs</h4>

                                    <p>
                                        Practice with multiple choice questions.
                                    </p>

                                </div>


                                <div
                                    className="tool-card"
                                    onClick={() => openTool("📝 Quiz")}
                                >

                                    <div className="tool-icon">📝</div>

                                    <h4>Quiz</h4>

                                    <p>
                                        Challenge yourself with a short quiz.
                                    </p>

                                </div>


                                <div
                                    className="tool-card"
                                    onClick={() => openTool("🔑 Key Points")}
                                >

                                    <div className="tool-icon">🔑</div>

                                    <h4>Key Points</h4>

                                    <p>
                                        Review the most important takeaways.
                                    </p>

                                </div>


                                <div
                                    className="tool-card"
                                    onClick={() => openTool("🧠 Mind Map")}
                                >

                                    <div className="tool-icon">🧠</div>

                                    <h4>Mind Map</h4>

                                    <p>
                                        Visualize the topic in a structured way.
                                    </p>

                                </div>

                            </div>

                        </div>


                        <div className="chat-section">

                            <h3>💬 Ask AI Teacher</h3>

                            <div className="chat-input-container">

                                <input
                                    type="text"
                                    placeholder={
                                        isListening
                                            ? "Listening... Speak now 🎙️"
                                            : "Ask anything about this PDF..."
                                    }
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            handleSend();
                                        }
                                    }}
                                />

                                {/* VOICE INPUT BUTTON */}

                                <button
                                    type="button"
                                    onClick={isListening ? stopVoiceInput : startVoiceInput}
                                    title={isListening ? "Stop listening" : "Speak your question"}
                              style={{
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
    marginRight: "8px",
    flexShrink: 0,
    boxShadow: isListening
        ? "0 0 0 5px rgba(229, 57, 53, 0.18)"
        : "0 4px 12px rgba(81, 70, 229, 0.4)",
    transition: "all 0.25s ease"
}}
                                >
                                    {isListening ? <FaStop /> : <FaMicrophone />}
                                </button>

                                {/* EXISTING SEND BUTTON */}

                                <button
                                    className="send-btn"
                                    onClick={handleSend}
                                    disabled={loading}
                                >
                                    <IoSend />
                                </button>

                            </div>

                        </div>

                    </>

                )}

            </div>


            <ToolModal
                isOpen={isModalOpen}
                title={modalTitle}
                onClose={() => setIsModalOpen(false)}
            >

                {modalLoading ? (

                    <div className="tool-loading">

                        <div className="tool-spinner"></div>

                        <h3>
                            {modalTitle === "📚 Flashcards"
                                ? "Generating your flashcards..."
                                : modalTitle === "❓ MCQs"
                                    ? "Preparing your MCQ practice..."
                                    : modalTitle === "📝 Quiz"
                                        ? "Preparing your quiz..."
                                        : `Generating ${modalTitle}...`}
                        </h3>

                        <p>
                            Your AI teacher is preparing your study material.
                        </p>

                    </div>

                ) : (

                    modalTitle === "📚 Flashcards" ? (

                        <Flashcards cards={modalFlashcards} />

                    ) : modalTitle === "❓ MCQs" ? (

                        <MCQ questions={modalMCQs} />

                    ) : modalTitle === "📝 Quiz" ? (

                        modalQuiz.length > 0 ? (

                            <Quiz questions={modalQuiz} />

                        ) : (

                            <div style={{
                                padding: "25px",
                                textAlign: "center",
                                color: "#d9534f"
                            }}>
                                <h3>Unable to generate quiz</h3>
                                <p>
                                    {modalContent || "No questions were returned. Please try again."}
                                </p>
                            </div>

                        )

                    ) : (

                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {toolTypewriter}
                        </ReactMarkdown>

                    )

                )}

            </ToolModal>

        </div>

    );

}

export default ResponseBox;