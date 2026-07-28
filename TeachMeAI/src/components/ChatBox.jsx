import React, { useContext, useState } from 'react'
import "../styles/Chatbox.css";
import {askGemini} from '../services/geminiService'
import { AppContext } from './Context/AppContext';

function ChatBox({pdfText,setAiResponse,loading,setLoading}) {
    const [question,setQuestion]=useState("");
    const {messages,setMessages}=useContext(AppContext);
    const handleSend=async()=>{
      alert("ChatBox handleSend")
      if (!question.trim()) return;
      
      setShowAction(false);
      const updatedMessages=[
          ...messages,
          {
            role:"user",
            text:question,
          },
      ];
    
    setMessages(updatedMessages);
  alert("user message saved")
    const currentQuestion=question;
    setquestion("");
    try{
      alert("caalling gemini")
      const reply=await askGemini(pdfText,currentQuestion);
      alert("gemeini replired")
      setAiResponse(reply);
      setMessages([
        ...updatedMessages,
        {
          role:"assistant",
          text:reply,
        },
      ]);
    }catch (error){
      console.log(error);
      setMessages([
        ...updatedMessages,
        {
          role:"assistant",
          text:"Something went wrong.Please try again"
        }
      ])
    }
  }
  return (
    <div className='chat-box'>
      
            <h3>💬 Ask More Questions</h3>
            <textarea
                value={question}
                onChange={(e)=>setQuestion(e.target.value)}
                placeholder="Ask anything about the uploaded PDF..."
            />
            <button onClick={handleSend}
            >
                Send
            </button>
    </div>
  )
}

export default ChatBox
