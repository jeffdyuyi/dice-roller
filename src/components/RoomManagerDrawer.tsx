import { useState } from 'react';
import { useMqttContext } from '../contexts/MqttContext';
import { CharacterInspector } from './CharacterInspector';

export function RoomManagerDrawer() {
    const {
        isManagerOpen, setManagerOpen, roomId, roomName, ruleSystem, isHost, connectedPlayers, pendingPlayers, myId,
        acceptPlayer, rejectPlayer, kickPlayer, leaveRoom
    } = useMqttContext();

    const [inspectingPlayerId, setInspectingPlayerId] = useState<string | null>(null);

    if (!isManagerOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-x-dark/80 backdrop-blur-sm" onClick={() => setManagerOpen(false)}></div>
            <div className="relative w-full max-w-md bg-x-dark border-l border-x-border h-full flex flex-col animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="p-6 border-b border-x-border flex justify-between items-center bg-transparent">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 border border-x-border bg-x-white text-x-dark flex items-center justify-center">
                            <span className="font-mono text-[16px]">M</span>
                        </div>
                        <div>
                            <h2 className="text-[14px] font-mono text-x-white uppercase tracking-xai">房间管理</h2>
                            <p className="text-[12px] font-mono text-x-muted uppercase tracking-xai mt-0.5">{isHost ? '您是房主' : '游玩中'}</p>
                        </div>
                    </div>
                    <button onClick={() => setManagerOpen(false)} className="w-10 h-10 border border-x-border hover:bg-x-surface text-x-muted transition-colors flex items-center justify-center font-mono">
                        X
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Room Info Card */}
                    <div className="bg-transparent p-6 border border-x-border relative overflow-hidden">
                        <div className="relative">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="text-[10px] font-mono text-x-muted uppercase tracking-xai mb-1">房间 ID</div>
                                    <div className="text-[32px] font-mono text-x-white leading-none select-all">{roomId}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-mono text-x-muted uppercase tracking-xai mb-1">使用规则</div>
                                    <div className="text-[12px] font-mono text-x-white bg-transparent px-2 py-1 border border-x-border">{ruleSystem || '未定义'}</div>
                                </div>
                            </div>

                            <div className="mt-6 mb-6">
                                <div className="text-[10px] font-mono text-x-muted uppercase tracking-xai mb-1">房间名称</div>
                                <div className="text-[14px] font-sans text-x-white border-l border-x-white pl-3 py-1 bg-transparent">{roomName || '未命名房间'}</div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(roomId || '');
                                        alert('ID 已复制');
                                    }}
                                    className="flex-1 bg-x-white text-x-dark border border-x-white px-3 py-2.5 text-[12px] font-mono uppercase tracking-xai transition-all hover:bg-white/90"
                                >
                                    复制 ID
                                </button>
                                {isHost && (
                                    <button className="w-12 h-10 bg-transparent text-x-white border border-x-border hover:bg-x-surface flex items-center justify-center transition-all">
                                        <span className="font-mono text-[12px]">S</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Notification/Status area */}
                    {pendingPlayers.length > 0 && isHost && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <span className="font-mono text-x-muted text-[12px]">*</span>
                                <h3 className="text-[12px] font-mono text-x-white uppercase tracking-xai">待入场请求 ({pendingPlayers.length})</h3>
                            </div>
                            <div className="space-y-3">
                                {pendingPlayers.map(p => (
                                    <div key={p.id} className="bg-transparent border border-x-border p-4 flex items-center justify-between group animate-in zoom-in-95 duration-200">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 border border-x-border bg-x-surface flex items-center justify-center text-x-white font-mono">
                                                {p.name?.[0] || '?'}
                                            </div>
                                            <div>
                                                <p className="text-[14px] font-sans text-x-white">{p.name}</p>
                                                <p className="text-[10px] font-mono text-x-muted uppercase tracking-xai mt-1">申请加入档案...</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => acceptPlayer(p.id, p.name)}
                                                className="w-10 h-10 bg-transparent border border-x-border text-x-white hover:bg-x-white hover:text-x-dark transition-all flex items-center justify-center font-mono"
                                            >
                                                Y
                                            </button>
                                            <button
                                                onClick={() => rejectPlayer(p.id)}
                                                className="w-10 h-10 bg-transparent border border-x-border text-x-white hover:bg-x-white hover:text-x-dark transition-all flex items-center justify-center font-mono"
                                            >
                                                N
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Connected Players */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-x-muted text-[12px]">-</span>
                            <h3 className="text-[12px] font-mono text-x-muted uppercase tracking-xai">当前在场人员 ({connectedPlayers.length})</h3>
                        </div>
                        <div className="space-y-2">
                            {connectedPlayers.map(p => (
                                <div key={p.id} className="group p-3 hover:bg-x-surface border border-transparent hover:border-x-border transition-all flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 flex items-center justify-center font-mono border ${p.isHost ? 'bg-x-white text-x-dark border-x-white' : 'bg-transparent text-x-white border-x-border'}`}>
                                            {p.name?.[0]}
                                        </div>
                                        <div>
                                            <span className="text-[14px] font-sans text-x-white">{p.name} {p.id === myId && <span className="text-x-muted opacity-60 ml-1">(您)</span>}</span>
                                            {p.isHost && <div className="text-[10px] font-mono text-x-muted uppercase tracking-xai mt-0.5">HOST</div>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {(p.characterData || p.id === myId) && (
                                            <button
                                                onClick={() => setInspectingPlayerId(p.id)}
                                                className="w-8 h-8 text-x-muted hover:text-x-white transition-all flex items-center justify-center hover:bg-x-surface font-mono"
                                                title={isHost ? "管理角色卡" : "查看角色卡"}
                                            >
                                                C
                                            </button>
                                        )}
                                        {isHost && p.id !== myId && (
                                            <button
                                                onClick={() => kickPlayer(p.id)}
                                                className="w-8 h-8 text-x-muted hover:text-x-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-x-surface font-mono"
                                            >
                                                -
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Footer */}
                <div className="p-6 bg-x-dark border-t border-x-border mt-auto">
                    <button
                        onClick={() => { leaveRoom(); setManagerOpen(false); }}
                        className="w-full bg-transparent hover:bg-x-white text-x-muted hover:text-x-dark border border-x-border py-4 font-mono text-[12px] uppercase tracking-xai transition-all"
                    >
                        完全退出房间领域 DISCONNECT
                    </button>
                </div>
            </div>

            {inspectingPlayerId && (
                <CharacterInspector
                    playerId={inspectingPlayerId}
                    onClose={() => setInspectingPlayerId(null)}
                />
            )}
        </div>
    );
}
