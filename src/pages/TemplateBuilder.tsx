import { useState, useEffect } from 'react';
import type { CharacterTemplate, SheetModule, ModuleType } from '../features/template-builder/types';
import { v4 as uuidv4 } from 'uuid';

export function TemplateBuilder() {
    const [template, setTemplate] = useState<CharacterTemplate>({
        id: uuidv4(),
        name: '未命名模板',
        description: '',
        author: '系统',
        modules: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
    });

    const [savedTemplates, setSavedTemplates] = useState<CharacterTemplate[]>([]);
    
    useEffect(() => {
        const stored = localStorage.getItem('dice_roller_templates');
        if (stored) {
            setSavedTemplates(JSON.parse(stored));
        }
    }, []);

    const saveTemplate = () => {
        const t = { ...template, updatedAt: Date.now() };
        const nextList = [...savedTemplates.filter(x => x.id !== t.id), t];
        localStorage.setItem('dice_roller_templates', JSON.stringify(nextList));
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
                newModule = { id: baseId, type, label: '新行囊', itemFields: [{ id: uuidv4(), name: '名称', valueType: 'text' }] };
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
        return (
            <div key={mod.id} className="border border-x-border p-5 bg-x-surface relative group transition-all hover:border-x-borderStrong">
                <button onClick={() => removeModule(mod.id)} className="absolute top-4 right-4 text-x-muted hover:text-white font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    X
                </button>
                <div className="flex gap-4 items-start">
                    <div className="w-12 h-12 flex items-center justify-center border border-x-border text-x-muted shrink-0 font-mono text-[10px] uppercase tracking-xai">
                        {mod.type.substring(0, 3)}
                    </div>
                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-4 border-b border-x-border pb-4">
                            <span className="text-[12px] font-mono text-x-muted tracking-xai uppercase w-16">模块名</span>
                            <input 
                                type="text" 
                                value={mod.label} 
                                onChange={e => updateModule(mod.id, { label: e.target.value })}
                                className="bg-transparent text-x-white font-sans text-[16px] outline-none flex-1 placeholder:text-x-muted/30"
                                placeholder="输入展示名称"
                            />
                        </div>

                        {mod.type === 'variable_stat' && (
                            <div className="flex gap-4">
                                <div className="flex-1 flex items-center gap-4">
                                    <span className="text-[12px] font-mono text-x-muted tracking-xai uppercase">默认最大值</span>
                                    <input type="number" value={mod.defaultMax || 0} onChange={e => updateModule(mod.id, { defaultMax: parseInt(e.target.value)||0 })} className="w-20 bg-transparent border border-x-border p-2 text-x-white font-mono text-center outline-none" />
                                </div>
                            </div>
                        )}

                        {mod.type === 'attribute' && (
                            <div className="space-y-3">
                                <div className="text-[12px] font-mono text-x-muted tracking-xai uppercase">配置属性条目</div>
                                {mod.fields.map((f, i) => (
                                    <div key={f.id} className="flex gap-2 items-center">
                                        <input type="text" value={f.name} onChange={e => {
                                            const newFields = [...mod.fields];
                                            newFields[i].name = e.target.value;
                                            updateModule(mod.id, { fields: newFields });
                                        }} className="bg-transparent border border-x-border px-3 py-2 text-x-white flex-1 font-sans text-[14px] outline-none" placeholder="如: 力量" />
                                        <select value={f.valueType} onChange={e => {
                                            const newFields = [...mod.fields];
                                            newFields[i].valueType = e.target.value as 'number'|'text';
                                            updateModule(mod.id, { fields: newFields });
                                        }} className="bg-x-dark border border-x-border text-x-white px-3 py-2 font-mono text-[12px] outline-none">
                                            <option value="number">数字</option>
                                            <option value="text">文本</option>
                                        </select>
                                        <button onClick={() => {
                                            updateModule(mod.id, { fields: mod.fields.filter(x => x.id !== f.id) });
                                        }} className="w-9 h-9 border border-x-border text-x-muted hover:text-white transition-colors font-mono">X</button>
                                    </div>
                                ))}
                                <button onClick={() => updateModule(mod.id, { fields: [...mod.fields, { id: uuidv4(), name: '新属性', valueType: 'number' }] })} className="text-[12px] font-mono tracking-xai text-x-muted hover:text-x-white transition-colors border border-dashed border-x-border px-4 py-2 w-full text-center uppercase">
                                    + 添加属性
                                </button>
                            </div>
                        )}

                        {mod.type === 'inventory' && (
                            <div className="space-y-3">
                                <div className="text-[12px] font-mono text-x-muted tracking-xai uppercase">配置物品字段</div>
                                {mod.itemFields.map((f, i) => (
                                    <div key={f.id} className="flex gap-2 items-center">
                                        <input type="text" value={f.name} onChange={e => {
                                            const newFields = [...mod.itemFields];
                                            newFields[i].name = e.target.value;
                                            updateModule(mod.id, { itemFields: newFields });
                                        }} className="bg-transparent border border-x-border px-3 py-2 text-x-white flex-1 font-sans text-[14px] outline-none" placeholder="如: 伤害值" />
                                        <select value={f.valueType} onChange={e => {
                                            const newFields = [...mod.itemFields];
                                            newFields[i].valueType = e.target.value as 'number'|'text';
                                            updateModule(mod.id, { itemFields: newFields });
                                        }} className="bg-x-dark border border-x-border text-x-white px-3 py-2 font-mono text-[12px] outline-none">
                                            <option value="number">数字</option>
                                            <option value="text">文本</option>
                                        </select>
                                        <button onClick={() => {
                                            updateModule(mod.id, { itemFields: mod.itemFields.filter(x => x.id !== f.id) });
                                        }} className="w-9 h-9 border border-x-border text-x-muted hover:text-white transition-colors font-mono">X</button>
                                    </div>
                                ))}
                                <button onClick={() => updateModule(mod.id, { itemFields: [...mod.itemFields, { id: uuidv4(), name: '新字段', valueType: 'text' }] })} className="text-[12px] font-mono tracking-xai text-x-muted hover:text-x-white transition-colors border border-dashed border-x-border px-4 py-2 w-full text-center uppercase">
                                    + 添加字段
                                </button>
                            </div>
                        )}

                        {(mod.type === 'trait' || mod.type === 'memo') && (
                            <div className="text-[12px] font-mono text-x-muted tracking-xai uppercase border border-x-border border-dashed p-4 text-center">
                                [ {mod.type === 'trait' ? '该区域将自动渲染为特性列表' : '该区域将作为 Markdown 长文本编辑器'} ]
                            </div>
                        )}

                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-full w-full bg-x-dark text-x-white overflow-hidden font-sans">
            {/* Left Panel - Library / Builder Controls */}
            <aside className="w-72 border-r border-x-border flex flex-col shrink-0">
                <div className="p-6 border-b border-x-border">
                    <h2 className="text-[16px] font-sans leading-none mb-2">模板配置</h2>
                    <p className="text-[10px] font-mono text-x-muted tracking-xai uppercase">SYSTEM / TEMPLATE_BUILDER</p>
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
                        <button onClick={() => setTemplate({ id: uuidv4(), name: '未命名模板', description: '', author: '系统', modules: [], createdAt: Date.now(), updatedAt: Date.now() })} className="text-[12px] font-mono text-x-muted hover:text-white transition-colors uppercase tracking-xai w-full text-left">
                            + 新建空模板
                        </button>
                    </div>

                    <div className="h-px bg-x-border"></div>

                    <div className="space-y-4">
                        <label className="text-[12px] font-mono text-x-muted uppercase tracking-xai">添加功能模块</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => addModule('variable_stat')} className="border border-x-border bg-x-surface hover:border-x-white transition-all py-3 flex flex-col items-center gap-2 group">
                                <span className="font-mono text-[16px] group-hover:text-x-white text-x-muted">VS</span>
                                <span className="text-[10px] font-mono tracking-xai uppercase text-x-muted">可变数值</span>
                            </button>
                            <button onClick={() => addModule('attribute')} className="border border-x-border bg-x-surface hover:border-x-white transition-all py-3 flex flex-col items-center gap-2 group">
                                <span className="font-mono text-[16px] group-hover:text-x-white text-x-muted">AT</span>
                                <span className="text-[10px] font-mono tracking-xai uppercase text-x-muted">属性集</span>
                            </button>
                            <button onClick={() => addModule('trait')} className="border border-x-border bg-x-surface hover:border-x-white transition-all py-3 flex flex-col items-center gap-2 group">
                                <span className="font-mono text-[16px] group-hover:text-x-white text-x-muted">TR</span>
                                <span className="text-[10px] font-mono tracking-xai uppercase text-x-muted">特性区</span>
                            </button>
                            <button onClick={() => addModule('inventory')} className="border border-x-border bg-x-surface hover:border-x-white transition-all py-3 flex flex-col items-center gap-2 group">
                                <span className="font-mono text-[16px] group-hover:text-x-white text-x-muted">IN</span>
                                <span className="text-[10px] font-mono tracking-xai uppercase text-x-muted">背包流</span>
                            </button>
                            <button onClick={() => addModule('memo')} className="col-span-2 border border-x-border bg-x-surface hover:border-x-white transition-all py-3 flex flex-col items-center gap-2 group">
                                <span className="font-mono text-[16px] group-hover:text-x-white text-x-muted">ME</span>
                                <span className="text-[10px] font-mono tracking-xai uppercase text-x-muted">冒险记录</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-x-border">
                    <button onClick={saveTemplate} className="w-full bg-x-white text-x-dark py-4 font-mono uppercase tracking-xai hover:bg-white/90 transition-colors text-[14px]">
                        保存模板 / SAVE
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
                                <span className="text-[12px] font-mono text-x-muted uppercase tracking-xai">从左侧面板添加模块 / ADD MODULES</span>
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
