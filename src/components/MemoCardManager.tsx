import { useState, useEffect, useRef } from 'react';
import { useMqttContext } from '../contexts/MqttContext';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { Character, MemoItem } from '../features/characters/types';
import { getMyCharacters, saveCharacter, deleteCharacter } from '../features/characters/api';

interface HandoutTemplate {
    id: string;
    title: string;
    category: string;
    content: string;
}

export function MemoCardManager() {
    const { 
        isHost, connectedPlayers, patchCharacter, activeCharacter, updateActiveCharacter, roomId, showNotification 
    } = useMqttContext();

    // GM local state
    const [gmTemplates, setGmTemplates] = useState<HandoutTemplate[]>([]);
    const [newTitle, setNewTitle] = useState('');
    const [newCategory, setNewCategory] = useState('线索');
    const [newContent, setNewContent] = useState('');
    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

    // Player/User active search & filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTab, setSelectedTab] = useState('all');

    // Textarea references for markdown helper insertion
    const gmTextareaRef = useRef<HTMLTextAreaElement>(null);
    const personalTextareaRef = useRef<HTMLTextAreaElement>(null);

    // Character library selection states
    const [characters, setCharacters] = useState<Character[]>([]);
    const [showNewCharForm, setShowNewCharForm] = useState(false);
    const [newCharName, setNewCharName] = useState('');
    const [newCharSummary, setNewCharSummary] = useState('');

    const userId = localStorage.getItem('dice_roller_my_id') || 'local-user';

    // Load local characters
    const loadCharacters = async () => {
        try {
            const chars = await getMyCharacters(userId);
            setCharacters(chars);
        } catch (err) {
            console.error('Failed to load characters', err);
        }
    };

    useEffect(() => {
        loadCharacters();
    }, [userId]);

    // Handle character loading/switching
    const handleSelectCharacter = (char: Character) => {
        updateActiveCharacter(char);
        showNotification(`已装载角色卡：${char.name}`, 'success');
    };

    // Handle character creation
    const handleCreateChar = async () => {
        if (!newCharName.trim()) {
            alert('角色名称不能为空！');
            return;
        }
        const newCharId = 'char-' + Math.floor(100000 + Math.random() * 900000);
        const newChar: Character = {
            id: newCharId,
            name: newCharName.trim(),
            userId: userId,
            summary: newCharSummary.trim() || '自定义设定库',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            memoItems: []
        };
        try {
            await saveCharacter(newChar);
            await loadCharacters();
            updateActiveCharacter(newChar); // Automatically select it!
            setNewCharName('');
            setNewCharSummary('');
            setShowNewCharForm(false);
            showNotification(`已塑造并装载新角色：${newChar.name}`, 'success');
        } catch (err) {
            console.error('Failed to create character', err);
            alert('角色卡保存失败，请重试！');
        }
    };

    // Handle character deletion
    const handleDeleteCharacter = async (charId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('确定要删除此角色档案吗？这会清空其中所有的随笔和接收线索！')) return;
        try {
            await deleteCharacter(charId);
            await loadCharacters();
            if (activeCharacter?.id === charId) {
                // If active character was deleted, unbind it
                // We mock updated active character as null by using a temporary cast
                updateActiveCharacter(null as any);
            }
            showNotification('角色档案删除成功', 'info');
        } catch (err) {
            console.error('Failed to delete character', err);
        }
    };

    // Load GM templates from local storage
    useEffect(() => {
        if (isHost && roomId) {
            const saved = localStorage.getItem(`dice_roller_gm_handouts_${roomId}`);
            if (saved) {
                try {
                    setGmTemplates(JSON.parse(saved));
                } catch (e) {
                    console.error('Failed to parse GM handouts template from storage', e);
                }
            }
        }
    }, [isHost, roomId]);

    // Save GM templates to local storage
    const saveGmTemplates = (templates: HandoutTemplate[]) => {
        setGmTemplates(templates);
        if (roomId) {
            localStorage.setItem(`dice_roller_gm_handouts_${roomId}`, JSON.stringify(templates));
        }
    };

    const handleCreateOrUpdateHandout = () => {
        if (!newTitle.trim() || !newContent.trim()) {
            alert('标题与内容不能为空！');
            return;
        }

        if (editingTemplateId) {
            // Edit existing
            const updated = gmTemplates.map(t => 
                t.id === editingTemplateId 
                    ? { ...t, title: newTitle.trim(), category: newCategory, content: newContent.trim() }
                    : t
            );
            saveGmTemplates(updated);
            setEditingTemplateId(null);
            showNotification('备忘卡模板更新成功', 'success');
        } else {
            // Create new
            const newTpl: HandoutTemplate = {
                id: 'tpl-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5),
                title: newTitle.trim(),
                category: newCategory,
                content: newContent.trim()
            };
            saveGmTemplates([...gmTemplates, newTpl]);
            showNotification('备忘卡模板创建成功', 'success');
        }

        setNewTitle('');
        setNewContent('');
    };

    const handleEditTemplate = (tpl: HandoutTemplate) => {
        setEditingTemplateId(tpl.id);
        setNewTitle(tpl.title);
        setNewCategory(tpl.category);
        setNewContent(tpl.content);
    };

    const handleDeleteTemplate = (id: string) => {
        if (confirm('确定要删除这个备忘卡模板吗？')) {
            const filtered = gmTemplates.filter(t => t.id !== id);
            saveGmTemplates(filtered);
            if (editingTemplateId === id) {
                setEditingTemplateId(null);
                setNewTitle('');
                setNewContent('');
            }
        }
    };

    const handleDistribute = (tpl: HandoutTemplate, targetId: string) => {
        const textPayload = JSON.stringify({
            title: tpl.title,
            category: tpl.category,
            content: tpl.content,
            isLocked: true
        });

        patchCharacter(targetId, textPayload);
        
        if (targetId === 'all') {
            showNotification(`已向全员玩家分发线索卡：[${tpl.title}]`, 'success');
        } else {
            const recipient = connectedPlayers.find(p => p.id === targetId);
            showNotification(`已向玩家 ${recipient?.name || '未知'} 分发线索卡：[${tpl.title}]`, 'success');
        }
    };

    // Player personal card creation
    const [personalTitle, setPersonalTitle] = useState('');
    const [personalCategory, setPersonalCategory] = useState('手记');
    const [personalContent, setPersonalContent] = useState('');
    const [showPersonalForm, setShowPersonalForm] = useState(false);

    const handleCreatePersonalNote = () => {
        if (!activeCharacter) {
            alert('请关联角色档案后再添加手记！');
            return;
        }
        if (!personalTitle.trim() || !personalContent.trim()) {
            alert('手记标题与内容不能为空！');
            return;
        }

        const notePayload = JSON.stringify({
            title: personalTitle.trim(),
            category: personalCategory,
            content: personalContent.trim(),
            isLocked: false
        });

        const newItem: MemoItem = {
            id: 'item-self-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5),
            content: notePayload,
            createdAt: Date.now(),
            source: 'self'
        };

        const updated = [...(activeCharacter.memoItems || []), newItem];
        updateActiveCharacter({ ...activeCharacter, memoItems: updated });

        setPersonalTitle('');
        setPersonalContent('');
        setShowPersonalForm(false);
        showNotification('已记录个人手记档案', 'success');
    };

    const handleDeletePersonalNote = (itemId: string) => {
        if (!activeCharacter) return;
        if (confirm('确定要删除此条手记吗？')) {
            const filtered = (activeCharacter.memoItems || []).filter(item => item.id !== itemId);
            updateActiveCharacter({ ...activeCharacter, memoItems: filtered });
            showNotification('已从个人仓库中删除此笔记', 'info');
        }
    };

    // Tactile vibration
    const handleCardDoubleClick = () => {
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
        }
    };

    // Selection insertion helper functions for Markdown
    const insertGmMarkdown = (prefix: string, suffix: string = '') => {
        if (!gmTextareaRef.current) return;
        const start = gmTextareaRef.current.selectionStart;
        const end = gmTextareaRef.current.selectionEnd;
        const text = newContent;
        const selected = text.slice(start, end);
        const before = text.slice(0, start);
        const after = text.slice(end);
        
        const inserted = suffix ? `${prefix}${selected || '内容'}${suffix}` : `${prefix}${selected}`;
        setNewContent(before + inserted + after);
        
        setTimeout(() => {
            if (gmTextareaRef.current) {
                gmTextareaRef.current.focus();
                const newPos = start + prefix.length + (selected ? selected.length : '内容'.length);
                gmTextareaRef.current.setSelectionRange(newPos, newPos);
            }
        }, 0);
    };

    const insertPersonalMarkdown = (prefix: string, suffix: string = '') => {
        if (!personalTextareaRef.current) return;
        const start = personalTextareaRef.current.selectionStart;
        const end = personalTextareaRef.current.selectionEnd;
        const text = personalContent;
        const selected = text.slice(start, end);
        const before = text.slice(0, start);
        const after = text.slice(end);
        
        const inserted = suffix ? `${prefix}${selected || '内容'}${suffix}` : `${prefix}${selected}`;
        setPersonalContent(before + inserted + after);
        
        setTimeout(() => {
            if (personalTextareaRef.current) {
                personalTextareaRef.current.focus();
                const newPos = start + prefix.length + (selected ? selected.length : '内容'.length);
                personalTextareaRef.current.setSelectionRange(newPos, newPos);
            }
        }, 0);
    };

    // Parse memos for displaying
    interface ParsedMemo {
        id: string;
        title: string;
        category: string;
        content: string;
        createdAt: number;
        source: 'self' | 'host';
        isLocked: boolean;
    }

    const parseMemoItem = (item: MemoItem): ParsedMemo => {
        try {
            const data = JSON.parse(item.content);
            return {
                id: item.id,
                title: data.title || '无标题笔记',
                category: data.category || '线索',
                content: data.content || '',
                createdAt: item.createdAt,
                source: item.source,
                isLocked: data.isLocked ?? false
            };
        } catch (e) {
            const firstLine = item.content.split('\n')[0] || '';
            const cleanTitle = firstLine.replace(/[#*`]/g, '').trim().substring(0, 15);
            return {
                id: item.id,
                title: cleanTitle || '未命名收到手记',
                category: '旧版线索',
                content: item.content,
                createdAt: item.createdAt,
                source: item.source,
                isLocked: false
            };
        }
    };

    const playerMemos: ParsedMemo[] = (activeCharacter?.memoItems || []).map(parseMemoItem);

    // Apply Search and Tab Filters to Player received notes
    const filteredMemos = playerMemos.filter(memo => {
        const matchesSearch = 
            memo.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            memo.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            memo.category.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (selectedTab === 'all') return matchesSearch;
        return memo.category === selectedTab && matchesSearch;
    });

    const uniqueCategories = Array.from(new Set(playerMemos.map(m => m.category)));

    return (
        <div className="flex-1 w-full h-full flex flex-col md:flex-row bg-ibm-background overflow-hidden select-none">
            
            {/* 1. Host/GM Section: Handout Creator & Template List */}
            {isHost && (
                <div className="w-full md:w-[380px] lg:w-[400px] shrink-0 border-b md:border-b-0 md:border-r border-ibm-border flex flex-col h-[45dvh] md:h-full bg-ibm-layer overflow-hidden">
                    
                    {/* Header */}
                    <div className="p-4 border-b border-ibm-border bg-ibm-layerHover flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">🧙‍♂️</span>
                            <h2 className="text-[12px] font-mono font-bold uppercase tracking-wider text-ibm-text">备忘卡制作分发 (HOST)</h2>
                        </div>
                        <span className="text-[9px] font-mono border border-ibm-border px-1.5 py-0.5 uppercase text-ibm-textSecondary">GM 控制台</span>
                    </div>

                    {/* Creator Form */}
                    <div className="p-4 border-b border-ibm-border bg-ibm-background shrink-0 space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                            <input
                                type="text"
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                placeholder="备忘卡片标题..."
                                className="col-span-2 bg-ibm-layer border border-ibm-border px-3 py-1.5 text-xs text-ibm-text outline-none focus:border-ibm-primary font-sans"
                            />
                            <select
                                value={newCategory}
                                onChange={e => setNewCategory(e.target.value)}
                                className="bg-ibm-layer border border-ibm-border px-2 py-1.5 text-xs text-ibm-text outline-none cursor-pointer font-sans"
                            >
                                <option value="线索">🔍 线索</option>
                                <option value="道具">💼 道具</option>
                                <option value="传闻">🗣️ 传闻</option>
                                <option value="其他">📌 其他</option>
                            </select>
                        </div>

                        {/* GM Textarea One-click Markdown Toolbar */}
                        <div className="border border-ibm-border bg-ibm-layer overflow-hidden">
                            <div className="flex gap-1 p-1 bg-ibm-layerHover border-b border-ibm-border flex-wrap">
                                <button type="button" onClick={() => insertGmMarkdown('**', '**')} className="w-7 h-7 flex items-center justify-center text-[10px] font-sans font-bold border border-ibm-border hover:bg-ibm-layer text-ibm-text bg-ibm-background" title="加粗">B</button>
                                <button type="button" onClick={() => insertGmMarkdown('*', '*')} className="w-7 h-7 flex items-center justify-center text-[10px] font-sans italic border border-ibm-border hover:bg-ibm-layer text-ibm-text bg-ibm-background" title="斜体">I</button>
                                <button type="button" onClick={() => insertGmMarkdown('~~', '~~')} className="w-7 h-7 flex items-center justify-center text-[10px] font-sans line-through border border-ibm-border hover:bg-ibm-layer text-ibm-text bg-ibm-background" title="删除线">S</button>
                                <div className="w-px bg-ibm-border my-1 mx-0.5"></div>
                                <button type="button" onClick={() => insertGmMarkdown('# ')} className="w-7 h-7 flex items-center justify-center text-[9px] font-mono border border-ibm-border hover:bg-ibm-layer text-ibm-text bg-ibm-background" title="一级标题">H1</button>
                                <button type="button" onClick={() => insertGmMarkdown('## ')} className="w-7 h-7 flex items-center justify-center text-[9px] font-mono border border-ibm-border hover:bg-ibm-layer text-ibm-text bg-ibm-background" title="二级标题">H2</button>
                                <button type="button" onClick={() => insertGmMarkdown('> ')} className="w-7 h-7 flex items-center justify-center text-[10px] font-sans border border-ibm-border hover:bg-ibm-layer text-ibm-text bg-ibm-background" title="引用 blockquote">&gt;</button>
                                <button type="button" onClick={() => insertGmMarkdown('- ')} className="w-7 h-7 flex items-center justify-center text-[10px] font-sans border border-ibm-border hover:bg-ibm-layer text-ibm-text bg-ibm-background" title="无序列表">•</button>
                                <button type="button" onClick={() => insertGmMarkdown('```\n', '\n```')} className="w-7 h-7 flex items-center justify-center text-[9px] font-mono border border-ibm-border hover:bg-ibm-layer text-ibm-text bg-ibm-background" title="代码块">&lt;/&gt;</button>
                                <button type="button" onClick={() => insertGmMarkdown('---\n')} className="w-7 h-7 flex items-center justify-center text-[9px] font-mono border border-ibm-border hover:bg-ibm-layer text-ibm-text bg-ibm-background" title="分割线">---</button>
                            </div>
                            <textarea
                                ref={gmTextareaRef}
                                value={newContent}
                                onChange={e => setNewContent(e.target.value)}
                                placeholder="输入卡片详情 (支持 Markdown 语法，可使用上方一键工具录入)..."
                                rows={3}
                                className="w-full bg-transparent p-3 text-xs text-ibm-text outline-none resize-none font-mono placeholder:text-ibm-textPlaceholder"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleCreateOrUpdateHandout}
                                className="flex-1 bg-ibm-primary text-ibm-textOnColor py-2 text-xs font-mono uppercase font-bold tracking-wider hover:bg-ibm-primaryHover transition-colors"
                            >
                                {editingTemplateId ? '更新备忘卡' : '+ 创建备忘卡模板'}
                            </button>
                            {editingTemplateId && (
                                <button
                                    onClick={() => {
                                        setEditingTemplateId(null);
                                        setNewTitle('');
                                        setNewContent('');
                                    }}
                                    className="px-4 border border-ibm-border text-ibm-text hover:bg-ibm-layerHover text-xs font-mono"
                                >
                                    取消
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Template Card Deck */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-ibm-background/45 custom-scrollbar">
                        <div className="flex items-center gap-1.5 pb-2 border-b border-ibm-border/25">
                            <span className="font-mono text-[9px] text-ibm-textSecondary">-</span>
                            <span className="text-[10px] font-mono text-ibm-textSecondary uppercase tracking-wider">当前模版仓库 ({gmTemplates.length})</span>
                        </div>

                        {gmTemplates.length === 0 ? (
                            <div className="p-8 border border-dashed border-ibm-border/45 text-center text-xs text-ibm-textPlaceholder font-mono">
                                模版仓库空空如也，请在上方创建卡片。
                            </div>
                        ) : (
                            gmTemplates.map(tpl => (
                                <div key={tpl.id} className="border border-ibm-border bg-ibm-layer hover:border-ibm-borderStrong transition-all p-3 space-y-3 relative group">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <span className="text-[8px] font-mono border border-ibm-border/60 bg-ibm-background/50 px-1.5 py-0.5 uppercase font-bold text-ibm-primary leading-none">
                                                {tpl.category}
                                            </span>
                                            <h3 className="text-xs font-sans font-bold text-ibm-text mt-1">{tpl.title}</h3>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEditTemplate(tpl)}
                                                className="w-5 h-5 border border-ibm-border hover:bg-ibm-layerHover text-ibm-text flex items-center justify-center text-[10px] bg-ibm-background"
                                                title="编辑"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTemplate(tpl.id)}
                                                className="w-5 h-5 border border-ibm-border hover:bg-ibm-danger/25 text-ibm-danger hover:text-white flex items-center justify-center text-[10px] bg-ibm-background"
                                                title="删除"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                    <div className="text-[11px] font-mono text-ibm-textSecondary line-clamp-2 truncate whitespace-pre-wrap select-text">
                                        <MarkdownRenderer content={tpl.content} />
                                    </div>

                                    {/* Action: Distribute */}
                                    <div className="pt-2.5 border-t border-ibm-border/30 flex flex-wrap gap-1.5 items-center">
                                        <span className="text-[9px] font-mono text-ibm-textPlaceholder uppercase">分发给:</span>
                                        <button
                                            onClick={() => handleDistribute(tpl, 'all')}
                                            className="px-2 py-0.5 bg-[#ff832b] text-white hover:bg-[#e06b18] text-[9px] font-mono uppercase font-bold tracking-wide"
                                        >
                                            全员玩家
                                        </button>
                                        {connectedPlayers.filter(p => !p.isHost).map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => handleDistribute(tpl, p.id)}
                                                className="px-2 py-0.5 border border-ibm-border bg-ibm-background hover:bg-ibm-layerHover text-ibm-text text-[9px] font-sans truncate max-w-[80px]"
                                                title={p.name}
                                            >
                                                {p.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* 2. Character Library Selector Panel */}
            <div className="w-full md:w-[300px] shrink-0 border-b md:border-b-0 md:border-r border-ibm-border flex flex-col h-[40dvh] md:h-full bg-ibm-layer/60 overflow-hidden">
                <div className="p-4 border-b border-ibm-border bg-ibm-layerHover flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">🎭</span>
                        <h2 className="text-[12px] font-mono font-bold uppercase tracking-wider text-ibm-text">备忘角色卡库</h2>
                    </div>
                    <button
                        onClick={() => setShowNewCharForm(!showNewCharForm)}
                        className={`text-[9px] font-mono border px-1.5 py-0.5 uppercase transition-all ${
                            showNewCharForm ? 'bg-[#ff832b] border-[#ff832b] text-white' : 'border-ibm-border text-ibm-textSecondary hover:bg-ibm-layerHover'
                        }`}
                    >
                        {showNewCharForm ? '收起' : '+ 塑造'}
                    </button>
                </div>

                {/* Quick Shape/Create New Character Form */}
                {showNewCharForm && (
                    <div className="p-4 border-b border-ibm-border bg-ibm-background shrink-0 space-y-3 animate-in slide-in-from-top duration-300">
                        <h4 className="text-[10px] font-mono font-bold text-[#ff832b] uppercase tracking-wider">塑造新角色</h4>
                        <div className="space-y-2">
                            <input
                                type="text"
                                placeholder="输入角色名字..."
                                value={newCharName}
                                onChange={e => setNewCharName(e.target.value)}
                                className="w-full bg-ibm-layer border border-ibm-border px-2.5 py-1.5 text-xs text-ibm-text outline-none focus:border-ibm-primary font-sans"
                            />
                            <input
                                type="text"
                                placeholder="设定描述 (如 DND5e 圣骑士)..."
                                value={newCharSummary}
                                onChange={e => setNewCharSummary(e.target.value)}
                                className="w-full bg-ibm-layer border border-ibm-border px-2.5 py-1.5 text-xs text-ibm-text outline-none focus:border-ibm-primary font-sans"
                            />
                            <button
                                onClick={handleCreateChar}
                                className="w-full bg-[#ff832b] hover:bg-[#e86c14] text-white py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider transition-colors"
                            >
                                确认塑造角色卡
                            </button>
                        </div>
                    </div>
                )}

                {/* Character List Grid */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-ibm-background/20">
                    <span className="text-[9px] font-mono text-ibm-textPlaceholder uppercase tracking-wider block mb-1">
                        本地全部存档 ({characters.length})
                    </span>

                    {characters.length === 0 ? (
                        <div className="p-6 border border-dashed border-ibm-border text-center text-xs text-ibm-textPlaceholder font-mono">
                            暂无角色卡，点击右上角【塑造】新建一个吧！
                        </div>
                    ) : (
                        characters.map(c => {
                            const isActive = activeCharacter?.id === c.id;
                            return (
                                <div 
                                    key={c.id}
                                    onClick={() => handleSelectCharacter(c)}
                                    className={`p-2.5 border transition-all flex flex-col gap-1.5 relative group cursor-pointer ${
                                        isActive 
                                            ? 'border-ibm-borderStrong bg-[#ff832b]/5 border-l-4 border-l-[#ff832b]' 
                                            : 'border-ibm-border bg-ibm-layer hover:border-ibm-borderStrong'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <div className={`w-6 h-6 flex items-center justify-center font-mono text-[10px] border shrink-0 ${
                                                isActive ? 'bg-[#ff832b] text-white border-[#ff832b]' : 'bg-transparent text-ibm-textSecondary border-ibm-border'
                                            }`}>
                                                {c.name?.[0] || '角'}
                                            </div>
                                            <span className="text-[12px] font-sans font-bold text-ibm-text truncate leading-none">
                                                {c.name}
                                            </span>
                                        </div>
                                        
                                        <button
                                            onClick={(e) => handleDeleteCharacter(c.id, e)}
                                            className="text-ibm-textPlaceholder hover:text-ibm-danger transition-colors font-mono text-[10px] opacity-0 group-hover:opacity-100 p-0.5"
                                            title="删除此角色卡"
                                        >
                                            删除
                                        </button>
                                    </div>

                                    <div className="flex justify-between items-center pl-8 text-[9px] font-mono text-ibm-textSecondary">
                                        <span className="px-1 border border-ibm-border/80 rounded bg-ibm-background/30 max-w-[120px] truncate" title={c.summary}>
                                            {c.summary || '无模板'}
                                        </span>
                                        <span className="text-ibm-textPlaceholder">
                                            ({c.memoItems?.length || 0} 条目)
                                        </span>
                                    </div>

                                    {isActive && (
                                        <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#ff832b] animate-ping" />
                                            <span className="text-[8px] font-mono text-[#ff832b] uppercase font-bold tracking-wider">装载中</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* 3. Personal Ledger & Card Viewer Section */}
            <div className="flex-grow flex-1 flex flex-col h-full overflow-hidden bg-ibm-background relative">
                
                {/* Search and Tabs Controller */}
                <div className="p-4 border-b border-ibm-border bg-ibm-layer shrink-0 flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">📥</span>
                            <h2 className="text-[13px] font-sans font-bold uppercase tracking-wider text-ibm-text">
                                {activeCharacter ? `[${activeCharacter.name}] 的个人备忘看板` : '角色手记与线索'}
                            </h2>
                        </div>

                        {activeCharacter ? (
                            <button
                                onClick={() => setShowPersonalForm(!showPersonalForm)}
                                className="px-3 py-1 bg-ibm-primary text-ibm-textOnColor text-[10px] font-mono uppercase font-bold tracking-wider hover:bg-ibm-primaryHover transition-all shrink-0"
                            >
                                {showPersonalForm ? '关闭新建' : '+ 记录个人笔记'}
                            </button>
                        ) : null}
                    </div>

                    {/* Personal Note Create Form Drawer */}
                    {showPersonalForm && activeCharacter && (
                        <div className="p-3 border border-ibm-primary/30 bg-ibm-background animate-in slide-in-from-top duration-300 space-y-2 mt-1.5">
                            <div className="grid grid-cols-3 gap-2">
                                <input
                                    type="text"
                                    value={personalTitle}
                                    onChange={e => setPersonalTitle(e.target.value)}
                                    placeholder="输入个人笔记标题..."
                                    className="col-span-2 bg-ibm-layer border border-ibm-border px-3 py-1.5 text-xs text-ibm-text outline-none focus:border-ibm-primary font-sans"
                                />
                                <select
                                    value={personalCategory}
                                    onChange={e => setPersonalCategory(e.target.value)}
                                    className="bg-ibm-layer border border-ibm-border px-2 py-1.5 text-xs text-ibm-text outline-none cursor-pointer font-sans"
                                >
                                    <option value="手记">📝 手记</option>
                                    <option value="随笔">🎨 随笔</option>
                                    <option value="物品">🔑 物品</option>
                                </select>
                            </div>

                            {/* Player Textarea One-click Markdown Toolbar */}
                            <div className="border border-ibm-border bg-ibm-layer overflow-hidden">
                                <div className="flex gap-1 p-1 bg-ibm-layerHover border-b border-ibm-border flex-wrap">
                                    <button type="button" onClick={() => insertPersonalMarkdown('**', '**')} className="w-7 h-7 flex items-center justify-center text-[10px] font-sans font-bold border border-ibm-border hover:bg-ibm-layer text-ibm-text bg-ibm-background" title="加粗">B</button>
                                    <button type="button" onClick={() => insertPersonalMarkdown('*', '*')} className="w-7 h-7 flex items-center justify-center text-[10px] font-sans italic border border-ibm-border hover:bg-ibm-layer text-ibm-text bg-ibm-background" title="斜体">I</button>
                                    <button type="button" onClick={() => insertPersonalMarkdown('~~', '~~')} className="w-7 h-7 flex items-center justify-center text-[10px] font-sans line-through border border-ibm-border hover:bg-ibm-layer text-ibm-text bg-ibm-background" title="删除线">S</button>
                                    <div className="w-px bg-ibm-border my-1 mx-0.5"></div>
                                    <button type="button" onClick={() => insertPersonalMarkdown('# ')} className="w-7 h-7 flex items-center justify-center text-[9px] font-mono border border-ibm-border hover:bg-ibm-layer text-ibm-text bg-ibm-background" title="一级标题">H1</button>
                                    <button type="button" onClick={() => insertPersonalMarkdown('## ')} className="w-7 h-7 flex items-center justify-center text-[9px] font-mono border border-ibm-border hover:bg-ibm-layer text-ibm-text bg-ibm-background" title="二级标题">H2</button>
                                    <button type="button" onClick={() => insertPersonalMarkdown('> ')} className="w-7 h-7 flex items-center justify-center text-[10px] font-sans border border-ibm-border hover:bg-ibm-layer text-ibm-text bg-ibm-background" title="引用 blockquote">&gt;</button>
                                    <button type="button" onClick={() => insertPersonalMarkdown('- ')} className="w-7 h-7 flex items-center justify-center text-[10px] font-sans border border-ibm-border hover:bg-ibm-layer text-ibm-text bg-ibm-background" title="无序列表">•</button>
                                    <button type="button" onClick={() => insertPersonalMarkdown('```\n', '\n```')} className="w-7 h-7 flex items-center justify-center text-[9px] font-mono border border-ibm-border hover:bg-ibm-layer text-ibm-text bg-ibm-background" title="代码块">&lt;/&gt;</button>
                                    <button type="button" onClick={() => insertPersonalMarkdown('---\n')} className="w-7 h-7 flex items-center justify-center text-[9px] font-mono border border-ibm-border hover:bg-ibm-layer text-ibm-text bg-ibm-background" title="分割线">---</button>
                                </div>
                                <textarea
                                    ref={personalTextareaRef}
                                    value={personalContent}
                                    onChange={e => setPersonalContent(e.target.value)}
                                    placeholder="在这里输入个人手记的详细内容 (支持 Markdown，可使用上方一键工具录入)..."
                                    rows={2}
                                    className="w-full bg-transparent p-2.5 text-xs text-ibm-text outline-none resize-none font-mono placeholder:text-ibm-textPlaceholder"
                                />
                            </div>

                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={handleCreatePersonalNote}
                                    className="px-4 py-1.5 bg-ibm-primary text-ibm-textOnColor text-[11px] font-mono font-bold uppercase tracking-wider hover:bg-ibm-primaryHover"
                                >
                                    确定创建
                                </button>
                                <button
                                    onClick={() => setShowPersonalForm(false)}
                                    className="px-4 py-1.5 border border-ibm-border text-ibm-text text-[11px] font-mono hover:bg-ibm-layerHover"
                                >
                                    取消
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Filter controls */}
                    <div className="flex flex-col sm:flex-row gap-2 mt-1 shrink-0">
                        <div className="relative flex-grow">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="输入关键字检索线索或物品库..."
                                className="w-full bg-ibm-layerHover border border-ibm-border px-3.5 py-1.5 pl-8 text-xs text-ibm-text placeholder:text-ibm-textPlaceholder outline-none font-sans"
                            />
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ibm-textPlaceholder text-xs pointer-events-none">🔍</span>
                        </div>

                        {/* Tab lists */}
                        <div className="flex bg-ibm-background border border-ibm-border p-0.5 overflow-x-auto select-none shrink-0 scrollbar-none">
                            <button
                                onClick={() => setSelectedTab('all')}
                                className={`h-6 px-3 text-[10px] font-mono transition-all uppercase font-bold shrink-0 ${
                                    selectedTab === 'all'
                                        ? 'bg-[#ff832b] text-white'
                                        : 'text-ibm-textSecondary hover:text-ibm-text'
                                }`}
                            >
                                全部
                            </button>
                            {uniqueCategories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedTab(cat)}
                                    className={`h-6 px-3 text-[10px] font-mono transition-all uppercase font-bold shrink-0 ${
                                        selectedTab === cat
                                            ? 'bg-[#ff832b] text-white'
                                            : 'text-ibm-textSecondary hover:text-ibm-text'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Ledger Cards Grid */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-ibm-background/35">
                    {!activeCharacter ? (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-ibm-background/50 border border-dashed border-ibm-border/60">
                            <span className="text-3xl mb-4">🎭</span>
                            <h3 className="text-sm font-sans font-bold text-ibm-text">目前未关联角色卡</h3>
                            <p className="text-xs text-ibm-textSecondary mt-2 max-w-sm leading-relaxed">
                                您当前是以访客身份在此房间中。房主分发给您的冒险线索将无法被安全地保存到您本地的安全数据库。
                            </p>
                            <p className="text-xs text-[#ff832b] mt-2 font-medium leading-relaxed">
                                请在左侧列表中【装载】一个已有角色，或在左上角【塑造新角色】来即时绑定它！
                            </p>
                        </div>
                    ) : filteredMemos.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center animate-in fade-in duration-550 py-12">
                            <div className="w-12 h-12 border border-ibm-border flex items-center justify-center text-ibm-textPlaceholder mb-4">
                                📂
                            </div>
                            <p className="text-[11px] font-mono text-ibm-textPlaceholder uppercase tracking-wider text-center">
                                没有匹配的线索卡片或个人手记
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredMemos.map(memo => (
                                <div
                                    key={memo.id}
                                    onDoubleClick={handleCardDoubleClick}
                                    className={`border p-4 flex flex-col justify-between space-y-4 rounded-none transition-all duration-300 relative select-text hover:shadow-md animate-in fade-in duration-300 ${
                                        memo.source === 'host'
                                            ? 'border-ibm-primary bg-ibm-layer border-t-4 border-t-ibm-primary'
                                            : 'border-ibm-border bg-ibm-layerHover/50 border-t-4 border-t-ibm-borderStrong'
                                    }`}
                                >
                                    {/* Card Header */}
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[8px] font-mono border border-ibm-border/60 bg-ibm-background/50 px-1.5 py-0.5 uppercase font-bold text-ibm-textSecondary leading-none">
                                                    {memo.category}
                                                </span>
                                                <span className="text-[8px] font-mono px-1 py-0.2 uppercase text-ibm-textPlaceholder leading-none">
                                                    {memo.source === 'host' ? 'GM 发放' : '个人记录'}
                                                </span>
                                            </div>
                                            
                                            {/* Delete option for personal notes */}
                                            {memo.source === 'self' && (
                                                <button
                                                    onClick={() => handleDeletePersonalNote(memo.id)}
                                                    className="text-[10px] text-ibm-textPlaceholder hover:text-ibm-danger transition-colors font-bold"
                                                    title="删除手记"
                                                >
                                                    ×
                                                </button>
                                            )}
                                        </div>

                                        <h3 className="text-sm font-sans font-bold text-ibm-text mt-2 pb-1 border-b border-ibm-border/20 select-text">
                                            {memo.title}
                                        </h3>

                                        {/* Card content with rich Markdown */}
                                        <div className="text-[13px] leading-relaxed text-ibm-text mt-3 font-sans max-h-[220px] overflow-y-auto custom-scrollbar select-text pr-1">
                                            <MarkdownRenderer content={memo.content} />
                                        </div>
                                    </div>

                                    {/* Card Footer */}
                                    <div className="pt-2 border-t border-ibm-border/20 flex items-center justify-between text-[9px] font-mono text-ibm-textPlaceholder uppercase">
                                        <span>
                                            {new Date(memo.createdAt).toLocaleDateString()} {new Date(memo.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <span className="opacity-50 select-none hidden sm:inline">
                                            📱 双击卡片触发振动反馈
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
