import React from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/LandingPage.css'

function LandingPage() {

    const navigate = useNavigate()

    return (

        <div className="landingPage">

            <div className="landingBackgroundGlow glowOne"></div>

            <div className="landingBackgroundGlow glowTwo"></div>


            {/* NAVBAR */}

            <nav className="landingNavbar">

                <div
                    className="landingLogo"
                    onClick={() => navigate('/')}
                >

                    <span className="landingLogoIcon">
                        📚
                    </span>

                    <span>
                        TeachMe<span className="logoAI">AI</span>
                    </span>

                </div>

              <div className="landingNavButtons">

    <button
        className="landingLoginBtn"
        onClick={() => navigate('/login')}
    >
        Login
    </button>

</div>

            </nav>


            {/* MAIN CONTENT */}

            <main className="landingMain">


                {/* BLACKBOARD */}

                <div className="blackboardContainer">

                    <div className="blackboard">

                        <div className="blackboardFrame">

                            <div className="blackboardSurface">

                                <div className="chalkContent">

                                    <div className="chalkIcon">
                                        ✦
                                    </div>

                                    <div className="chalkTitle">

                                        <span className="chalkTeachMe">
                                            TEACHME
                                        </span>

                                        <span className="chalkAI">
                                            AI
                                        </span>

                                    </div>

                                    <div className="chalkLine"></div>

                                    <p className="chalkTagline">
                                        Your personal AI teacher
                                    </p>

                                </div>

                                {/* CHALK */}

                                <div className="animatedChalk">

                                    <div className="chalkStick"></div>

                                    <div className="chalkDust"></div>

                                </div>

                            </div>

                        </div>


                        {/* BLACKBOARD TRAY */}

                        <div className="blackboardTray">

                            <div className="chalkPiece"></div>

                            <div className="eraser"></div>

                        </div>

                    </div>

                </div>


                {/* TITLE */}

                <div className="landingText">

                    <h1>
                        Learn smarter.
                        <br />

                        <span>Understand better.</span>
                    </h1>

                    <p>
                        Turn complicated PDFs into clear explanations,
                        <br className="desktopBreak" />

                        interactive learning and knowledge you remember.
                    </p>

                </div>


                {/* ACTION BUTTONS */}

                <div className="landingActions">

                    <button
                        className="mainSignupButton"
                        onClick={() => navigate('/signup')}
                    >

                        <span>Create Your Account</span>

                        <span>→</span>

                    </button>


                    <button
                        className="guestButton"
                        onClick={() => navigate('/upload')}
                    >

                        Continue as Guest

                        <span>→</span>

                    </button>

                </div>


                {/* FOOTER */}

                <div className="landingFooter">

                    <span>📄 Upload your PDF</span>

                    <span className="footerDot">•</span>

                    <span>🧠 Learn your way</span>

                    <span className="footerDot">•</span>

                    <span>✨ Understand everything</span>

                </div>

            </main>

        </div>

    )
}

export default LandingPage