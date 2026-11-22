import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppContext } from '../components/Context/AppContext';
import { supabase } from '../lib/supabaseClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import '../styles/SavedTopics.css';

function SavedTopics() {

    const navigate = useNavigate();

    const {
        user,
        authLoading,
        setAiResponse,
        setPdfText,
        setMessages,
        setCurrentStudyId
    } = useContext(AppContext);

    const [bookmarks, setBookmarks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {

        if (authLoading) return;

        if (!user) {
            navigate('/login');
            return;
        }

        const fetchBookmarks = async () => {

            setLoading(true);
            setError('');

            const { data, error } = await supabase
                .from('bookmarks')
                .select(`
                    id,
                    study_id,
                    topic_title,
                    topic_content,
                    created_at,
                    study_history (
                        pdf_name,
                        explanation,
                        extracted_text
                    )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Bookmark fetching error:', error);
                setError('Unable to load your saved topics.');
            } else {
                setBookmarks(data || []);
            }

            setLoading(false);
        };

        fetchBookmarks();

    }, [user, authLoading]);

    // DELETE BOOKMARK
    const deleteBookmark = async (id) => {

        const confirmDelete = window.confirm(
            'Are you sure you want to remove this saved topic?'
        );

        if (!confirmDelete) return;

        const { error } = await supabase
            .from('bookmarks')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Bookmark deletion error:', error);
            alert('Unable to remove bookmark.');
            return;
        }

        setBookmarks(previous =>
            previous.filter(bookmark => bookmark.id !== id)
        );
    };

    // REOPEN ORIGINAL STUDY SESSION
    const openStudySession = (bookmark) => {

        const study = bookmark.study_history;

        if (!study) {
            alert('The original study session could not be found.');
            return;
        }

        setAiResponse(study.explanation);
        setPdfText(study.extracted_text || '');
        setCurrentStudyId(bookmark.study_id);

        setMessages([{
            role: 'assistant',
            text: study.explanation
        }]);

        navigate('/summary');
    };

    if (authLoading || loading) {
        return (
            <div className="savedLoading">
                Loading your saved topics...
            </div>
        );
    }

    return (

        <div className="savedTopicsPage">

            <div className="savedTopicsHeader">

                <button onClick={() => navigate('/')}>
                    ← Back to Home
                </button>

                <h1>My Saved Topics 🔖</h1>

                <p>
                    All your bookmarked topics in one place.
                </p>

            </div>

            <div className="savedTopicsContainer">

                {error && (
                    <p className="savedError">{error}</p>
                )}

                {!error && bookmarks.length === 0 && (

                    <div className="emptySavedTopics">

                        <span>🔖</span>

                        <h2>No Saved Topics Yet</h2>

                        <p>
                            Bookmark important topics while studying
                            and they will appear here.
                        </p>

                        <button onClick={() => navigate('/')}>
                            Start Learning
                        </button>

                    </div>

                )}

                {bookmarks.map((bookmark) => (

                    <div className="savedTopicCard" key={bookmark.id}>

                        <div className="savedTopicTop">

                            <div>
                                <span className="savedLabel">
                                    BOOKMARKED TOPIC
                                </span>

                                <h2>{bookmark.topic_title}</h2>

                                <p className="savedPdfName">
                                    📄 {bookmark.study_history?.pdf_name || 'Study PDF'}
                                </p>
                            </div>

                            <button
                                className="removeBookmarkBtn"
                                onClick={() => deleteBookmark(bookmark.id)}
                                title="Remove bookmark"
                            >
                                ✕
                            </button>

                        </div>

                        <div className="savedTopicContent">

                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {bookmark.topic_content}
                            </ReactMarkdown>

                        </div>

                        <div className="savedTopicFooter">

                            <span>
                                Saved on {new Date(
                                    bookmark.created_at
                                ).toLocaleDateString()}
                            </span>

                            <button
                                className="openOriginalBtn"
                                onClick={() => openStudySession(bookmark)}
                            >
                                Open Original Study →
                            </button>

                        </div>

                    </div>

                ))}

            </div>

        </div>

    );
}

export default SavedTopics;