import React, { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import UploadBox from '../components/UploadBox'
import { AppContext } from '../components/Context/AppContext'
import "../styles/Home.css"

function Home() {
  const { pdfText, setPdfText } = useContext(AppContext)
  const navigate = useNavigate()

  return (
    <div className='homeContainer'>
      <div className='container'>
        <Header />

       <UploadBox
    setPdfText={setPdfText}
    onContinue={() => navigate("/choose-prompt")}
/>

       

      </div>
    </div>
  )
}

export default Home