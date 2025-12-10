import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useState } from 'react';

const HackathonCard = ({ hackathon }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const isLeader = user && user.id === hackathon.created_by_user_id;
    const progress = Math.min((hackathon.current_members / hackathon.team_size) * 100, 100);



    return (
        <div
            onClick={() => navigate(`/hackathon/${hackathon.id}`)}
            className="group relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-100 dark:border-gray-700 cursor-pointer flex flex-col h-full"
        >
            {/* Header: Title & Badge */}
            <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight line-clamp-2">
                    {hackathon.title}
                </h3>
                <span className={`shrink-0 px-2.5 py-1 text-xs font-semibold rounded-full border ${hackathon.type === 'University'
                    ? 'bg-purple-50 text-purple-700 border-purple-100'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    }`}>
                    {hackathon.type === 'University' ? 'Uni Level' : 'Open'}
                </span>
            </div>

            {/* Date */}
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-4">
                {new Date(hackathon.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>

            {/* Description */}
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-6 line-clamp-3 flex-1">
                {hackathon.description}
            </p>

            {/* Footer: Team Progress & Action */}
            <div className="mt-auto space-y-4">
                {/* Progress Bar (Maybe total participants?) or just date */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Teams Formed: {hackathon.teams_count || 'View to see'}</span>
                </div>

                {/* Button */}
                <button
                    className="w-full py-3 px-4 bg-gray-50 hover:bg-white text-indigo-600 font-bold rounded-xl border border-gray-200 transition-all group-hover:border-indigo-200 group-hover:text-indigo-700 group-hover:shadow-md"
                >
                    View Teams &rarr;
                </button>
            </div>
        </div>
    );
};

export default HackathonCard;