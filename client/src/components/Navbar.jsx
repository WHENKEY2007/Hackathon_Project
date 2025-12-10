import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
            <div className="container mx-auto px-6 h-16 flex justify-between items-center">
                {/* Left: Sign Up (Visitor) or Dashboard (User) */}
                <div className="flex items-center w-1/3">
                    {!user && (
                        <Link to="/register" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                            ← Sign Up
                        </Link>
                    )}
                    {user && (
                        <Link to="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">
                            Dashboard
                        </Link>
                    )}
                </div>

                {/* Center: Brand */}
                <div className="flex-1 text-center">
                    <Link to="/" className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        CollabX
                    </Link>
                </div>

                {/* Right: Auth Actions */}
                <div className="flex justify-end items-center w-1/3 gap-4">
                    {!user ? (
                        <Link
                            to="/login"
                            className="px-5 py-2 text-sm font-medium text-white bg-gray-900 rounded-full hover:bg-gray-800 transition-all shadow-lg shadow-gray-900/20"
                        >
                            Sign In
                        </Link>
                    ) : (
                        <div className="flex items-center gap-4">
                            <span className="hidden md:inline text-sm text-gray-500 dark:text-gray-400">
                                {user.name}
                            </span>
                            {user.profile_photo ? (
                                <img src={user.profile_photo} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                                    {user.name.charAt(0)}
                                </div>
                            )}
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;