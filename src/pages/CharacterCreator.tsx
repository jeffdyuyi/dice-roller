import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';
import { saveCharacter } from '../features/characters/api';

export function CharacterCreator() {
    const { user, isLoggedIn } = useAuth();
    const navigate = useNavigate();

    const [memoName, setMemoName] = useState('');

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
            memoItems: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        await saveCharacter(newMemo as any);
        alert('备忘录已成功保存！');
        navigate('/characters');
    };

    return (
        <div className="flex flex-col w-full h-full bg-x-dark text-x-white relative font-sans overflow-hidden">
            <div className="w-full max-w-4xl mx-auto p-6 md:p-12 z-10 overflow-y-auto custom-scrollbar relative">
                <div className="flex justify-between items-center mb-12 border-b border-x-border pb-6">
                    <div>
                        <h1 className="text-[34px] font-sans font-semibold tracking-tight text-x-white leading-tight">新建备忘库存</h1>
                        <p className="text-[14px] font-sans text-x-muted mt-1">创建一个空白的备忘录，用于存放规则速查、物品或者角色设定</p>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="group">
                        <label className="block text-[12px] font-mono uppercase tracking-xai font-medium text-x-muted mb-3 transition-colors group-focus-within:text-x-white">备忘录名称</label>
                        <input 
                            type="text" 
                            value={memoName} 
                            onChange={e => setMemoName(e.target.value)} 
                            className="w-full bg-x-surface focus:bg-transparent border border-x-border rounded-none px-6 py-4 text-[16px] font-sans text-x-white outline-none focus:border-x-white transition-all placeholder:text-x-muted" 
                            placeholder="如：DND 5E 战士背包 / 赛博朋克调查笔记..." 
                        />
                    </div>

                    <div className="pt-8 flex justify-end">
                        <button onClick={handleSave} className="bg-x-white text-x-dark rounded-none font-mono uppercase tracking-xai font-medium py-3.5 px-12 text-[12px] transition-all hover:bg-white/90">
                            保存并创建
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
