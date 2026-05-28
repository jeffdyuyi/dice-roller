import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyCharacters, deleteCharacter, saveCharacter } from '../features/characters/api';
import type { Character, MemoItem } from '../features/characters/types';
import { MarkdownRenderer } from '../components/MarkdownRenderer';

export function CharacterLibrary() {
    const navigate = useNavigate();
    const [characters, setCharacters] = useState<Character[]>([]);
    
    // Detailed edit state
    const [selectedChar, setSelectedChar] = useState<Character | null>(null);
    const [editName, setEditName] = useState('');
    const [editSummary, setEditSummary] = useState('');
    const [newNoteContent, setNewNoteContent] = useState('');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    const refreshCharacters = async () => {
        const chars = await getMyCharacters('local-user');
        setCharacters(chars);
        // Sync detailed view if open
        if (selectedChar) {
            const updated = chars.find(c => c.id === selectedChar.id);
            if (updated) {
                setSelectedChar(updated);
            }
        }
    };

    useEffect(() => {
        refreshCharacters();
    }, []);

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('确认删除该角色备忘库吗？这会抹除其中的所有已存笔记条目！')) return;
        await deleteCharacter(id);
        await refreshCharacters();
    };

    const handleSelectChar = (char: Character) => {
        setSelectedChar(char);
        setEditName(char.name || '');
        setEditSummary(char.summary || '');
        setNewNoteContent('');
        setSaveStatus('idle');
    };

    const handleSaveChar = async () => {
        if (!selectedChar) return;
        if (!editName.trim()) {
            alert('角色名字不能为空！');
            return;
        }
        setSaveStatus('saving');
        const updatedChar: Character = {
            ...selectedChar,
            name: editName.trim(),
            summary: editSummary.trim(),
            updatedAt: Date.now()
        };
        await saveCharacter(updatedChar);
        setSelectedChar(updatedChar);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        await refreshCharacters();
    };

    const handleAddNote = async () => {
        if (!selectedChar || !newNoteContent.trim()) return;
        const newNote: MemoItem = {
            id: 'item-' + Date.now().toString(36),
            content: newNoteContent.trim(),
            createdAt: Date.now(),
            source: 'self'
        };
        const updatedChar: Character = {
            ...selectedChar,
            name: editName.trim(),
            summary: editSummary.trim(),
            memoItems: [...(selectedChar.memoItems || []), newNote],
            updatedAt: Date.now()
        };
        await saveCharacter(updatedChar);
        setSelectedChar(updatedChar);
        setNewNoteContent('');
        await refreshCharacters();
    };

    const handleDeleteNote = async (noteId: string) => {
        if (!selectedChar) return;
        if (!confirm('确认删除该笔记条目吗？')) return;
        const updatedItems = (selectedChar.memoItems || []).filter(item => item.id !== noteId);
        const updatedChar: Character = {
            ...selectedChar,
            memoItems: updatedItems,
            updatedAt: Date.now()
        };
        await saveCharacter(updatedChar);
        setSelectedChar(updatedChar);
        await refreshCharacters();
    };

    // --- RENDER DETAILED VIEW ---
    if (selectedChar) {
        return (
            <div className="p-8 pb-32 max-w-5xl mx-auto w-full h-full flex flex-col bg-ibm-background">
                <header className="mb-10 border-b border-ibm-border pb-6 shrink-0 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <button 
                            onClick={() => setSelectedChar(null)}
                            className="h-8 px-4 border border-ibm-border hover:bg-ibm-layerHover text-ibm-text text-xs font-mono transition-all"
                        >
                            ← 返回备忘库列表
                        </button>
                        <div className="flex gap-3">
                            <button
                                onClick={handleSaveChar}
                                className={`h-8 px-5 text-xs font-mono transition-all uppercase tracking-wider ${
                                    saveStatus === 'saved'
                                        ? 'bg-ibm-primary text-white'
                                        : 'bg-[#ff832b] text-white hover:bg-[#e86c14]'
                                }`}
                            >
                                {saveStatus === 'saving' ? '正在保存...' : saveStatus === 'saved' ? '已保存 ✓' : '保存卡片修改'}
                            </button>
                        </div>
                    </div>
                    <div>
                        <span className="text-[11px] font-mono text-ibm-textSecondary uppercase tracking-widest block mb-1">
                            角色卡管理面板 / Character Memo Dashboard
                        </span>
                        <h1 className="text-ibm-text text-3xl font-sans font-normal tracking-tight">
                            {selectedChar.name}
                        </h1>
                    </div>
                </header>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0 overflow-y-auto custom-scrollbar">
                    {/* Left Panel: Basic Details */}
                    <div className="space-y-6">
                        <div className="bg-ibm-layer border border-ibm-border p-6 space-y-5">
                            <h3 className="text-sm font-mono uppercase tracking-widest text-ibm-text border-b border-ibm-border/30 pb-2">
                                🛠️ 基本信息配置
                            </h3>

                            {/* Name Input */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-mono uppercase tracking-widest text-ibm-textSecondary block">
                                    角色/设定姓名
                                </label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className="w-full bg-ibm-background border border-ibm-border text-ibm-text px-3 py-2 text-xs focus:border-[#ff832b] outline-none transition-all font-sans"
                                    placeholder="输入角色名字..."
                                />
                            </div>

                            {/* Summary Input */}
                            <div className="space-y-2">
                                <label className="text-[11px] font-mono uppercase tracking-widest text-ibm-textSecondary block">
                                    规则设定或背景总结
                                </label>
                                <input
                                    type="text"
                                    value={editSummary}
                                    onChange={e => setEditSummary(e.target.value)}
                                    className="w-full bg-ibm-background border border-ibm-border text-ibm-text px-3 py-2 text-xs focus:border-[#ff832b] outline-none transition-all font-sans"
                                    placeholder="例如：DND5E 圣骑士 / 侦探笔记"
                                />
                            </div>

                            <p className="text-[11px] text-ibm-textPlaceholder leading-relaxed">
                                💡 修改基本信息后，请记得点击右上角的 <strong>“保存卡片修改”</strong> 按钮，数据将会被即时持久化到您本地的安全数据库中。
                            </p>
                        </div>

                        {/* Interactive Stats Block */}
                        <div className="bg-ibm-layer border border-ibm-border p-6 space-y-3">
                            <h3 className="text-sm font-mono uppercase tracking-widest text-ibm-textSecondary border-b border-ibm-border/30 pb-2">
                                📊 档案统计
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="border border-ibm-border bg-ibm-background/40 py-3">
                                    <div className="text-xl font-mono font-bold text-ibm-text">
                                        {selectedChar.memoItems?.length || 0}
                                    </div>
                                    <div className="text-[10px] font-mono text-ibm-textPlaceholder uppercase mt-1">备忘条目数</div>
                                </div>
                                <div className="border border-ibm-border bg-ibm-background/40 py-3">
                                    <div className="text-[11px] font-mono font-medium text-ibm-text truncate px-1">
                                        {new Date(selectedChar.updatedAt).toLocaleDateString()}
                                    </div>
                                    <div className="text-[10px] font-mono text-ibm-textPlaceholder uppercase mt-1">最后更新</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Notes / Memo Items */}
                    <div className="lg:col-span-2 space-y-6 flex flex-col min-h-0">
                        {/* Add Memo Item */}
                        <div className="bg-ibm-layer border border-ibm-border p-6 space-y-4 shrink-0">
                            <h3 className="text-sm font-mono uppercase tracking-widest text-[#ff832b] font-bold">
                                📝 撰写新随笔 / 记录备忘
                            </h3>
                            <div className="relative">
                                <textarea
                                    value={newNoteContent}
                                    onChange={e => setNewNoteContent(e.target.value)}
                                    rows={3}
                                    placeholder="支持 Markdown 格式。例如：&#10;- 获得新装备：屠龙宝刀&#10;- 下一步计划：前往黑石深渊探秘..."
                                    className="w-full bg-ibm-background border border-ibm-border text-ibm-text p-4 text-xs focus:border-[#ff832b] outline-none resize-none transition-all placeholder:text-ibm-textSecondary/50 font-sans leading-relaxed"
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && e.ctrlKey) {
                                            e.preventDefault();
                                            handleAddNote();
                                        }
                                    }}
                                />
                                <div className="absolute right-3 bottom-3 text-[10px] font-mono text-ibm-textPlaceholder pointer-events-none">
                                    Ctrl + Enter 快速提交
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={handleAddNote}
                                    className="h-9 px-6 bg-[#ff832b] text-white hover:bg-[#e86c14] transition-all text-xs font-mono uppercase tracking-wider font-medium shadow-sm"
                                >
                                    + 添加至备忘条目
                                </button>
                            </div>
                        </div>

                        {/* List Memo Items */}
                        <div className="flex-1 bg-ibm-layer border border-ibm-border p-6 flex flex-col min-h-0">
                            <h3 className="text-sm font-mono uppercase tracking-widest text-ibm-text border-b border-ibm-border/30 pb-3 mb-4 shrink-0">
                                📓 冒险备忘大事记
                            </h3>

                            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                                {(!selectedChar.memoItems || selectedChar.memoItems.length === 0) ? (
                                    <div className="py-12 text-center text-xs text-ibm-textPlaceholder border border-dashed border-ibm-border/60">
                                        暂无随笔或房主分发的冒险记录。在上方输入内容，开启您的首条探索足迹吧！
                                    </div>
                                ) : (
                                    [...(selectedChar.memoItems)].reverse().map((item) => (
                                        <div
                                            key={item.id}
                                            className="p-5 border border-ibm-border bg-ibm-background hover:border-ibm-borderStrong transition-all duration-200 group relative flex flex-col gap-3"
                                        >
                                            {/* Note Meta & Actions */}
                                            <div className="flex items-center justify-between border-b border-ibm-border/30 pb-2">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 border ${
                                                        item.source === 'host'
                                                            ? 'border-ibm-primary/40 bg-ibm-primary/10 text-ibm-primary font-bold'
                                                            : 'border-ibm-textSecondary/40 bg-ibm-layerHover text-ibm-textSecondary'
                                                    }`}>
                                                        {item.source === 'host' ? '🧙‍♂️ 房主下发' : '🕵️ 个人随笔'}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-ibm-textPlaceholder">
                                                        {new Date(item.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                {item.source === 'self' && (
                                                    <button
                                                        onClick={() => handleDeleteNote(item.id)}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono text-ibm-textSecondary hover:text-[#fa4d56]"
                                                    >
                                                        删除
                                                    </button>
                                                )}
                                            </div>

                                            {/* Note Content Renderer */}
                                            <div className="text-xs text-ibm-text leading-relaxed font-sans">
                                                <MarkdownRenderer content={item.content} />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER LIBRARY LIST ---
    return (
        <div className="p-8 pb-32 max-w-5xl mx-auto w-full h-full flex flex-col bg-ibm-background">
            <header className="mb-12 flex justify-between items-end border-b border-ibm-border pb-6 shrink-0">
                <div>
                    <h1 className="text-ibm-text text-4xl font-sans font-light tracking-tight mb-2">备忘库存</h1>
                    <p className="text-ibm-textSecondary font-sans text-sm">管理您的角色设定档及接收到的冒险备忘录</p>
                </div>
                <div className="flex gap-4 items-center">
                    <button 
                        onClick={() => navigate('/characters/new')} 
                        className="h-10 px-6 bg-[#ff832b] text-white hover:bg-[#e86c14] transition-colors shadow-sm font-sans text-[14px]"
                    >
                        + 塑造新角色
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {characters.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 border border-ibm-border border-dashed">
                        <div className="w-16 h-16 border border-ibm-border flex items-center justify-center text-ibm-textSecondary mb-4">
                            <span className="font-mono text-2xl">M</span>
                        </div>
                        <h3 className="text-ibm-text font-sans text-lg mb-2">暂无角色备忘库</h3>
                        <p className="text-ibm-textSecondary font-sans text-[13px] text-center max-w-sm mb-6">
                            点击右上角塑造新角色，创建角色后，在联机房间中接收主持人分发的冒险备忘，或者在个人看板上管理角色设定。
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {characters.map(c => (
                            <div 
                                key={c.id} 
                                onClick={() => handleSelectChar(c)}
                                className="p-6 border border-ibm-border bg-ibm-layer hover:border-[var(--brand-orange)] hover:shadow-[0_8px_24px_rgba(255,131,43,0.12)] hover:-translate-y-1 transition-all duration-300 ease-out cursor-pointer flex flex-col group relative rounded-sm shadow-sm"
                            >
                                <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => handleDelete(c.id, e)}
                                        className="text-ibm-textSecondary hover:text-[#fa4d56] font-mono text-xs"
                                        title="删除角色卡"
                                    >
                                        删除
                                    </button>
                                </div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-ibm-primary/10 flex items-center justify-center text-ibm-primary font-mono font-bold text-lg border border-transparent shadow-inner select-none">
                                        {c.name ? c.name[0] : '角'}
                                    </div>
                                    <div className="truncate flex-1">
                                        <h3 className="text-[18px] font-sans font-medium text-ibm-text truncate pr-8">{c.name}</h3>
                                        <p className="text-[12px] text-ibm-textSecondary mt-0.5">
                                            记录条目: {c.memoItems?.length || 0}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-auto pt-4 border-t border-ibm-border/40 flex justify-between items-center">
                                    <span className="text-[12px] text-ibm-textPlaceholder font-sans">
                                        {c.summary || '普通角色卡'}
                                    </span>
                                    <span className="px-3.5 py-1.5 text-[11px] font-bold border border-[var(--brand-orange)] bg-[var(--brand-orange)] text-white hover:bg-[var(--brand-orange-hover)] hover:border-[var(--brand-orange-hover)] transition-all cursor-pointer shadow-sm active:scale-95">
                                        查看管理 →
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
