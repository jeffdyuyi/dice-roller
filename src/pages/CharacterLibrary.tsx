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
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 h-full bg-[#fdf8f4]">
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-slate-200 mb-6">
                    <i className="fa-solid fa-lock text-3xl text-slate-300"></i>
                </div>
                <h2 className="text-xl font-black text-slate-800 mb-2">欢迎来到秘密基地</h2>
                <p className="text-sm text-slate-500 max-w-xs text-center">请先登录您的账号，开启属于您的 TRPG 冒险之旅并管理您的角色卡。</p>
                <button onClick={() => { const un = prompt('请输入昵称:'); if (un) window.location.reload(); }} className="mt-8 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 transition-all active:scale-95">
                    立即登录
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
        <div className="p-6 md:p-12 w-full max-w-7xl mx-auto min-h-screen overflow-y-auto custom-scrollbar">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-2 h-8 bg-orange-500 rounded-full"></div>
                        <h1 className="text-3xl font-black text-slate-800">我的角色档案</h1>
                    </div>
                    <p className="text-sm font-bold text-slate-400 ml-5">管理您的英雄与调查员，准备随时带入房间</p>
                </div>
                <button onClick={() => navigate('/characters/new')} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-6 py-3 rounded-2xl shadow-xl shadow-indigo-100 font-black text-sm transition-all active:scale-95 flex items-center gap-2">
                    <i className="fa-solid fa-plus-circle"></i> 创建新角色
                </button>
            </div>

            {characters.length === 0 ? (
                <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-[2rem] p-20 text-center group hover:border-indigo-300 transition-colors">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                        <i className="fa-regular fa-folder-open text-2xl text-slate-400"></i>
                    </div>
                    <p className="text-slate-500 font-bold">档案库空空如也，快去创建一个吧</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {characters.map(c => (
                        <div key={c.id} className="bg-white border border-slate-100 rounded-[2rem] p-6 hover:shadow-2xl hover:shadow-indigo-100/50 transition-all group relative overflow-hidden flex flex-col h-[220px]">
                            {/* Decorative Background */}
                            <div className="absolute -top-12 -right-12 w-32 h-32 bg-slate-50 rounded-full group-hover:bg-indigo-50 transition-colors"></div>

                            <div className="relative flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-tr from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center text-slate-400 text-xl font-black group-hover:from-indigo-500 group-hover:to-purple-500 group-hover:text-white transition-all shadow-inner">
                                            {c.name[0]}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{c.name}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] font-black px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full uppercase tracking-tighter">{c.ruleSystem}</span>
                                                <span className="text-[10px] font-black px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full uppercase tracking-tighter">LVL {c.level}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-sm text-slate-500 font-medium leading-relaxed italic line-clamp-2">
                                    "{c.summary || '这是一位神秘的角色，暂无详细描述...'}"
                                </div>
                            </div>

                            <div className="relative pt-4 flex gap-3 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                                <button className="flex-1 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-xl text-xs text-slate-700 font-black transition-colors" onClick={() => alert('编辑功能即将上线')}>查看详情</button>
                                <button className="w-10 h-10 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-xl flex items-center justify-center transition-all" onClick={() => handleDelete(c.id)}>
                                    <i className="fa-solid fa-trash-can text-xs"></i>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
