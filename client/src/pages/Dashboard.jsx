import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import HackathonCard from '../components/HackathonCard';

const Dashboard = () => {
    const { user } = useAuth();
    const [hackathons, setHackathons] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchHackathons();
    }, []);

    const fetchHackathons = async () => {
        try {
            const { data } = await api.get('/hackathons');
            setHackathons(data);
        } catch (error) {
            console.error('Failed to fetch hackathons:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pb-20">
            {/* Hero Section */}
            <div className="py-16 text-center max-w-3xl mx-auto px-4">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6">
                    Build your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">Dream Team</span>.
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                    Find skilled teammates for your next hackathon or join an existing squad. 
                    University level or Open — we've got you covered.
                </p>
                {user && (
                    <button
                        onClick={() => navigate('/add-hackathon')}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-all hover:scale-105"
                    >
                        + Create New Team
                    </button>
                )}
            </div>

            {/* Grid */}
            <div className="px-4 md:px-8">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
                            {hackathons.map(h => (
                                <HackathonCard key={h.id} hackathon={h} />
                            ))}
                        </div>
                        
                        {hackathons.length === 0 && (
                            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 max-w-2xl mx-auto mt-8">
                                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No active hackathons</h3>
                                <p className="mt-1 text-sm text-gray-500">Get started by creating a new team request.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Dashboard;