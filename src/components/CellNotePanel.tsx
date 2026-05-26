import { useState, useEffect, useRef } from 'react';
import EmojiPicker, { type EmojiClickData, Theme } from 'emoji-picker-react';
import type { CellData, CellNoteEntry } from '../features/whiteboards/types';

const ICON_PRESETS = ['🔥','🏰','🌲','🌳','🌊','⛰️','🕳️','🚪','🗝️','📦','💎','🪙','🏹','🕯️','👾','🐉','🛡️','🧙','🧟','💀','🐺','⚔️','🧪','📜','🏕️','🌀'];

const TERRAIN_COLORS = [
    { hex: '#7d9e70', label: '草原' },
    { hex: '#5588a3', label: '水体' },
    { hex: '#8e8d8a', label: '岩山' },
    { hex: '#d8c3a5', label: '沙漠' },
    { hex: '#d9825e', label: '熔岩' },
    { hex: '#4b604f', label: '森林' },
    { hex: '#6b3e26', label: '泥地' },
    { hex: '#2d2d2d', label: '暗域' },
];

function insertAtCursor(ta: HTMLTextAreaElement, before: string, after = '') {
    const s = ta.selectionStart, e = ta.selectionEnd;
    const sel = ta.value.substring(s, e);
    return {
        newText: ta.value.substring(0, s) + before + sel + after + ta.value.substring(e),
        cs: s + before.length,
        ce: s + before.length + sel.length
    };
}

function autoResize(ta: HTMLTextAreaElement) {
    ta.style.height = 'auto';
    ta.style.height = ta.scrollHeight + 'px';
}

const MD_BUTTONS: ({ l: string; b: string; a?: string; cls?: string; t: string } | null)[] = [
    { l: 'B', b: '**', a: '**', cls: 'font-bold', t: '加粗' },
    { l: 'I', b: '*', a: '*', cls: 'italic', t: '斜体' },
    { l: 'S', b: '~~', a: '~~', cls: 'line-through', t: '删除线' },
    null,
    { l: '#', b: '## ', t: '二级标题' },
    { l: '>', b: '> ', t: '引用' },
    { l: '•', b: '- ', t: '列表' },
    { l: '`', b: '`', a: '`', cls: 'font-mono', t: '行内代码' },
];

