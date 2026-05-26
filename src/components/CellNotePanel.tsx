import { useState } from 'react';
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

    if (!isOpen) return null;

    // Sync input states when cellData changes
    const currentTerrain = cellData?.terrain || '';
    const currentObject = cellData?.object || '';
    const currentUnit = cellData?.unit || '';

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
            unit: unit.trim() || undefined
        });
    };

    return (
        <div className="absolute right-0 top-0 h-full w-80 bg-ibm-layer border-l border-ibm-border z-30 flex flex-col shadow-lg animate-in slide-in-from-right duration-200">
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
                <div className="space-y-4 border-b border-ibm-border pb-6">
                    <h4 className="text-[11px] font-mono text-ibm-textSecondary uppercase tracking-widest">图层元素编辑</h4>
                    
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <label className="w-16 font-mono text-ibm-textSecondary text-[11px] uppercase">🌿 地形层:</label>
                            <input 
                                type="text"
                                placeholder="输入 Emoji (如 🌿, 🧱) 或文本"
                                value={terrain}
                                onChange={e => setTerrain(e.target.value)}
                                className="flex-1 bg-ibm-background border border-ibm-border px-2 py-1 text-ibm-text outline-none text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="w-16 font-mono text-ibm-textSecondary text-[11px] uppercase">🚪 物件层:</label>
                            <input 
                                type="text"
                                placeholder="输入 Emoji (如 🚪, 🗝️) 或文本"
                                value={object}
                                onChange={e => setObject(e.target.value)}
                                className="flex-1 bg-ibm-background border border-ibm-border px-2 py-1 text-ibm-text outline-none text-sm"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="w-16 font-mono text-ibm-textSecondary text-[11px] uppercase">👤 单位层:</label>
                            <input 
                                type="text"
                                placeholder="输入中文或 Emoji (如 👾, 战士)"
                                value={unit}
                                onChange={e => setUnit(e.target.value)}
                                className="flex-1 bg-ibm-background border border-ibm-border px-2 py-1 text-ibm-text outline-none text-sm"
                            />
                        </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                        {/* Reset values buttons */}
                        <button 
                            onClick={() => {
                                setTerrain(currentTerrain);
                                setObject(currentObject);
                                setUnit(currentUnit);
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
                        <textarea 
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
