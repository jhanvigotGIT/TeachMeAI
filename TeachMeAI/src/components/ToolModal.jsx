import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "../styles/ToolModal.css";

function ToolModal({ isOpen, title, onClose, children }) {

    const [showModal, setShowModal] = useState(isOpen);

    useEffect(() => {
        if (isOpen) {
            setShowModal(true);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }

        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    const handleClose = () => {
        setShowModal(false);

        setTimeout(() => {
            onClose();
        }, 300);
    };

    if (!isOpen && !showModal) return null;

    const modalClass =
        title === "📚 Flashcards" ? "flashcard-modal" :
        title === "🔑 Key Points" ? "keypoints-modal" :
        title === "🧠 Mind Map" ? "mindmap-modal" : "";

    return createPortal(

        <div
            className={`modal-overlay ${showModal ? "show" : "hide"}`}
            onClick={handleClose}
        >

            <div
                className={`tool-modal ${modalClass} ${showModal ? "show" : "hide"}`}
                onClick={(e) => e.stopPropagation()}
            >

                <div className="tool-modal-header">

                    <h2>{title}</h2>

                    <button
                        className="close-btn"
                        onClick={handleClose}
                    >
                        ✖
                    </button>

                </div>

                <div className="tool-modal-body">
                    <div className="tool-modal-content">
                        {children}
                    </div>
                </div>

            </div>

        </div>,

        document.body

    );
}

export default ToolModal;