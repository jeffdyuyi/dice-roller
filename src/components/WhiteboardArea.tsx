import { useState, useRef } from 'react';
import type { WhiteboardProject, WhiteboardTab, CellData } from '../features/whiteboards/types';
import { GridBoard } from './GridBoard';
import { CellNotePanel } from './CellNotePanel';

interface WhiteboardAreaProps {
    project: WhiteboardProject;
    onChange: (updatedProject: WhiteboardProject) => void;
    myName: string;
}

export function WhiteboardArea({ project, onChange, myName }: WhiteboardAreaProps) {
    const [activeTabId, setActiveTabId] = useState<string>(project.tabs[0]?.id || '');
    const [selectedCell, setSelectedCell] = useState<{ q: number; r: number } | null>(null);
    const [recenterTrigger, setRecenterTrigger] = useState(0);
    const [isCreatingTab, setIsCreatingTab] = useState(false);
    const [newTabName, setNewTabName] = useState('');
    const [newTabType, setNewTabType] = useState<'square' | 'hex'>('hex');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeTab = project.tabs.find(t => t.id === activeTabId) || project.tabs[0];

    // Ensure we have an active tab ID if tab gets updated/deleted
    if (activeTab && activeTab.id !== activeTabId) {
        setActiveTabId(activeTab.id);
    }

    const handleSelectCell = (q: number, r: number) => {
        setSelectedCell({ q, r });
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
                {/* Tabs selection */}
                <div className="flex items-center gap-1 overflow-x-auto pr-4 custom-scrollbar-horizontal h-full py-1">
                    {project.tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => { setActiveTabId(t.id); setSelectedCell(null); }}
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
                                className="bg-transparent text-xs text-ibm-textSecondary outline-none mr-1"
                            >
                                <option value="hex">六边形</option>
                                <option value="square">正方形</option>
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
            <div className="flex-1 w-full relative">
                {activeTab ? (
                    <GridBoard
                        tab={activeTab}
                        selectedCell={selectedCell}
                        onSelectCell={handleSelectCell}
                        recenterTrigger={recenterTrigger}
                    />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-ibm-textSecondary">
                        <span>无可用白板标签页</span>
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
