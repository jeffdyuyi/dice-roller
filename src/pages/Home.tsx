import { useMqttContext } from '../contexts/MqttContext';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getMyCharacters } from '../features/characters/api';
import type { Character } from '../features/characters/types';
import { WhiteboardArea } from '../components/WhiteboardArea';

export function Home() {
    const { commState, activeLobbyRooms, myId } = useMqttContext();
    const { openRoomModal } = useOutletContext<{ openRoomModal: (mode?: 'create' | 'join', roomId?: string) => void }>();
    const navigate = useNavigate();

    const [myCharacters, setMyCharacters] = useState<Character[]>([]);

    useEffect(() => {
        getMyCharacters(myId).then(setMyCharacters);
    }, [myId]);

    // CONNECTED STATE - COLLABORATIVE WHITEBOARD
    if (commState === 'CONNECTED') {
        const { roomWhiteboard, updateRoomWhiteboard, myName } = useMqttContext();
        return (
            <div className="flex-1 w-full h-full flex flex-col bg-ibm-background overflow-hidden relative">
                {roomWhiteboard ? (
                    <WhiteboardArea
                        project={roomWhiteboard}
                        onChange={updateRoomWhiteboard}
                        myName={myName || '主持人'}
                    />
                ) : (
                    <div className="flex-1 w-full h-full flex items-center justify-center text-ibm-textSecondary text-sm">
                        <span>正在初始化共享网格白板...</span>
                    </div>
                )}
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
                            onClick={() => navigate('/characters/new')}
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

                {/* Whiteboard Library Section */}
                <section>
                    <div className="flex items-center justify-between border-b border-ibm-border pb-4 mb-6">
                        <h2 className="text-[24px] font-sans font-semibold text-ibm-text">白板库存</h2>
                        <Link 
                            to="/whiteboards"
                            className="bg-ibm-primary text-ibm-textOnColor px-4 py-2 text-[14px] font-medium transition-colors hover:bg-ibm-primaryHover shadow-sm flex items-center justify-center"
                        >
                            + 管理白板
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="p-4 border border-ibm-border bg-ibm-layer flex flex-col hover:border-ibm-borderStrong transition-colors group">
                            <h3 className="text-[16px] font-sans font-medium text-ibm-text truncate mb-1">示例白板</h3>
                            <p className="text-[12px] text-ibm-textSecondary mb-4">标签页: 1</p>
                            <div className="mt-auto self-end">
                                <Link to={`/whiteboards`} className="text-[13px] text-ibm-primary hover:text-ibm-primaryHover transition-colors">打开</Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
