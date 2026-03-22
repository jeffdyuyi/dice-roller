import { useState, useEffect } from 'react';

export interface User {
    id: string;
    username: string;
    displayName: string;
}

// 模拟 Auth Hook (使用 localStorage)
export function useAuth() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem('mock_user');
        if (stored) {
            try {
                setUser(JSON.parse(stored));
            } catch (e) { }
        }
    }, []);

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
        localStorage.removeItem('mock_user');
        setUser(null);
    };

    return {
        user,
        isLoggedIn: !!user,
        login,
        logout
    };
}
