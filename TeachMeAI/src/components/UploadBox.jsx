import React, { useRef, useState, useEffect,useContext } from 'react'
import "../styles/UploaBox.css"
import { extractTextFromPDF } from "../services/pdfService";

import { AppContext } from './Context/AppContext';

function UploadBox({ setPdfText,onContinue  }) {
    const { setPdfFile } = useContext(AppContext);
    const [pdf, setpdf] = useState(null);
    const fileInputRef = useRef(null);
    const [isExtracted, setIsExtracted] = useState(false);
    const [pdfText, setpdfText] = useState("");
    const continueBtnRef = useRef(null);
    const handleFile = async (file) => {
    setpdf(file);
    setPdfFile(file);
    setIsExtracted(false);

    const text = await extractTextFromPDF(file);

    console.log("Extracted PDF text length:", text.length);
    console.log("Extracted PDF text:", text.substring(0, 300));

    setPdfText(text);
    setIsExtracted(true);
}
useEffect(() => {
    if (isExtracted && continueBtnRef.current) {
        setTimeout(() => {
            const buttonPosition = continueBtnRef.current.getBoundingClientRect().top;

            window.scrollBy({
                top: buttonPosition - 120,
                behavior: "smooth"
            });
        }, 200);
    }
}, [isExtracted]);

    return (
        <div className='uploadBox'
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file && file.type === "application/pdf") {
                    handleFile(file);
                }
            }}>
            <div className='uploadIcon'>{pdf ? "✅" : "📄"}</div>
            <h2>UPLOAD YOUR PDF HERE !</h2>
            <p>Drag & Drop your PDF here</p>
            <span>or</span>
            <input
                ref={fileInputRef}
                type="file"
                id='pdfUpload'
                accept='.pdf'
                hidden
                onChange={(e) => handleFile(e.target.files[0])} />
            {pdf && (
                <div className='fileinfo'>
                    <div className="file-top">
                        <div className="file-icon">
                            📄
                        </div>
                        <div className="file-details">
                            <h3>{pdf.name}</h3>
                            <p>
                                {(pdf.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            <span className="success-tag">
                                ✓ Ready to Learn
                            </span>
                        </div>
                    </div>

                </div>
            )}
            <label htmlFor='pdfUpload' className='uploadbtn'>{pdf ? "🔁 Replace PDF" : "Browse PDF"}</label>
            {isExtracted && (
    <button
         ref={continueBtnRef}
        className="startLearningBtn"
        onClick={onContinue}
    >
        ✨ Choose How to Learn →
    </button>
)}

        </div>

    )
}

export default UploadBox
