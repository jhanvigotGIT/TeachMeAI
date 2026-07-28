import React, { useContext, useEffect, useState } from 'react'
import "../styles/ResponseBox.css"
import ReactMarkdown from "react-markdown";
import { jsPDF } from "jspdf";
import { AppContext } from './Context/AppContext';
import { IoSend } from "react-icons/io5";
import { IoMdPerson } from "react-icons/io";
import { RiRobot2Fill } from "react-icons/ri";
import { askGemini } from '../services/geminiService';
import ToolModal from "./ToolModal";

function ResponseBox({ aiResponse }) {
  const [displayText, setDisplayText] = useState("");
  const [showActions, setShowActions] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setisTyping] = useState(false);
  const { messages, setMessages, pdfText, setAiResponse } = useContext(AppContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
const [modalTitle, setModalTitle] = useState("");
const [modalContent, setModalContent] = useState("");
const [modalLoading, setModalLoading] = useState(false);
const [toolTypewriter, setToolTypewriter] = useState("");

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
      index += 4;
      if (index >= aiResponse.length) {
        clearInterval(interval);
        setShowActions(true);
      }
    }, 8);
    return () => clearInterval(interval);
  }, [aiResponse]);
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
  const copyResponse = async () => {
    if (!aiResponse) return;
    await navigator.clipboard.writeText(aiResponse);
    alert("Copied to clipboard!")
  }
  const downloadPDf = () => {
    if (!aiResponse) {
      alert("No AI response available");
      return;
    }
    const doc = new jsPDF();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    const lines = doc.splitTextToSize(aiResponse, 180);
    doc.text(lines, 15, 20);
    doc.save("TeachMeAI-Notes.pdf")
  }
const openTool = async (title) => {

  setModalTitle(title);

  setIsModalOpen(true);

  setModalLoading(true);

  setModalContent("");

  setToolTypewriter("");

  try {

let prompt = "";

switch(title){

case "📚 Flashcards":

prompt=`
You are an expert AI teacher.

Based ONLY on the uploaded PDF, create revision flashcards.

Rules:

- Question → Answer format
- Cover important concepts
- Keep answers short
- Use Markdown
- Generate at least 15 flashcards.
`;

break;

case "❓ MCQs":

prompt=`
Create 20 multiple choice questions.

Each question should contain:

Question

A)

B)

C)

D)

Correct Answer

Short Explanation
`;

break;

case "📝 Quiz":

prompt=`
Create a quiz from this PDF.

Include:

- MCQs
- True/False
- Fill in the blanks
- Short Answer Questions

At the end provide the answer key.
`;

break;

case "🔑 Key Points":

prompt=`
Summarize this PDF into important key points.

Use headings and bullet points.

Keep it concise and easy to revise.
`;

break;

case "🧠 Mind Map":

prompt=`
Create a text based hierarchical mind map.

Use indentation and arrows.

Cover every important topic from the PDF.
`;

break;

default:

prompt="Explain this PDF.";

}
    console.log(title);
    console.log(prompt);
    const reply = await askGemini(pdfText, prompt);

    setModalContent(reply);

    setModalLoading(false);

  }

  catch(error){

    console.log(error);

    setModalLoading(false);

    setModalContent(error.message);

  }

};
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
        text: currentQuestion,
      },
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
          text: reply,
        },
      ]);
    } catch (error) {
      setisTyping(false);
      console.log(error);
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          text: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className='responseBox'>
      <div className='response-header'>
        <h2>🤖AI TEACHER</h2>
        <div className='response-actions'>
          <button className='copy-btn'
            onClick={copyResponse}>
            📋Copy
          </button>
          <button className='download-btn'
            onClick={downloadPDf}>
            📄Download
          </button>
        </div>
      </div>
      <div className='responseCon'>
        {aiResponse && (
          <div className="message-header">
            🤖 <span>AI Teacher</span>
          </div>
        )}

        {messages.length > 0 ? (messages.map((msg, index) => (
          <div key={index}
            className={
              msg.role === "user"
                ? "user-message"
                : "ai-message"}
          >
            <div className="message-header">
              {msg.role === "user" ?
                (<strong>  <IoMdPerson className='message-icon' />You </strong>)
                : (<strong> <RiRobot2Fill className='message-icon' />AI Teacher 
                </strong>)}
            </div>
            <ReactMarkdown>
              {msg.role === "assistant" &&
                index === messages.length - 1 &&
                !isTyping
                ? displayText
                : msg.text}
            </ReactMarkdown>
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

                  <p className="typing">Typing...</p>
                </div>
              )}
          </div>
        ))
        ) : (<p>Upload a PDF and click <strong>TEACH ME</strong> to begin learning.</p>)}
        {showActions && (
          <>
            <div className="dotted-line"></div>
            <div className="tools-section">
              <h3>✨ Continue Learning</h3>
              <p>Choose how you'd like to study this topic next.</p>
              <div className="tool-grid">
                <div className="tool-card"
                 onClick={() => openTool("📚 Flashcards")}>
                  <div className="tool-icon">📚</div>
                  <h4>FlashCards</h4>
                  <p>Quickly revise important concepts.</p>
                </div>
                <div className="tool-card"
                onClick={()=>openTool("❓ MCQs")}>
                  <div className="toolicon">❓</div>
                  <h4>MCQs</h4>
                  <p>PRactice with multiple choice questions.</p>
                </div>
                <div className="tool-card"
                onClick={()=>openTool("📝 Quiz")}>
                  <div className="tool-icon">📝</div>
                  <h4>Quiz</h4>
                  <p>Challenge yourself with a short quiz.</p>
                </div>
                <div className="tool-card"
                onClick={()=>openTool("🔑 Key Points")}>
                  <div className="tool-icon">🔑</div>
                  <h4>Key Points</h4>
                  <p>Review th emost important takeaways.</p>
                </div>
                <div className="tool-card"
                onClick={()=>openTool("🧠 Mind Map")}>
                  <div className="tool-icon">🧠</div>
                  <h4>Mind Map</h4>
                  <p>Visulaize the topic in a structured way.</p>
                </div>
              </div>
            </div>
            <div className="chat-section">
              <h3>💬 Ask AI Teacher</h3>
              <div className="chat-input-container">
                <input
                  type="text"
                  placeholder="Ask anything about this PDF..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSend();
                    }
                  }}
                />
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
    <h3>✨ Generating Flashcards...</h3>
  ) : (
    <ReactMarkdown>{toolTypewriter}</ReactMarkdown>
  )}
</ToolModal>
    </div>

  )
}
export default ResponseBox
