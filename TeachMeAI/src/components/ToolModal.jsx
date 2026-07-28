import React, { useEffect, useState } from "react";
import "../styles/ToolModal.css";

function ToolModal({ isOpen, title, onClose, children }) {

  const [showModal, setShowModal] = useState(isOpen);

  useEffect(() => {

    if (isOpen) {
      setShowModal(true);
    }

  }, [isOpen]);

  const handleClose = () => {

    setShowModal(false);

    setTimeout(() => {
      onClose();
    }, 300);

  };

  if (!isOpen && !showModal) return null;

  return (

    <div
      className={`modal-overlay ${showModal ? "show" : "hide"}`}
      onClick={handleClose}
    >

      <div
        className={`tool-modal ${showModal ? "show" : "hide"}`}
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

    </div>

  );
}

export default ToolModal;