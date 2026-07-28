import React, { useContext, useState } from 'react'
import Header from '../components/Header'
import UploadBox from '../components/UploadBox'
import PromptSection from '../components/PromptSection'

import "../styles/Home.css"
import { AppContext } from '../components/Context/AppContext'
function Home() {
  const {pdfText,setPdfText,aiResponse,setAiResponse}=useContext(AppContext)

  const[loading,setLoading]=useState(false);
  const [loadinstage,setLoadingstage]=useState("idle");
  return (
    <div className='homeContainer'>
    <div className='container'>
       <Header/>
     <UploadBox setPdfText={setPdfText}/>
     <PromptSection pdfText={pdfText}
     setAiResponse={setAiResponse}
     loading={loading}
     setLoading={setLoading}
     loadinstage={loadinstage}
     setLoadingstage={setLoadingstage}/>
    </div>
    </div>
  )
}

export default Home
