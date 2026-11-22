import React, { useContext, useEffect } from 'react'
import { AppContext } from '../components/Context/AppContext'
import ResponseBox from '../components/ResponseBox'
import PersonalNotes from '../components/PersonalNotes'
import '../styles/Summarypage.css'
import { useNavigate } from 'react-router-dom'
function SummaryPage() {
  const navigate = useNavigate()

    const {
        aiResponse,
        messages,
        setMessages
    } = useContext(AppContext)

    useEffect(() => {

        if (aiResponse && messages.length === 0) {

            setMessages([
                {
                    role: "assistant",
                    text: aiResponse
                }
            ])

        }

    }, [aiResponse])

    return (

        <div className='summary-page'>
          <button
    className="summaryBackHomeBtn"
    onClick={() => navigate('/')}
>
    <span className="backArrow">←</span>
    <span>Back to Home</span>
</button>

            <div className='summary-container'>

                <ResponseBox
                    aiResponse={aiResponse}
                />

            </div>
        

            <PersonalNotes />

        </div>

    )
}

export default SummaryPage