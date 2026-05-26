import { useMqttContext } from '../contexts/MqttContext';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getMyCharacters } from '../features/characters/api';
import type { Character, MemoItem } from '../features/characters/types';

export function Home() {
    const { commState, activeCharacter, activeLobbyRooms, myId, updateActiveCharacter } = useMqttContext();
    const { openRoomModal } = useOutletContext<{ openRoomModal: (mode?: 'create' | 'join', roomId?: string) => void }>();
    const navigate = useNavigate();

    const [myCharacters, setMyCharacters] = useState<Character[]>([]);
    
    // Local State for Memo Editing
    const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
    const [editingContent, setEditingContent] = useState('');
    const [newMemoContent, setNewMemoContent] = useState('');

    useEffect(() => {
        getMyCharacters(myId).then(setMyCharacters);
    }, [myId]);

    const handleCreateMemo = () => {
        if (!activeCharacter || !newMemoContent.trim()) return;
        const newItem: MemoItem = {
            id: 'memo-' + Date.now().toString(36),
            content: newMemoContent,
            createdAt: Date.now(),
            source: 'self'
        };
        const nextItems = [...(activeCharacter.memoItems || []), newItem];
        updateActiveCharacter({ ...activeCharacter, memoItems: nextItems });
        setNewMemoContent('');
    };

    const handleUpdateMemo = () => {
        if (!activeCharacter || !editingMemoId || !editingContent.trim()) return;
        const nextItems = (activeCharacter.memoItems || []).map(item => 
            item.id === editingMemoId ? { ...item, content: editingContent } : item
        );
        updateActiveCharacter({ ...activeCharacter, memoItems: nextItems });
        setEditingMemoId(null);
        setEditingContent('');
    };

    const handleDeleteMemo = (id: string) => {
        if (!activeCharacter) return;
        if (!confirm('确定要删除这条备忘记录吗？')) return;
        const nextItems = (activeCharacter.memoItems || []).filter(item => item.id !== id);
        updateActiveCharacter({ ...activeCharacter, memoItems: nextItems });
    };

    // CONNECTED STATE
    if (commState === 'CONNECTED') {
        const char = activeCharacter;
        const memoItems = char?.memoItems || [];
        return (
            <div className="flex-1 w-full h-full flex flex-col p-6 md:p-8 bg-ibm-layer">
                <div className="mb-6 flex items-end justify-between border-b border-ibm-border pb-4">
                    <div>
                        <h2 className="text-[24px] font-sans font-semibold text-ibm-text tracking-tight">{char?.name || '公共笔记'}</h2>
                        <p className="text-[12px] font-mono uppercase tracking-xai text-ibm-textSecondary mt-1">{char?.summary || '当前在房间中的共享区域或私人备忘录'}</p>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                    {memoItems.length > 0 ? (
                        <div className="space-y-4 mb-8">
                            {memoItems.map(item => (
                                <div key={item.id} className="p-4 border border-ibm-border bg-ibm-background group relative">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="text-[11px] text-ibm-textSecondary font-mono tracking-xai uppercase">
                                            {item.source === 'host' ? '来自房主分发' : '个人记录'} · {new Date(item.createdAt).toLocaleTimeString()}
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {editingMemoId !== item.id && (
                                                <button onClick={() => { setEditingMemoId(item.id); setEditingContent(item.content); }} className="text-[12px] text-ibm-textSecondary hover:text-ibm-primary">编辑</button>
                                            )}
                                            <button onClick={() => handleDeleteMemo(item.id)} className="text-[12px] text-ibm-textSecondary hover:text-[#fa4d56]">删除</button>
                                        </div>
                                    </div>
                                    
                                    {editingMemoId === item.id ? (
                                        <div className="flex flex-col gap-3">
                                            <textarea 
                                                value={editingContent} 
                                                onChange={e => setEditingContent(e.target.value)} 
                                                className="w-full bg-ibm-layer border border-ibm-border p-3 text-[14px] font-sans text-ibm-text outline-none min-h-[100px]" 
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => setEditingMemoId(null)} className="px-3 py-1 text-[12px] border border-ibm-border hover:bg-ibm-layerHover">取消</button>
                                                <button onClick={handleUpdateMemo} className="px-3 py-1 text-[12px] bg-ibm-primary text-ibm-textOnColor hover:bg-ibm-primaryHover">保存</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="prose prose-invert prose-p:font-sans prose-headings:font-sans max-w-none text-[14px]">
                                            <pre className="whitespace-pre-wrap font-sans text-ibm-text font-normal bg-transparent p-0 m-0 border-none leading-relaxed">{item.content}</pre>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 max-w-md mx-auto">
                            <div className="w-full p-10 border border-dashed border-ibm-border bg-ibm-layerHover text-center flex flex-col items-center justify-center">
                                <svg className="w-8 h-8 text-ibm-textPlaceholder mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                <p className="text-[14px] text-ibm-text font-sans mb-1">当前备忘库为空</p>
                                <p className="text-[12px] text-ibm-textSecondary font-sans">您可以在下方创建新的记录卡片，或者接收房主下发的信息</p>
                            </div>
                        </div>
                    )}

                    <div className="mt-auto pt-6 border-t border-ibm-border">
                        <div className="flex flex-col gap-3">
                            <textarea 
                                value={newMemoContent} 
                                onChange={e => setNewMemoContent(e.target.value)} 
                                placeholder="输入新的备忘内容，支持多行文本..." 
                                className="w-full bg-ibm-background border border-ibm-border p-3 text-[14px] font-sans text-ibm-text outline-none focus:border-ibm-primary transition-colors min-h-[80px]" 
                            />
                            <div className="flex justify-end">
                                <button onClick={handleCreateMemo} className="px-6 py-2 bg-ibm-primary text-ibm-textOnColor text-[13px] font-medium hover:bg-ibm-primaryHover transition-colors shadow-sm">
                                    + 添加卡片
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // DISCONNECTED STATE - FLAT LAYOUT
    return (
        <div className="flex-1 h-full w-full bg-ibm-background p-6 md:p-12 overflow-y-auto custom-scrollbar">
            <div className="w-full max-w-5xl mx-auto space-y-16">
                
                {/* Lobby Section */}
                <section>
                    <div className="flex items-center justify-between border-b border-ibm-border pb-4 mb-6">
                        <h2 className="text-[24px] font-sans font-semibold text-ibm-text">联机大厅</h2>
                        <button 
                            onClick={() => openRoomModal('create')} 
                            className="bg-[#ff832b] text-white px-4 py-2 text-[14px] font-medium transition-colors hover:bg-[#e86c14] shadow-sm"
                        >
                            + 创建房间
                        </button>
                    </div>

                    {activeLobbyRooms.length === 0 ? (
                        <div className="p-8 border border-dashed border-ibm-border bg-ibm-layerHover text-center">
                            <p className="text-[14px] text-ibm-textSecondary">当前大厅暂无活跃房间</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeLobbyRooms.map(room => (
                                <div 
                                    key={room.id} 
                                    className="p-4 border border-ibm-border bg-ibm-layer flex flex-col justify-between hover:border-ibm-primary transition-colors cursor-pointer group"
                                    onClick={() => openRoomModal('join', room.id)}
                                >
                                    <div className="mb-4">
                                        <div className="text-[16px] font-sans font-medium text-ibm-text truncate">{room.name}</div>
                                        <div className="text-[12px] text-ibm-textSecondary mt-1">主持人: {room.hostName}</div>
                                    </div>
                                    <button className="self-end px-4 py-1.5 border border-ibm-border text-ibm-text text-[13px] group-hover:bg-ibm-primary group-hover:text-ibm-textOnColor group-hover:border-ibm-primary transition-colors">
                                        加入
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Character Memo Library Section */}
                <section>
                    <div className="flex items-center justify-between border-b border-ibm-border pb-4 mb-6">
                        <h2 className="text-[24px] font-sans font-semibold text-ibm-text">备忘库存</h2>
                        <button 
                            onClick={() => navigate('/create')}
                            className="bg-ibm-primary text-ibm-textOnColor px-4 py-2 text-[14px] font-medium transition-colors hover:bg-ibm-primaryHover shadow-sm"
                        >
                            + 新建备忘
                        </button>
                    </div>

                    {myCharacters.length === 0 ? (
                        <div className="p-8 border border-dashed border-ibm-border bg-ibm-layerHover text-center">
                            <p className="text-[14px] text-ibm-textSecondary">尚未创建任何备忘库</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {myCharacters.map(char => (
                                <div key={char.id} className="p-4 border border-ibm-border bg-ibm-layer flex flex-col hover:border-ibm-borderStrong transition-colors group">
                                    <h3 className="text-[16px] font-sans font-medium text-ibm-text truncate mb-1">{char.name}</h3>
                                    <p className="text-[12px] text-ibm-textSecondary mb-4">记录条目: {char.memoItems?.length || 0}</p>
                                    <div className="mt-auto self-end">
                                        <Link to={`/characters`} className="text-[13px] text-ibm-primary hover:text-ibm-primaryHover transition-colors">管理</Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

            </div>
        </div>
    );
}
