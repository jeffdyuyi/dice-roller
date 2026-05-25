import { useState, useEffect } from 'react';
import type { CharacterTemplate, SheetModule } from '../features/template-builder/types';

interface DynamicSheetRendererProps {
    template: CharacterTemplate;
    data: Record<string, any>;
    onChange?: (moduleId: string, value: any) => void;
    readonly?: boolean;
}

function DebouncedTextarea({ value, onChange, disabled, className, placeholder }: any) {
    const [localVal, setLocalVal] = useState(value);

    useEffect(() => {
        setLocalVal(value);
    }, [value]);

    const handleBlur = () => {
        if (localVal !== value) {
            onChange(localVal);
        }
    };

    return (
        <textarea
            value={localVal}
            onChange={e => setLocalVal(e.target.value)}
            onBlur={handleBlur}
            disabled={disabled}
            className={className}
            placeholder={placeholder}
        />
    );
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
            case 'inventory':
            case 'memo':
                const items: any[] = modData.list || [];
                // Migration: if they had text, convert to list
                if (items.length === 0 && modData.text) {
                    items.push({ id: Date.now().toString(), text: modData.text });
                }

                return (
                    <div key={mod.id} className="border border-x-border p-5 h-full flex flex-col">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-x-border">
                            <h3 className="text-[12px] font-mono text-x-muted tracking-xai uppercase">{mod.label}</h3>
                            {!readonly && (
                                <button 
                                    onClick={() => handleChange(mod.id, { list: [...items, { id: Date.now().toString(), text: '' }] })}
                                    className="text-[10px] font-mono text-x-muted hover:text-x-white uppercase tracking-xai border border-x-border px-2 py-1 transition-colors"
                                >
                                    + 添加条目
                                </button>
                            )}
                        </div>
                        <div className="space-y-4 flex-1">
                            {items.map((item, idx) => {
                                // Graceful handling of old structured data
                                const itemText = item.text !== undefined 
                                    ? item.text 
                                    : (item.name ? `**${item.name}**\n${item.requirement || ''}\n${item.effect || ''}` : '');

                                return (
                                    <div key={item.id} className="bg-x-surface border border-x-border p-3 relative group">
                                        {!readonly && (
                                            <button 
                                                onClick={() => handleChange(mod.id, { list: items.filter(x => x.id !== item.id) })}
                                                className="absolute top-2 right-2 text-x-muted hover:text-red-500 transition-colors text-lg leading-none opacity-0 group-hover:opacity-100"
                                                title="删除该条目"
                                            >
                                                ×
                                            </button>
                                        )}
                                        <DebouncedTextarea 
                                            value={itemText}
                                            disabled={readonly}
                                            onChange={(val: string) => {
                                                const nl = [...items];
                                                nl[idx] = { ...nl[idx], text: val };
                                                handleChange(mod.id, { list: nl });
                                            }}
                                            className="w-full bg-transparent text-[14px] font-mono text-x-white outline-none resize-y min-h-[60px] disabled:opacity-50 pr-6 mt-1"
                                            placeholder="输入 Markdown 内容..."
                                        />
                                    </div>
                                );
                            })}
                            {items.length === 0 && <div className="text-x-muted text-[12px] font-mono italic">暂无内容</div>}
                        </div>
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
