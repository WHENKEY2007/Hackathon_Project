import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
    const { user, login } = useAuth(); // login is effectively used to update local user state if context allows or we need to refetch
    const [formData, setFormData] = useState({
        name: '',
        university: '',
        skills: '',
        profile_photo: ''
    });
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                university: user.university || '',
                skills: user.skills ? (Array.isArray(user.skills) ? user.skills.join(', ') : user.skills) : '',
                profile_photo: user.profile_photo || ''
            });

            // If context user doesn't have all details (like university), we might fetch from /api/hackathons/me equivalent? 
            // The current /me endpoint returns id, name, email, profile_photo. We might want to update it to return university/skills too.
            // Let's assume user object in context is updated or fetch fresh.
            fetchProfile();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/auth/me', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update form with fresh data
            const userData = res.data;
            setFormData({
                name: userData.name || '',
                university: userData.university || '',
                skills: userData.skills || '', // api might return string or array depending on server impl. server sends string in /me?
                profile_photo: userData.profile_photo || ''
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleChange = (e) => {
        if (e.target.name === 'profile_photo') {
            setFormData({ ...formData, profile_photo: e.target.files[0] });
        } else {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);
        try {
            const token = localStorage.getItem('token');
            const data = new FormData();
            data.append('name', formData.name);
            data.append('university', formData.university);
            data.append('skills', formData.skills); // Backend parses array if logic remains, or string? 
            // In backend: "const skillsString = Array.isArray(skills) ? skills.join(',') : skills;"
            // FormData sends strings. So duplicate key or comma separated? Server expects string or array.
            // Let's send regular string if simple, or if we want array behavior with FormData we append multiple times.
            // Current backend logic: "const skillsString = Array.isArray(skills) ? skills.join(',') : skills;"
            // We'll send the comma separated string as is from input.

            if (formData.profile_photo instanceof File) {
                data.append('profile_photo', formData.profile_photo);
            } else if (formData.profile_photo) {
                // It's a URL string (existing photo). We might need to send it if we want to keep it?
                // But backend "let { profile_photo } = req.body;" will grab it if it's text.
                data.append('profile_photo', formData.profile_photo);
            }

            const res = await axios.put('http://localhost:5000/api/auth/profile', data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });

            setMsg({ type: 'success', text: 'Profile updated successfully!' });
            // Update photo preview if new URL came back
            setFormData(prev => ({ ...prev, profile_photo: res.data.profile_photo }));

        } catch (err) {
            console.error(err);
            setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to update profile.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Edit Profile</h2>

            {msg && (
                <div className={`p-4 mb-4 rounded-md ${msg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {msg.text}
                </div>
            )}

            {/* Image Preview */}
            <div className="flex justify-center mb-6">
                <div className="relative">
                    {formData.profile_photo && (typeof formData.profile_photo === 'string' || formData.profile_photo instanceof File) ? (
                        <img
                            src={typeof formData.profile_photo === 'string' ? formData.profile_photo : URL.createObjectURL(formData.profile_photo)}
                            alt="Profile"
                            className="w-24 h-24 rounded-full object-cover border-4 border-indigo-100 dark:border-gray-700 shadow-sm"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                            <span className="text-xs">No Photo</span>
                        </div>
                    )}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="mt-1 block w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:text-gray-100"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">University</label>
                    <input
                        type="text"
                        name="university"
                        value={formData.university}
                        onChange={handleChange}
                        className="mt-1 block w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:text-gray-100"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Skills (comma separated)</label>
                    <input
                        type="text"
                        name="skills"
                        value={formData.skills}
                        onChange={handleChange}
                        className="mt-1 block w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:text-gray-100"
                        placeholder="React, Node.js, Design"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile Photo</label>
                    <input
                        type="file"
                        name="profile_photo"
                        accept="image/*"
                        onChange={handleChange}
                        className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-full file:border-0
                            file:text-sm file:font-semibold
                            file:bg-indigo-50 file:text-indigo-700
                            hover:file:bg-indigo-100
                            dark:file:bg-gray-700 dark:file:text-gray-200
                        "
                    />
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Profile;
