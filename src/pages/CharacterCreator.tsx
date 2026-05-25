import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';
import { saveCharacter } from '../features/characters/api';
import type { CharacterTemplate } from '../features/template-builder/types';
import { DynamicSheetRenderer } from '../components/DynamicSheetRenderer';
import { Storage } from '../lib/storage';

export function CharacterCreator() {
    const { user, isLoggedIn } = useAuth();
    const navigate = useNavigate();

    const [templates, setTemplates] = useState<CharacterTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [charName, setCharName] = useState('');
    const [charData, setCharData] = useState<Record<string, any>>({});

    useEffect(() => {
        Storage.get<CharacterTemplate[]>('dice_roller_templates').then(stored => {
            if (stored) {
                setTemplates(stored);
                if (stored.length > 0) setSelectedTemplateId(stored[0].id);
            }
        });
    }, []);

    if (!isLoggedIn || !user) {
        return (
            <div className="flex justify-center items-center h-full text-x-muted bg-x-dark">
                <h2 className="text-[14px] font-mono uppercase tracking-xai">请先登录</h2>
            </div>
        );
    }

    const template = templates.find(t => t.id === selectedTemplateId);

    const handleSave = async () => {
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

        await saveCharacter(newChar as any);
        alert('角色卡已成功保存！');
        navigate('/characters');
    };

    return (
        <div className="flex flex-col lg:flex-row w-full h-full bg-black text-white relative font-sans overflow-hidden">
            {/* Form Section */}
            <div className="w-full lg:w-3/5 p-6 md:p-12 z-10 overflow-y-auto custom-scrollbar relative border-r border-white/5">
                <div className="flex justify-between items-center mb-12">
                    <div>
                        <h1 className="text-[34px] font-sans font-semibold tracking-tight text-white leading-tight">塑造角色档案</h1>
                        <p className="text-[14px] font-sans text-white/50 mt-1">基于动态规则模板创建</p>
                    </div>
                </div>

                <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="group">
                            <label className="block text-[13px] font-sans font-medium text-white/60 mb-2 transition-colors group-focus-within:text-white">模板规则系统</label>
                            <div className="relative">
                                <select 
                                    value={selectedTemplateId} 
                                    onChange={e => { setSelectedTemplateId(e.target.value); setCharData({}); }} 
                                    className="w-full bg-[#1d1d1f] rounded-xl px-4 py-3 text-[15px] font-sans text-white outline-none focus:ring-2 focus:ring-apple-blue appearance-none cursor-pointer transition-all shadow-sm"
                                >
                                    {templates.map(t => (
                                        <option key={t.id} value={t.id} className="bg-[#1d1d1f]">{t.name}</option>
                                    ))}
                                    {templates.length === 0 && <option value="" disabled>暂无模板，请前往模板编辑器创建</option>}
                                </select>
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none text-xs">▼</span>
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-[13px] font-sans font-medium text-white/60 mb-2 transition-colors group-focus-within:text-white">角色姓名</label>
                            <input 
                                type="text" 
                                value={charName} 
                                onChange={e => setCharName(e.target.value)} 
                                className="w-full bg-[#1d1d1f] focus:bg-[#272729] rounded-xl px-4 py-3 text-[15px] font-sans text-white outline-none focus:ring-2 focus:ring-apple-blue transition-all placeholder:text-white/30 shadow-sm" 
                                placeholder="输入姓名..." 
                            />
                        </div>
                    </div>

                    <div className="pt-6">
                        <div className="mb-6">
                            <h2 className="text-[18px] font-sans font-medium text-white tracking-tight">属性与资料填写</h2>
                        </div>
                        <div className="bg-[#1d1d1f] rounded-2xl p-6 shadow-sm border border-white/5">
                            {template ? (
                                <DynamicSheetRenderer template={template} data={charData} onChange={(id, val) => setCharData(p => ({ ...p, [id]: val }))} />
                            ) : (
                                <div className="p-16 text-center text-[14px] font-sans text-white/40">暂无可用模板</div>
                            )}
                        </div>
                    </div>

                    <div className="pt-8 flex justify-end">
                        <button onClick={handleSave} className="bg-apple-blue text-white rounded-full font-sans font-medium py-3 px-10 text-[16px] transition-all hover:bg-apple-blue/90 hover:scale-[0.98] active:bg-[#ededf2] active:text-[#1d1d1f] shadow-sm">
                            保存角色卡数据
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            <div className="w-full lg:w-2/5 p-6 md:p-12 bg-[#1c1c1e] relative overflow-y-auto custom-scrollbar flex flex-col items-center">
                <div className="bg-black/30 rounded-full px-4 py-1.5 mb-8 text-[12px] font-sans text-white/50 shadow-sm border border-white/5">
                    最终数据预览
                </div>
                {template && charName ? (
                    <div className="bg-[#1d1d1f] rounded-3xl p-8 md:p-10 shadow-apple w-full max-w-lg border border-white/5 animate-in fade-in zoom-in-95 duration-500">
                        <div className="text-center mb-10 border-b border-white/5 pb-8">
                            <h2 className="text-[32px] font-sans font-semibold tracking-tight text-white mb-2">{charName}</h2>
                            <div className="inline-block px-3 py-1 bg-white/5 rounded-full text-[13px] font-sans font-medium text-white/50">{template.name}</div>
                        </div>
                        <DynamicSheetRenderer template={template} data={charData} readonly />
                    </div>
                ) : (
                    <div className="w-full max-w-lg rounded-3xl border border-dashed border-white/10 p-16 text-center text-[14px] font-sans text-white/30">输入姓名查看预览</div>
                )}
            </div>
        </div>
    );
}
