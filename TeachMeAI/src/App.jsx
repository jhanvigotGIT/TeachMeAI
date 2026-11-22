import React from 'react'
import { Route, Routes } from 'react-router-dom'

import LandingPage from './pages/LandingPage'
import Home from './pages/Home'
import SummaryPage from './pages/SummaryPage'
import PromptPage from './pages/PromptPage'
import Login from './pages/Login'
import Signup from './pages/Signup'
import History from './pages/History'
import SavedTopics from './pages/SavedTopics'

function App() {
    return (
        <div>
            <Routes>
                <Route path="/" element={<LandingPage />} />

                <Route path="/upload" element={<Home />} />

                <Route path="/choose-prompt" element={<PromptPage />} />

                <Route path="/summary" element={<SummaryPage />} />

                <Route path="/login" element={<Login />} />

                <Route path="/signup" element={<Signup />} />

                <Route path="/history" element={<History />} />

                <Route path="/saved-topics" element={<SavedTopics />} />
            </Routes>
        </div>
    )
}

export default App