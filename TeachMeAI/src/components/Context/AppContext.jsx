import React, { createContext, useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

export const AppContext = createContext();

function AppProvider({ children }) {

  // EXISTING APPLICATION STATES
  const [pdfText, setPdfText] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [messages, setMessages] = useState([]);
  const [pdfFile, setPdfFile] = useState(null);

  // AUTHENTICATION STATES
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentStudyId, setCurrentStudyId] = useState(null);

  // CHECK USER LOGIN SESSION
  useEffect(() => {

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("Session error:", error.message);
      }

      setSession(data?.session ?? null);
      setUser(data?.session?.user ?? null);
      setAuthLoading(false);
    });

    // LISTEN FOR LOGIN AND LOGOUT CHANGES
    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };

  }, []);

  return (
    <AppContext.Provider
      value={{
        // EXISTING STATES
        pdfText,
        setPdfText,
        aiResponse,
        setAiResponse,
        messages,
        setMessages,
          pdfFile, setPdfFile,
          currentStudyId, setCurrentStudyId,

        // AUTHENTICATION STATES
        user,
        session,
        authLoading
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export default AppProvider