import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';
import { saveCharacter } from '../features/characters/api';
import type { CharacterTemplate } from '../features/template-builder/types';
import { DynamicSheetRenderer } from '../components/DynamicSheetRenderer';

export function CharacterCreator() {
    const { user, isLoggedIn } = useAuth();
    const navigate = useNavigate();

    const [templates, setTemplates] = useState<CharacterTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [charName, setCharName] = useState('');
    const [charData, setCharData] = useState<Record<string, any>>({});

    useEffect(() => {
        const stored = localStorage.getItem('dice_roller_templates');
        if (stored) {
            const parsed = JSON.parse(stored);
            setTemplates(parsed);
            if (parsed.length > 0) setSelectedTemplateId(parsed[0].id);
        }
    }, []);

    if (!isLoggedIn || !user) {
        return (
            <div className="flex justify-center items-center h-full text-x-muted bg-x-dark">
                <h2 className="text-[14px] font-mono uppercase tracking-xai">请先登录</h2>
            </div>
        );
    }

    const template = templates.find(t => t.id === selectedTemplateId);

    const handleSave = () => {
        if (!charName) return alert('角色名不能为空！');
        if (!template) return alert('请选择一个模板！');

        const newChar = {
            id: 'char-' + Date.now().toString(36),
            userId: user.id,
            templateId: template.id,
            name: charName,
            level: 1,
            summary: template.name,
            characterData: charData,
            createdAt: Date.now()
        };

        saveCharacter(newChar as any);
        alert('角色卡已成功保存！');
        navigate('/characters');
    };

    return (
        <div className="flex flex-col lg:flex-row w-full h-full bg-x-dark text-x-white relative font-sans overflow-hidden">
            {/* Form Section */}
            <div className="w-full lg:w-3/5 p-6 md:p-12 border-r border-x-border z-10 overflow-y-auto custom-scrollbar relative">
                <div className="flex justify-between items-center mb-16 pb-4 border-b border-x-border">
                    <div>
                        <h1 className="text-[32px] font-sans leading-none uppercase">塑造角色档案</h1>
                        <p className="text-[10px] font-mono text-x-muted tracking-xai uppercase mt-2">基于动态模板创建</p>
                    </div>
                </div>

                <div className="space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div>
                            <label className="block text-[10px] font-mono text-x-muted mb-2 uppercase tracking-xai">模板规则系统</label>
                            <select 
                                value={selectedTemplateId} 
                                onChange={e => { setSelectedTemplateId(e.target.value); setCharData({}); }} 
                                className="w-full bg-transparent border border-x-border px-4 py-3 text-x-white font-mono text-[14px] outline-none"
                            >
                                {templates.map(t => (
                                    <option key={t.id} value={t.id} className="bg-x-dark">{t.name}</option>
                                ))}
                                {templates.length === 0 && <option value="" disabled>暂无模板，请前往模板编辑器创建</option>}
                            </select>
                        </div>

                        <div>
                            <label className="block text-[10px] font-mono text-x-muted mb-2 uppercase tracking-xai">角色姓名</label>
                            <input 
                                type="text" 
                                value={charName} 
                                onChange={e => setCharName(e.target.value)} 
                                className="w-full bg-transparent border border-x-border px-4 py-3 text-x-white font-sans text-[16px] outline-none placeholder-x-muted" 
                                placeholder="输入姓名..." 
                            />
                        </div>
                    </div>

                    <div className="pt-8">
                        <div className="mb-6 flex items-center gap-4">
                            <span className="text-[12px] font-mono text-x-muted uppercase tracking-xai px-3 py-1 border border-x-border">填写区</span>
                        </div>
                        {template ? (
                            <DynamicSheetRenderer template={template} data={charData} onChange={(id, val) => setCharData(p => ({ ...p, [id]: val }))} />
                        ) : (
                            <div className="border border-dashed border-x-border p-16 text-center text-[12px] font-mono text-x-muted uppercase tracking-xai">暂无可用模板</div>
                        )}
                    </div>

                    <div className="pt-12 border-t border-x-border flex justify-end">
                        <button onClick={handleSave} className="bg-x-white text-x-dark hover:bg-white/90 font-mono py-4 px-12 text-[14px] uppercase tracking-xai transition-all">
                            保存角色卡数据
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            <div className="w-full lg:w-2/5 p-12 bg-x-surface relative overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-3 mb-8 self-start border border-x-border bg-x-dark px-4 py-2">
                    <span className="text-[10px] font-mono text-x-muted uppercase tracking-xai">最终数据预览</span>
                </div>
                {template && charName ? (
                    <div className="bg-x-dark border border-x-border p-8 shadow-2xl">
                        <h2 className="text-[24px] font-sans text-x-white mb-2">{charName}</h2>
                        <div className="text-[10px] font-mono text-x-muted uppercase tracking-xai mb-8 pb-4 border-b border-x-border">模板: {template.name}</div>
                        <DynamicSheetRenderer template={template} data={charData} readonly />
                    </div>
                ) : (
                    <div className="border border-dashed border-x-border p-16 text-center text-[12px] font-mono text-x-muted uppercase tracking-xai">输入姓名查看预览</div>
                )}
            </div>
        </div>
    );
}
