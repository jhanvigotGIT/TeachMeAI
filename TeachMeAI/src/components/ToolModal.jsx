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

    return createPortal(

        <div
            className={`modal-overlay ${showModal ? "show" : "hide"}`}
            onClick={handleClose}
        >

            <div
                className={`tool-modal ${title === "📚 Flashcards" ? "flashcard-modal" : ""} ${showModal ? "show" : "hide"}`}
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
                    {children}
                </div>

            </div>

        </div>,

        document.body

    );

}

export default ToolModal;