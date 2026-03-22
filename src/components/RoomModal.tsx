import React, { useState } from 'react';
import { PlayerNode } from '../lib/mqttService';

interface RoomModalProps {
    isOpen: boolean;
    onClose: () => void;
    commState: string;
    roomId: string | null;
    myName: string;
    isHost: boolean;
    connectedPlayers: PlayerNode[];
    pendingPlayers: PlayerNode[];
    myId: string;
    onCreateRoom: (name: string, rid: string) => void;
    onJoinRoom: (name: string, rid: string) => void;
    onAcceptPlayer: (id: string, name: string) => void;
    onRejectPlayer: (id: string) => void;
    onKickPlayer: (id: string) => void;
    onLeaveRoom: () => void;
}

export function RoomModal({
    isOpen, onClose, commState, roomId, myName: initialName, isHost, connectedPlayers, pendingPlayers, myId,
    onCreateRoom, onJoinRoom, onAcceptPlayer, onRejectPlayer, onKickPlayer, onLeaveRoom
}: RoomModalProps) {
    const [inputName, setInputName] = useState(initialName);
    const [inputRoomId, setInputRoomId] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 p-6 rounded-2xl shadow-2xl max-w-md w-full relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white"><i className="fa-solid fa-xmark"></i></button>
                <h3 className="text-xl font-bold text-white mb-4"><i className="fa-solid fa-network-wired"></i> 联机房间</h3>

                {commState === 'DISCONNECTED' && (
                    <div>
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-500 mb-1">玩家昵称</label>
                            <input type="text" value={inputName} onChange={e => setInputName(e.target.value)} placeholder="输入昵称" className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded text-white text-sm h-10 transition-colors" />
                        </div>
                        <div className="flex gap-4 mb-4">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 mb-1">房间号</label>
                                <input type="text" value={inputRoomId} onChange={e => setInputRoomId(e.target.value)} placeholder="输入5位数字(创建时留空)" className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded text-white text-sm h-10 transition-colors" />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => onCreateRoom(inputName, inputRoomId)} className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded shadow-lg">创建房间</button>
                            <button onClick={() => onJoinRoom(inputName, inputRoomId)} className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-bold py-2 rounded shadow-lg">加入房间</button>
                        </div>
                    </div>
                )}

                {commState === 'WAITING' && (
                    <div className="flex flex-col items-center justify-center py-8">
                        <i className="fa-solid fa-spinner fa-spin text-3xl text-indigo-500 mb-3"></i>
                        <div className="text-slate-400 text-sm">连接中/等待审批...</div>
                    </div>
                )}

                {commState === 'CONNECTED' && (
                    <div>
                        <div className="flex justify-between items-center mb-4 bg-slate-900 p-3 rounded">
                            <div>
                                <div className="text-xs text-slate-500">当前房间</div>
                                <div className="text-2xl font-mono font-bold text-indigo-400">{roomId}</div>
                            </div>
                            <button onClick={() => { onLeaveRoom(); onClose() }} className="bg-red-900/50 hover:bg-red-900/80 text-red-300 px-3 py-1.5 rounded text-sm border border-red-900/50"><i className="fa-solid fa-arrow-right-from-bracket"></i> 退出</button>
                        </div>

                        <h4 className="text-sm font-bold text-slate-300 mb-2 border-b border-slate-700 pb-1">成员列表 ({connectedPlayers.length})</h4>
                        <ul className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar mb-4">
                            {connectedPlayers.map(p => (
                                <li key={p.id} className="bg-slate-900 border border-slate-700/50 p-2 rounded flex justify-between items-center text-sm">
                                    <span className={p.id === myId ? 'text-indigo-400 font-bold' : 'text-slate-300'}>
                                        {p.isHost && <i className="fa-solid fa-crown text-yellow-500 mr-1"></i>}
                                        {p.name} {p.id === myId && '(你)'}
                                    </span>
                                    {isHost && p.id !== myId && (
                                        <button onClick={() => onKickPlayer(p.id)} className="text-xs text-red-400 hover:text-red-300"><i className="fa-solid fa-user-minus"></i></button>
                                    )}
                                </li>
                            ))}
                        </ul>

                        {isHost && (
                            <div>
                                <h4 className="text-sm font-bold text-yellow-500 mb-2 border-b border-slate-700 pb-1">等待审批 ({pendingPlayers.length})</h4>
                                <ul className="space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                                    {pendingPlayers.length === 0 ? (
                                        <li className="text-slate-600 text-xs italic">暂无申请</li>
                                    ) : pendingPlayers.map(p => (
                                        <li key={p.id} className="bg-slate-900 border border-slate-700/50 p-2 rounded flex justify-between items-center text-sm">
                                            <span className="text-slate-300">{p.name}</span>
                                            <div>
                                                <button onClick={() => onAcceptPlayer(p.id, p.name)} className="text-green-400 mr-2"><i className="fa-solid fa-check"></i></button>
                                                <button onClick={() => onRejectPlayer(p.id)} className="text-red-400"><i className="fa-solid fa-xmark"></i></button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
