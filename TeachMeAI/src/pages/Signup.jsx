import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import '../styles/Auth.css'

function Signup() {

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const [loading, setLoading] = useState(false)

    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const navigate = useNavigate()


    const handleSignup = async (e) => {

        e.preventDefault()

        setLoading(true)

        setError('')
        setSuccess('')


        const { data, error } = await supabase.auth.signUp({

            email,

            password,

            options: {

                data: {
                    full_name: name
                }

            }

        })


        if (error) {

            setError(error.message)

        } else if (data.session) {

            navigate('/upload')

        } else {

            setSuccess(
                'Registration successful! Please check your email to verify your account.'
            )

        }


        setLoading(false)

    }


    return (

        <div className="authPage">

            <div className="authCard">

                <h1>Create Account</h1>

                <p>Join TeachMeAI and make learning easier.</p>


                <form onSubmit={handleSignup}>


                    <input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />


                    <input
                        type="email"
                        placeholder="Email Address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />


                    <input
                        type="password"
                        placeholder="Create Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        minLength={6}
                        required
                    />


                    {error && (
                        <div className="authError">
                            {error}
                        </div>
                    )}


                    {success && (
                        <div className="authSuccess">
                            {success}
                        </div>
                    )}


                    <button type="submit" disabled={loading}>

                        {loading ? 'Creating Account...' : 'Sign Up'}

                    </button>


                </form>


                <p className="authSwitch">

                    Already have an account?

                    <Link to="/login"> Login</Link>

                </p>


                <Link to="/" className="backHome">
                    Back to Home
                </Link>

            </div>

        </div>

    )

}

export default Signup