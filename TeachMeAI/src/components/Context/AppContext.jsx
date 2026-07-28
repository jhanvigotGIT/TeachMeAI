import React, { createContext, useState } from 'react'
export const AppContext = createContext();

function AppProvider({children}) {
  const [pdfText,setPdfText]=useState("");
  const [aiResponse,setAiResponse]=useState("");
  const [messages,setMessages]=useState([]);

  return (
    <div>
      <AppContext.Provider
      value={{
        pdfText,
        setPdfText,
        aiResponse,
        setAiResponse,
        messages,
        setMessages
      }}
      >
        {children}
      </AppContext.Provider>
      

    </div>
  )
}

export default AppProvider
