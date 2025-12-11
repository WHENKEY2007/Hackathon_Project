import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        university: '',
        skills: '',
        profile_photo: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleGoogleClick = () => {
        alert('Google sign-up coming soon. Configure Supabase OAuth in server.');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        const { name, email, password, confirmPassword, university, profile_photo } = formData;

        // Logic from your signup.js snippet
        if (!name.trim() || !email.trim() || !password || !confirmPassword || !university.trim()) {
            setError('Please fill all required fields.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('Enter a valid email.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        try {
            // Process skills (comma separated -> array)
            const skillsArray = formData.skills.split(',').map(s => s.trim()).filter(s => s);

            // Register using AuthContext (which calls API)
            await register({
                name,
                email,
                password,
                university,
                skills: skillsArray
            });

            setSuccess('Sign up successful! Redirecting...');

            // Redirect after 1.8s delay per your snippet
            setTimeout(() => {
                navigate('/login');
            }, 1800);

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Sign up failed.');
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Left Panel */}
            <div className="hidden lg:flex flex-col justify-center w-[45%] bg-gray-900 text-white px-16 relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-5xl font-bold mb-6">Join CollabX</h1>
                    <p className="text-lg text-gray-300 opacity-90 leading-relaxed">
                        Create an account to start your collaboration journey. Find partners, join teams, and build amazing projects.
                    </p>
                </div>
                <div className="absolute top-20 right-[-50px] w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-20"></div>
            </div>

            {/* Right Panel */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
                <div className="w-full max-w-lg bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 my-8">
                    <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Sign Up</h2>

                    <button
                        onClick={handleGoogleClick}
                        type="button"
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

                    {error && <p className="text-red-600 bg-red-50 p-3 rounded text-sm mb-4 border border-red-100">{error}</p>}
                    {success && <p className="text-emerald-600 bg-emerald-50 p-3 rounded text-sm mb-4 border border-emerald-100">{success}</p>}

                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                            <input type="text" name="name" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all dark:bg-gray-700 dark:border-gray-600" placeholder="Enter your full name" onChange={handleChange} required />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                            <input type="email" name="email" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all dark:bg-gray-700 dark:border-gray-600" placeholder="Enter your email" onChange={handleChange} required />
                        </div>

                        {/* Needed for Hackathon App */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">University</label>
                                <input type="text" name="university" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all dark:bg-gray-700 dark:border-gray-600" placeholder="Stanford" onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skills</label>
                                <input type="text" name="skills" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all dark:bg-gray-700 dark:border-gray-600" placeholder="React, Java..." onChange={handleChange} />
                            </div>
                        </div>



                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                <input type="password" name="password" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all dark:bg-gray-700 dark:border-gray-600" placeholder="Min 6 chars" onChange={handleChange} required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
                                <input type="password" name="confirmPassword" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all dark:bg-gray-700 dark:border-gray-600" placeholder="Re-enter password" onChange={handleChange} required />
                            </div>
                        </div>

                        <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-lg shadow-lg shadow-emerald-500/20 transition-all mt-4">
                            Create Account
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-gray-500">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-500">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;