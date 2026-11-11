import React from 'react'
import Home from './pages/Home'
import { Route, Routes } from 'react-router-dom'
import SummaryPage from './pages/SummaryPage'
import PromptPage from './pages/PromptPage'

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/choose-prompt" element={<PromptPage/>}/>
        <Route path="/summary" element={<SummaryPage/>} />
      </Routes>
    </div>
  )
}

export default App