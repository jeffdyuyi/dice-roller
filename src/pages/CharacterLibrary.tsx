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
        <div className="p-6 md:p-12 w-full max-w-6xl mx-auto min-h-screen overflow-y-auto custom-scrollbar bg-black text-white relative font-sans">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 relative z-10 pb-6 border-b border-white/5">
                <div>
                    <h1 className="text-[34px] font-sans font-semibold tracking-tight leading-none text-white">本地角色库</h1>
                    <p className="text-[14px] font-sans text-white/50 mt-2">管理与查看您的所有冒险者档案</p>
                </div>
                <button 
                    onClick={() => navigate('/characters/new')} 
                    className="bg-apple-blue text-white px-8 py-3.5 rounded-full font-sans font-medium text-[15px] hover:bg-apple-blue/90 hover:scale-[0.98] active:bg-[#ededf2] active:text-[#1d1d1f] transition-all shadow-sm"
                >
                    + 塑造新角色
                </button>
            </div>

            {characters.length === 0 ? (
                <div className="border border-dashed border-white/10 rounded-3xl p-32 text-center relative z-10 flex flex-col items-center justify-center bg-[#1c1c1e]/30">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white/20" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                    </div>
                    <p className="text-white/40 font-sans text-[15px]">档案库为空，暂无角色</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 relative z-10">
                    {characters.map(c => (
                        <div key={c.id} className="bg-[#1d1d1f] rounded-2xl p-6 shadow-apple border border-white/5 hover:-translate-y-1 hover:shadow-apple-hover transition-all duration-300 group flex flex-col h-[240px]">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-[#2c2c2e] flex items-center justify-center text-white font-sans font-medium text-xl shadow-sm border border-white/5">
                                        {c.name[0]}
                                    </div>
                                    <div>
                                        <h3 className="text-[18px] font-sans font-semibold text-white tracking-tight">{c.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[12px] font-sans px-2.5 py-1 bg-white/5 rounded-md text-white/50">模板: {c.summary || '未知'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1"></div>

                            <div className="pt-5 border-t border-white/5 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <button className="flex-1 bg-[#2c2c2e] hover:bg-[#3a3a3c] rounded-full py-2.5 text-[13px] text-white font-sans font-medium transition-colors shadow-sm" onClick={() => alert('档案详情系统即将开放')}>
                                    查看详情
                                </button>
                                <button className="w-10 h-10 rounded-full hover:bg-red-500/10 text-white/40 hover:text-red-400 flex items-center justify-center transition-colors" onClick={() => handleDelete(c.id)}>
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
