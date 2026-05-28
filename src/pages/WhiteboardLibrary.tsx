import { useState, useEffect } from 'react';
import { getMyWhiteboards, saveWhiteboard, deleteWhiteboard } from '../features/whiteboards/api';
import type { WhiteboardProject, WhiteboardTab } from '../features/whiteboards/types';
import { WhiteboardArea } from '../components/WhiteboardArea';
import { useMqttContext } from '../contexts/MqttContext';

export function WhiteboardLibrary() {
    const { myId, myName, commState, isHost, updateRoomWhiteboard } = useMqttContext();
    const [boards, setBoards] = useState<WhiteboardProject[]>([]);
    const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
    const [activeBoard, setActiveBoard] = useState<WhiteboardProject | null>(null);
    const [newBoardName, setNewBoardName] = useState('');
    const [isCreatingBoard, setIsCreatingBoard] = useState(false);

    const handleExportBoard = (board: WhiteboardProject, e: React.MouseEvent) => {
        e.stopPropagation();
        const dataStr = JSON.stringify(board, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${board.name}_export.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        document.getElementById('import-board-file-input')?.click();
    };

    const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const data = JSON.parse(evt.target?.result as string);
                if (!data.name || !Array.isArray(data.tabs)) {
                    alert('导入失败：无效的白板数据格式！');
                    return;
                }
                const newBoard: WhiteboardProject = {
                    ...data,
                    id: 'board-' + Date.now().toString(36),
                    userId: myId || 'local-user',
                    updatedAt: Date.now()
                };
                await saveWhiteboard(newBoard);
                alert(`成功导入白板: ${newBoard.name}`);
                await refreshBoards();
            } catch (err) {
                alert('导入失败：解析 JSON 文件出错！');
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset
    };

    // Refresh list of boards
    const refreshBoards = async () => {
        const list = await getMyWhiteboards(myId || 'local-user');
        setBoards(list);
    };

    useEffect(() => {
        refreshBoards();
    }, [myId]);

    // Load active board if selected
    useEffect(() => {
        if (!selectedBoardId) {
            setActiveBoard(null);
            return;
        }
        const b = boards.find(x => x.id === selectedBoardId);
        if (b) {
            setActiveBoard(b);
        }
    }, [selectedBoardId, boards]);

    const handleCreateBoard = async () => {
        if (!newBoardName.trim()) return;
        const defaultTab: WhiteboardTab = {
            id: 'tab-' + Date.now().toString(36),
            name: '默认白板',
            gridType: 'hex',
            cells: {}
        };
        const newProj: WhiteboardProject = {
            id: 'board-' + Date.now().toString(36),
            name: newBoardName.trim(),
            userId: myId || 'local-user',
            updatedAt: Date.now(),
            tabs: [defaultTab]
        };
        await saveWhiteboard(newProj);
        setNewBoardName('');
        setIsCreatingBoard(false);
        await refreshBoards();
        setSelectedBoardId(newProj.id); // Open it immediately
    };

    const handleDeleteBoard = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('确定删除该白板资源吗？这会抹除其中的所有网格标签页！')) return;
        await deleteWhiteboard(id);
        await refreshBoards();
    };

    const handleBoardChange = async (updated: WhiteboardProject) => {
        setActiveBoard(updated);
        await saveWhiteboard(updated);
        // Refresh local array
        setBoards(prev => prev.map(b => b.id === updated.id ? updated : b));
    };

    // Rendering Active Editing Session
    if (activeBoard) {
        return (
            <div className="w-full h-full flex flex-col bg-ibm-background">
                {/* Editing Header bar */}
                <div className="h-14 bg-ibm-layer border-b border-ibm-border px-6 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setSelectedBoardId(null)}
                            className="h-8 px-4 border border-ibm-border hover:bg-ibm-layerHover text-ibm-text text-xs font-mono transition-all"
                        >
                            ← 返回白板库
                        </button>
                        <div className="h-4 w-px bg-ibm-border"></div>
                        <div>
                            <span className="text-[12px] font-mono text-ibm-textSecondary uppercase tracking-widest">当前编辑: </span>
                            <span className="text-sm font-sans font-medium text-ibm-text">{activeBoard.name}</span>
                        </div>
                    </div>
                    {commState === 'CONNECTED' && isHost && (
                        <button
                            onClick={() => {
                                if (confirm(`确认将当前编辑的白板 [${activeBoard.name}] 载入到当前联机房间吗？这会更新全员画面！`)) {
                                    updateRoomWhiteboard(activeBoard);
                                    alert(`当前白板 [${activeBoard.name}] 已载入房间并同步！`);
                                }
                            }}
                            className="h-8 px-4 bg-ibm-primary text-ibm-textOnColor hover:bg-ibm-primaryHover text-xs font-mono transition-all border border-ibm-primary"
                        >
                            🚀 同步至联机房间
                        </button>
                    )}
                </div>

                <div className="flex-1 w-full overflow-hidden">
                    <WhiteboardArea
                        project={activeBoard}
                        onChange={handleBoardChange}
                        myName={myName || '主持人'}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 pb-32 max-w-5xl mx-auto w-full h-full flex flex-col">
            <header className="mb-12 flex justify-between items-end border-b border-ibm-border pb-6 shrink-0">
                <div>
                    <h1 className="text-ibm-text text-4xl font-sans font-light tracking-tight mb-2">白板库存</h1>
                    <p className="text-ibm-textSecondary font-sans text-sm">管理和创建基于网格的地城和参照白板</p>
                </div>
                <div className="flex gap-4 items-center">
                    <input 
                        type="file" 
                        id="import-board-file-input" 
                        accept=".json" 
                        onChange={handleImportFileChange} 
                        className="hidden" 
                    />
                    <button 
                        onClick={handleImportClick}
                        className="h-10 px-4 border border-ibm-border text-ibm-text hover:bg-ibm-layerHover transition-all font-sans text-[14px]"
                    >
                        导入白板 (.json)
                    </button>
                    {!isCreatingBoard ? (
                        <button 
                            onClick={() => setIsCreatingBoard(true)}
                            className="h-10 px-6 bg-[#ff832b] text-white hover:bg-[#e86c14] transition-colors shadow-sm font-sans text-[14px]"
                        >
                            创建新白板
                        </button>
                    ) : (
                        <div className="flex gap-2 items-center bg-ibm-layer p-1.5 border border-ibm-border">
                            <input 
                                type="text"
                                placeholder="输入白板名称..."
                                value={newBoardName}
                                onChange={e => setNewBoardName(e.target.value)}
                                className="bg-ibm-background text-xs px-3 py-1.5 text-ibm-text border border-ibm-border outline-none w-48"
                                onKeyDown={e => e.key === 'Enter' && handleCreateBoard()}
                            />
                            <button 
                                onClick={handleCreateBoard}
                                className="h-8 px-3 bg-[#ff832b] text-white hover:bg-[#e86c14] transition-colors shadow-sm text-xs"
                            >
                                确定
                            </button>
                            <button 
                                onClick={() => setIsCreatingBoard(false)}
                                className="h-8 px-3 border border-ibm-border hover:bg-ibm-layerHover text-ibm-textSecondary text-xs"
                            >
                                取消
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {boards.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 border border-ibm-border border-dashed">
                        <div className="w-16 h-16 border border-ibm-border flex items-center justify-center text-ibm-textSecondary mb-4">
                            <span className="font-mono text-2xl">W</span>
                        </div>
                        <h3 className="text-ibm-text font-sans text-lg mb-2">暂无白板项目</h3>
                        <p className="text-ibm-textSecondary font-sans text-[13px] text-center max-w-sm mb-6">
                            点击右上角创建一个新的网格白板，支持多标签页以及底图上传。
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {boards.map(b => (
                            <div 
                                key={b.id} 
                                onClick={() => setSelectedBoardId(b.id)}
                                className="p-6 border border-ibm-border bg-ibm-layer hover:border-ibm-borderStrong transition-all duration-200 cursor-pointer flex flex-col group relative"
                            >
                                <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleExportBoard(b, e); }}
                                        className="text-ibm-textSecondary hover:text-ibm-primary font-mono text-xs"
                                        title="导出白板数据"
                                    >
                                        导出
                                    </button>
                                    <span className="text-ibm-border text-xs">|</span>
                                    <button 
                                        onClick={(e) => handleDeleteBoard(b.id, e)}
                                        className="text-ibm-textSecondary hover:text-[#fa4d56] font-mono text-xs"
                                        title="删除白板"
                                    >
                                        删除
                                    </button>
                                </div>
                                <h3 className="text-[18px] font-sans font-medium text-ibm-text truncate mb-2 pr-12">{b.name}</h3>
                                <p className="text-[12px] text-ibm-textSecondary mb-6">
                                    标签数: {b.tabs.length} · 更新于 {new Date(b.updatedAt).toLocaleDateString()}
                                </p>
                                <div className="mt-auto flex justify-between items-center pt-4 border-t border-ibm-border/40">
                                    <span className="px-3.5 py-1.5 text-[11px] font-bold border border-[#ff832b] bg-[#ff832b] text-white hover:bg-[#e86c14] hover:border-[#e86c14] transition-all cursor-pointer shadow-sm">
                                        编辑网格 →
                                    </span>
                                    {commState === 'CONNECTED' && isHost && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (confirm(`确认将此白板 [${b.name}] 载入当前房间吗？这会更新全员画面！`)) {
                                                    updateRoomWhiteboard(b);
                                                    alert(`白板 [${b.name}] 已载入房间并同步！`);
                                                }
                                            }}
                                            className="h-8 px-3 border border-[#ff832b] bg-[#ff832b] text-white hover:bg-[#e86c14] hover:border-[#e86c14] text-xs font-mono font-bold transition-all shadow-sm"
                                        >
                                            🚀 载入至房间
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
