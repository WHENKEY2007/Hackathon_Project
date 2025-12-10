import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const HackathonDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [hackathon, setHackathon] = useState(null);
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateTeam, setShowCreateTeam] = useState(false);

    // Form state
    const [teamName, setTeamName] = useState('');
    const [description, setDescription] = useState('');
    const [neededSkills, setNeededSkills] = useState('');

    // Manage Team State
    const [managingTeam, setManagingTeam] = useState(null);
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const [hackResponse, teamsResponse] = await Promise.all([
                api.get(`/hackathons/${id}`),
                api.get(`/hackathons/${id}/teams`)
            ]);
            setHackathon(hackResponse.data);
            setTeams(teamsResponse.data);
        } catch (error) {
            console.error('Failed to fetch details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeam = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/hackathons/${id}/teams`, {
                name: teamName,
                description,
                needed_skills: neededSkills.split(',').map(s => s.trim())
            });
            setShowCreateTeam(false);
            setTeamName('');
            setDescription('');
            setNeededSkills('');
            fetchData(); // Refresh list
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to create team');
        }
    };

    const handleJoinTeam = async (teamId) => {
        if (!user) return navigate('/login');
        try {
            await api.post(`/teams/${teamId}/join`);
            alert('Request sent!');
            fetchData();
        } catch (error) {
            alert(error.response?.data?.error || 'Failed to join team');
        }
    };

    const openManageModal = async (team) => {
        setManagingTeam(team);
        try {
            const { data } = await api.get(`/teams/${team.id}/requests`);
            setRequests(data);
        } catch (error) {
            console.error('Failed to fetch requests', error);
            alert('Failed to load requests');
        }
    };

    const handleRequestAction = async (requestId, status) => {
        try {
            await api.put(`/teams/${managingTeam.id}/requests/${requestId}`, { status });
            // Refresh requests
            const { data } = await api.get(`/teams/${managingTeam.id}/requests`);
            setRequests(data);
            // Refresh teams to update member counts
            fetchData();
        } catch (error) {
            alert('Action failed');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading details...</div>;
    if (!hackathon) return <div className="p-8 text-center text-red-500">Hackathon not found</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 pb-24 relative">
            {/* Header */}
            <div className="mb-12 text-center">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">
                    {hackathon.title}
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                    {hackathon.description}
                </p>

                <div className="flex flex-wrap justify-center gap-4 mt-8">
                    <span className="px-5 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full font-semibold text-sm border border-indigo-100 dark:border-indigo-800">
                        {hackathon.type}
                    </span>
                    <span className="px-5 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full font-semibold text-sm border border-gray-200 dark:border-gray-700">
                        Teams up to {hackathon.max_team_size || hackathon.team_size} members
                    </span>
                    <span className="px-5 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full font-semibold text-sm border border-gray-200 dark:border-gray-700">
                        Started {new Date(hackathon.start_date).toLocaleDateString()}
                    </span>
                </div>
            </div>

            {/* Teams Section Header */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Active Teams</h2>
                {user && (
                    <button
                        onClick={() => setShowCreateTeam(!showCreateTeam)}
                        className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-500/30 transition-all font-bold hover:scale-105"
                    >
                        {showCreateTeam ? 'Cancel' : '+ Create Your Team'}
                    </button>
                )}
            </div>

            {/* Create Team Form */}
            {showCreateTeam && (
                <div className="mb-16 p-8 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-indigo-100 dark:border-gray-700 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                    <h3 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">Assemble Your Squad</h3>
                    <form onSubmit={handleCreateTeam} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Team Name</label>
                            <input
                                type="text"
                                required
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-indigo-500 focus:ring-0 transition-colors text-lg"
                                placeholder="e.g. The Code Avengers"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Mission & Goals</label>
                            <textarea
                                required
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-indigo-500 focus:ring-0 transition-colors text-base"
                                rows="3"
                                placeholder="What are you building? Who do you need?"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Skills Needed (comma separated)</label>
                            <input
                                type="text"
                                value={neededSkills}
                                onChange={(e) => setNeededSkills(e.target.value)}
                                className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:border-indigo-500 focus:ring-0 transition-colors text-base"
                                placeholder="e.g. Frontend, AI, Design, Pitching"
                            />
                        </div>
                        <div className="flex justify-end pt-4">
                            <button
                                type="submit"
                                className="px-10 py-4 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl shadow-xl transition-all hover:-translate-y-1"
                            >
                                Launch Team
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Teams List */}
            {teams.length === 0 ? (
                <div className="text-center py-24 bg-white dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <div className="text-6xl mb-4">🚀</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No teams yet</h3>
                    <p className="text-gray-500 text-lg">Be the pioneer and create the first team!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {teams.map(team => (
                        <div key={team.id} className="group flex flex-col bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-700">
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                                    {team.name}
                                </h3>
                                <span className="shrink-0 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-full uppercase tracking-wider">
                                    Team
                                </span>
                            </div>

                            <div className="mb-4 flex flex-col gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center text-xs font-semibold bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded border dark:border-gray-700 w-fit">
                                    👑 {team.leader_name}
                                </span>
                                {team.member_names && (
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {team.member_names.split(',').map((name, i) => (
                                            <span key={i} className="text-gray-600 dark:text-gray-300 font-medium text-xs">
                                                @{name}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <p className="text-gray-600 dark:text-gray-300 mb-6 flex-1 text-base leading-relaxed">
                                {team.description}
                            </p>

                            <div className="mb-6 space-y-3">
                                <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Looking for</h4>
                                <div className="flex flex-wrap gap-2">
                                    {team.needed_skills && team.needed_skills.split(',').filter(s => s).length > 0 ? (
                                        team.needed_skills.split(',').map((skill, index) => (
                                            <span key={index} className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs rounded-lg font-semibold border border-indigo-100 dark:border-indigo-800">
                                                {skill}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-400 text-sm italic">Open to all</span>
                                    )}
                                </div>
                            </div>

                            <div className="mt-auto border-t border-gray-100 dark:border-gray-700 pt-5 flex items-center justify-between gap-2">
                                <span className="text-sm font-bold text-gray-500">
                                    {team.current_members} / {hackathon.max_team_size || hackathon.team_size} Members
                                </span>
                                {user && user.id === team.leader_id ? (
                                    <button
                                        onClick={() => openManageModal(team)}
                                        className="px-5 py-2.5 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-xl transition-colors ring-4 ring-gray-100 dark:ring-gray-700"
                                    >
                                        Manage Requests
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <a
                                            href={`mailto:${team.leader_email}?subject=Join Request: ${team.name}`}
                                            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-bold rounded-xl transition-colors flex items-center gap-2"
                                            title="Contact Leader"
                                        >
                                            ✉️
                                        </a>
                                        <button
                                            onClick={() => handleJoinTeam(team.id)}
                                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                                        >
                                            Join Team
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Manage Modal */}
            {managingTeam && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold dark:text-white">Manage: {managingTeam.name}</h3>
                            <button onClick={() => setManagingTeam(null)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-bold uppercase text-gray-400">Join Requests</h4>
                            {requests.length === 0 ? (
                                <p className="text-gray-500 py-4">No pending requests.</p>
                            ) : (
                                requests.map(req => (
                                    <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600">
                                        <div className="mb-4 sm:mb-0">
                                            <p className="font-bold text-gray-900 dark:text-white text-lg">{req.user_name}</p>
                                            <p className="text-sm text-gray-500">{req.user_university}</p>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {req.user_skills.map((s, i) => (
                                                    <span key={i} className="text-xs bg-white dark:bg-gray-600 px-2 py-1 rounded border dark:border-gray-500">{s}</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {req.status === 'pending' ? (
                                                <>
                                                    <button
                                                        onClick={() => handleRequestAction(req.id, 'rejected')}
                                                        className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg font-bold text-sm transition-colors"
                                                    >
                                                        Decline
                                                    </button>
                                                    <button
                                                        onClick={() => handleRequestAction(req.id, 'approved')}
                                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm shadow-md transition-transform active:scale-95"
                                                    >
                                                        Accept
                                                    </button>
                                                </>
                                            ) : (
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {req.status}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HackathonDetails;
