import React from 'react'
import Home from './pages/Home'
import { Route, Routes } from 'react-router-dom'
import SummaryPage from './pages/SummaryPage'



function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path='/summary' element={<SummaryPage/>} />
      </Routes>
    </div>
  )
}

export default App
