import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import '../styles/Auth.css'

function Login() {

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const navigate = useNavigate()


    const handleLogin = async (e) => {

        e.preventDefault()

        setLoading(true)

        setError('')

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (error) {

            setError(error.message)

        } else {

            navigate('/upload')

        }

        setLoading(false)

    }


    return (

        <div className="authPage">

            <div className="authCard">

                <h1>Welcome Back!</h1>

                <p>Login to continue your learning journey.</p>


                <form onSubmit={handleLogin}>

                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />


                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />


                    {error && (
                        <div className="authError">
                            {error}
                        </div>
                    )}


                    <button type="submit" disabled={loading}>

                        {loading ? 'Logging in...' : 'Login'}

                    </button>

                </form>


                <p className="authSwitch">

                    Don't have an account?

                    <Link to="/signup"> Sign Up</Link>

                </p>


                <Link to="/" className="backHome">
                    Back to Home
                </Link>

            </div>

        </div>

    )

}

export default Login