import { useState, useRef, useEffect } from 'react';
import type { WhiteboardProject, WhiteboardTab, CellData, WallSegment } from '../features/whiteboards/types';
import { GridBoard } from './GridBoard';
import { CellNotePanel, TERRAIN_COLORS } from './CellNotePanel';
import { MarkdownRenderer } from './MarkdownRenderer';
import { useMqttContext } from '../contexts/MqttContext';

const TOKEN_COLORS = [
    { hex: '#ff832b', label: '耀橙' },
    { hex: '#fa4d56', label: '绯红' },
    { hex: '#198038', label: '森绿' },
    { hex: '#0f62fe', label: '海蓝' },
    { hex: '#8a3ffc', label: '幻紫' },
    { hex: '#f1c21b', label: '闪黄' },
];

interface WhiteboardAreaProps {
    project: WhiteboardProject;
    onChange: (updatedProject: WhiteboardProject) => void;
    myName: string;
}

export function WhiteboardArea({ project, onChange, myName }: WhiteboardAreaProps) {
    const { commState, isHost, myId, connectedPlayers } = useMqttContext();
    const actualIsHost = commState === 'DISCONNECTED' ? true : isHost;
    const hasEditPermission = actualIsHost || (project.allowedEditors || []).includes(myId || 'local-user');

    const [activeTabId, setActiveTabId] = useState<string>(project.tabs[0]?.id || '');
    const [selectedCell, setSelectedCell] = useState<{ q: number; r: number } | null>(null);
    const [viewingCell, setViewingCell] = useState<{ q: number; r: number; x: number; y: number } | null>(null);
    const [contextMenuCell, setContextMenuCell] = useState<{ q: number; r: number; x: number; y: number } | null>(null);
    
    const [recenterTrigger, setRecenterTrigger] = useState(0);
    const [isCreatingTab, setIsCreatingTab] = useState(false);
    const [newTabName, setNewTabName] = useState('');
    const [newTabType, setNewTabType] = useState<'square' | 'hex'>('hex');

    const [tokenColor, setTokenColor] = useState('#ff832b');
    const [tokenLabel, setTokenLabel] = useState('战');

    const [wallDrawingMode, setWallDrawingMode] = useState<'wall' | 'door' | 'window' | 'delete' | null>(null);
    const [wallThicknessMode, setWallThicknessMode] = useState<'thin' | 'standard' | 'massive'>('standard');

    // Fog of war states & handlers
    const [fogDrawingMode, setFogDrawingMode] = useState<'paint' | 'erase' | null>(null);

    // Alignment and Painting Brush states
    const [isAlignMode, setIsAlignMode] = useState(false);
    const [tileColorBrushMode, setTileColorBrushMode] = useState<string | null>(null);

    // Collapsible states for horizontal toolbar sections
    const [terrainExpanded, setTerrainExpanded] = useState(true);
    const [fogExpanded, setFogExpanded] = useState(true);
    const [wallExpanded, setWallExpanded] = useState(true);

    const handleUpdateFogOfWar = (updatedFog: Record<string, boolean>) => {
        if (!activeTab || !hasEditPermission) return;
        const updatedTab = {
            ...activeTab,
            fogOfWar: updatedFog
        };
        onChange({
            ...project,
            tabs: project.tabs.map(t => t.id === activeTab.id ? updatedTab : t)
        });
    };

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

    // Automatically trigger recenter whenever the active page tab is opened/changed
    useEffect(() => {
        if (activeTabId) {
            setRecenterTrigger(prev => prev + 1);
            setWallDrawingMode(null);
            setFogDrawingMode(null);
            setIsAlignMode(false);
            setTileColorBrushMode(null);
        }
    }, [activeTabId]);

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

    const handleBatchUpdateCells = (cellsUpdates: Record<string, Partial<CellData>>) => {
        if (!activeTab) return;
        const updatedCells = { ...activeTab.cells };
        
        Object.entries(cellsUpdates).forEach(([key, updatedFields]) => {
            const parts = key.split(',');
            const q = parseInt(parts[0], 10);
            const r = parseInt(parts[1], 10);
            
            const existingCell = updatedCells[key] || {
                q,
                r,
                entries: []
            };
            updatedCells[key] = {
                ...existingCell,
                ...updatedFields
            };
        });
        
        const updatedTab: WhiteboardTab = {
            ...activeTab,
            cells: updatedCells
        };
        
        onChange({
            ...project,
            tabs: project.tabs.map(t => t.id === activeTab.id ? updatedTab : t)
        });
    };

    const handleUpdateBgPosition = (bgX: number, bgY: number, bgScale: number) => {
        if (!activeTab || !hasEditPermission) return;
        const updatedTab = {
            ...activeTab,
            bgX,
            bgY,
            bgScale
        };
        onChange({
            ...project,
            tabs: project.tabs.map(t => t.id === activeTab.id ? updatedTab : t)
        });
    };

    const handleUpdateWalls = (updatedWalls: WallSegment[]) => {
        if (!activeTab || !hasEditPermission) return;
        const updatedTab = {
            ...activeTab,
            walls: updatedWalls
        };
        onChange({
            ...project,
            tabs: project.tabs.map(t => t.id === activeTab.id ? updatedTab : t)
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

        // Check file size (5MB threshold)
        const sizeInMB = file.size / (1024 * 1024);
        if (sizeInMB > 5.0) {
            const confirmUpload = confirm(
                `⚠️ 警告：当前上传的地图底图体积为 ${sizeInMB.toFixed(2)}MB，已超出系统推荐的 5MB 限制！\n\n` +
                `虽然本地数据库支持储存，但过大的图片在实际跑团中极易引发以下问题：\n` +
                `1. 联机大厅向其他玩家广播同步地图时，极易因数据过大导致同步超时或失败。\n` +
                `2. 浏览器画布渲染特大图片时，可能在移动指示物时产生明显的拖拽延迟与卡顿。\n` +
                `3. 超出浏览器 LocalStorage 的备份限制，导致无法在旧设备上兼容还原。\n\n` +
                `【强烈建议】：使用图片压缩工具将底图处理至 5MB 以内再行上传。\n\n` +
                `您确定要强行继续上传当前 ${sizeInMB.toFixed(2)}MB 的底图吗？`
            );
            if (!confirmUpload) {
                e.target.value = ''; // Reset file input
                return;
            }
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            const updatedTab: WhiteboardTab = {
                ...activeTab,
                bgImage: base64,
                bgOpacity: activeTab.bgOpacity ?? 0.5,
                bgX: activeTab.bgX ?? 0,
                bgY: activeTab.bgY ?? 0,
                bgScale: activeTab.bgScale ?? 1
            };
            const updatedTabs = project.tabs.map(t => t.id === activeTab.id ? updatedTab : t);
            onChange({
                ...project,
                tabs: updatedTabs
            });
            // Force center camera viewport layout around coordinates origin
            setRecenterTrigger(prev => prev + 1);
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
                    {activeTab && hasEditPermission && (
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
                                        onClick={() => {
                                            setIsAlignMode(prev => !prev);
                                            setWallDrawingMode(null);
                                            setFogDrawingMode(null);
                                            setTileColorBrushMode(null);
                                        }}
                                        className={`h-6 px-1.5 rounded transition-all text-[10px] border flex items-center justify-center font-bold ${
                                            isAlignMode
                                                ? 'bg-ibm-primary border-ibm-primary text-white shadow-sm'
                                                : 'bg-transparent border-ibm-border hover:bg-ibm-layerHover hover:text-ibm-text text-ibm-textSecondary'
                                        }`}
                                        title="开启底图鼠标拖拽/微调对齐校准"
                                    >
                                        校准对齐
                                    </button>
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

                    {/* Host Permission Panel Dropdown */}
                    {actualIsHost && commState === 'CONNECTED' && (
                        <div className="relative group border-r border-ibm-border pr-2 mr-2 h-8 flex items-center">
                            <button className="h-8 px-2 border border-ibm-border hover:bg-ibm-layerHover text-ibm-textSecondary hover:text-ibm-text text-xs transition-all flex items-center gap-1">
                                <span>📝 授权编辑</span>
                                <span className="text-[9px]">▼</span>
                            </button>
                            <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-ibm-layer border border-ibm-border shadow-2xl p-3 w-48 z-50 text-xs" style={{ backgroundColor: 'var(--bg-layer-01, #161616)' }}>
                                <p className="font-mono text-[9px] text-ibm-textSecondary uppercase tracking-wider mb-2 border-b border-ibm-border pb-1">分配编辑权限</p>
                                {connectedPlayers.filter(p => p.id !== myId).length === 0 ? (
                                    <p className="text-ibm-textPlaceholder italic py-1">房间内暂无其他玩家</p>
                                ) : (
                                    <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
                                        {connectedPlayers.filter(p => p.id !== myId).map(player => {
                                            const isAllowed = (project.allowedEditors || []).includes(player.id);
                                            return (
                                                <label key={player.id} className="flex items-center gap-2 cursor-pointer text-ibm-text hover:text-ibm-primary py-0.5 select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={isAllowed}
                                                        onChange={() => {
                                                            const currentAllowed = project.allowedEditors || [];
                                                            const updatedAllowed = isAllowed
                                                                ? currentAllowed.filter(id => id !== player.id)
                                                                : [...currentAllowed, player.id];
                                                            onChange({
                                                                ...project,
                                                                allowedEditors: updatedAllowed
                                                            });
                                                        }}
                                                        className="rounded border-ibm-border text-ibm-primary focus:ring-0 cursor-pointer accent-ibm-primary"
                                                    />
                                                    <span className="truncate flex-1">{player.name}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
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
                {/* 1. Alignment Adjustment Floating Banner */}
                {isAlignMode && activeTab && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40 bg-ibm-layer/95 border border-ibm-primary/80 shadow-2xl px-4 py-2.5 flex items-center gap-4 rounded-full backdrop-blur-md transition-all text-xs border-solid" style={{ backgroundColor: 'var(--bg-layer-01, #161616)' }}>
                        <span className="font-bold text-ibm-primary shrink-0 flex items-center gap-1.5 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-ibm-primary" />
                            底图校准对齐模式
                        </span>
                        <div className="h-4 w-px bg-ibm-border" />
                        <div className="flex items-center gap-1">
                            <span className="text-ibm-textSecondary mr-1 font-sans">位移:</span>
                            <button
                                onClick={() => handleUpdateBgPosition((activeTab.bgX ?? 0) - 1, activeTab.bgY ?? 0, activeTab.bgScale ?? 1)}
                                className="w-6 h-6 border border-ibm-border bg-ibm-background hover:bg-ibm-layerHover text-ibm-text flex items-center justify-center rounded font-mono active:scale-95 transition-all text-sm font-bold"
                                title="向左微调 1px"
                            >
                                ←
                            </button>
                            <button
                                onClick={() => handleUpdateBgPosition(activeTab.bgX ?? 0, (activeTab.bgY ?? 0) + 1, activeTab.bgScale ?? 1)}
                                className="w-6 h-6 border border-ibm-border bg-ibm-background hover:bg-ibm-layerHover text-ibm-text flex items-center justify-center rounded font-mono active:scale-95 transition-all text-sm font-bold"
                                title="向下微调 1px"
                            >
                                ↓
                            </button>
                            <button
                                onClick={() => handleUpdateBgPosition(activeTab.bgX ?? 0, (activeTab.bgY ?? 0) - 1, activeTab.bgScale ?? 1)}
                                className="w-6 h-6 border border-ibm-border bg-ibm-background hover:bg-ibm-layerHover text-ibm-text flex items-center justify-center rounded font-mono active:scale-95 transition-all text-sm font-bold"
                                title="向上微调 1px"
                            >
                                ↑
                            </button>
                            <button
                                onClick={() => handleUpdateBgPosition((activeTab.bgX ?? 0) + 1, activeTab.bgY ?? 0, activeTab.bgScale ?? 1)}
                                className="w-6 h-6 border border-ibm-border bg-ibm-background hover:bg-ibm-layerHover text-ibm-text flex items-center justify-center rounded font-mono active:scale-95 transition-all text-sm font-bold"
                                title="向右微调 1px"
                            >
                                →
                            </button>
                        </div>
                        <div className="flex items-center gap-1.5 ml-2">
                            <span className="text-ibm-textSecondary mr-1 font-sans">缩放:</span>
                            <button
                                onClick={() => handleUpdateBgPosition(activeTab.bgX ?? 0, activeTab.bgY ?? 0, Math.max(0.1, (activeTab.bgScale ?? 1) - 0.01))}
                                className="w-6 h-6 border border-ibm-border bg-ibm-background hover:bg-ibm-layerHover text-ibm-text flex items-center justify-center rounded font-mono active:scale-95 transition-all text-xs font-bold"
                                title="缩放 -1%"
                            >
                                -
                            </button>
                            <span className="font-mono w-12 text-center text-ibm-text font-bold">
                                {Math.round((activeTab.bgScale ?? 1) * 100)}%
                            </span>
                            <button
                                onClick={() => handleUpdateBgPosition(activeTab.bgX ?? 0, activeTab.bgY ?? 0, (activeTab.bgScale ?? 1) + 0.01)}
                                className="w-6 h-6 border border-ibm-border bg-ibm-background hover:bg-ibm-layerHover text-ibm-text flex items-center justify-center rounded font-mono active:scale-95 transition-all text-xs font-bold"
                                title="缩放 +1%"
                            >
                                +
                            </button>
                        </div>
                        <div className="h-4 w-px bg-ibm-border" />
                        <button
                            onClick={() => handleUpdateBgPosition(0, 0, 1)}
                            className="px-2.5 h-6 border border-ibm-border hover:bg-ibm-layerHover text-ibm-textSecondary rounded flex items-center justify-center transition-all active:scale-95 text-[10px] font-sans"
                        >
                            原点复位
                        </button>
                        <button
                            onClick={() => setIsAlignMode(false)}
                            className="px-3 h-6 bg-ibm-primary hover:bg-ibm-primaryHover text-white rounded flex items-center justify-center transition-all active:scale-95 shadow-md font-bold font-sans"
                        >
                            完成校准
                        </button>
                    </div>
                )}

                {/* ── Unified Map Tools Toolbar (Horizontal & Collapsible Blocks) ── */}
                {activeTab && hasEditPermission && (
                    <div
                        className="absolute left-4 top-4 z-40 bg-ibm-layer/95 border border-ibm-borderStrong shadow-2xl p-2 flex flex-row items-center gap-3 rounded backdrop-blur-md max-w-[calc(100%-2rem)] flex-wrap"
                        style={{ backgroundColor: 'var(--bg-layer-01, #161616)' }}
                    >
                        {/* ── Block 1: Terrain (地貌) ── */}
                        <div className="flex items-center gap-1.5 bg-ibm-background/40 border border-ibm-border/60 p-1 rounded transition-all">
                            <button
                                onClick={() => setTerrainExpanded(!terrainExpanded)}
                                className={`h-8 px-2 flex items-center gap-1.5 text-xs font-sans font-bold hover:bg-ibm-layerHover text-ibm-text transition-all rounded ${
                                    terrainExpanded ? 'text-[#ff832b]' : 'text-ibm-textSecondary'
                                }`}
                                title={terrainExpanded ? '收起地貌工具栏' : '展开地貌工具栏'}
                            >
                                <span className="text-sm">🗺️</span>
                                <span className="hidden sm:inline">地貌</span>
                                <span className="text-[9px] font-mono opacity-65">{terrainExpanded ? '◀' : '▶'}</span>
                            </button>

                            {terrainExpanded && (
                                <div className="flex items-center gap-1.5 border-l border-ibm-border/40 pl-1.5 animate-in slide-in-from-left duration-200">
                                    {TERRAIN_COLORS.map(item => (
                                        <button
                                            key={item.hex}
                                            onClick={() => {
                                                setTileColorBrushMode(prev => prev === item.hex ? null : item.hex);
                                                setWallDrawingMode(null);
                                                setFogDrawingMode(null);
                                                setIsAlignMode(false);
                                            }}
                                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all relative group border hover:scale-110 active:scale-95 cursor-pointer ${
                                                tileColorBrushMode === item.hex
                                                    ? 'border-white scale-115 shadow-md ring-2 ring-[#ff832b]'
                                                    : 'border-black/50 hover:border-white/80'
                                            }`}
                                            style={{ backgroundColor: item.hex }}
                                            title={`地貌刷: ${item.label}`}
                                        >
                                            {tileColorBrushMode === item.hex && (
                                                <span className="text-[9px] font-bold text-white drop-shadow-md leading-none bg-black/40 rounded-full w-4 h-4 flex items-center justify-center">✓</span>
                                            )}
                                            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 shadow-md">{item.label}</span>
                                        </button>
                                    ))}
                                    
                                    <div className="w-px h-6 bg-ibm-border/60 mx-0.5" />
                                    
                                    {/* Terrain eraser */}
                                    <button
                                        onClick={() => { setTileColorBrushMode(prev => prev === 'eraser' ? null : 'eraser'); setWallDrawingMode(null); setFogDrawingMode(null); setIsAlignMode(false); }}
                                        className={`w-8 h-8 rounded flex items-center justify-center text-xs transition-all relative group border hover:scale-110 active:scale-95 cursor-pointer ${
                                            tileColorBrushMode === 'eraser' 
                                                ? 'bg-[#fa4d56] border-[#fa4d56] text-white shadow-md' 
                                                : 'bg-ibm-background/90 border-ibm-borderStrong hover:bg-ibm-layerHover text-ibm-text'
                                        }`}
                                        title="地貌橡皮擦"
                                    >
                                        <span>🧹</span>
                                        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 shadow-md">橡皮擦</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="w-px h-8 bg-ibm-border hidden sm:block" />

                        {/* ── Block 2: Fog of War (迷雾) ── */}
                        <div className="flex items-center gap-1.5 bg-ibm-background/40 border border-ibm-border/60 p-1 rounded transition-all">
                            <button
                                onClick={() => setFogExpanded(!fogExpanded)}
                                className={`h-8 px-2 flex items-center gap-1.5 text-xs font-sans font-bold hover:bg-ibm-layerHover text-ibm-text transition-all rounded ${
                                    fogExpanded ? 'text-[#ff832b]' : 'text-ibm-textSecondary'
                                }`}
                                title={fogExpanded ? '收起迷雾工具栏' : '展开迷雾工具栏'}
                            >
                                <span className="text-sm">👁️</span>
                                <span className="hidden sm:inline">迷雾</span>
                                <span className="text-[9px] font-mono opacity-65">{fogExpanded ? '◀' : '▶'}</span>
                            </button>

                            {fogExpanded && (
                                <div className="flex items-center gap-1.5 border-l border-ibm-border/40 pl-1.5 animate-in slide-in-from-left duration-200">
                                    <button
                                        onClick={() => {
                                            onChange({ ...project, tabs: project.tabs.map(t => t.id === activeTab.id ? { ...activeTab, fogEnabled: !activeTab.fogEnabled } : t) });
                                            if (activeTab.fogEnabled) setFogDrawingMode(null);
                                        }}
                                        className={`w-8 h-8 rounded flex items-center justify-center text-xs transition-all relative group border hover:scale-110 active:scale-95 cursor-pointer ${
                                            activeTab.fogEnabled 
                                                ? 'bg-[#ff832b] border-[#ff832b] text-white shadow-md' 
                                                : 'bg-ibm-background/90 border-ibm-borderStrong hover:bg-ibm-layerHover text-ibm-text hover:border-[#ff832b]'
                                        }`}
                                        title={activeTab.fogEnabled ? '关闭迷雾覆盖' : '启用迷雾覆盖'}
                                    >
                                        <span>👁️</span>
                                        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 shadow-md">{activeTab.fogEnabled ? '关闭迷雾' : '启用迷雾'}</span>
                                    </button>
                                    
                                    <button
                                        onClick={() => {
                                            if (!activeTab.fogEnabled) onChange({ ...project, tabs: project.tabs.map(t => t.id === activeTab.id ? { ...activeTab, fogEnabled: true } : t) });
                                            setFogDrawingMode(prev => prev === 'paint' ? null : 'paint');
                                            setWallDrawingMode(null); setTileColorBrushMode(null);
                                        }}
                                        className={`w-8 h-8 rounded flex items-center justify-center text-xs transition-all relative group border hover:scale-110 active:scale-95 cursor-pointer ${
                                            fogDrawingMode === 'paint' 
                                                ? 'bg-ibm-primary border-ibm-primary text-white shadow-md' 
                                                : 'bg-ibm-background/90 border-ibm-borderStrong hover:bg-ibm-layerHover text-ibm-text'
                                        }`}
                                        title="铺设战争迷雾 (遮挡)"
                                    >
                                        <span>🌑</span>
                                        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 shadow-md">铺设 (遮蔽)</span>
                                    </button>
                                    
                                    <button
                                        onClick={() => {
                                            if (!activeTab.fogEnabled) onChange({ ...project, tabs: project.tabs.map(t => t.id === activeTab.id ? { ...activeTab, fogEnabled: true } : t) });
                                            setFogDrawingMode(prev => prev === 'erase' ? null : 'erase');
                                            setWallDrawingMode(null); setTileColorBrushMode(null);
                                        }}
                                        className={`w-8 h-8 rounded flex items-center justify-center text-xs transition-all relative group border hover:scale-110 active:scale-95 cursor-pointer ${
                                            fogDrawingMode === 'erase' 
                                                ? 'bg-ibm-primary border-ibm-primary text-white shadow-md' 
                                                : 'bg-ibm-background/90 border-ibm-borderStrong hover:bg-ibm-layerHover text-ibm-text'
                                        }`}
                                        title="擦除战争迷雾 (开视野)"
                                    >
                                        <span>☀️</span>
                                        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 shadow-md">擦除 (视野)</span>
                                    </button>

                                    <div className="w-px h-6 bg-ibm-border/60 mx-0.5" />
                                    
                                    <button
                                        onClick={() => {
                                            const newFog: Record<string, boolean> = {};
                                            for (let q = -18; q <= 18; q++) for (let r = -18; r <= 18; r++) newFog[`${q},${r}`] = true;
                                            Object.keys(activeTab.cells).forEach(k => { newFog[k] = true; });
                                            onChange({ ...project, tabs: project.tabs.map(t => t.id === activeTab.id ? { ...activeTab, fogEnabled: true, fogOfWar: newFog } : t) });
                                        }}
                                        className="w-8 h-8 rounded flex items-center justify-center text-xs transition-all relative group border bg-ibm-background/90 border-ibm-borderStrong hover:bg-ibm-layerHover hover:scale-110 active:scale-95 cursor-pointer text-ibm-text"
                                        title="全图笼罩迷雾"
                                    >
                                        <span>⬛</span>
                                        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 shadow-md">铺满迷雾</span>
                                    </button>
                                    
                                    <button
                                        onClick={() => { if (confirm('确定清除所有迷雾吗？')) onChange({ ...project, tabs: project.tabs.map(t => t.id === activeTab.id ? { ...activeTab, fogOfWar: {} } : t) }); }}
                                        className="w-8 h-8 rounded flex items-center justify-center text-xs transition-all relative group border bg-ibm-background/90 border-ibm-borderStrong hover:bg-ibm-layerHover hover:scale-110 active:scale-95 cursor-pointer text-ibm-text"
                                        title="清除全图迷雾"
                                    >
                                        <span>⬜</span>
                                        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 shadow-md">清除迷雾</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        {activeTab.gridType === 'square' && <div className="w-px h-8 bg-ibm-border hidden sm:block" />}

                        {/* ── Block 3: Wall Drawing (墙体, square only) ── */}
                        {activeTab.gridType === 'square' && (
                            <div className="flex items-center gap-1.5 bg-ibm-background/40 border border-ibm-border/60 p-1 rounded transition-all">
                                <button
                                    onClick={() => setWallExpanded(!wallExpanded)}
                                    className={`h-8 px-2 flex items-center gap-1.5 text-xs font-sans font-bold hover:bg-ibm-layerHover text-ibm-text transition-all rounded ${
                                        wallExpanded ? 'text-[#ff832b]' : 'text-ibm-textSecondary'
                                    }`}
                                    title={wallExpanded ? '收起墙体工具栏' : '展开墙体工具栏'}
                                >
                                    <span className="text-sm">🧱</span>
                                    <span className="hidden sm:inline">墙体</span>
                                    <span className="text-[9px] font-mono opacity-65">{wallExpanded ? '◀' : '▶'}</span>
                                </button>

                                {wallExpanded && (
                                    <div className="flex items-center gap-1.5 border-l border-ibm-border/40 pl-1.5 animate-in slide-in-from-left duration-200">
                                        {[
                                            { mode: 'wall' as const, icon: '🧱', label: '绘制墙体' },
                                            { mode: 'door' as const, icon: '🚶', label: '放置门扇' },
                                            { mode: 'window' as const, icon: '🪟', label: '绘制窗格' },
                                        ].map(({ mode, icon, label }) => (
                                            <button
                                                key={mode}
                                                onClick={() => { setWallDrawingMode(prev => prev === mode ? null : mode); setFogDrawingMode(null); setTileColorBrushMode(null); }}
                                                className={`w-8 h-8 rounded flex items-center justify-center text-xs transition-all relative group border hover:scale-110 active:scale-95 cursor-pointer ${
                                                    wallDrawingMode === mode 
                                                        ? 'bg-ibm-primary border-ibm-primary text-white shadow-md' 
                                                        : 'bg-ibm-background/90 border-ibm-borderStrong hover:bg-ibm-layerHover text-ibm-text'
                                                }`}
                                                title={label}
                                            >
                                                <span>{icon}</span>
                                                <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 shadow-md">{label}</span>
                                            </button>
                                        ))}
                                        
                                        <button
                                            onClick={() => { setWallDrawingMode(prev => prev === 'delete' ? null : 'delete'); setFogDrawingMode(null); setTileColorBrushMode(null); }}
                                            className={`w-8 h-8 rounded flex items-center justify-center text-xs transition-all relative group border hover:scale-110 active:scale-95 cursor-pointer ${
                                                wallDrawingMode === 'delete' 
                                                    ? 'bg-[#fa4d56] border-[#fa4d56] text-white shadow-md' 
                                                    : 'bg-ibm-background/90 border-ibm-borderStrong hover:bg-ibm-layerHover text-ibm-text'
                                            }`}
                                            title="擦除墙体"
                                        >
                                            <span>✂️</span>
                                            <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-black text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-50 shadow-md">擦除墙体</span>
                                        </button>

                                        {/* Thickness controls */}
                                        {['wall', 'door', 'window'].includes(wallDrawingMode || '') && (
                                            <div className="flex bg-ibm-background border border-ibm-borderStrong p-0.5 rounded ml-1">
                                                {(['thin', 'standard', 'massive'] as const).map((t, i) => (
                                                    <button 
                                                        key={t} 
                                                        onClick={() => setWallThicknessMode(t)}
                                                        className={`px-2 py-1 text-[9px] font-bold rounded transition-all cursor-pointer ${
                                                            wallThicknessMode === t 
                                                                ? 'bg-ibm-primary text-white' 
                                                                : 'bg-transparent text-ibm-textSecondary hover:bg-ibm-layerHover'
                                                        }`}
                                                    >
                                                        {['细', '中', '粗'][i]}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}



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
                        allowedEditors={project.allowedEditors}
                        myId={myId}
                        isHost={actualIsHost}
                        onUpdateTokens={(updatedTokens) => {
                            const updatedTab = {
                                ...activeTab,
                                tokens: updatedTokens
                            };
                            onChange({
                                ...project,
                                tabs: project.tabs.map(t => t.id === activeTab.id ? updatedTab : t)
                            });
                        }}
                        wallDrawingMode={wallDrawingMode}
                        wallThicknessMode={wallThicknessMode}
                        onUpdateWalls={handleUpdateWalls}
                        fogDrawingMode={fogDrawingMode}
                        onUpdateFogOfWar={handleUpdateFogOfWar}
                        isAlignMode={isAlignMode}
                        onUpdateBgPosition={handleUpdateBgPosition}
                        tileColorBrushMode={tileColorBrushMode}
                        onBatchUpdateCells={handleBatchUpdateCells}
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
                                {hasEditPermission && (
                                    <button
                                        onClick={() => {
                                            setSelectedCell({ q: viewingCell.q, r: viewingCell.r });
                                            setViewingCell(null);
                                        }}
                                        className="text-[10px] font-mono text-ibm-primary hover:text-ibm-primaryHover border border-ibm-border px-1.5 py-0.5"
                                    >
                                        编辑
                                    </button>
                                )}
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
                        className="absolute z-50 bg-ibm-layer border border-ibm-border shadow-2xl py-1 w-[220px] text-xs font-sans transition-all duration-100 animate-in fade-in zoom-in-95 duration-100"
                        style={{
                            left: `${Math.min(contextMenuCell.x, bounds.width - 230)}px`,
                            top: `${Math.min(contextMenuCell.y, bounds.height - 440)}px`,
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
                        
                        {hasEditPermission && (
                            <>
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
                            </>
                        )}

                        {/* Draggable Circle Tokens Section */}
                        <div className="border-b border-ibm-border/30 pb-2 mb-1">
                            <div className="px-4 py-1.5 text-[9px] font-mono text-ibm-textSecondary uppercase tracking-wider">
                                放置圆形指示物
                            </div>
                            
                            {/* Color Selector */}
                            <div className="px-4 py-1 flex gap-1.5">
                                {TOKEN_COLORS.map(c => (
                                    <button
                                        key={c.hex}
                                        onClick={() => setTokenColor(c.hex)}
                                        className={`w-4 h-4 rounded-full border transition-all ${
                                            tokenColor === c.hex ? 'border-ibm-text scale-110' : 'border-transparent hover:scale-110'
                                        }`}
                                        style={{ backgroundColor: c.hex }}
                                        title={c.label}
                                    />
                                ))}
                            </div>

                            {/* Label Input & Place Button */}
                            <div className="px-4 py-2 flex gap-2 items-center">
                                <input
                                    type="text"
                                    maxLength={1}
                                    placeholder="字"
                                    value={tokenLabel}
                                    onChange={e => setTokenLabel(e.target.value)}
                                    className="w-10 bg-ibm-background text-ibm-text border border-ibm-border px-1.5 py-0.5 text-center text-xs outline-none"
                                />
                                <button
                                    onClick={() => {
                                        const currentTokens = activeTab.tokens || [];
                                        const newToken = {
                                            id: 'token-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5),
                                            q: contextMenuCell.q,
                                            r: contextMenuCell.r,
                                            color: tokenColor,
                                            label: tokenLabel.trim().substring(0, 1) || '?',
                                            ownerId: myId || 'local-user',
                                            ownerName: myName || '玩家'
                                        };
                                        const updatedTab = {
                                            ...activeTab,
                                            tokens: [...currentTokens, newToken]
                                        };
                                        onChange({
                                            ...project,
                                            tabs: project.tabs.map(t => t.id === activeTab.id ? updatedTab : t)
                                        });
                                        setContextMenuCell(null);
                                    }}
                                    className="flex-1 h-7 bg-[#ff832b] text-white hover:bg-[#e86c14] text-[10px] font-mono font-medium transition-colors flex items-center justify-center shadow-sm"
                                >
                                    放置
                                </button>
                            </div>
                        </div>

                        {/* Existing cell tokens deletion */}
                        {(() => {
                            const cellTokens = (activeTab.tokens || []).filter(
                                t => t.q === contextMenuCell.q && t.r === contextMenuCell.r
                            );
                            if (cellTokens.length === 0) return null;
                            return (
                                <div className="border-b border-ibm-border/30 pb-2 mb-1">
                                    <div className="px-4 py-1.5 text-[9px] font-mono text-ibm-textSecondary uppercase tracking-wider">
                                        地块指示物列表
                                    </div>
                                    <div className="px-4 space-y-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                                        {cellTokens.map(token => {
                                            const canDelete = actualIsHost || token.ownerId === myId;
                                            return (
                                                <div key={token.id} className="flex items-center justify-between gap-1 text-[11px] text-ibm-text">
                                                    <div className="flex items-center gap-1.5 truncate">
                                                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: token.color }} />
                                                        <span className="font-bold shrink-0">[{token.label}]</span>
                                                        <span className="text-[10px] text-ibm-textSecondary truncate">{token.ownerName}</span>
                                                    </div>
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => {
                                                                const updatedTab = {
                                                                    ...activeTab,
                                                                    tokens: (activeTab.tokens || []).filter(t => t.id !== token.id)
                                                                };
                                                                onChange({
                                                                    ...project,
                                                                    tabs: project.tabs.map(t => t.id === activeTab.id ? updatedTab : t)
                                                                });
                                                                setContextMenuCell(null);
                                                            }}
                                                            className="text-[#fa4d56] hover:text-[#da1e28] font-mono text-[9px]"
                                                        >
                                                            删除
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Clear Cell */}
                        {hasEditPermission && (
                            <button
                                onClick={() => {
                                    if (confirm('确定清空该地块的颜色和所有备注内容层吗？')) {
                                        handleUpdateCell(contextMenuCell.q, contextMenuCell.r, { color: undefined, entries: [] });
                                    }
                                    setContextMenuCell(null);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-ibm-danger/10 hover:text-ibm-danger text-ibm-text flex items-center gap-2 border-b border-ibm-border/30"
                            >
                                <span>❌</span> <span>清空该地块 (Clear)</span>
                            </button>
                        )}

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
                    isOpen={selectedCell !== null && hasEditPermission}
                    onClose={() => setSelectedCell(null)}
                    q={selectedCell?.q || 0}
                    r={selectedCell?.r || 0}
                    cellData={selectedCellData}
                    myName={myName}
                    onUpdateCell={(updatedData) => {
                        if (selectedCell && hasEditPermission) {
                            handleUpdateCell(selectedCell.q, selectedCell.r, updatedData);
                        }
                    }}
                />
            </div>
        </div>
    );
}
