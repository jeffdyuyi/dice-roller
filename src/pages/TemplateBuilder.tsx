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
            <div key={mod.id} className="border border-x-border rounded-md bg-x-surface relative group transition-all shadow-sm">
                <div className="flex items-center justify-between px-5 py-3 border-b border-x-border bg-x-dark/30 rounded-t-md">
                    <div className="flex items-center gap-3 flex-1">
                        <span className="px-2 py-1 bg-x-white text-x-dark text-[10px] rounded-sm">{typeName}</span>
                        <input 
                            type="text" 
                            value={mod.label} 
                            onChange={e => updateModule(mod.id, { label: e.target.value })}
                            className="bg-transparent text-x-white font-sans text-[16px] font-bold outline-none flex-1 placeholder:text-x-muted/30"
                            placeholder="输入展示名称"
                        />
                    </div>
                    <button onClick={() => removeModule(mod.id)} className="text-x-muted hover:text-red-500 transition-colors text-xl leading-none">
                        ×
                    </button>
                </div>
                
                <div className="p-5 space-y-4">
                    {mod.type === 'variable_stat' && (
                        <div className="flex gap-4">
                            <div className="flex-1 flex items-center gap-4">
                                <span className="text-[12px] text-x-muted">默认最大值</span>
                                <input type="number" value={mod.defaultMax || 0} onChange={e => updateModule(mod.id, { defaultMax: parseInt(e.target.value)||0 })} className="w-20 bg-transparent border border-x-border rounded-sm p-2 text-x-white text-center outline-none" />
                            </div>
                        </div>
                    )}

                    {mod.type === 'attribute' && (
                        <div className="space-y-3">
                            <div className="text-[12px] text-x-muted">配置属性条目</div>
                            {mod.fields.map((f, i) => (
                                <div key={f.id} className="flex gap-2 items-center">
                                    <input type="text" value={f.name} onChange={e => {
                                        const newFields = [...mod.fields];
                                        newFields[i].name = e.target.value;
                                        updateModule(mod.id, { fields: newFields });
                                    }} className="bg-transparent border border-x-border rounded-sm px-3 py-2 text-x-white flex-1 font-sans text-[14px] outline-none" placeholder="如: 力量" />
                                    <select value={f.valueType} onChange={e => {
                                        const newFields = [...mod.fields];
                                        newFields[i].valueType = e.target.value as 'number'|'text';
                                        updateModule(mod.id, { fields: newFields });
                                    }} className="bg-x-dark border border-x-border rounded-sm text-x-white px-3 py-2 text-[12px] outline-none">
                                        <option value="number">数字</option>
                                        <option value="text">文本</option>
                                    </select>
                                    <button onClick={() => {
                                        updateModule(mod.id, { fields: mod.fields.filter(x => x.id !== f.id) });
                                    }} className="w-9 h-9 border border-x-border rounded-sm text-x-muted hover:text-white transition-colors">×</button>
                                </div>
                            ))}
                            <button onClick={() => updateModule(mod.id, { fields: [...mod.fields, { id: crypto.randomUUID(), name: '新属性', valueType: 'number' }] })} className="text-[12px] text-x-muted hover:text-x-white transition-colors border border-dashed border-x-border rounded-sm px-4 py-2 w-full text-center">
                                + 添加属性
                            </button>
                        </div>
                    )}

                    {(mod.type === 'trait' || mod.type === 'inventory' || mod.type === 'memo') && (
                        <div className="text-[12px] text-x-muted border border-x-border border-dashed rounded-sm p-4 text-center">
                            [ 该区域支持添加多条 Markdown 文本块 ]
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col md:flex-row h-full w-full bg-x-dark text-x-white overflow-hidden font-sans">
            {/* Left Panel - Library / Builder Controls */}
            <aside className="w-full md:w-72 border-b md:border-b-0 md:border-r border-x-border flex flex-col shrink-0 h-[40vh] md:h-full">
                <div className="p-6 border-b border-x-border">
                    <h2 className="text-[16px] font-sans leading-none">模板配置</h2>
                </div>
                
                <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                        <label className="text-[12px] font-mono text-x-muted uppercase tracking-xai">载入已有模板</label>
                        <select 
                            onChange={(e) => {
                                const t = savedTemplates.find(x => x.id === e.target.value);
                                if (t) setTemplate(t);
                            }}
                            value={template.id}
                            className="w-full bg-transparent border border-x-border text-x-white p-3 font-mono text-[14px] outline-none"
                        >
                            <option value="new" disabled>-- 选择模板 --</option>
                            {savedTemplates.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                        <button onClick={() => setTemplate({ id: crypto.randomUUID(), name: '未命名模板', description: '', author: '系统', modules: [], createdAt: Date.now(), updatedAt: Date.now() })} className="text-[12px] font-mono text-x-muted hover:text-white transition-colors uppercase tracking-xai w-full text-left">
                            + 新建空模板
                        </button>
                    </div>

                    <div className="h-px bg-x-border"></div>

                    <div className="space-y-4">
                        <label className="text-[12px] font-mono text-x-muted uppercase tracking-xai">添加功能模块</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => addModule('variable_stat')} className="border border-x-border rounded-md bg-x-surface hover:border-x-white transition-all py-3 flex items-center justify-center group shadow-sm">
                                <span className="text-[12px] group-hover:text-x-white text-x-muted">可变数值</span>
                            </button>
                            <button onClick={() => addModule('attribute')} className="border border-x-border rounded-md bg-x-surface hover:border-x-white transition-all py-3 flex items-center justify-center group shadow-sm">
                                <span className="text-[12px] group-hover:text-x-white text-x-muted">属性集</span>
                            </button>
                            <button onClick={() => addModule('trait')} className="border border-x-border rounded-md bg-x-surface hover:border-x-white transition-all py-3 flex items-center justify-center group shadow-sm">
                                <span className="text-[12px] group-hover:text-x-white text-x-muted">特性区</span>
                            </button>
                            <button onClick={() => addModule('inventory')} className="border border-x-border rounded-md bg-x-surface hover:border-x-white transition-all py-3 flex items-center justify-center group shadow-sm">
                                <span className="text-[12px] group-hover:text-x-white text-x-muted">背包流</span>
                            </button>
                            <button onClick={() => addModule('memo')} className="col-span-2 border border-x-border rounded-md bg-x-surface hover:border-x-white transition-all py-3 flex items-center justify-center group shadow-sm">
                                <span className="text-[12px] group-hover:text-x-white text-x-muted">冒险记录</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-x-border">
                    <button onClick={saveTemplate} className="w-full bg-x-white text-x-dark py-4 font-mono uppercase tracking-xai hover:bg-white/90 transition-colors text-[14px]">
                        保存模板
                    </button>
                </div>
            </aside>

            {/* Main Area - Canvas */}
            <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="max-w-4xl mx-auto space-y-8 pb-32">
                    <div className="space-y-4">
                        <input 
                            type="text" 
                            value={template.name}
                            onChange={e => setTemplate(p => ({ ...p, name: e.target.value }))}
                            className="bg-transparent text-[36px] font-sans text-x-white border-b border-x-border pb-4 w-full outline-none focus:border-x-white transition-colors"
                            placeholder="输入模板名称..."
                        />
                        <input 
                            type="text" 
                            value={template.description || ''}
                            onChange={e => setTemplate(p => ({ ...p, description: e.target.value }))}
                            className="bg-transparent text-[16px] font-sans text-x-muted border-b border-x-border pb-2 w-full outline-none focus:border-x-white transition-colors"
                            placeholder="输入模板简述..."
                        />
                    </div>

                    <div className="space-y-6">
                        {template.modules.length === 0 ? (
                            <div className="h-64 border border-dashed border-x-border flex items-center justify-center">
                                <span className="text-[12px] font-mono text-x-muted uppercase tracking-xai">从左侧面板添加功能模块</span>
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
