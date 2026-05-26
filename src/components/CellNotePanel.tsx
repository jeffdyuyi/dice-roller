import { useState, useEffect, useRef } from 'react';
import type { CellData, CellNoteEntry } from '../features/whiteboards/types';

interface CellNotePanelProps {
    isOpen: boolean;
    onClose: () => void;
    q: number;
    r: number;
    cellData: CellData | null;
    myName: string;
    onUpdateCell: (updatedData: Partial<CellData>) => void;
}

export function CellNotePanel({ isOpen, onClose, q, r, cellData, myName, onUpdateCell }: CellNotePanelProps) {
    const [newNote, setNewNote] = useState('');
    const [terrain, setTerrain] = useState(cellData?.terrain || '');
    const [object, setObject] = useState(cellData?.object || '');
    const [unit, setUnit] = useState(cellData?.unit || '');
    const [color, setColor] = useState(cellData?.color || '');

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Sync input states when q, r coordinates or cellData change
    useEffect(() => {
        setTerrain(cellData?.terrain || '');
        setObject(cellData?.object || '');
        setUnit(cellData?.unit || '');
        setColor(cellData?.color || '');
    }, [q, r, cellData]);

    if (!isOpen) return null;

    const currentTerrain = cellData?.terrain || '';
    const currentObject = cellData?.object || '';
    const currentUnit = cellData?.unit || '';
    const currentColor = cellData?.color || '';

    const handleAddNote = () => {
        if (!newNote.trim()) return;
        const newEntry: CellNoteEntry = {
            id: 'note-' + Date.now().toString(36),
            mdContent: newNote,
            author: myName || '未命名',
            timestamp: Date.now()
        };
        const updatedEntries = [...(cellData?.entries || []), newEntry];
        onUpdateCell({
            q,
            r,
            entries: updatedEntries
        });
        setNewNote('');
    };

    const handleDeleteNote = (noteId: string) => {
        if (!cellData) return;
        const updatedEntries = cellData.entries.filter(e => e.id !== noteId);
        onUpdateCell({
            q,
            r,
            entries: updatedEntries
        });
    };

    const handleSaveElements = () => {
        onUpdateCell({
            q,
            r,
            terrain: terrain.trim() || undefined,
            object: object.trim() || undefined,
            unit: unit.trim() || undefined,
            color: color || undefined
        });
    };

    const insertMarkdown = (before: string, after: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;

        const selectedText = text.substring(start, end);
        const replacement = before + selectedText + after;

        setNewNote(
            text.substring(0, start) +
            replacement +
            text.substring(end)
        );

        // Focus back and select inserted pattern
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(
                start + before.length,
                start + before.length + selectedText.length
            );
        }, 0);
    };

    return (
        <div 
            className="absolute right-0 top-0 h-full w-80 bg-ibm-layer border-l border-ibm-border z-30 flex flex-col shadow-lg animate-in slide-in-from-right duration-200"
            onWheel={(e) => e.stopPropagation()} // Stop wheel event propagation to prevent canvas zoom
        >
            {/* Header */}
            <div className="p-4 border-b border-ibm-border flex justify-between items-center bg-ibm-background/50">
                <div>
                    <h3 className="text-[14px] font-mono text-ibm-text uppercase tracking-xai">单元格属性</h3>
                    <p className="text-[11px] font-mono text-ibm-textSecondary mt-0.5">坐标: ({q}, {r})</p>
                </div>
                <button onClick={onClose} className="w-8 h-8 border border-ibm-border hover:bg-ibm-layerHover text-ibm-textSecondary transition-colors flex items-center justify-center font-mono text-sm">
                    X
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar text-[13px]">
                {/* Layer Settings */}
                <div className="space-y-5 border-b border-ibm-border pb-6">
                    <h4 className="text-[11px] font-mono text-ibm-textSecondary uppercase tracking-widest">图层元素编辑</h4>
                    
                    {/* Tactical Background Paint Picker */}
                    <div className="space-y-2 bg-ibm-background/30 p-2.5 border border-ibm-border">
                        <label className="font-mono text-ibm-textSecondary text-[11px] uppercase block">🎨 战术网格填色:</label>
                        <div className="flex flex-wrap gap-2 items-center mt-1">
                            {[
                                { hex: '#da1e28', label: '危险/熔岩' },
                                { hex: '#198038', label: '剧毒/酸液' },
                                { hex: '#002d9c', label: '深水/传送' },
                                { hex: '#b28600', label: '警戒/陷阱' },
                                { hex: '#525252', label: '迷雾/视线' },
                                { hex: '#8a6a4d', label: '泥泞/困难' }
                            ].map(item => (
                                <button
                                    key={item.hex}
                                    type="button"
                                    onClick={() => setColor(item.hex)}
                                    className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                                        color === item.hex ? 'border-ibm-text scale-115 shadow-md' : 'border-transparent hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: item.hex }}
                                    title={item.label}
                                />
                            ))}
                            {color && (
                                <button
                                    type="button"
                                    onClick={() => setColor('')}
                                    className="px-2 py-0.5 border border-ibm-border hover:bg-ibm-layerHover text-ibm-textSecondary text-[10px] font-mono transition-all ml-1"
                                >
                                    清除颜色
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Terrain Layer */}
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <label className="w-16 font-mono text-ibm-textSecondary text-[11px] uppercase">🔥 地形层:</label>
                                <input 
                                    type="text"
                                    placeholder="输入 Emoji 或文本"
                                    value={terrain}
                                    onChange={e => setTerrain(e.target.value)}
                                    className="flex-1 bg-ibm-background border border-ibm-border px-2 py-1 text-ibm-text outline-none text-sm"
                                />
                            </div>
                            <div className="flex flex-wrap gap-1 pl-18 mt-1">
                                {['🧱', '🏰', '🌲', '🌳', '🔥', '🌊', '⛰️', '🕳️'].map(emoji => (
                                    <button 
                                        key={emoji}
                                        type="button"
                                        onClick={() => setTerrain(emoji)}
                                        className="w-6 h-6 flex items-center justify-center border border-ibm-border bg-ibm-background hover:bg-ibm-layerHover hover:border-ibm-borderStrong text-xs transition-all"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Object Layer */}
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <label className="w-16 font-mono text-ibm-textSecondary text-[11px] uppercase">🚪 物件层:</label>
                                <input 
                                    type="text"
                                    placeholder="输入 Emoji 或文本"
                                    value={object}
                                    onChange={e => setObject(e.target.value)}
                                    className="flex-1 bg-ibm-background border border-ibm-border px-2 py-1 text-ibm-text outline-none text-sm"
                                />
                            </div>
                            <div className="flex flex-wrap gap-1 pl-18 mt-1">
                                {['🚪', '🗝️', '📦', '💎', '🪙', '🏹', '🕯️', '🍷'].map(emoji => (
                                    <button 
                                        key={emoji}
                                        type="button"
                                        onClick={() => setObject(emoji)}
                                        className="w-6 h-6 flex items-center justify-center border border-ibm-border bg-ibm-background hover:bg-ibm-layerHover hover:border-ibm-borderStrong text-xs transition-all"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Unit Layer */}
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <label className="w-16 font-mono text-ibm-textSecondary text-[11px] uppercase">👤 单位层:</label>
                                <input 
                                    type="text"
                                    placeholder="输入中文或 Emoji"
                                    value={unit}
                                    onChange={e => setUnit(e.target.value)}
                                    className="flex-1 bg-ibm-background border border-ibm-border px-2 py-1 text-ibm-text outline-none text-sm"
                                />
                            </div>
                            <div className="flex flex-wrap gap-1 pl-18 mt-1">
                                {['👾', '🐉', '🛡️', '🧙', '🏹', '🧟', '💀', '🐺'].map(emoji => (
                                    <button 
                                        key={emoji}
                                        type="button"
                                        onClick={() => setUnit(emoji)}
                                        className="w-6 h-6 flex items-center justify-center border border-ibm-border bg-ibm-background hover:bg-ibm-layerHover hover:border-ibm-borderStrong text-xs transition-all"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-2">
                        <button 
                            onClick={() => {
                                setTerrain(currentTerrain);
                                setObject(currentObject);
                                setUnit(currentUnit);
                                setColor(currentColor);
                            }}
                            className="px-3 py-1.5 border border-ibm-border hover:bg-ibm-layerHover text-ibm-text text-[11px] font-mono transition-all"
                        >
                            重置
                        </button>
                        <button 
                            onClick={handleSaveElements}
                            className="px-4 py-1.5 bg-ibm-primary text-ibm-textOnColor hover:bg-ibm-primaryHover text-[11px] font-medium transition-all"
                        >
                            保存图层
                        </button>
                    </div>
                </div>

                {/* Markdown Notes */}
                <div className="space-y-4 flex-1 flex flex-col">
                    <h4 className="text-[11px] font-mono text-ibm-textSecondary uppercase tracking-widest">MD 备注条目 ({cellData?.entries.length || 0})</h4>
                    
                    <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                        {cellData?.entries && cellData.entries.length > 0 ? (
                            cellData.entries.map(entry => (
                                <div key={entry.id} className="p-3 border border-ibm-border bg-ibm-background/40 relative group">
                                    <div className="flex justify-between items-center mb-1.5 border-b border-ibm-border/30 pb-1">
                                        <span className="text-[10px] font-mono text-ibm-textSecondary uppercase tracking-xai">{entry.author}</span>
                                        <button 
                                            onClick={() => handleDeleteNote(entry.id)}
                                            className="text-[10px] text-ibm-textSecondary hover:text-[#fa4d56] opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            删除
                                        </button>
                                    </div>
                                    <pre className="whitespace-pre-wrap font-sans text-ibm-text text-[12px] leading-relaxed select-text">{entry.mdContent}</pre>
                                    <div className="text-[9px] font-mono text-ibm-textSecondary text-right mt-1.5">
                                        {new Date(entry.timestamp).toLocaleTimeString()}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 text-ibm-textPlaceholder text-[12px] font-sans">
                                暂无备注标签，在下方输入可添加。
                            </div>
                        )}
                    </div>

                    {/* New Note Area */}
                    <div className="pt-2 space-y-2">
                        {/* Markdown Formatting Toolbar */}
                        <div className="flex gap-1 p-1 border border-ibm-border bg-ibm-layerHover/50 shrink-0">
                            <button 
                                type="button"
                                onClick={() => insertMarkdown('**', '**')} 
                                className="w-6 h-6 flex items-center justify-center text-ibm-textSecondary hover:text-ibm-text hover:bg-ibm-background border border-transparent hover:border-ibm-border transition-all font-sans font-bold text-xs" 
                                title="加粗 (Bold)"
                            >
                                B
                            </button>
                            <button 
                                type="button"
                                onClick={() => insertMarkdown('*', '*')} 
                                className="w-6 h-6 flex items-center justify-center text-ibm-textSecondary hover:text-ibm-text hover:bg-ibm-background border border-transparent hover:border-ibm-border transition-all font-sans italic text-xs" 
                                title="斜体 (Italic)"
                            >
                                I
                            </button>
                            <button 
                                type="button"
                                onClick={() => insertMarkdown('~~', '~~')} 
                                className="w-6 h-6 flex items-center justify-center text-ibm-textSecondary hover:text-ibm-text hover:bg-ibm-background border border-transparent hover:border-ibm-border transition-all font-sans line-through text-xs" 
                                title="删除线 (Strike)"
                            >
                                S
                            </button>
                            <div className="w-px bg-ibm-border mx-1 my-1"></div>
                            <button 
                                type="button"
                                onClick={() => insertMarkdown('> ')} 
                                className="w-6 h-6 flex items-center justify-center text-ibm-textSecondary hover:text-ibm-text hover:bg-ibm-background border border-transparent hover:border-ibm-border transition-all font-mono text-xs" 
                                title="引用 (Blockquote)"
                            >
                                &gt;
                            </button>
                            <button 
                                type="button"
                                onClick={() => insertMarkdown('- ')} 
                                className="w-6 h-6 flex items-center justify-center text-ibm-textSecondary hover:text-ibm-text hover:bg-ibm-background border border-transparent hover:border-ibm-border transition-all font-mono text-xs" 
                                title="无序列表 (List)"
                            >
                                •
                            </button>
                            <button 
                                type="button"
                                onClick={() => insertMarkdown('`', '`')} 
                                className="w-6 h-6 flex items-center justify-center text-ibm-textSecondary hover:text-ibm-text hover:bg-ibm-background border border-transparent hover:border-ibm-border transition-all font-mono text-xs" 
                                title="行内代码 (Code)"
                            >
                                `
                            </button>
                        </div>

                        <textarea 
                            ref={textareaRef}
                            placeholder="添加 Markdown 格式的备注..."
                            value={newNote}
                            onChange={e => setNewNote(e.target.value)}
                            className="w-full bg-ibm-background border border-ibm-border p-2 text-xs text-ibm-text outline-none focus:border-ibm-primary transition-colors min-h-[60px] resize-none"
                        />
                        <div className="flex justify-end">
                            <button 
                                onClick={handleAddNote}
                                className="px-4 py-1.5 bg-ibm-primary text-ibm-textOnColor hover:bg-ibm-primaryHover text-[11px] font-medium transition-all"
                            >
                                + 添加备注
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
