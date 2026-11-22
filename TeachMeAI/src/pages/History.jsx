import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../components/Context/AppContext'
import { supabase } from '../lib/supabaseClient'
import '../styles/History.css'

function History() {

    const navigate = useNavigate();

    const {
        user,
        authLoading,
        setAiResponse,
        setPdfText,
        setMessages,setCurrentStudyId
    } = useContext(AppContext);

    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {

        if (authLoading) return;

        if (!user) {
            navigate('/login');
            return;
        }

        const fetchHistory = async () => {

            setLoading(true);
            setError('');

            const { data, error } = await supabase
                .from('study_history')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("History fetching error:", error);
                setError("Unable to load your study history.");
            } else {
                setHistory(data || []);
            }

            setLoading(false);
        };

        fetchHistory();

    }, [user, authLoading]);

    const openStudySession = (study) => {

        setAiResponse(study.explanation);
        setPdfText(study.extracted_text || '');
         setCurrentStudyId(study.id);

        setMessages([{
            role: 'assistant',
            text: study.explanation
        }]);

        navigate('/summary');
    };

    if (authLoading || loading) {
        return <div className="historyLoading">Loading your study history...</div>;
    }

    return (

        <div className="historyPage">

            <div className="historyHeader">

                <button onClick={() => navigate('/')}>
                    ← Back to Home
                </button>

                <h1>My Study History</h1>

                <p>Revisit your previous learning sessions.</p>

            </div>

            <div className="historyContainer">

                {error && (
                    <p className="historyError">{error}</p>
                )}

                {!error && history.length === 0 && (

                    <div className="emptyHistory">
                        <span>📚</span>
                        <h2>No Study History Yet</h2>
                        <p>Your completed study sessions will appear here.</p>

                        <button onClick={() => navigate('/')}>
                            Start Learning
                        </button>
                    </div>

                )}

                {history.map((study) => (

                    <div className="historyCard" key={study.id}>

                        <div className="historyFileIcon">
                            📄
                        </div>

                        <div className="historyDetails">

                            <h3>{study.pdf_name}</h3>

                            <p>
                                {new Date(study.created_at).toLocaleString()}
                            </p>

                            <span>
                                {study.learning_prompt || 'Custom Learning'}
                            </span>

                        </div>

                        <button
                            className="openStudyBtn"
                            onClick={() => openStudySession(study)}
                        >
                            View Explanation →
                        </button>

                    </div>

                ))}

            </div>

        </div>

    );

}

export default History;