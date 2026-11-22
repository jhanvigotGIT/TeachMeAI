import React, { useContext, useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from './Context/AppContext'
import { supabase } from '../lib/supabaseClient'
import "../styles/Header.css"

function Header() {

    const navigate = useNavigate()

    const { user, authLoading } = useContext(AppContext)

    const [menuOpen, setMenuOpen] = useState(false)
    const [loggingOut, setLoggingOut] = useState(false)

    const menuRef = useRef(null)

    // CLOSE DROPDOWN WHEN CLICKING OUTSIDE
    useEffect(() => {

        const handleClickOutside = (event) => {

            if (
                menuRef.current &&
                !menuRef.current.contains(event.target)
            ) {
                setMenuOpen(false)
            }

        }

        document.addEventListener('mousedown', handleClickOutside)

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }

    }, [])

    // LOGOUT
    const handleLogout = async () => {

        setLoggingOut(true)

        const { error } = await supabase.auth.signOut()

        if (error) {
            alert(error.message)
        } else {
            navigate('/')
        }

        setLoggingOut(false)
    }

    const userName =
        user?.user_metadata?.full_name ||
        user?.email?.split('@')[0] ||
        'User'

    return (

        <header className="header">

            {/* BRAND */}
            <div
                className="headerBrand"
                onClick={() => navigate('/')}
            >

                <div className="brandIcon">
                    📚
                </div>

                <div className="brandText">
                    <h1>
                        TEACHME<span>AI</span>
                    </h1>

                    <p>Your personal AI teacher</p>
                </div>

            </div>


            {/* PROFILE SECTION */}
            {!authLoading && (

                <div className="profileMenuContainer" ref={menuRef}>

                    {user ? (

                        /* LOGGED-IN USER */
                        <>
                            <button
                                className={`profileButton ${menuOpen ? 'active' : ''}`}
                                onClick={() => setMenuOpen(!menuOpen)}
                            >

                                <div className="profileIcon">
                                    👤
                                </div>

                                <span className="profileName">
                                    {userName}
                                </span>

                                <span className={`profileArrow ${menuOpen ? 'rotated' : ''}`}>
                                    ▼
                                </span>

                            </button>


                            {menuOpen && (

                                <div className="profileDropdown">

                                    <div className="dropdownUserInfo">

                                        <div className="dropdownAvatar">
                                            👤
                                        </div>

                                        <div>
                                            <h3>{userName}</h3>
                                            <p>{user.email}</p>
                                        </div>

                                    </div>


                                    <div className="dropdownDivider"></div>


                                    <button
                                        className="dropdownItem"
                                        onClick={() => {
                                            setMenuOpen(false)
                                            navigate('/history')
                                        }}
                                    >
                                        <span>📚</span>
                                        <span>My History</span>
                                    </button>


                                    <button
                                        className="dropdownItem"
                                        onClick={() => {
                                            setMenuOpen(false)
                                            navigate('/saved-topics')
                                        }}
                                    >
                                        <span>🔖</span>
                                        <span>Saved Topics</span>
                                    </button>


                                    <button
                                        className="dropdownItem"
                                        onClick={() => {
                                            setMenuOpen(false)
                                            navigate('/history')
                                        }}
                                    >
                                        <span>📝</span>
                                        <span>My Notes</span>
                                    </button>


                                    <div className="dropdownDivider"></div>


                                    <button
                                        className="dropdownItem logoutItem"
                                        onClick={handleLogout}
                                        disabled={loggingOut}
                                    >
                                        <span>🚪</span>

                                        <span>
                                            {loggingOut ? 'Logging out...' : 'Logout'}
                                        </span>
                                    </button>

                                </div>

                            )}

                        </>

                    ) : (

                        /* GUEST USER */
                        <div className="guestProfile">

                            <div className="profileIcon">
                                👤
                            </div>

                            <span className="profileName">
                                User
                            </span>

                        </div>

                    )}

                </div>

            )}

        </header>

    )
}

export default Header