function MdToolbar({ taRef, onChange }: { taRef: React.RefObject<HTMLTextAreaElement>; onChange: (v: string) => void }) {
    const insert = (before: string, after = '') => {
        const ta = taRef.current;
        if (!ta) return;
        const { newText, cs, ce } = insertAtCursor(ta, before, after);
        onChange(newText);
        setTimeout(() => { ta.focus(); ta.setSelectionRange(cs, ce); autoResize(ta); }, 0);
    };
    return (
        <div className="flex items-center gap-0.5 px-2 py-1 border-b border-ibm-border/40 bg-ibm-background/60 shrink-0">
            {MD_BUTTONS.map((btn, i) => btn === null
                ? <span key={i} className="w-px self-stretch bg-ibm-border mx-1" />
                : <button key={btn.l} type="button" onClick={() => insert(btn.b, btn.a || '')}
                    className={`w-6 h-5 text-[10px] text-ibm-textSecondary hover:text-ibm-text hover:bg-ibm-layerHover border border-transparent hover:border-ibm-border transition-all ${btn.cls || ''}`}
                    title={btn.t}>{btn.l}</button>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Icon Selector (presets + full emoji picker)
// ---------------------------------------------------------------------------
function IconSelector({ value, onChange, onClose }: {
    value: string;
    onChange: (icon: string) => void;
    onClose: () => void;
}) {
    const [tab, setTab] = useState<'presets' | 'picker'>('presets');
    const [local, setLocal] = useState(value);

    const commit = (icon: string) => {
        onChange(icon);
        onClose();
    };

    const handleEmojiClick = (emojiData: EmojiClickData) => {
        commit(emojiData.emoji);
    };

    return (
        <div className="border-b border-ibm-border/60 bg-ibm-background animate-in slide-in-from-top-1 duration-150">
            {/* Tabs */}
            <div className="flex border-b border-ibm-border/40">
                {[
                    { key: 'presets', label: '常用预设' },
                    { key: 'picker', label: '🔍 完整 Emoji 库' }
                ].map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key as 'presets' | 'picker')}
                        className={`flex-1 px-2 py-1.5 text-[10px] font-mono transition-all ${tab === t.key
                            ? 'text-ibm-text border-b-2 border-ibm-primary bg-ibm-layer/50'
                            : 'text-ibm-textSecondary hover:text-ibm-text hover:bg-ibm-layerHover'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'presets' && (
                <div className="p-2.5 space-y-2">
                    <div className="flex items-center gap-2">
                        <input
                            autoFocus
                            type="text"
                            value={local}
                            onChange={e => setLocal(e.target.value.slice(0, 4))}
                            onKeyDown={e => { if (e.key === 'Enter') commit(local); }}
                            placeholder="自定义单字/Emoji..."
                            className="flex-1 bg-ibm-layer border border-ibm-border px-2 py-1 text-ibm-text outline-none text-sm"
                        />
                        <button onClick={() => commit(local)}
                            className="px-3 py-1 bg-ibm-primary text-ibm-textOnColor text-[11px] font-mono hover:bg-ibm-primaryHover transition-all">
                            确定
                        </button>
                        {local && (
                            <button onClick={() => commit('')}
                                className="px-2 py-1 border border-ibm-border text-ibm-textSecondary text-[10px] font-mono hover:bg-ibm-layerHover transition-all">
                                清除
                            </button>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {ICON_PRESETS.map(e => (
                            <button key={e} onClick={() => commit(e)}
                                className={`w-7 h-7 flex items-center justify-center text-base border transition-all ${local === e ? 'border-ibm-primary bg-ibm-primary/10' : 'border-ibm-border hover:bg-ibm-layerHover'}`}>
                                {e}
                            </button>
                        ))}
                    </div>
                    <button onClick={onClose}
                        className="text-[10px] font-mono text-ibm-textSecondary hover:text-ibm-text transition-all">
                        取消
                    </button>
                </div>
            )}

            {tab === 'picker' && (
                <div className="p-2">
                    <EmojiPicker
                        onEmojiClick={handleEmojiClick}
                        theme={Theme.DARK}
                        width="100%"
                        height={340}
                        searchPlaceholder="搜索 Emoji..."
                        lazyLoadEmojis
                    />
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Entry Card
// ---------------------------------------------------------------------------
interface EntryCardProps {
    entry: CellNoteEntry;
    onUpdate: (fields: Partial<CellNoteEntry>) => void;
    onDelete: () => void;
}

function EntryCard({ entry, onUpdate, onDelete }: EntryCardProps) {
    const [md, setMd] = useState(entry.mdContent);
    const [iconOpen, setIconOpen] = useState(false);
    const taRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => { setMd(entry.mdContent); }, [entry.id]);
    useEffect(() => { if (taRef.current) autoResize(taRef.current); }, []);

    return (
        <div className="border border-ibm-border bg-ibm-background group/card" style={{ backgroundColor: 'var(--bg-background)' }}>
            {/* Card Header */}
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-ibm-border/40 bg-ibm-layer/40">
                <button
                    onClick={() => setIconOpen(o => !o)}
                    className={`w-8 h-8 flex items-center justify-center text-lg shrink-0 transition-all ${
                        iconOpen ? 'bg-ibm-primary/30 border border-ibm-primary' : 'bg-ibm-primary/10 border border-ibm-primary/30 hover:bg-ibm-primary/20'
                    }`}
                    title="点击修改标记符号"
                >
                    {entry.icon || '?'}
                </button>
                <span className="flex-1 text-[10px] font-mono text-ibm-textSecondary truncate">
                    {entry.author} · {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button onClick={onDelete}
                    className="opacity-0 group-hover/card:opacity-100 text-[10px] font-mono text-ibm-textSecondary hover:text-[#fa4d56] transition-all px-1">
                    删除
                </button>
            </div>

            {/* Icon Selector (inline) */}
            {iconOpen && (
                <IconSelector
                    value={entry.icon || ''}
                    onChange={icon => { onUpdate({ icon: icon || undefined }); setIconOpen(false); }}
                    onClose={() => setIconOpen(false)}
                />
            )}

            {/* Markdown Toolbar */}
            <MdToolbar taRef={taRef as React.RefObject<HTMLTextAreaElement>} onChange={v => setMd(v)} />

            {/* Textarea */}
            <textarea
                ref={taRef}
                value={md}
                onChange={e => { setMd(e.target.value); autoResize(e.target); }}
                onBlur={() => { if (md !== entry.mdContent) onUpdate({ mdContent: md }); }}
                placeholder="在此录入 Markdown 备注内容..."
                className="w-full bg-transparent px-3 py-2.5 text-[12px] text-ibm-text outline-none resize-none min-h-[80px] leading-relaxed font-sans placeholder:text-ibm-textPlaceholder"
                style={{ overflow: 'hidden' }}
            />
        </div>
    );
}

// ---------------------------------------------------------------------------
// New Entry Form
// ---------------------------------------------------------------------------
function NewEntryForm({ myName, onAdd, onCancel }: {
    myName: string;
    onAdd: (entry: CellNoteEntry) => void;
    onCancel: () => void;
}) {
    const [icon, setIcon] = useState('');
    const [md, setMd] = useState('');
    const [iconOpen, setIconOpen] = useState(false);
    const taRef = useRef<HTMLTextAreaElement>(null);

    const commit = () => {
        onAdd({
            id: 'entry-' + Date.now().toString(36),
            icon: icon.trim() || undefined,
            mdContent: md,
            author: myName || '未命名',
            timestamp: Date.now()
        });
    };

    return (
        <div className="border border-ibm-primary/40 bg-ibm-background/30 animate-in slide-in-from-bottom-1 duration-150">
            {/* Icon Row */}
            <div className="px-3 pt-3 pb-2 border-b border-ibm-border/40 space-y-1.5">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-ibm-textSecondary uppercase shrink-0">标记符号:</span>
                    <button
                        onClick={() => setIconOpen(o => !o)}
                        className={`w-8 h-8 flex items-center justify-center text-lg border transition-all shrink-0 ${icon ? 'border-ibm-primary bg-ibm-primary/10' : 'border-ibm-border hover:bg-ibm-layerHover'}`}
                    >
                        {icon || '+'}
                    </button>
                    <span className="text-[10px] text-ibm-textPlaceholder">点击选择符号</span>
                </div>

                {iconOpen && (
                    <IconSelector
                        value={icon}
                        onChange={v => { setIcon(v); setIconOpen(false); }}
                        onClose={() => setIconOpen(false)}
                    />
                )}
            </div>

            {/* Markdown */}
            <MdToolbar taRef={taRef as React.RefObject<HTMLTextAreaElement>} onChange={v => setMd(v)} />
            <textarea
                ref={taRef}
                value={md}
                onChange={e => { setMd(e.target.value); autoResize(e.target); }}
                onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) commit(); }}
                placeholder="在此录入 Markdown 备注... (Ctrl+Enter 确认)"
                className="w-full bg-transparent px-3 py-2.5 text-[12px] text-ibm-text outline-none resize-none min-h-[80px] leading-relaxed font-sans placeholder:text-ibm-textPlaceholder"
                style={{ overflow: 'hidden' }}
            />

            <div className="flex justify-end gap-2 px-3 pb-3 pt-1 border-t border-ibm-border/30">
                <button onClick={onCancel}
                    className="px-3 py-1.5 text-[11px] font-mono border border-ibm-border hover:bg-ibm-layerHover text-ibm-textSecondary transition-all">
                    取消
                </button>
                <button onClick={commit}
                    className="px-4 py-1.5 text-[11px] font-medium bg-ibm-primary text-ibm-textOnColor hover:bg-ibm-primaryHover transition-all">
                    + 确认添加
                </button>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------------------
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
    const [entries, setEntries] = useState<CellNoteEntry[]>(cellData?.entries || []);
    const [currentColor, setCurrentColor] = useState(cellData?.color || '');
    const [addingNew, setAddingNew] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    // Sync when selected cell changes
    useEffect(() => {
        setEntries(cellData?.entries || []);
        setCurrentColor(cellData?.color || '');
        setAddingNew(false);
    }, [q, r]);

    if (!isOpen) return null;

    const handleColorClick = (hex: string) => {
        const nc = currentColor === hex ? '' : hex;
        setCurrentColor(nc);
        onUpdateCell({ color: nc || undefined });
    };

    const handleUpdateEntry = (entryId: string, fields: Partial<CellNoteEntry>) => {
        const updated = entries.map(e => e.id === entryId ? { ...e, ...fields } : e);
        setEntries(updated);
        onUpdateCell({ entries: updated });
    };

    const handleDeleteEntry = (entryId: string) => {
        const updated = entries.filter(e => e.id !== entryId);
        setEntries(updated);
        onUpdateCell({ entries: updated });
    };

    const handleAddEntry = (entry: CellNoteEntry) => {
        const updated = [...entries, entry];
        setEntries(updated);
        onUpdateCell({ entries: updated });
        setAddingNew(false);
    };

    // -------------------------------------------------------------------------
    // Collapsed state: thin strip on the right edge
    // -------------------------------------------------------------------------
    if (collapsed) {
        return (
            <div
                className="absolute right-0 top-0 h-full w-8 bg-ibm-layer border-l border-ibm-border z-30 flex flex-col items-center shadow-xl cursor-pointer hover:bg-ibm-layerHover transition-colors"
                onClick={() => setCollapsed(false)}
                title="展开编辑面板"
                onWheel={e => e.stopPropagation()}
                style={{ backgroundColor: 'var(--bg-layer-01)' }}
            >
                {/* Expand Arrow */}
                <div className="w-8 h-8 flex items-center justify-center text-ibm-primary text-sm mt-2">
                    ◁
                </div>
                {/* Rotated Label */}
                <div className="flex-1 flex items-center justify-center">
                    <span
                        className="text-[9px] font-mono text-ibm-textSecondary uppercase tracking-widest whitespace-nowrap"
                        style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                    >
                        ({q},{r}) · {entries.length}层
                    </span>
                </div>
                {/* Blue dot if has entries */}
                {entries.length > 0 && (
                    <div className="w-2 h-2 rounded-full bg-ibm-primary mb-4" />
                )}
            </div>
        );
    }

    // -------------------------------------------------------------------------
    // Expanded state: full panel
    // -------------------------------------------------------------------------
    return (
        <div
            className="absolute right-0 top-0 h-full w-[480px] bg-ibm-layer border-l border-ibm-border z-30 flex flex-col shadow-xl transition-all duration-200"
            onWheel={e => e.stopPropagation()}
            style={{ backgroundColor: 'var(--bg-layer-01)' }}
        >
            {/* Header */}
            <div className="px-4 py-3 border-b border-ibm-border flex items-center justify-between bg-ibm-background/60 shrink-0">
                <div>
                    <p className="text-[13px] font-mono text-ibm-text uppercase tracking-wider">地块属性编辑</p>
                    <p className="text-[10px] font-mono text-ibm-textSecondary mt-0.5">
                        坐标 ({q}, {r}) · {entries.length} 个内容层
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    {/* Collapse Button */}
                    <button
                        onClick={() => setCollapsed(true)}
                        className="w-8 h-8 border border-ibm-border hover:bg-ibm-layerHover text-ibm-textSecondary flex items-center justify-center font-mono text-sm transition-all"
                        title="收起面板"
                    >
                        ▷
                    </button>
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="w-8 h-8 border border-ibm-border hover:bg-ibm-layerHover text-ibm-textSecondary flex items-center justify-center font-mono text-sm transition-all"
                        title="关闭"
                    >
                        X
                    </button>
                </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {/* === Color Section === */}
                <div className="px-4 py-3 border-b border-ibm-border">
                    <p className="text-[10px] font-mono text-ibm-textSecondary uppercase mb-2">🎨 地貌背景色 (即选即生效)</p>
                    <div className="flex items-center gap-2 flex-wrap">
                        {TERRAIN_COLORS.map(item => (
                            <div key={item.hex} className="flex flex-col items-center gap-0.5">
                                <button
                                    type="button"
                                    onClick={() => handleColorClick(item.hex)}
                                    className={`w-7 h-7 rounded-full transition-all ${currentColor === item.hex
                                        ? 'ring-2 ring-offset-1 ring-ibm-text scale-110 ring-offset-ibm-layer'
                                        : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
                                    style={{ backgroundColor: item.hex }}
                                    title={item.label}
                                />
                                <span className="text-[8px] font-mono text-ibm-textSecondary">{item.label}</span>
                            </div>
                        ))}
                        {currentColor && (
                            <button onClick={() => handleColorClick(currentColor)}
                                className="text-[10px] font-mono text-ibm-textSecondary hover:text-ibm-text border border-ibm-border px-2 py-0.5 hover:bg-ibm-layerHover transition-all ml-1">
                                清除
                            </button>
                        )}
                    </div>
                </div>

                {/* === Entries Section === */}
                <div className="px-4 py-3 space-y-3">
                    <p className="text-[10px] font-mono text-ibm-textSecondary uppercase">📌 地块内容层</p>

                    {entries.length === 0 && !addingNew && (
                        <div className="py-8 text-center text-ibm-textPlaceholder text-[12px] font-sans border border-dashed border-ibm-border">
                            暂无内容层，点击下方按钮添加。
                        </div>
                    )}

                    {entries.map(entry => (
                        <EntryCard
                            key={entry.id}
                            entry={entry}
                            onUpdate={fields => handleUpdateEntry(entry.id, fields)}
                            onDelete={() => handleDeleteEntry(entry.id)}
                        />
                    ))}

                    {addingNew && (
                        <NewEntryForm
                            myName={myName}
                            onAdd={handleAddEntry}
                            onCancel={() => setAddingNew(false)}
                        />
                    )}

                    {!addingNew && (
                        <button
                            onClick={() => setAddingNew(true)}
                            className="w-full py-2 border border-dashed border-ibm-border hover:border-ibm-borderStrong hover:bg-ibm-layerHover text-ibm-textSecondary hover:text-ibm-text text-[11px] font-mono transition-all flex items-center justify-center gap-2"
                        >
                            + 添加地块内容层
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
