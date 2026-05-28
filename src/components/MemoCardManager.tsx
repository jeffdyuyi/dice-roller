import { useState, useEffect } from 'react';
import { useMqttContext } from '../contexts/MqttContext';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { Character, MemoItem } from '../features/characters/types';

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

    // Tactile double tap vibration
    const handleCardDoubleClick = () => {
        if ('vibrate' in navigator) {
            navigator.vibrate([100, 50, 100]);
        }
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
            // Backward compatibility for raw text memos
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
        <div className="flex-1 w-full h-full flex flex-col md:flex-row bg-ibm-background overflow-hidden">
            
            {/* 1. Host/GM Section: Handout Creator & Template List */}
            {isHost && (
                <div className="w-full md:w-[380px] lg:w-[420px] shrink-0 border-b md:border-b-0 md:border-r border-ibm-border flex flex-col h-[50dvh] md:h-full bg-ibm-layer overflow-hidden">
                    
                    {/* Header */}
                    <div className="p-4 border-b border-ibm-border bg-ibm-layerHover flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">⚙️</span>
                            <h2 className="text-[12px] font-mono font-bold uppercase tracking-wider text-ibm-text">备忘卡制作分发</h2>
                        </div>
                        <span className="text-[9px] font-mono border border-ibm-border px-1.5 py-0.5 uppercase text-ibm-textSecondary">GM Panel</span>
                    </div>

                    {/* Creator Form */}
                    <div className="p-4 border-b border-ibm-border bg-ibm-background shrink-0 space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                            <input
                                type="text"
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                placeholder="备忘卡片标题..."
                                className="col-span-2 bg-ibm-layer border border-ibm-border px-3 py-1.5 text-xs text-ibm-text outline-none focus:border-ibm-primary"
                            />
                            <select
                                value={newCategory}
                                onChange={e => setNewCategory(e.target.value)}
                                className="bg-ibm-layer border border-ibm-border px-2 py-1.5 text-xs text-ibm-text outline-none cursor-pointer"
                            >
                                <option value="线索">🔍 线索</option>
                                <option value="道具">💼 道具</option>
                                <option value="传闻">🗣️ 传闻</option>
                                <option value="其他">📌 其他</option>
                            </select>
                        </div>
                        <textarea
                            value={newContent}
                            onChange={e => setNewContent(e.target.value)}
                            placeholder="输入卡片详情 (支持 Markdown 语法，如粗体、列表、分割线等)..."
                            rows={3}
                            className="w-full bg-ibm-layer border border-ibm-border p-3 text-xs text-ibm-text outline-none focus:border-ibm-primary resize-none font-mono"
                        />
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
                                            <span className="text-[8px] font-mono border border-ibm-border/60 bg-ibm-background/50 px-1 py-0.2 uppercase font-bold text-ibm-primary leading-none">
                                                {tpl.category}
                                            </span>
                                            <h3 className="text-xs font-sans font-bold text-ibm-text mt-1">{tpl.title}</h3>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEditTemplate(tpl)}
                                                className="w-5 h-5 border border-ibm-border hover:bg-ibm-layerHover text-ibm-text flex items-center justify-center text-[10px]"
                                                title="编辑"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTemplate(tpl.id)}
                                                className="w-5 h-5 border border-ibm-border hover:bg-ibm-danger/25 text-ibm-danger hover:text-white flex items-center justify-center text-[10px]"
                                                title="删除"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-[11px] font-mono text-ibm-textSecondary line-clamp-2 truncate whitespace-pre-wrap">{tpl.content}</p>

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
                                                className="px-2 py-0.5 border border-ibm-border hover:bg-ibm-layerHover text-ibm-text text-[9px] font-sans truncate max-w-[80px]"
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

            {/* 2. Personal Ledger & Card Viewer Section */}
            <div className="flex-grow flex-1 flex flex-col h-full overflow-hidden bg-ibm-background relative">
                
                {/* Search and Tabs Controller */}
                <div className="p-4 border-b border-ibm-border bg-ibm-layer shrink-0 flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">📥</span>
                            <h2 className="text-[13px] font-sans font-bold uppercase tracking-wider text-ibm-text">
                                {activeCharacter ? `[${activeCharacter.name}] 的个人仓库` : '我的备忘与线索'}
                            </h2>
                        </div>

                        {activeCharacter ? (
                            <button
                                onClick={() => setShowPersonalForm(!showPersonalForm)}
                                className="px-3 py-1 bg-ibm-primary text-ibm-textOnColor text-[10px] font-mono uppercase font-bold tracking-wider hover:bg-ibm-primaryHover transition-all shrink-0"
                            >
                                {showPersonalForm ? '关闭新建' : '+ 记录个人笔记'}
                            </button>
                        ) : (
                            <span className="text-[10px] text-ibm-textPlaceholder font-sans">
                                💡 请在联机大厅关联角色卡，以便将线索卡保存至本地
                            </span>
                        )}
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
                                    className="col-span-2 bg-ibm-layer border border-ibm-border px-3 py-1.5 text-xs text-ibm-text outline-none focus:border-ibm-primary"
                                />
                                <select
                                    value={personalCategory}
                                    onChange={e => setPersonalCategory(e.target.value)}
                                    className="bg-ibm-layer border border-ibm-border px-2 py-1.5 text-xs text-ibm-text outline-none cursor-pointer"
                                >
                                    <option value="手记">📝 手记</option>
                                    <option value="随笔">🎨 随笔</option>
                                    <option value="物品">🔑 物品</option>
                                </select>
                            </div>
                            <textarea
                                value={personalContent}
                                onChange={e => setPersonalContent(e.target.value)}
                                placeholder="在这里输入个人手记的详细内容..."
                                rows={2}
                                className="w-full bg-ibm-layer border border-ibm-border p-2.5 text-xs text-ibm-text outline-none focus:border-ibm-primary resize-none font-mono"
                            />
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
                                className="w-full bg-ibm-layerHover border border-ibm-border px-3.5 py-1.5 pl-8 text-xs text-ibm-text placeholder:text-ibm-textPlaceholder outline-none"
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
                    {filteredMemos.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center animate-in fade-in duration-500 py-12">
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
                                                <span className="text-[8px] font-mono border border-ibm-border/60 bg-ibm-background/50 px-1 py-0.2 uppercase font-bold text-ibm-textSecondary leading-none">
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

                                        <h3 className="text-sm font-sans font-bold text-ibm-text mt-2 pb-1 border-b border-ibm-border/20">
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
