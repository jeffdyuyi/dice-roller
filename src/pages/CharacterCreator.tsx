import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveCharacter } from '../features/characters/api';

export function CharacterCreator() {
    const navigate = useNavigate();
    const [memoName, setMemoName] = useState('');

    const handleSave = async () => {
        if (!memoName.trim()) return alert('备忘录名称不能为空！');

        const newMemo = {
            id: 'memo-' + Date.now().toString(36),
            userId: 'local-user', // Default user
            name: memoName.trim(),
            summary: '备忘库存',
            memoItems: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        await saveCharacter(newMemo as any);
        alert('备忘库已成功保存！');
        navigate('/characters');
    };

    return (
        <div className="p-8 pb-32 max-w-3xl mx-auto w-full h-full flex flex-col bg-ibm-background">
            <header className="mb-12 border-b border-ibm-border pb-6 shrink-0 flex flex-col gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/characters')}
                        className="h-8 px-4 border border-ibm-border hover:bg-ibm-layerHover text-ibm-text text-xs font-mono transition-all"
                    >
                        ← 返回备忘库存
                    </button>
                </div>
                <div>
                    <h1 className="text-ibm-text text-4xl font-sans font-light tracking-tight mb-2">新建备忘库</h1>
                    <p className="text-ibm-textSecondary font-sans text-sm">创建一个空白的备忘库，用于存放角色卡档案或记录冒险日记条目</p>
                </div>
            </header>

            <div className="bg-ibm-layer border border-ibm-border p-8 space-y-6">
                <div className="space-y-2">
                    <label className="text-[12px] font-mono uppercase tracking-widest text-ibm-textSecondary block">备忘库存名称</label>
                    <input 
                        type="text" 
                        value={memoName} 
                        onChange={e => setMemoName(e.target.value)} 
                        className="w-full bg-ibm-background border border-ibm-border text-ibm-text px-4 py-3 text-sm focus:border-ibm-primary outline-none transition-all placeholder:text-ibm-textSecondary/50 font-sans" 
                        placeholder="例如：DND 5E 战士雷恩 / 赛博朋克深网调查..." 
                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                    />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                    <button 
                        onClick={() => navigate('/characters')}
                        className="h-10 px-6 border border-ibm-border text-ibm-text hover:bg-ibm-layerHover transition-all text-xs font-mono"
                    >
                        取消
                    </button>
                    <button 
                        onClick={handleSave}
                        className="h-10 px-8 bg-ibm-primary text-ibm-textOnColor hover:bg-ibm-primaryHover transition-all text-xs font-mono"
                    >
                        确定并创建
                    </button>
                </div>
            </div>
        </div>
    );
}
