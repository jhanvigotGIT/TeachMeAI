import React, { useContext, useEffect } from 'react'
import { AppContext } from '../components/Context/AppContext'
import ResponseBox from '../components/ResponseBox'
import ChatBox from '../components/ChatBox'
import '../styles/Summarypage.css'

function SummaryPage() {
    const {aiResponse,pdfText,setAiResponse,messages,setMessages}=useContext(AppContext)
    useEffect(()=>{
      if (aiResponse && messages.length === 0){
        setMessages([
          {
            role:"assistant",
            text: aiResponse
          }
        ])
      }
    },[aiResponse])
  return (
    <div className='summary-page'>
     <div className='summary-container'>
           <ResponseBox
      aiResponse={aiResponse}
      
    />

   
     </div>
        
    </div>
  )
}

export default SummaryPage
