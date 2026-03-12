import axios from 'axios';
import { toast } from 'sonner';

const api = axios.create({
    baseURL: '/api',
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
    }
    return config;
});

// Handle 401 responses — auto-logout on expired/invalid token
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Only redirect if user was logged in (avoid redirect loop on login page)
            const user = JSON.parse(localStorage.getItem('user') || 'null');
            if (user) {
                localStorage.removeItem('user');
                toast.error('Session expired. Please sign in again.');
                // Slight delay so toast is visible before redirect
                setTimeout(() => {
                    window.location.href = '/login';
                }, 500);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
