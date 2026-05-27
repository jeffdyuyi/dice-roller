import { useState, useRef, useEffect } from 'react';
import type { WhiteboardProject, WhiteboardTab, CellData } from '../features/whiteboards/types';
import { GridBoard } from './GridBoard';
import { CellNotePanel, TERRAIN_COLORS } from './CellNotePanel';
import { MarkdownRenderer } from './MarkdownRenderer';

interface WhiteboardAreaProps {
    project: WhiteboardProject;
    onChange: (updatedProject: WhiteboardProject) => void;
    myName: string;
}

export function WhiteboardArea({ project, onChange, myName }: WhiteboardAreaProps) {
    const [activeTabId, setActiveTabId] = useState<string>(project.tabs[0]?.id || '');
    const [selectedCell, setSelectedCell] = useState<{ q: number; r: number } | null>(null);
    const [viewingCell, setViewingCell] = useState<{ q: number; r: number; x: number; y: number } | null>(null);
    const [contextMenuCell, setContextMenuCell] = useState<{ q: number; r: number; x: number; y: number } | null>(null);
    
    const [recenterTrigger, setRecenterTrigger] = useState(0);
    const [isCreatingTab, setIsCreatingTab] = useState(false);
    const [newTabName, setNewTabName] = useState('');
    const [newTabType, setNewTabType] = useState<'square' | 'hex'>('hex');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [bounds, setBounds] = useState({ width: 800, height: 600 });

    useEffect(() => {
        if (!containerRef.current) return;
        const ro = new ResizeObserver(entries => {
            for (let e of entries) {
                setBounds({
                    width: e.contentRect.width,
                    height: e.contentRect.height
                });
            }
        });
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);

    const activeTab = project.tabs.find(t => t.id === activeTabId) || project.tabs[0];

    // Ensure we have an active tab ID if tab gets updated/deleted
    if (activeTab && activeTab.id !== activeTabId) {
        setActiveTabId(activeTab.id);
    }

    const handleCellInteraction = (evt: { type: 'click' | 'dblclick' | 'contextmenu' | 'longpress' | 'dragstart'; q: number; r: number; screenX: number; screenY: number }) => {
        setContextMenuCell(null);
        
        if (evt.type === 'dragstart') {
            setViewingCell(null);
            return;
        }

        if (evt.type === 'click') {
            setViewingCell({ q: evt.q, r: evt.r, x: evt.screenX, y: evt.screenY });
        } else if (evt.type === 'dblclick') {
            setViewingCell(null);
            setSelectedCell({ q: evt.q, r: evt.r });
        } else if (evt.type === 'contextmenu' || evt.type === 'longpress') {
            setViewingCell(null);
            setContextMenuCell({ q: evt.q, r: evt.r, x: evt.screenX, y: evt.screenY });
        }
    };

    const handleUpdateCell = (q: number, r: number, updatedFields: Partial<CellData>) => {
        if (!activeTab) return;
        const cellKey = `${q},${r}`;
        const existingCell = activeTab.cells[cellKey] || {
            q,
            r,
            entries: []
        };

        const updatedCell: CellData = {
            ...existingCell,
            ...updatedFields
        };

        const updatedTab: WhiteboardTab = {
            ...activeTab,
            cells: {
                ...activeTab.cells,
                [cellKey]: updatedCell
            }
        };

        const updatedTabs = project.tabs.map(t => t.id === activeTab.id ? updatedTab : t);
        onChange({
            ...project,
            tabs: updatedTabs
        });
    };

    const handleCreateTab = () => {
        if (!newTabName.trim()) return;
        const newTab: WhiteboardTab = {
            id: 'tab-' + Date.now().toString(36),
            name: newTabName.trim(),
            gridType: newTabType,
            cells: {}
        };
        const updatedTabs = [...project.tabs, newTab];
        onChange({
            ...project,
            tabs: updatedTabs
        });
        setActiveTabId(newTab.id);
        setNewTabName('');
        setIsCreatingTab(false);
    };

    const handleDeleteTab = (tabId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (project.tabs.length <= 1) {
            alert('必须保留至少一个白板标签页！');
            return;
        }
        if (!confirm('确定删除该白板标签页吗？此操作不可逆！')) return;
        const updatedTabs = project.tabs.filter(t => t.id !== tabId);
        onChange({
            ...project,
            tabs: updatedTabs
        });
        if (activeTabId === tabId) {
            setActiveTabId(updatedTabs[0]?.id || '');
        }
    };

    const handleRecenter = () => {
        setRecenterTrigger(prev => prev + 1);
    };

    const handleBgUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleBgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeTab) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            const updatedTab: WhiteboardTab = {
                ...activeTab,
                bgImage: base64,
                bgOpacity: activeTab.bgOpacity ?? 0.5
            };
            const updatedTabs = project.tabs.map(t => t.id === activeTab.id ? updatedTab : t);
            onChange({
                ...project,
                tabs: updatedTabs
            });
        };
        reader.readAsDataURL(file);
    };

    const handleRemoveBg = () => {
        if (!activeTab) return;
        if (!confirm('确定移除底图吗？')) return;
        const updatedTab: WhiteboardTab = {
            ...activeTab,
            bgImage: undefined
        };
        const updatedTabs = project.tabs.map(t => t.id === activeTab.id ? updatedTab : t);
        onChange({
            ...project,
            tabs: updatedTabs
        });
    };

    const handleOpacityChange = (opacity: number) => {
        if (!activeTab) return;
        const updatedTab: WhiteboardTab = {
            ...activeTab,
            bgOpacity: opacity
        };
        const updatedTabs = project.tabs.map(t => t.id === activeTab.id ? updatedTab : t);
        onChange({
            ...project,
            tabs: updatedTabs
        });
    };

    const selectedCellKey = selectedCell ? `${selectedCell.q},${selectedCell.r}` : '';
    const selectedCellData = activeTab?.cells[selectedCellKey] || null;

    return (
        <div className="flex-1 w-full h-full flex flex-col bg-ibm-background relative overflow-hidden">
             {/* Top Whiteboard Navbar */}
            <div className="h-12 border-b border-ibm-border px-4 flex justify-between items-center bg-ibm-layer shrink-0 z-10">
                {/* Title, Compass & Tabs selection */}
                <div className="flex items-center gap-1 overflow-x-auto pr-4 custom-scrollbar-horizontal h-full py-1">
                    <div className="flex items-center gap-2 shrink-0 border-r border-ibm-border pr-3 mr-2 h-8">
                        <span className="font-semibold text-xs text-ibm-text flex items-center gap-1.5" title={`白板库: ${project.name}`}>
                            🗺️ {project.name}
                        </span>
                        
                        {/* Compass Indicator */}
                        <div className="flex items-center gap-1.5 ml-1 bg-ibm-background px-1.5 py-0.5 rounded border border-ibm-border text-[9px] font-mono text-ibm-textSecondary select-none" title="地图方向指引：上北(N) 下南(S) 左西(W) 右东(E)">
                            <div className="relative w-4 h-4 rounded-full border border-ibm-border flex items-center justify-center bg-ibm-layer">
                                <span className="absolute top-[-2px] text-[7px] text-ibm-primary font-bold leading-none">N</span>
                                <span className="absolute bottom-[-1px] text-[6px] text-ibm-textSecondary leading-none">S</span>
                                <span className="absolute left-[1px] text-[6px] text-ibm-textSecondary leading-none">W</span>
                                <span className="absolute right-[1px] text-[6px] text-ibm-textSecondary leading-none">E</span>
                            </div>
                            <span className="text-[9px] font-bold text-ibm-primary">N ▲</span>
                        </div>
                    </div>

                    {project.tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => { setActiveTabId(t.id); setSelectedCell(null); setViewingCell(null); setContextMenuCell(null); }}
                            className={`h-8 px-3 border flex items-center gap-2 text-xs transition-all shrink-0 ${
                                activeTabId === t.id
                                    ? 'bg-ibm-background border-ibm-borderStrong text-ibm-text'
                                    : 'border-transparent text-ibm-textSecondary hover:bg-ibm-layerHover'
                            }`}
                        >
                            <span className="font-mono text-[10px] uppercase border px-1 border-ibm-border text-ibm-textSecondary">
                                {t.gridType === 'hex' ? '六角' : '四角'}
                            </span>
                            <span>{t.name}</span>
                            <span 
                                onClick={(e) => handleDeleteTab(t.id, e)}
                                className="hover:text-[#fa4d56] px-1 rounded transition-colors text-[10px]"
                            >
                                x
                            </span>
                        </button>
                    ))}
                    
                    {!isCreatingTab ? (
                        <button 
                            onClick={() => setIsCreatingTab(true)}
                            className="h-8 w-8 flex items-center justify-center border border-dashed border-ibm-border text-ibm-textSecondary hover:border-ibm-borderStrong hover:text-ibm-text transition-all font-mono"
                        >
                            +
                        </button>
                    ) : (
                        <div className="flex items-center gap-2 bg-ibm-background p-1 border border-ibm-border h-8 shrink-0">
                            <input 
                                type="text" 
                                placeholder="白板名称..."
                                value={newTabName}
                                onChange={e => setNewTabName(e.target.value)}
                                className="bg-transparent text-xs text-ibm-text px-1 outline-none w-20 border-r border-ibm-border"
                                onKeyDown={e => e.key === 'Enter' && handleCreateTab()}
                            />
                            <select 
                                value={newTabType} 
                                onChange={e => setNewTabType(e.target.value as 'square' | 'hex')}
                                className="text-xs outline-none mr-1 px-1.5 py-0.5 border border-ibm-border cursor-pointer transition-all hover:border-ibm-borderStrong"
                                style={{
                                    backgroundColor: 'var(--bg-layer-01, #161616)',
                                    color: 'var(--text-primary, #f4f4f4)',
                                }}
                            >
                                <option value="hex" style={{ backgroundColor: 'var(--bg-layer-01, #161616)', color: 'var(--text-primary, #f4f4f4)' }}>六边形</option>
                                <option value="square" style={{ backgroundColor: 'var(--bg-layer-01, #161616)', color: 'var(--text-primary, #f4f4f4)' }}>正方形</option>
                            </select>
                            <button onClick={handleCreateTab} className="text-[11px] text-ibm-primary font-mono mr-1">加</button>
                            <button onClick={() => setIsCreatingTab(false)} className="text-[11px] text-ibm-textSecondary font-mono">关</button>
                        </div>
                    )}
                </div>

                {/* Operations Toolbar */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Background image controls */}
                    {activeTab && (
                        <div className="flex items-center gap-2 border-r border-ibm-border pr-2 mr-2">
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleBgFileChange} 
                                accept="image/*" 
                                className="hidden" 
                            />
                            {!activeTab.bgImage ? (
                                <button 
                                    onClick={handleBgUploadClick}
                                    className="h-8 px-2 border border-ibm-border hover:bg-ibm-layerHover text-ibm-textSecondary hover:text-ibm-text text-xs transition-all"
                                >
                                    上传底图
                                </button>
                            ) : (
                                <div className="flex items-center gap-1.5 bg-ibm-background px-2 py-0.5 border border-ibm-border text-xs text-ibm-textSecondary">
                                    <span>底图已挂载</span>
                                    <input 
                                        type="range" 
                                        min="0.1" 
                                        max="1" 
                                        step="0.1" 
                                        value={activeTab.bgOpacity ?? 0.5} 
                                        onChange={e => handleOpacityChange(parseFloat(e.target.value))}
                                        className="w-12 h-1 cursor-pointer accent-ibm-primary"
                                        title="底图透明度"
                                    />
                                    <button 
                                        onClick={handleRemoveBg}
                                        className="text-[#fa4d56] hover:text-[#da1e28] ml-1 font-mono text-[10px]"
                                    >
                                        x
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={handleRecenter}
                        className="h-8 px-3 border border-ibm-border hover:bg-ibm-layerHover hover:border-ibm-borderStrong text-ibm-text text-xs font-mono transition-all flex items-center justify-center"
                    >
                        一键回中
                    </button>
                </div>
            </div>

            {/* Core Canvas Area */}
            <div ref={containerRef} className="flex-1 w-full relative">
                {activeTab ? (
                    <GridBoard
                        tab={activeTab}
                        selectedCell={
                            selectedCell || 
                            (viewingCell ? { q: viewingCell.q, r: viewingCell.r } : null) || 
                            (contextMenuCell ? { q: contextMenuCell.q, r: contextMenuCell.r } : null)
                        }
                        onCellInteraction={handleCellInteraction}
                        recenterTrigger={recenterTrigger}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-ibm-textSecondary">
                        <span>无可用白板标签页</span>
                    </div>
                )}

                {/* 查看卡片 View Mode Popover */}
                {viewingCell && activeTab && (
                    <div
                        className="absolute z-50 bg-ibm-layer border border-ibm-border shadow-2xl p-4 w-[360px] max-h-[400px] overflow-y-auto custom-scrollbar transition-all duration-150 animate-in fade-in zoom-in-95 duration-100"
                        style={{
                            left: `${Math.min(viewingCell.x + 10, bounds.width - 380)}px`,
                            top: `${Math.min(viewingCell.y + 10, bounds.height - 420)}px`,
                            backgroundColor: 'var(--bg-layer-01)',
                        }}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center pb-2 border-b border-ibm-border/45 mb-3">
                            <span className="font-mono text-[11px] text-ibm-textSecondary uppercase tracking-wider">
                                坐标 ({viewingCell.q}, {viewingCell.r}) · 查看备注
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setSelectedCell({ q: viewingCell.q, r: viewingCell.r });
                                        setViewingCell(null);
                                    }}
                                    className="text-[10px] font-mono text-ibm-primary hover:text-ibm-primaryHover border border-ibm-border px-1.5 py-0.5"
                                >
                                    编辑
                                </button>
                                <button
                                    onClick={() => setViewingCell(null)}
                                    className="text-[10px] font-mono text-ibm-textSecondary hover:text-ibm-text px-1"
                                >
                                    X
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        {(() => {
                            const cellKey = `${viewingCell.q},${viewingCell.r}`;
                            const cellData = activeTab.cells[cellKey];
                            const terrain = cellData?.color ? TERRAIN_COLORS.find(t => t.hex === cellData.color) : null;
                            const entries = cellData?.entries || [];

                            if (!cellData || (!cellData.color && entries.length === 0)) {
                                return (
                                    <p className="text-[12px] text-ibm-textPlaceholder text-center py-4 font-sans">
                                        该地块尚无地貌颜色或备注信息。
                                    </p>
                                );
                            }

                            return (
                                <div className="space-y-4">
                                    {terrain && (
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] text-ibm-textSecondary font-mono uppercase">地貌:</span>
                                            <div className="w-3.5 h-3.5 rounded-full border border-ibm-border" style={{ backgroundColor: terrain.hex }} />
                                            <span className="text-[12px] text-ibm-text font-medium">{terrain.label}</span>
                                        </div>
                                    )}

                                    {entries.length > 0 && (
                                        <div className="space-y-3">
                                            {entries.map(entry => (
                                                <div key={entry.id} className="border border-ibm-border p-3 bg-ibm-background/40" style={{ backgroundColor: 'var(--bg-background)' }}>
                                                    <div className="flex items-center gap-2 mb-2 pb-1 border-b border-ibm-border/20">
                                                        <span className="text-sm shrink-0">{entry.icon || '📌'}</span>
                                                        <span className="text-[10px] text-ibm-textSecondary font-mono truncate flex-1">
                                                            {entry.author}
                                                        </span>
                                                        <span className="text-[9px] text-ibm-textPlaceholder font-mono">
                                                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <div className="text-[12px] text-ibm-text leading-relaxed select-text font-sans">
                                                        <MarkdownRenderer content={entry.mdContent} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* 右键/长按快捷菜单 Context Menu */}
                {contextMenuCell && activeTab && (
                    <div
                        className="absolute z-50 bg-ibm-layer border border-ibm-border shadow-2xl py-1 w-[200px] text-xs font-sans transition-all duration-100 animate-in fade-in zoom-in-95 duration-100"
                        style={{
                            left: `${Math.min(contextMenuCell.x, bounds.width - 210)}px`,
                            top: `${Math.min(contextMenuCell.y, bounds.height - 380)}px`,
                            backgroundColor: 'var(--bg-layer-01)',
                        }}
                    >
                        {/* Menu Items */}
                        <button
                            onClick={() => {
                                setViewingCell({ q: contextMenuCell.q, r: contextMenuCell.r, x: contextMenuCell.x, y: contextMenuCell.y });
                                setContextMenuCell(null);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-ibm-layerHover text-ibm-text flex items-center gap-2"
                        >
                            <span>👁️</span> <span>查看备注 (View)</span>
                        </button>
                        <button
                            onClick={() => {
                                setSelectedCell({ q: contextMenuCell.q, r: contextMenuCell.r });
                                setContextMenuCell(null);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-ibm-layerHover text-ibm-text flex items-center gap-2 border-b border-ibm-border/30"
                        >
                            <span>✏️</span> <span>编辑地块 (Edit)</span>
                        </button>

                        {/* Quick Terrain Colors */}
                        <div className="px-4 py-1.5 text-[9px] font-mono text-ibm-textSecondary uppercase tracking-wider">
                            快捷地貌颜色
                        </div>
                        <div className="px-2 py-1.5 grid grid-cols-4 gap-1.5 border-b border-ibm-border/30">
                            {TERRAIN_COLORS.map(item => (
                                <button
                                    key={item.hex}
                                    type="button"
                                    onClick={() => {
                                        handleUpdateCell(contextMenuCell.q, contextMenuCell.r, { color: item.hex });
                                        setContextMenuCell(null);
                                    }}
                                    className="w-6 h-6 rounded-full border border-ibm-border/40 hover:scale-110 hover:border-ibm-text transition-all shrink-0"
                                    style={{ backgroundColor: item.hex }}
                                    title={item.label}
                                />
                            ))}
                        </div>

                        {/* Clear Cell */}
                        <button
                            onClick={() => {
                                if (confirm('确定清空该地块的颜色和所有备注内容层吗？')) {
                                    handleUpdateCell(contextMenuCell.q, contextMenuCell.r, { color: undefined, entries: [] });
                                }
                                setContextMenuCell(null);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-ibm-danger/10 hover:text-ibm-danger text-ibm-text flex items-center gap-2"
                        >
                            <span>❌</span> <span>清空该地块 (Clear)</span>
                        </button>

                        {/* Cancel */}
                        <button
                            onClick={() => setContextMenuCell(null)}
                            className="w-full text-left px-4 py-2 hover:bg-ibm-layerHover text-ibm-textSecondary flex items-center gap-2 border-t border-ibm-border/30"
                        >
                            <span>🚫</span> <span>取消 (Close)</span>
                        </button>
                    </div>
                )}

                {/* Grid cell details drawer */}
                <CellNotePanel
                    isOpen={selectedCell !== null}
                    onClose={() => setSelectedCell(null)}
                    q={selectedCell?.q || 0}
                    r={selectedCell?.r || 0}
                    cellData={selectedCellData}
                    myName={myName}
                    onUpdateCell={(updatedData) => {
                        if (selectedCell) {
                            handleUpdateCell(selectedCell.q, selectedCell.r, updatedData);
                        }
                    }}
                />
            </div>
        </div>
    );
}
