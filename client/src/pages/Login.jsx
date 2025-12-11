import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { supabase } from '../supabaseClient';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Logic from your login.js snippet
        if (!email.trim() || !password.trim()) {
            setError('Please enter both email and password.');
            return;
        }

        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            // Check if response exists, otherwise generic connection error
            const msg = err.response?.data?.error || 'Connection error. Make sure server is running.';
            setError(msg);
        }
    };

    const handleGoogleClick = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) setError(error.message);
        } catch (err) {
            setError('Failed to initiate Google Login');
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex flex-col justify-center w-[45%] bg-gray-900 text-white px-16 relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-5xl font-bold mb-6">Welcome Back</h1>
                    <p className="text-lg text-gray-300 opacity-90 leading-relaxed">
                        Log in to access your dashboard, manage your hackathon requests, and find your dream team.
                    </p>
                </div>
                {/* Decorative circle */}
                <div className="absolute -bottom-32 -left-20 w-80 h-80 bg-emerald-500 rounded-full blur-[100px] opacity-20"></div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
                <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h2 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">Sign In</h2>
                    <p className="text-gray-500 mb-8 text-sm">Enter your credentials to access your account</p>

                    <button
                        onClick={handleGoogleClick}
                        className="w-full flex items-center justify-center gap-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors mb-6 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium"
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                        Continue with Google
                    </button>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
                        <span className="text-gray-400 text-sm">or</span>
                        <div className="h-px bg-gray-200 dark:bg-gray-700 flex-1"></div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 rounded bg-red-50 text-red-600 text-sm border border-red-100 font-medium animate-pulse">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                            <input
                                type="email"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Enter your email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                            <input
                                type="password"
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Enter your password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg shadow-lg shadow-emerald-500/20 transition-all mt-2"
                        >
                            Log In
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-gray-500">
                        Don't have an account?{' '}
                        <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-500">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;