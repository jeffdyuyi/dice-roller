import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyCharacters, deleteCharacter } from '../features/characters/api';
import { useAuth } from '../features/auth/useAuth';

export function CharacterLibrary() {
    const { user, isLoggedIn } = useAuth();
    const navigate = useNavigate();
    const [characters, setCharacters] = useState(getMyCharacters(user?.id || ''));

    if (!isLoggedIn) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-[#6b6250] h-full bg-[#0c0c10] relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[#bf953f]/5 rounded-full blur-[120px] -mr-[25vw] -mt-[25vw] pointer-events-none"></div>

                <div className="w-24 h-24 bg-[#141420] border border-[#bf953f]/20 rounded-3xl flex items-center justify-center shadow-2xl mb-8 relative z-10">
                    <i className="fa-solid fa-lock text-4xl text-[#bf953f] animate-pulse"></i>
                </div>
                <h2 className="text-2xl font-black text-[#f0ead8] tracking-widest uppercase mb-4 relative z-10">欢迎来到秘密基地</h2>
                <p className="text-sm text-[#6b6250] max-w-xs text-center font-bold tracking-wider relative z-10">请先登录您的账号，开启属于您的 TRPG 冒险之旅并管理您的角色卡。</p>
                <button onClick={() => { const un = prompt('请输入昵称:'); if (un) window.location.reload(); }} className="mt-10 px-10 py-4 bg-gradient-to-r from-[#bf953f] to-[#aa771c] hover:from-[#fcf6ba] hover:to-[#bf953f] text-[#0c0c10] rounded-xl font-black shadow-2xl shadow-black/40 transition-all active:scale-95 uppercase tracking-widest text-sm relative z-10">
                    立即接入领域
                </button>
            </div>
        );
    }

    const handleDelete = (id: string) => {
        if (!confirm('确认删除角色卡吗？')) return;
        deleteCharacter(id);
        setCharacters(getMyCharacters(user?.id || ''));
    };

    return (
        <div className="p-6 md:p-12 w-full max-w-7xl mx-auto min-h-screen overflow-y-auto custom-scrollbar bg-[#0c0c10] text-[#f0ead8] relative">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-amber-900/5 rounded-full blur-[140px] -mr-[30vw] -mt-[30vw] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-indigo-950/5 rounded-full blur-[120px] -ml-[25vw] -mb-[25vw] pointer-events-none"></div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6 relative z-10">
                <div>
                    <div className="flex items-center gap-5 mb-3">
                        <div className="w-2.5 h-10 bg-[#bf953f] rounded-full shadow-[0_0_15px_rgba(191,149,63,0.6)]"></div>
                        <h1 className="text-4xl font-black golden-text tracking-widest uppercase">我的角色档案 My Grimoire</h1>
                    </div>
                    <p className="text-[11px] font-black text-[#6b6250] ml-7 uppercase tracking-[0.4em]">英雄与调查员的记忆之殿堂</p>
                </div>
                <button onClick={() => navigate('/characters/new')} className="bg-gradient-to-br from-[#bf953f] to-[#aa771c] hover:from-[#fcf6ba] hover:to-[#bf953f] text-[#0c0c10] px-8 py-4 rounded-xl shadow-2xl shadow-black/60 font-black text-sm transition-all active:scale-95 flex items-center gap-3 uppercase tracking-widest">
                    <i className="fa-solid fa-feather-pointed"></i> 塑造新角色
                </button>
            </div>

            {characters.length === 0 ? (
                <div className="bg-[#141420]/40 border-2 border-dashed border-[#bf953f]/10 rounded-xl p-32 text-center group hover:border-[#bf953f]/30 transition-all relative z-10 shadow-inner">
                    <div className="w-20 h-20 bg-[#1e1e30] border border-[#bf953f]/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-xl">
                        <i className="fa-regular fa-folder-open text-3xl text-[#bf953f]/40 group-hover:text-[#bf953f] transition-colors"></i>
                    </div>
                    <p className="text-[#6b6250] font-black uppercase tracking-[0.5em] opacity-40">档案库空空如也，等待灵魂驻入</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 relative z-10">
                    {characters.map(c => (
                        <div key={c.id} className="bg-[#141420]/80 border border-[#bf953f]/10 rounded-xl p-8 hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)] hover:border-[#bf953f]/30 transition-all group relative overflow-hidden flex flex-col h-[260px]">
                            {/* Decorative Background */}
                            <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#bf953f]/5 rounded-full group-hover:bg-[#bf953f]/10 transition-colors"></div>

                            <div className="relative flex-1">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 bg-[#1e1e30] border border-[#bf953f]/10 rounded-xl flex items-center justify-center text-[#bf953f] text-3xl font-black group-hover:bg-[#bf953f] group-hover:text-[#0c0c10] transition-all shadow-2xl">
                                            {c.name[0]}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-[#f0ead8] group-hover:text-[#bf953f] transition-colors tracking-tight uppercase leading-tight">{c.name}</h3>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-[10px] font-black px-3 py-1 bg-[#bf953f]/10 text-[#bf953f] border border-[#bf953f]/20 rounded uppercase tracking-widest">{c.ruleSystem}</span>
                                                <span className="text-[10px] font-black px-3 py-1 bg-[#1e1e30] text-[#a89b7a] border border-[#bf953f]/5 rounded uppercase tracking-widest">RANK {c.level}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-[13px] text-[#6b6250] font-bold leading-relaxed italic line-clamp-2 mt-4 px-1 group-hover:text-[#a89b7a] transition-colors">
                                    "{c.summary || '这是一位神秘的角色，暂无详细描述...'}"
                                </div>
                            </div>

                            <div className="relative pt-6 flex gap-4 opacity-0 group-hover:opacity-100 transition-all translate-y-6 group-hover:translate-y-0">
                                <button className="flex-1 bg-[#1e1e30] hover:bg-[#bf953f] py-3 rounded-lg text-[10px] text-[#a89b7a] hover:text-[#0c0c10] font-black transition-all uppercase tracking-widest border border-[#bf953f]/10 shadow-lg" onClick={() => alert('记忆之门即将开启 (Coming Soon)')}>查看档案</button>
                                <button className="w-12 h-12 bg-red-950/20 hover:bg-red-600 border border-red-900/20 text-red-500 hover:text-white rounded-lg flex items-center justify-center transition-all active:scale-90" onClick={() => handleDelete(c.id)}>
                                    <i className="fa-solid fa-trash-can text-lg"></i>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
