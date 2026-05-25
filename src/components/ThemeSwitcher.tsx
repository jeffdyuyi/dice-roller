import { useState, useEffect } from 'react';

export function ThemeSwitcher() {
    const [theme, setTheme] = useState<'brutalist' | 'apple'>(() => {
        return (localStorage.getItem('app-theme') as 'brutalist' | 'apple') || 'brutalist';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('app-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'brutalist' ? 'apple' : 'brutalist');
    };

    return (
        <button 
            onClick={toggleTheme}
            className="w-10 h-10 border border-x-border flex items-center justify-center hover:bg-x-surface transition-all text-x-white"
            title={`当前主题: ${theme === 'brutalist' ? '黑客粗犷' : 'Apple 简约'}`}
        >
            {theme === 'brutalist' ? (
                <span className="font-mono text-[14px]">X</span>
            ) : (
                <span className="font-sans text-[16px] font-bold">A</span>
            )}
        </button>
    );
}
