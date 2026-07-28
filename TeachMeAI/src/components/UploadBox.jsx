import React, { useRef, useState } from 'react'
import "../styles/UploaBox.css"
import { extractTextFromPDF } from '../services/pdfService';
function UploadBox({ setPdfText }) {
    const [pdf, setpdf] = useState(null);
    const fileInputRef = useRef(null);
    const [pdfText, setpdfText] = useState("");
    const handleFile = async (file) => {
        setpdf(file);
        const text = await extractTextFromPDF(file);
        setPdfText(text);
    }
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

        </div>

    )
}

export default UploadBox
