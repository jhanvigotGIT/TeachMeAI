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

import ToolModal from "./ToolModal";
import Flashcards from "./Flashcards";
import MCQ from "./MCQ";
import Quiz from "./Quiz";
import { FaMicrophone, FaStop } from "react-icons/fa";

import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';


function BookmarkableMarkdown({ content, onBookmark, savedSections }) {
    const lines = content.split('\n');
    const sections = [];
    let currentSection = null;
    let preamble = [];

    lines.forEach((line) => {
        const heading = line.match(/^(#{1,6})\s+(.+)$/);

        if (heading) {
            if (currentSection) sections.push(currentSection);
            else if (preamble.length) {
                sections.push({
                    title: "Introduction",
                    content: preamble.join('\n').trim()
                });
                preamble = [];
            }

            currentSection = {
                title: heading[2].replace(/[*_`]/g, '').trim(),
                content: line
            };
        } else if (currentSection) {
            currentSection.content += '\n' + line;
        } else {
            preamble.push(line);
        }
    });

    if (currentSection) sections.push(currentSection);
    else if (preamble.length) {
        sections.push({
            title: "Study Notes",
            content: preamble.join('\n').trim()
        });
    }

    if (sections.length === 0) {
        return <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>;
    }

    const isIntroSection = (section) => {
        const title = section.title.toLowerCase();
        const text = section.content.toLowerCase().slice(0, 500);
        return /^(introduction|welcome|ai teacher|teacher|hello|overview|about this lesson|learning objectives|how to use|study guide)$/i.test(title)
            || /^(🤖\s*)?ai teacher|^(hello|welcome)|your personal ai teacher/i.test(text);
    };

    return (
        <div className="bookmarkableContent">
            {sections.map((section, index) => {
                const sectionKey = `${section.title}::${section.content}`;
                const canSave = !isIntroSection(section) && section.title !== 'Study Notes';
                const isSaved = savedSections.has(sectionKey);

                return (
                    <div className="bookmarkSection" key={index}>
                        {canSave && (
                            <div className="bookmarkSectionHeader">
                                <button
                                    type="button"
                                    className={`bookmarkButton ${isSaved ? 'bookmarkSaved' : ''}`}
                                    onClick={() => !isSaved && onBookmark(section.title, section.content, sectionKey)}
                                    title={isSaved ? 'Topic saved' : `Save ${section.title}`}
                                    disabled={isSaved}
                                >
                                    {isSaved ? <span className="bookmarkCheck">✓</span> : <span>🔖</span>}
                                    {isSaved ? 'Saved' : 'Save topic'}
                                </button>
                            </div>
                        )}
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {section.content}
                        </ReactMarkdown>
                    </div>
                );
            })}
        </div>
    );
}

function ResponseBox({ aiResponse }) {

    const [displayText, setDisplayText] = useState("");
    const [showActions, setShowActions] = useState(false);
    const [userInput, setUserInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isTyping, setisTyping] = useState(false);

    const speechRunId = useRef(0);
const speechChunksRef = useRef([]);
const speechIndexRef = useRef(0);
const currentUtteranceRef = useRef(null);
const speechTimerRef = useRef(null);

    const [speechStatus, setSpeechStatus] = useState("stopped");
    const [speechSpeed, setSpeechSpeed] = useState(0.9);

    // VOICE INPUT
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef(null);

    const { messages, setMessages, pdfText, setAiResponse, user,
    currentStudyId  } = useContext(AppContext);

    const navigate = useNavigate();
    const [savedSections, setSavedSections] = useState(new Set());
    const [bookmarkNotice, setBookmarkNotice] = useState('');
    const bookmarkNoticeTimer = useRef(null);

    const showBookmarkNotice = (message) => {
        setBookmarkNotice(message);
        if (bookmarkNoticeTimer.current) clearTimeout(bookmarkNoticeTimer.current);
        bookmarkNoticeTimer.current = setTimeout(() => setBookmarkNotice(''), 3200);
    };

    const saveBookmark = async (title, content, sectionKey) => {
        if (!user) {
            showBookmarkNotice('Log in to save topics to your Saved Topics.');
            setTimeout(() => navigate('/login'), 1600);
            return;
        }

        if (!currentStudyId) {
            showBookmarkNotice('Open or generate a study session before saving topics.');
            return;
        }

        const { error } = await supabase
            .from('bookmarks')
            .insert({
                user_id: user.id,
                study_id: currentStudyId,
                topic_title: title,
                topic_content: content
            });

        if (error) {
            console.error("Bookmark error:", error);
            showBookmarkNotice('Could not save this topic. Please try again.');
            return;
        }

        setSavedSections(previous => new Set([...previous, sectionKey]));
        showBookmarkNotice('Topic saved to Saved Topics!');
    };

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


 // VOICE NARRATION — BROWSER SPEECH SYNTHESIS

const splitSpeechIntoChunks = (text, maxLength = 220) => {

    const words = text.split(/\s+/);
    const chunks = [];
    let currentChunk = "";

    words.forEach(word => {

        if (
            currentChunk.length + word.length + 1 > maxLength &&
            currentChunk.length > 0
        ) {
            chunks.push(currentChunk.trim());
            currentChunk = "";
        }

        currentChunk += word + " ";

    });

    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    return chunks;

};


const speakNextChunk = (runId) => {

    if (runId !== speechRunId.current) return;

    if (speechIndexRef.current >= speechChunksRef.current.length) {

        setSpeechStatus("stopped");
        currentUtteranceRef.current = null;

        return;

    }

    const chunk = speechChunksRef.current[speechIndexRef.current];

    const utterance = new SpeechSynthesisUtterance(chunk);

    const voices = window.speechSynthesis.getVoices();

    const selectedVoice =
        voices.find(voice => voice.lang.toLowerCase() === "en-in") ||
        voices.find(voice => voice.lang.toLowerCase().startsWith("en-us")) ||
        voices.find(voice => voice.lang.toLowerCase().startsWith("en"));

    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    utterance.rate = speechSpeed;
    utterance.pitch = 1;
    utterance.volume = 1;

    currentUtteranceRef.current = utterance;

    utterance.onstart = () => {

        if (runId === speechRunId.current) {
            setSpeechStatus("playing");
        }

    };

    utterance.onend = () => {

        if (runId !== speechRunId.current) return;

        speechIndexRef.current++;

        speechTimerRef.current = setTimeout(() => {
            speakNextChunk(runId);
        }, 100);

    };

    utterance.onerror = (event) => {

        if (runId !== speechRunId.current) return;

        console.error("Speech narration error:", event.error);

        setSpeechStatus("stopped");
        currentUtteranceRef.current = null;

    };

    window.speechSynthesis.speak(utterance);

};


const speakText = (text) => {

    // Stop microphone if it is currently listening
    if (recognitionRef.current) {

        try {
            recognitionRef.current.stop();
        } catch (error) {
            console.log(error);
        }

        recognitionRef.current = null;

    }

    setIsListening(false);

    if (
        !("speechSynthesis" in window) ||
        !("SpeechSynthesisUtterance" in window)
    ) {

        alert("Voice narration is not supported in this browser.");

        return;

    }

    // Stop previous narration
    speechRunId.current++;

    const runId = speechRunId.current;

    window.speechSynthesis.cancel();

    clearTimeout(speechTimerRef.current);

    // Clean Markdown formatting
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

    speechChunksRef.current = splitSpeechIntoChunks(cleanText);
    speechIndexRef.current = 0;

    setSpeechStatus("loading");

    // Start narration
    speakNextChunk(runId);

};


// PAUSE NARRATION

const pauseSpeech = () => {

    if (window.speechSynthesis.speaking) {

        window.speechSynthesis.pause();

        setSpeechStatus("paused");

    }

};


// RESUME NARRATION

const resumeSpeech = () => {

    if (window.speechSynthesis.paused) {

        window.speechSynthesis.resume();

        setSpeechStatus("playing");

    }

};


// STOP NARRATION

const stopSpeech = () => {

    speechRunId.current++;

    clearTimeout(speechTimerRef.current);

    window.speechSynthesis.cancel();

    speechChunksRef.current = [];
    speechIndexRef.current = 0;
    currentUtteranceRef.current = null;

    setSpeechStatus("stopped");

};


// CHANGE SPEECH SPEED

const changeSpeechSpeed = (speed) => {

    setSpeechSpeed(speed);

    if (currentUtteranceRef.current) {

        currentUtteranceRef.current.rate = speed;

    }

};


// VOICE INPUT — SPEECH TO TEXT

const startVoiceInput = () => {

    // Stop narration before activating microphone
    stopSpeech();

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

        recognitionRef.current = null;

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

        recognitionRef.current = null;

    }

};


const stopVoiceInput = () => {

    if (recognitionRef.current) {

        recognitionRef.current.stop();

    }

    setIsListening(false);

};


// CLEANUP WHEN COMPONENT UNMOUNTS

useEffect(() => {

    return () => {

        speechRunId.current++;

        clearTimeout(speechTimerRef.current);

        window.speechSynthesis.cancel();

        if (recognitionRef.current) {

            try {
                recognitionRef.current.stop();
            } catch (error) {
                console.log(error);
            }

        }

    };

}, []);



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

Create beautifully structured and comprehensive revision notes
based ONLY on the uploaded PDF.

Follow this exact structure:

## 📌 Topic Overview
Give a short introduction to the subject.

## 🔑 Key Concepts
Organise the important concepts into separate sections.

For every concept:
- Give a clear and meaningful heading.
- Explain it in simple language.
- Highlight important terms using **bold**.
- Include definitions wherever necessary.

## ⭐ Must Remember
List the most important facts, rules, formulas,
dates, names or principles from the PDF.

## 💡 Examples
Include relevant examples wherever they help
explain a difficult concept.

## 🎯 Quick Revision
End with 5-10 short, highly important takeaways.

IMPORTANT:
- Do not miss important information from the PDF.
- Avoid unnecessary repetition.
- Use short paragraphs and well-organised bullet points.
- Make the notes easy to scan and revise.
- Use Markdown headings, bold text and lists.
- Do not use tables unless absolutely necessary.
`;

break;


                case "🧠 Mind Map":

prompt = `
You are an expert visual learning and mind-mapping assistant.

Create a detailed, well-organised hierarchical mind map
based ONLY on the uploaded PDF.

Follow these formatting rules strictly:

# 🧠 CENTRAL TOPIC
Write the main subject or topic of the PDF.

## 🌿 Main Branch 1: [Main Concept]
### Subtopic
- Supporting idea
- Important detail
- Example or explanation

### Subtopic
- Supporting idea
- Important detail

## 🌿 Main Branch 2: [Main Concept]
### Subtopic
- Supporting idea
- Important detail

## 🌿 Main Branch 3: [Main Concept]
### Subtopic
- Supporting idea
- Important detail

Continue creating branches for all important topics.

IMPORTANT RULES:

- The central topic must represent the entire PDF.
- Every main branch must represent a major concept.
- Subtopics must belong to their correct main branches.
- Include important definitions, examples and relationships.
- Use short phrases instead of lengthy paragraphs.
- Cover all important topics without unnecessary repetition.
- Use different relevant emojis for main branches.
- Maintain a clear parent-child hierarchy.
- Do not create a normal essay or a flat bullet-point summary.
- Use Markdown headings and nested bullet points only.
- Do not use code blocks.
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

            {bookmarkNotice && (
                <div className={`bookmarkNotice ${bookmarkNotice.includes('Could not') || bookmarkNotice.includes('Log in') || bookmarkNotice.includes('Open or generate') ? 'bookmarkNoticeError' : ''}`} role='status'>
                    <span className='bookmarkNoticeIcon'>{bookmarkNotice.includes('saved') ? '✓' : 'ℹ'}</span>
                    {bookmarkNotice}
                </div>
            )}

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


                                {msg.role === "assistant" ? (
                                    <BookmarkableMarkdown
                                        content={
                                            index === messages.length - 1 && !isTyping
                                                ? displayText
                                                : msg.text
                                        }
                                        onBookmark={saveBookmark}
                                        savedSections={savedSections}
                                    />
                                ) : (
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {msg.text}
                                    </ReactMarkdown>
                                )}


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
                            : modalTitle === "🔑 Key Points"
                                ? "✨ Organising your Key Points..."
                                : modalTitle === "🧠 Mind Map"
                                    ? "🧠 Building your Mind Map..."
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