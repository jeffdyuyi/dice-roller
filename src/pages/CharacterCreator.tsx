import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';
import { saveCharacter } from '../features/characters/api';

export function CharacterCreator() {
    const { user, isLoggedIn } = useAuth();
    const navigate = useNavigate();

    const [memoName, setMemoName] = useState('');
    const [memoContent, setMemoContent] = useState('');

    if (!isLoggedIn || !user) {
        return (
            <div className="flex justify-center items-center h-full text-x-muted bg-x-dark">
                <h2 className="text-[14px] font-mono uppercase tracking-xai">请先登录</h2>
            </div>
        );
    }

    const handleSave = async () => {
        if (!memoName.trim()) return alert('备忘录名称不能为空！');

        const newMemo = {
            id: 'memo-' + Date.now().toString(36),
            userId: user.id,
            name: memoName,
            summary: '备忘库存',
            memoContent: memoContent,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        await saveCharacter(newMemo as any);
        alert('备忘录已成功保存！');
        navigate('/characters');
    };

    return (
        <div className="flex flex-col w-full h-full bg-black text-white relative font-sans overflow-hidden">
            <div className="w-full max-w-4xl mx-auto p-6 md:p-12 z-10 overflow-y-auto custom-scrollbar relative">
                <div className="flex justify-between items-center mb-12 border-b border-white/5 pb-6">
                    <div>
                        <h1 className="text-[34px] font-sans font-semibold tracking-tight text-white leading-tight">新建备忘库存</h1>
                        <p className="text-[14px] font-sans text-white/70 mt-1">创建一个空白的备忘录，用于存放规则速查、物品或者角色设定</p>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="group">
                        <label className="block text-[15px] font-sans font-medium text-white/80 mb-3 transition-colors group-focus-within:text-white">备忘录名称</label>
                        <input 
                            type="text" 
                            value={memoName} 
                            onChange={e => setMemoName(e.target.value)} 
                            className="w-full bg-[#1d1d1f] focus:bg-[#272729] rounded-2xl px-6 py-4 text-[16px] font-sans text-white outline-none focus:ring-2 focus:ring-apple-blue transition-all placeholder:text-white/70 shadow-sm border border-white/5" 
                            placeholder="如：DND 5E 战士背包 / 赛博朋克调查笔记..." 
                        />
                    </div>

                    <div className="group">
                        <label className="block text-[15px] font-sans font-medium text-white/80 mb-3 transition-colors group-focus-within:text-white">初始记录 (Markdown)</label>
                        <textarea
                            value={memoContent}
                            onChange={e => setMemoContent(e.target.value)}
                            className="w-full bg-[#1d1d1f] focus:bg-[#272729] rounded-2xl px-6 py-4 text-[15px] font-sans text-white outline-none focus:ring-2 focus:ring-apple-blue transition-all placeholder:text-white/70 shadow-sm border border-white/5 min-h-[300px] resize-y custom-scrollbar"
                            placeholder="您可以提前写下一些角色的初始设定、自带物品清单..."
                        />
                    </div>

                    <div className="pt-8 flex justify-end">
                        <button onClick={handleSave} className="bg-apple-blue text-white rounded-full font-sans font-medium py-3.5 px-12 text-[16px] transition-all hover:bg-apple-blue/90 hover:scale-[0.98] active:bg-[#ededf2] active:text-[#1d1d1f] shadow-sm">
                            保存并创建
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
