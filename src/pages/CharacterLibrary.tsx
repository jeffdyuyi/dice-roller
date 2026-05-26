import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyCharacters, deleteCharacter } from '../features/characters/api';
import type { Character } from '../features/characters/types';
import { useAuth } from '../features/auth/useAuth';

export function CharacterLibrary() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [characters, setCharacters] = useState<Character[]>([]);

    useEffect(() => {
        if (user) {
            getMyCharacters(user.id).then(setCharacters);
        }
    }, [user]);

    const handleDelete = async (id: string) => {
        if (!confirm('确认删除角色卡吗？')) return;
        await deleteCharacter(id);
        const chars = await getMyCharacters(user?.id || '');
        setCharacters(chars);
    };

    return (
        <div className="p-6 md:p-12 w-full max-w-6xl mx-auto min-h-screen overflow-y-auto custom-scrollbar bg-black text-white relative font-sans">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 relative z-10 pb-6 border-b border-white/5">
                <div>
                    <h1 className="text-[34px] font-sans font-semibold tracking-tight leading-none text-white">本地角色库</h1>
                    <p className="text-[14px] font-sans text-white/70 mt-2">管理与查看您的所有冒险者档案</p>
                </div>
                <button 
                    onClick={() => navigate('/characters/new')} 
                    className="bg-x-white text-x-dark px-8 py-3.5 rounded-none font-mono uppercase tracking-xai font-medium text-[12px] hover:bg-white/90 transition-all"
                >
                    + 塑造新角色
                </button>
            </div>

            {characters.length === 0 ? (
                <div className="border border-dashed border-x-border rounded-none p-32 text-center relative z-10 flex flex-col items-center justify-center bg-x-surface">
                    <div className="w-16 h-16 rounded-none border border-x-border bg-transparent flex items-center justify-center mb-4">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-x-muted" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    </div>
                    <p className="text-x-muted font-mono tracking-xai uppercase text-[12px]">备忘库存为空，暂无记录</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 relative z-10">
                    {characters.map(c => (
                        <div key={c.id} className="bg-transparent rounded-none p-6 border border-x-border hover:-translate-y-1 hover:bg-x-surface transition-all duration-300 group flex flex-col h-[240px]">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-none bg-x-surface flex items-center justify-center text-x-white font-mono font-medium text-xl border border-x-border">
                                        {c.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="text-[18px] font-sans font-semibold text-x-white tracking-tight">{c.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-mono tracking-xai uppercase px-2.5 py-1 border border-x-border rounded-none text-x-muted">{c.summary || '未分类'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1"></div>

                            <div className="pt-5 border-t border-x-border flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button className="flex-1 bg-x-white text-x-dark rounded-none py-2 text-[12px] font-mono uppercase tracking-xai font-medium transition-colors" onClick={() => alert('备忘详情编辑功能即将开放')}>
                                    查看详情
                                </button>
                                <button className="w-10 h-10 rounded-none bg-transparent border border-x-border text-x-muted hover:text-red-400 hover:border-red-400 flex items-center justify-center transition-colors" onClick={() => handleDelete(c.id)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
