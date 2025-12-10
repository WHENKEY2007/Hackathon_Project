import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';

const HackathonRequests = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRequests();
    }, [id]);

    const fetchRequests = async () => {
        try {
            const { data } = await api.get(`/hackathons/${id}/requests`);
            setRequests(data);
        } catch (error) {
            console.error(error);
            alert('Failed to fetch requests. Are you the leader?');
            navigate('/');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (requestId, status) => {
        try {
            await api.put(`/hackathons/${id}/requests/${requestId}`, { status });
            // Refresh list
            fetchRequests();
        } catch (error) {
            alert('Action failed');
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Manage Join Requests</h1>

            <div className="bg-white dark:bg-gray-800 shadow rounded overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Candidate</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">University</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Skills</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {requests.map(req => (
                            <tr key={req.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{req.user_name}</div>
                                    <div className="text-sm text-gray-500">{req.user_email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    {req.user_university}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                    <div className="flex flex-wrap gap-1">
                                        {req.user_skills.map((skill, i) => (
                                            <span key={i} className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${req.status === 'approved' ? 'bg-green-100 text-green-800' :
                                            req.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {req.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {req.status === 'pending' && (
                                        <>
                                            <button onClick={() => handleAction(req.id, 'approved')} className="text-green-600 hover:text-green-900 mr-4">Approve</button>
                                            <button onClick={() => handleAction(req.id, 'rejected')} className="text-red-600 hover:text-red-900">Reject</button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {requests.length === 0 && (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">No requests found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HackathonRequests;
