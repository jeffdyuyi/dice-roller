import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyCharacters, deleteCharacter } from '../features/characters/api';
import type { Character } from '../features/characters/rule-engines/types';
import { useAuth } from '../features/auth/useAuth';

export function CharacterLibrary() {
    const { user, isLoggedIn } = useAuth();
    const navigate = useNavigate();
    const [characters, setCharacters] = useState<Character[]>([]);

    useEffect(() => {
        if (isLoggedIn && user) {
            getMyCharacters(user.id).then(setCharacters);
        }
    }, [isLoggedIn, user]);

    if (!isLoggedIn) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-x-muted bg-x-dark">
                <span className="font-mono text-[48px] opacity-20">_</span>
                <p className="text-[12px] font-mono tracking-xai uppercase mt-8 opacity-50">待机中 / 请先登录</p>
            </div>
        );
    }

    const handleDelete = async (id: string) => {
        if (!confirm('确认删除角色卡吗？')) return;
        await deleteCharacter(id);
        const chars = await getMyCharacters(user?.id || '');
        setCharacters(chars);
    };

    return (
        <div className="p-6 md:p-12 w-full max-w-7xl mx-auto min-h-screen overflow-y-auto custom-scrollbar bg-x-dark text-x-white relative font-sans">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6 relative z-10 pb-6 border-b border-x-border">
                <div>
                    <h1 className="text-[32px] font-sans leading-none uppercase">本地角色库</h1>
                </div>
                <button 
                    onClick={() => navigate('/characters/new')} 
                    className="bg-x-white text-x-dark px-8 py-3 font-mono text-[14px] uppercase tracking-xai hover:bg-white/90 transition-all border border-transparent hover:border-x-borderStrong"
                >
                    + 塑造新角色
                </button>
            </div>

            {characters.length === 0 ? (
                <div className="border border-dashed border-x-border p-32 text-center relative z-10">
                    <p className="text-x-muted font-mono uppercase tracking-xai text-[12px]">档案库为空</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                    {characters.map(c => (
                        <div key={c.id} className="bg-x-surface border border-x-border p-6 hover:border-x-white transition-all group relative flex flex-col h-[220px]">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 border border-x-border flex items-center justify-center text-x-white font-mono text-xl group-hover:bg-x-white group-hover:text-x-dark transition-colors">
                                        {c.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="text-[18px] font-sans text-x-white uppercase leading-tight">{c.name}</h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[10px] font-mono px-2 py-1 border border-x-border text-x-muted uppercase tracking-xai">模板: {c.summary || '未知'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1"></div>

                            <div className="pt-4 border-t border-x-border flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="flex-1 bg-transparent border border-x-border hover:bg-x-white hover:text-x-dark hover:border-x-white py-2 text-[10px] text-x-muted font-mono uppercase tracking-xai transition-colors" onClick={() => alert('档案详情系统即将开放')}>
                                    查看详情
                                </button>
                                <button className="w-10 h-10 border border-x-border hover:border-[#ef4444] text-x-muted hover:text-[#ef4444] flex items-center justify-center transition-colors" onClick={() => handleDelete(c.id)}>
                                    <span className="font-mono text-sm">X</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
