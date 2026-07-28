import React, { useEffect, useState } from 'react'
import "../styles/loading.css"

function LoadingIndicator({loadinstage}) {
    const steps=[
      {
        key:"pdf",
        text:"PDF processed"
      },
      {
        key:"prompt",
        text:"Learning style prepared"
      },
      {
        key:"generating",
        text:"Generating your lesson"
      }
    ];
   
  const [dots,setDots]=useState("");
  useEffect(()=>{
    const interval=setInterval(()=>{
        setDots(prev=>(prev.length>=3?"":prev+"."));
    },500);
    return ()=>clearInterval(interval);
  },[])
  return (
    <div className='loading-container'>
        <div className='loading-card'>
            <h3>🤖AI Teacher is working</h3>
         {steps.map((step) => {

    let icon = "⌛";
    // PDF step
    if (step.key === "pdf") {
        if (
            loadinstage === "prompt" ||
            loadinstage === "generating" ||
            loadinstage === "done"
        ) {
            icon = "✅";
        }
    }
    // Prompt step
    if (step.key === "prompt") {
        if (
            loadinstage === "generating" ||
            loadinstage === "done"
        ) {
            icon = "✅";
        }
    }
    // Generating step
    if (step.key === "generating") {
        if (loadinstage === "generating") {
            icon = "🔄";
        }
        if (loadinstage === "done") {
            icon = "✅";
        }
    }
    return (
        <p
            key={step.key}
            className={
                step.key === "generating" &&
                loadinstage === "generating"
                    ? "active-step"
                    : ""
            }
        >            {icon} {step.text}
            {step.key === "generating" &&
                loadinstage === "generating" &&
                dots}
        </p>
    );

})}
        </div>
      
    </div>
  )
}

export default LoadingIndicator
