import { useState, useEffect } from 'react';
import type { CharacterTemplate, SheetModule, ModuleType } from '../features/template-builder/types';
import { Storage } from '../lib/storage';

export function TemplateBuilder() {
    const [template, setTemplate] = useState<CharacterTemplate>({
        id: crypto.randomUUID(),
        name: '未命名模板',
        description: '',
        author: '系统',
        modules: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
    });

    const [savedTemplates, setSavedTemplates] = useState<CharacterTemplate[]>([]);
    
    useEffect(() => {
        Storage.get<CharacterTemplate[]>('dice_roller_templates').then(stored => {
            if (stored) {
                setSavedTemplates(stored);
            }
        });
    }, []);

    const saveTemplate = async () => {
        const t = { ...template, updatedAt: Date.now() };
        const nextList = [...savedTemplates.filter(x => x.id !== t.id), t];
        await Storage.set('dice_roller_templates', nextList);
        setSavedTemplates(nextList);
        alert('模板已保存');
    };

    const addModule = (type: ModuleType) => {
        let newModule: SheetModule;
        const baseId = `${type}-${Date.now().toString().slice(-4)}`;
        
        switch (type) {
            case 'variable_stat':
                newModule = { id: baseId, type, label: '新数值', defaultCurrent: 10, defaultMax: 10 };
                break;
            case 'attribute':
                newModule = { id: baseId, type, label: '新属性区', fields: [] };
                break;
            case 'trait':
                newModule = { id: baseId, type, label: '新特性区' };
                break;
            case 'inventory':
                newModule = { id: baseId, type, label: '新行囊' };
                break;
            case 'memo':
                newModule = { id: baseId, type, label: '新记录区' };
                break;
        }
        
        setTemplate(prev => ({ ...prev, modules: [...prev.modules, newModule] }));
    };

    const removeModule = (id: string) => {
        setTemplate(prev => ({ ...prev, modules: prev.modules.filter(m => m.id !== id) }));
    };

    const updateModule = (id: string, updates: Partial<SheetModule>) => {
        setTemplate(prev => ({
            ...prev,
            modules: prev.modules.map(m => m.id === id ? { ...m, ...updates } as SheetModule : m)
        }));
    };

    const renderModuleEditor = (mod: SheetModule) => {
        let typeName = '';
        switch (mod.type) {
            case 'variable_stat': typeName = '可变数值'; break;
            case 'attribute': typeName = '属性集'; break;
            case 'trait': typeName = '特性区'; break;
            case 'inventory': typeName = '背包流'; break;
            case 'memo': typeName = '冒险记录'; break;
        }

        return (
            <div key={mod.id} className="bg-[#1d1d1f] border border-white/5 rounded-2xl relative group transition-all shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 bg-[#2c2c2e]/50 border-b border-white/5">
                    <div className="flex items-center gap-4 flex-1">
                        <span className="px-3 py-1 bg-white/10 text-white text-[12px] font-sans font-medium rounded-full">{typeName}</span>
                        <input 
                            type="text" 
                            value={mod.label} 
                            onChange={e => updateModule(mod.id, { label: e.target.value })}
                            className="bg-transparent text-white font-sans text-[16px] font-semibold outline-none flex-1 placeholder:text-white/30"
                            placeholder="输入展示名称"
                        />
                    </div>
                    <button onClick={() => removeModule(mod.id)} className="text-white/40 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-white/10">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 1L1 13M1 1L13 13"/></svg>
                    </button>
                </div>
                <div className="p-6 space-y-5">
                    {mod.type === 'variable_stat' && (
                        <div className="flex gap-4">
                            <div className="flex-1 flex items-center gap-4 bg-black/20 p-4 rounded-xl">
                                <span className="text-[13px] font-sans font-medium text-white/60">默认最大值</span>
                                <input type="number" value={mod.defaultMax || 0} onChange={e => updateModule(mod.id, { defaultMax: parseInt(e.target.value)||0 })} className="w-24 bg-[#2c2c2e] rounded-lg px-3 py-2 text-white text-center font-sans font-medium outline-none focus:ring-2 focus:ring-apple-blue transition-all" />
                            </div>
                        </div>
                    )}

                    {mod.type === 'attribute' && (
                        <div className="space-y-4">
                            <div className="text-[13px] font-sans font-medium text-white/60">配置属性条目</div>
                            {mod.fields.map((f, i) => (
                                <div key={f.id} className="flex gap-3 items-center">
                                    <input type="text" value={f.name} onChange={e => {
                                        const newFields = [...mod.fields];
                                        newFields[i].name = e.target.value;
                                        updateModule(mod.id, { fields: newFields });
                                    }} className="bg-[#2c2c2e] rounded-xl px-4 py-2.5 text-white flex-1 font-sans text-[14px] outline-none focus:ring-2 focus:ring-apple-blue transition-all" placeholder="如: 力量" />
                                    <select value={f.valueType} onChange={e => {
                                        const newFields = [...mod.fields];
                                        newFields[i].valueType = e.target.value as 'number'|'text';
                                        updateModule(mod.id, { fields: newFields });
                                    }} className="bg-[#2c2c2e] rounded-xl text-white px-4 py-2.5 text-[14px] font-sans outline-none appearance-none cursor-pointer">
                                        <option value="number">数字</option>
                                        <option value="text">文本</option>
                                    </select>
                                    <button onClick={() => {
                                        updateModule(mod.id, { fields: mod.fields.filter(x => x.id !== f.id) });
                                    }} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-red-500/20 rounded-xl text-white/40 hover:text-red-400 transition-colors">
                                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 1L1 13M1 1L13 13"/></svg>
                                    </button>
                                </div>
                            ))}
                            <button onClick={() => updateModule(mod.id, { fields: [...mod.fields, { id: crypto.randomUUID(), name: '新属性', valueType: 'number' }] })} className="text-[13px] font-sans font-medium text-apple-blue hover:text-blue-400 transition-colors border border-dashed border-white/10 hover:border-apple-blue/50 rounded-xl px-4 py-3 w-full text-center">
                                + 添加属性
                            </button>
                        </div>
                    )}

                    {(mod.type === 'trait' || mod.type === 'inventory' || mod.type === 'memo') && (
                        <div className="text-[13px] font-sans text-white/40 border border-white/5 border-dashed rounded-xl p-6 text-center bg-black/10">
                            [ 该区域支持添加多条 Markdown 文本块 ]
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col md:flex-row h-full w-full bg-black text-white overflow-hidden font-sans">
            {/* Left Panel - Library / Builder Controls */}
            <aside className="w-full md:w-80 bg-[#1c1c1e] border-b md:border-b-0 md:border-r border-white/5 flex flex-col shrink-0 h-[40vh] md:h-full relative z-20">
                <div className="p-6 border-b border-white/5">
                    <h2 className="text-[18px] font-sans font-semibold tracking-tight">模板开发配置</h2>
                </div>
                
                <div className="p-6 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="space-y-3">
                        <label className="text-[13px] font-sans font-medium text-white/60">载入已有模板</label>
                        <div className="relative">
                            <select 
                                onChange={(e) => {
                                    const t = savedTemplates.find(x => x.id === e.target.value);
                                    if (t) setTemplate(t);
                                }}
                                value={template.id}
                                className="w-full bg-[#2c2c2e] rounded-xl text-white px-4 py-3 font-sans text-[14px] outline-none appearance-none cursor-pointer"
                            >
                                <option value="new" disabled>-- 选择模板 --</option>
                                {savedTemplates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none text-xs">▼</span>
                        </div>
                        <button onClick={() => setTemplate({ id: crypto.randomUUID(), name: '未命名模板', description: '', author: '系统', modules: [], createdAt: Date.now(), updatedAt: Date.now() })} className="text-[13px] font-sans font-medium text-apple-blue hover:text-blue-400 transition-colors w-full text-left pt-2 inline-block">
                            + 新建空模板
                        </button>
                    </div>

                    <div className="h-px bg-white/5"></div>

                    <div className="space-y-4">
                        <label className="text-[13px] font-sans font-medium text-white/60">添加功能模块</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => addModule('variable_stat')} className="bg-[#2c2c2e] hover:bg-[#3a3a3c] rounded-xl transition-all py-3 flex items-center justify-center group shadow-sm">
                                <span className="text-[13px] font-sans font-medium group-hover:text-white text-white/70">可变数值</span>
                            </button>
                            <button onClick={() => addModule('attribute')} className="bg-[#2c2c2e] hover:bg-[#3a3a3c] rounded-xl transition-all py-3 flex items-center justify-center group shadow-sm">
                                <span className="text-[13px] font-sans font-medium group-hover:text-white text-white/70">属性集</span>
                            </button>
                            <button onClick={() => addModule('trait')} className="bg-[#2c2c2e] hover:bg-[#3a3a3c] rounded-xl transition-all py-3 flex items-center justify-center group shadow-sm">
                                <span className="text-[13px] font-sans font-medium group-hover:text-white text-white/70">特性区</span>
                            </button>
                            <button onClick={() => addModule('inventory')} className="bg-[#2c2c2e] hover:bg-[#3a3a3c] rounded-xl transition-all py-3 flex items-center justify-center group shadow-sm">
                                <span className="text-[13px] font-sans font-medium group-hover:text-white text-white/70">背包流</span>
                            </button>
                            <button onClick={() => addModule('memo')} className="col-span-2 bg-[#2c2c2e] hover:bg-[#3a3a3c] rounded-xl transition-all py-3 flex items-center justify-center group shadow-sm">
                                <span className="text-[13px] font-sans font-medium group-hover:text-white text-white/70">冒险记录</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-white/5">
                    <button onClick={saveTemplate} className="w-full bg-apple-blue text-white rounded-full py-3.5 font-sans font-medium hover:bg-apple-blue/90 hover:scale-[0.98] active:bg-[#ededf2] active:text-[#1d1d1f] transition-all text-[15px] shadow-sm">
                        保存模板至本地库
                    </button>
                </div>
            </aside>

            {/* Main Area - Canvas */}
            <main className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar bg-black relative z-10">
                <div className="max-w-3xl mx-auto space-y-10 pb-32">
                    <div className="space-y-4">
                        <input 
                            type="text" 
                            value={template.name}
                            onChange={e => setTemplate(p => ({ ...p, name: e.target.value }))}
                            className="bg-transparent text-[40px] font-sans font-semibold tracking-tight text-white border-b border-white/10 pb-4 w-full outline-none focus:border-white/30 transition-colors placeholder:text-white/20"
                            placeholder="输入模板名称..."
                        />
                        <input 
                            type="text" 
                            value={template.description || ''}
                            onChange={e => setTemplate(p => ({ ...p, description: e.target.value }))}
                            className="bg-transparent text-[18px] font-sans text-white/50 border-b border-white/10 pb-3 w-full outline-none focus:border-white/30 transition-colors placeholder:text-white/20"
                            placeholder="输入模板简述 (可选)..."
                        />
                    </div>

                    <div className="space-y-6">
                        {template.modules.length === 0 ? (
                            <div className="h-[300px] border border-dashed border-white/10 rounded-3xl flex items-center justify-center">
                                <span className="text-[15px] font-sans text-white/30">请从左侧面板添加功能模块，拼装您的角色卡</span>
                            </div>
                        ) : (
                            template.modules.map(mod => renderModuleEditor(mod))
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
