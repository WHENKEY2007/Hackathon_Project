import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUser();

        // Listen for Supabase Auth changes (Google Login Redirect)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
                const { user: supabaseUser } = session;
                // Sync with backend
                try {
                    await googleLogin(supabaseUser);
                } catch (error) {
                    console.error('Failed to sync Google user with backend:', error);
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkUser = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const { data } = await api.get('/auth/me');
            setUser(data);
        } catch (error) {
            console.error('Auth check failed:', error);
            localStorage.removeItem('token');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', data.token);
        setUser(data.user);
    };

    const register = async (userData) => {
        await api.post('/auth/register', userData);
        // Automatically login logic or just redirect to login handled by caller
    };

    const googleLogin = async (supabaseUser) => {
        const { email, user_metadata } = supabaseUser;
        const name = user_metadata.full_name || user_metadata.name || email.split('@')[0];
        const profile_photo = user_metadata.avatar_url || user_metadata.picture;

        const { data } = await api.post('/auth/google', {
            email,
            name,
            profile_photo,
            google_id: supabaseUser.id
        });

        localStorage.setItem('token', data.token);
        setUser(data.user);
    };

    const logout = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, googleLogin }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
