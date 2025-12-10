import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const AddHackathon = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_date: '',
        team_size: 4,
        type: 'Open',
        url: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/hackathons', formData);
            navigate('/');
        } catch (err) {
            alert('Failed to create hackathon: ' + (err.response?.data?.error || err.message));
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded shadow-md">
            <h2 className="text-2xl font-bold mb-6">Add New Hackathon</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
                <div>
                    <label className="block mb-1 font-medium">Hackathon Title</label>
                    <input type="text" name="title" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" onChange={handleChange} required />
                </div>

                <div>
                    <label className="block mb-1 font-medium">Description</label>
                    <textarea name="description" rows="3" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" onChange={handleChange}></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-1 font-medium">Start Date & Time</label>
                        <input type="datetime-local" name="start_date" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" onChange={handleChange} required />
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">Team Size Required</label>
                        <input type="number" name="team_size" min="1" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" value={formData.team_size} onChange={handleChange} required />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block mb-1 font-medium">Type</label>
                        <select name="type" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" onChange={handleChange}>
                            <option value="Open">Open Hackathon</option>
                            <option value="University">University Level</option>
                        </select>
                    </div>
                    <div>
                        <label className="block mb-1 font-medium">Website URL</label>
                        <input type="url" name="url" className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" onChange={handleChange} placeholder="https://..." />
                    </div>
                </div>

                <div className="flex gap-4 mt-4">
                    <button type="button" onClick={() => navigate('/')} className="px-4 py-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Create Hackathon</button>
                </div>
            </form>
        </div>
    );
};

export default AddHackathon;
