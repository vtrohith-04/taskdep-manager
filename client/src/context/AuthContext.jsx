import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'sonner';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'));
    const [loading, setLoading] = useState(false);

    const login = async (email, password) => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            toast.success('Logged in successfully');
            return true;
        } catch (err) {
            toast.error(err.response?.data?.message || 'Login failed');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const register = async (name, email, password) => {
        setLoading(true);
        try {
            const { data } = await api.post('/auth/register', { name, email, password });
            localStorage.setItem('user', JSON.stringify(data));
            setUser(data);
            toast.success('Account created successfully');
            return true;
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
