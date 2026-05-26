import { useState } from 'react';

export interface User {
    id: string;
    username: string;
    displayName: string;
}

const DEFAULT_USER: User = {
    id: 'local-user',
    username: 'Player',
    displayName: 'Player'
};

// 模拟 Auth Hook (使用 localStorage)
export function useAuth() {
    const [user, setUser] = useState<User>(() => {
        const stored = localStorage.getItem('mock_user');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {}
        }
        localStorage.setItem('mock_user', JSON.stringify(DEFAULT_USER));
        return DEFAULT_USER;
    });

    const login = (username: string) => {
        const mockUser: User = {
            id: 'usr-' + Math.random().toString(36).substr(2, 9),
            username,
            displayName: username
        };
        localStorage.setItem('mock_user', JSON.stringify(mockUser));
        setUser(mockUser);
    };

    const logout = () => {
        // For a pure frontend app, we just reset to default local user instead of logging out
        localStorage.setItem('mock_user', JSON.stringify(DEFAULT_USER));
        setUser(DEFAULT_USER);
    };

    return {
        user,
        isLoggedIn: true,
        login,
        logout
    };
}
