import React, { useContext, useState } from 'react'
import "../styles/Promptsec.css"
import {askGemini} from "../services/geminiService"
import LoadingIndicator from './LoadingIndicator';
import { useNavigate } from 'react-router-dom';
import { AppContext } from './Context/AppContext';

function PromptSection({pdfText,setAiResponse,loading,setLoading,loadinstage,setLoadingstage}) {
    const navigate = useNavigate();
    const {messages, setMessages}=useContext(AppContext);
  const [usePrompt,setuserPrompt]=useState("");
  const handleTeachMe = async () => {
    if (!usePrompt.trim()) {
        alert("Please tell me how you want to learn.");
        return;
    }
    try {
        setLoading(true);
        setLoadingstage("pdf");
        await new Promise(resolve=>setTimeout(resolve,800));
        setLoadingstage("prompt");
        await new Promise(resolve=>setTimeout(resolve,800));
        setLoadingstage("generating");
        const response = await askGemini(
            pdfText,
            usePrompt
        );
        setAiResponse(response);
        setMessages([{
            role: "assistant",
            text: response,
        },
    ]);
        setLoadingstage("done");
        await new Promise(resolve=>setTimeout(resolve,800));
        setLoading(false);
        navigate("/summary");
    } catch (error) {
      setLoading(false);
        alert(error.message);
        console.error(error);
    }
};

  return (
    <div className='promptSection'>
      <h2>How should I teach this PDF ?</h2>             
    <p className='promptSubtitle'>
      Click a suggestion below or write your own.
    </p>
    <div className="prompt-chips">
    <button
        type="button"
        onClick={() => setuserPrompt("Explain this PDF like I'm 5 years old.")}
    >
        🧒 Explain Like I'm 5
    </button>
    <button
        type="button"
        onClick={() => setuserPrompt("Prepare me for tomorrow's exam. Focus only on important topics.")}
    >
        🎓 Exam Tomorrow
    </button>
    <button
        type="button"
        onClick={() => setuserPrompt("Explain every topic in detail with examples.")}
    >
        📚 Detailed Notes
    </button>
    <button
        type="button"
        onClick={() => setuserPrompt("Give me a quick summary of the entire PDF.")}
    >
        ⚡ Quick Summary
    </button>
    <button
        type="button"
        onClick={() => setuserPrompt("Teach me deeply and make sure I understand every concept.")}
    >
        🧠 Deep Understanding
    </button>
    <button
        type="button"
        onClick={() => setuserPrompt("Prepare me for interviews based on this PDF.")}
    >
        💼 Interview Prep
    </button>
</div>
      <textarea value={usePrompt} onChange={(e)=>setuserPrompt(e.target.value)} placeholder="Or describe exactly how you want to learn..."rows="5">
      </textarea>
      <button onClick={handleTeachMe}
      disabled={loading}>{loading ? (<LoadingIndicator loadinstage={loadinstage}/>):("TEACH ME")} </button>
    </div>
  )
}

export default PromptSection
