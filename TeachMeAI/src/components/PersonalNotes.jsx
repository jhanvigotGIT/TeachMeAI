import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from './Context/AppContext';
import { supabase } from '../lib/supabaseClient';
import '../styles/PersonalNotes.css';

function PersonalNotes() {
    console.log("PersonalNotes component is rendering");
    const {
        user,
        currentStudyId,
        pdfFile
    } = useContext(AppContext);

    const [isOpen, setIsOpen] = useState(false);
    const [showTip, setShowTip] = useState(false);
    const [note, setNote] = useState('');
    const [savedNote, setSavedNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [toast, setToast] = useState(null);

useEffect(() => {
    if (toast) {
        const timer = setTimeout(() => {
            setToast(null);
        }, 3000);

        return () => clearTimeout(timer);
    }
}, [toast]);

const showMessage = (message, type = 'success') => {
    setToast({ message, type });
};

    const guestKey = `teachmeai_guest_notes_${pdfFile?.name || 'current-session'}`;

    // SHOW INTRODUCTION ONLY ONCE
    useEffect(() => {

        const tipKey = `teachmeai_notes_tip_${user?.id || 'guest'}`;

        if (!localStorage.getItem(tipKey)) {

            setShowTip(true);

            const timer = setTimeout(() => {
                setShowTip(false);
                localStorage.setItem(tipKey, 'shown');
            }, 4000);

            return () => clearTimeout(timer);
        }

    }, [user]);

    // LOAD EXISTING NOTES
    useEffect(() => {

        const loadNotes = async () => {

            setLoading(true);

            if (user && currentStudyId) {

                const { data, error } = await supabase
                    .from('study_notes')
                    .select('note_content')
                    .eq('user_id', user.id)
                    .eq('study_id', currentStudyId)
                    .maybeSingle();

                if (error) {
                    console.error('Notes loading error:', error);
                }

                const existingNote = data?.note_content || '';

                setNote(existingNote);
                setSavedNote(existingNote);

            } else {

                const existingNote = localStorage.getItem(guestKey) || '';

                setNote(existingNote);
                setSavedNote(existingNote);

            }

            setLoading(false);
        };

        loadNotes();

    }, [user, currentStudyId, pdfFile]);

    // SAVE NOTES
    const saveNotes = async () => {

        if (!note.trim()) {
           	showMessage('Please write something before saving.', 'error');
            return;
        }

        setSaving(true);

        if (user) {

            if (!currentStudyId) {
                showMessage('Please open a study session first.', 'error');
                setSaving(false);
                return;
            }

            const { error } = await supabase
                .from('study_notes')
                .upsert({
                    user_id: user.id,
                    study_id: currentStudyId,
                    note_content: note,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,study_id'
                });

            if (error) {

                console.error('Notes saving error:', error);
                showMessage('Unable to save notes. Please try again.', 'error');
                setSaving(false);
                return;
            }

        } else {

            localStorage.setItem(guestKey, note);

        }

        setSavedNote(note);
        setSaving(false);

        showMessage('Your notes have been saved successfully!');
    };

    // DELETE NOTES
    const deleteNotes = async () => {

    
        

        if (user && currentStudyId) {

            const { error } = await supabase
                .from('study_notes')
                .delete()
                .eq('user_id', user.id)
                .eq('study_id', currentStudyId);

            if (error) {
               showMessage('Unable to delete notes. Please try again.', 'error');
                return;
            }

        } else {

            localStorage.removeItem(guestKey);

        }

        setNote('');
        setSavedNote('');
        showMessage('Your notes have been deleted successfully!');

    };

    return (

        <>
        {toast && (
    <div className={`notesToast ${toast.type}`}>
        <span className="toastIcon">
            {toast.type === 'success' ? '✓' : '⚠'}
        </span>
        <span>{toast.message}</span>
    </div>
)}

            {/* FLOATING NOTES ICON */}

            <div className="personalNotesFloating">

                {showTip && (
                    <div className="notesTooltip">
                        Have your own thoughts? Write your personal notes here! 📝
                    </div>
                )}

                <button
                    className="notesFloatingButton"
                    onClick={() => setIsOpen(true)}
                    title="My Personal Notes"
                >
                    <span>📝</span>
                </button>

            </div>


            {/* NOTES PANEL */}

            {isOpen && (

                <div className="notesOverlay">

                    <div className="notesPanel">

                        <div className="notesPanelHeader">

                            <div>
                                <h2>My Personal Notes 📝</h2>

                                <p>
                                    {pdfFile?.name || 'Your study session'}
                                </p>
                            </div>

                            <button
                                className="closeNotesBtn"
                                onClick={() => setIsOpen(false)}
                            >
                                ✕
                            </button>

                        </div>


                        <div className="notesEditor">

                            {loading ? (

                                <p>Loading your notes...</p>

                            ) : (

                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="Write down your thoughts, important points, questions or anything you want to remember..."
                                />

                            )}

                        </div>


                        <div className="notesPanelFooter">

                            <span className="notesStatus">

                                {note === savedNote
                                    ? 'All changes saved'
                                    : 'Unsaved changes'}

                            </span>

                            <div className="notesActions">

                               <button
    className="deleteNotesBtn"
    onClick={() => setShowDeleteConfirm(true)}
    disabled={!note.trim() && !savedNote.trim()}
>
    Delete
</button>

                                <button
                                    className="saveNotesBtn"
                                    onClick={saveNotes}
                                    disabled={saving || loading}
                                >
                                    {saving ? 'Saving...' : 'Save Notes'}
                                </button>

                            </div>

                        </div>

                    </div>

                </div>
                

            )}
            {showDeleteConfirm && (
    <div className="deleteConfirmOverlay">
        <div className="deleteConfirmBox">
            <div className="deleteConfirmIcon">🗑️</div>

            <h3>Delete your notes?</h3>

            <p>
                Are you sure you want to delete these notes?
                This action cannot be undone.
            </p>

            <div className="deleteConfirmActions">
                <button
                    className="cancelDeleteBtn"
                    onClick={() => setShowDeleteConfirm(false)}
                >
                    Cancel
                </button>

                <button
                    className="confirmDeleteBtn"
                    onClick={() => {
                        setShowDeleteConfirm(false);
                        deleteNotes();
                    }}
                >
                    Yes, Delete
                </button>
            </div>
        </div>
    </div>
)}

        </>

    );

}

export default PersonalNotes;