import type { CharacterTemplate, SheetModule } from '../features/template-builder/types';

interface DynamicSheetRendererProps {
    template: CharacterTemplate;
    data: Record<string, any>;
    onChange?: (moduleId: string, value: any) => void;
    readonly?: boolean;
}

export function DynamicSheetRenderer({ template, data, onChange, readonly = false }: DynamicSheetRendererProps) {
    
    const handleChange = (moduleId: string, value: any) => {
        if (!onChange || readonly) return;
        onChange(moduleId, value);
    };

    const renderModule = (mod: SheetModule) => {
        const modData = data[mod.id] || {};

        switch (mod.type) {
            case 'variable_stat':
                const current = modData.current ?? mod.defaultCurrent;
                const max = modData.max ?? mod.defaultMax;
                return (
                    <div key={mod.id} className="border border-x-border p-5 bg-x-surface">
                        <div className="flex justify-between items-center">
                            <span className="text-[14px] font-mono tracking-xai uppercase text-x-white">{mod.label}</span>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    value={current} 
                                    onChange={e => handleChange(mod.id, { ...modData, current: parseInt(e.target.value)||0 })}
                                    disabled={readonly}
                                    className="w-16 bg-transparent border-b border-x-border text-center font-mono text-x-white outline-none focus:border-x-white disabled:opacity-50"
                                />
                                <span className="text-x-muted font-mono">/</span>
                                <input 
                                    type="number" 
                                    value={max} 
                                    onChange={e => handleChange(mod.id, { ...modData, max: parseInt(e.target.value)||0 })}
                                    disabled={readonly}
                                    className="w-16 bg-transparent border-b border-x-border text-center font-mono text-x-white outline-none focus:border-x-white disabled:opacity-50"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 'attribute':
                return (
                    <div key={mod.id} className="border border-x-border p-5">
                        <h3 className="text-[12px] font-mono text-x-muted tracking-xai uppercase mb-4 pb-2 border-b border-x-border">{mod.label}</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {mod.fields.map(f => (
                                <div key={f.id} className="flex flex-col gap-1">
                                    <label className="text-[10px] font-mono text-x-muted uppercase">{f.name}</label>
                                    <input 
                                        type={f.valueType === 'number' ? 'number' : 'text'}
                                        value={modData[f.id] || ''}
                                        onChange={e => handleChange(mod.id, { ...modData, [f.id]: f.valueType === 'number' ? parseFloat(e.target.value) : e.target.value })}
                                        disabled={readonly}
                                        className="bg-transparent border border-x-border p-2 text-x-white font-sans text-[14px] outline-none focus:border-x-white disabled:opacity-50"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'trait':
                const traits: any[] = modData.list || [];
                return (
                    <div key={mod.id} className="border border-x-border p-5">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-x-border">
                            <h3 className="text-[12px] font-mono text-x-muted tracking-xai uppercase">{mod.label}</h3>
                            {!readonly && (
                                <button 
                                    onClick={() => handleChange(mod.id, { list: [...traits, { id: Date.now().toString(), name: '新特性', requirement: '', effect: '' }] })}
                                    className="text-[10px] font-mono text-x-muted hover:text-x-white uppercase tracking-xai border border-x-border px-2 py-1"
                                >
                                    + 添加
                                </button>
                            )}
                        </div>
                        <div className="space-y-4">
                            {traits.map((t, idx) => (
                                <div key={t.id} className="bg-x-surface border border-x-border p-3 space-y-2 relative">
                                    {!readonly && (
                                        <button 
                                            onClick={() => handleChange(mod.id, { list: traits.filter(x => x.id !== t.id) })}
                                            className="absolute top-2 right-2 text-x-muted hover:text-x-white font-mono"
                                        >X</button>
                                    )}
                                    <input 
                                        type="text" value={t.name} disabled={readonly}
                                        onChange={e => { const nl = [...traits]; nl[idx].name = e.target.value; handleChange(mod.id, { list: nl }); }}
                                        className="w-full bg-transparent text-[14px] font-bold text-x-white outline-none disabled:opacity-50" placeholder="特性名称"
                                    />
                                    <input 
                                        type="text" value={t.requirement} disabled={readonly}
                                        onChange={e => { const nl = [...traits]; nl[idx].requirement = e.target.value; handleChange(mod.id, { list: nl }); }}
                                        className="w-full bg-transparent text-[12px] font-mono text-x-muted outline-none disabled:opacity-50" placeholder="需求/细节"
                                    />
                                    <textarea 
                                        value={t.effect} disabled={readonly} rows={2}
                                        onChange={e => { const nl = [...traits]; nl[idx].effect = e.target.value; handleChange(mod.id, { list: nl }); }}
                                        className="w-full bg-transparent text-[12px] font-sans text-x-white outline-none resize-none mt-1 disabled:opacity-50" placeholder="效果描述"
                                    />
                                </div>
                            ))}
                            {traits.length === 0 && <div className="text-x-muted text-[12px] font-mono italic">暂无内容</div>}
                        </div>
                    </div>
                );
            case 'inventory':
                const items: any[] = modData.list || [];
                return (
                    <div key={mod.id} className="border border-x-border p-5">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-x-border">
                            <h3 className="text-[12px] font-mono text-x-muted tracking-xai uppercase">{mod.label}</h3>
                            {!readonly && (
                                <button 
                                    onClick={() => handleChange(mod.id, { list: [...items, { id: Date.now().toString(), values: {} }] })}
                                    className="text-[10px] font-mono text-x-muted hover:text-x-white uppercase tracking-xai border border-x-border px-2 py-1"
                                >
                                    + 添加物品
                                </button>
                            )}
                        </div>
                        <div className="space-y-2">
                            {items.map((item, idx) => (
                                <div key={item.id} className="flex items-start gap-2 relative bg-x-surface p-2 border border-x-border">
                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                        {mod.itemFields.map(f => (
                                            <input 
                                                key={f.id}
                                                type={f.valueType === 'number' ? 'number' : 'text'}
                                                value={item.values[f.id] || ''}
                                                disabled={readonly}
                                                onChange={e => {
                                                    const nl = [...items]; 
                                                    nl[idx].values = { ...nl[idx].values, [f.id]: f.valueType === 'number' ? parseFloat(e.target.value) : e.target.value };
                                                    handleChange(mod.id, { list: nl });
                                                }}
                                                className="bg-transparent border-b border-x-border p-1 text-x-white font-sans text-[12px] outline-none disabled:opacity-50" 
                                                placeholder={f.name}
                                            />
                                        ))}
                                    </div>
                                    {!readonly && (
                                        <button 
                                            onClick={() => handleChange(mod.id, { list: items.filter(x => x.id !== item.id) })}
                                            className="text-x-muted hover:text-x-white font-mono px-2"
                                        >X</button>
                                    )}
                                </div>
                            ))}
                            {items.length === 0 && <div className="text-x-muted text-[12px] font-mono italic">暂无物品</div>}
                        </div>
                    </div>
                );
            case 'memo':
                return (
                    <div key={mod.id} className="border border-x-border p-5 h-full flex flex-col">
                        <h3 className="text-[12px] font-mono text-x-muted tracking-xai uppercase mb-4 pb-2 border-b border-x-border">{mod.label}</h3>
                        <textarea 
                            value={modData.text || ''}
                            disabled={readonly}
                            onChange={e => handleChange(mod.id, { text: e.target.value })}
                            className="flex-1 w-full bg-transparent text-[14px] font-mono text-x-white outline-none resize-none disabled:opacity-50 min-h-[120px]"
                            placeholder="输入 Markdown 文本..."
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="w-full space-y-6">
            {template.modules.map(mod => renderModule(mod))}
        </div>
    );
}
