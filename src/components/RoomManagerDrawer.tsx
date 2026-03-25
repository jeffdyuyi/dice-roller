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
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setManagerOpen(false)}></div>
            <div className="relative w-full max-w-md bg-[#0c0c10] border-l border-[#bf953f]/30 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="p-6 border-b border-[#bf953f]/20 flex justify-between items-center bg-[#141420]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#bf953f]/10 rounded-xl flex items-center justify-center text-[#bf953f] border border-[#bf953f]/20">
                            <i className="fa-solid fa-tower-broadcast text-lg"></i>
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-[#f0ead8] uppercase tracking-widest">房间管理</h2>
                            <p className="text-[10px] font-bold text-[#bf953f]/60 uppercase tracking-tighter mt-0.5">{isHost ? '您是房主' : '游玩中'}</p>
                        </div>
                    </div>
                    <button onClick={() => setManagerOpen(false)} className="w-10 h-10 rounded-xl hover:bg-white/5 text-slate-500 transition-colors flex items-center justify-center">
                        <i className="fa-solid fa-xmark text-lg"></i>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Room Info Card */}
                    <div className="bg-gradient-to-br from-[#141420] to-[#0c0c10] p-8 rounded-xl border border-[#bf953f]/20 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-[#bf953f]/5 rotate-45 translate-x-16 -translate-y-16 group-hover:bg-[#bf953f]/10 transition-all duration-700"></div>
                        <div className="relative">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <div className="text-[9px] text-[#bf953f]/60 font-black uppercase tracking-[0.4em] mb-1">房间 ID</div>
                                    <div className="text-4xl font-mono font-black golden-text leading-none select-all">{roomId}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[9px] text-[#bf953f]/60 font-black uppercase tracking-[0.4em] mb-1">使用规则</div>
                                    <div className="text-xs font-black text-[#f0ead8] bg-[#bf953f]/20 px-2 py-1 rounded border border-[#bf953f]/30">{ruleSystem || '未定义'}</div>
                                </div>
                            </div>

                            <div className="mt-6 mb-6">
                                <div className="text-[9px] text-[#bf953f]/60 font-black uppercase tracking-[0.4em] mb-1">房间名称</div>
                                <div className="text-sm font-black text-[#f0ead8] border-l-2 border-[#bf953f] pl-3 py-1 bg-white/5 rounded-r-md">{roomName || '未命名房间'}</div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(roomId || '');
                                        alert('ID 已复制');
                                    }}
                                    className="flex-1 bg-[#bf953f]/10 hover:bg-[#bf953f]/20 text-[#bf953f] border border-[#bf953f]/30 px-3 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-black/20"
                                >
                                    复制 ID
                                </button>
                                {isHost && (
                                    <button className="w-12 h-10 bg-white/5 hover:bg-[#bf953f]/20 text-slate-400 hover:text-[#bf953f] border border-white/10 hover:border-[#bf953f]/30 rounded-lg flex items-center justify-center transition-all">
                                        <i className="fa-solid fa-gear text-xs"></i>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Notification/Status area */}
                    {pendingPlayers.length > 0 && isHost && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">待入场请求 ({pendingPlayers.length})</h3>
                            </div>
                            <div className="space-y-3">
                                {pendingPlayers.map(p => (
                                    <div key={p.id} className="bg-amber-900/10 border border-amber-500/20 p-4 rounded-xl flex items-center justify-between group animate-in zoom-in-95 duration-200 shadow-xl shadow-black/20">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-[#bf953f] to-[#aa771c] flex items-center justify-center text-[#141420] font-black shadow-lg">
                                                {p.name?.[0] || '?'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-white tracking-tight">{p.name}</p>
                                                <p className="text-[9px] font-bold text-amber-500/60 uppercase tracking-widest mt-1">申请加入档案...</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => acceptPlayer(p.id, p.name)}
                                                className="w-10 h-10 bg-emerald-500/20 text-emerald-500 rounded-lg hover:bg-emerald-500 hover:text-black transition-all flex items-center justify-center"
                                            >
                                                <i className="fa-solid fa-check"></i>
                                            </button>
                                            <button
                                                onClick={() => rejectPlayer(p.id)}
                                                className="w-10 h-10 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                            >
                                                <i className="fa-solid fa-xmark"></i>
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
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">当前在场人员 ({connectedPlayers.length})</h3>
                        </div>
                        <div className="space-y-2">
                            {connectedPlayers.map(p => (
                                <div key={p.id} className="group p-3 hover:bg-white/5 rounded-xl border border-transparent hover:border-white/10 transition-all flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shadow-inner border border-white/5 ${p.isHost ? 'bg-[#bf953f]/20 text-[#bf953f]' : 'bg-indigo-500/20 text-indigo-400'}`}>
                                            {p.name?.[0]}
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-[#f0ead8] tracking-tight">{p.name} {p.id === myId && <span className="text-[#bf953f]/60 opacity-60 ml-1">(您)</span>}</span>
                                            {p.isHost && <div className="text-[7px] font-black text-[#bf953f] uppercase tracking-widest mt-0.5">房主 HOST</div>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {(p.characterData || p.id === myId) && (
                                            <button
                                                onClick={() => setInspectingPlayerId(p.id)}
                                                className="w-8 h-8 text-slate-500 hover:text-amber-500 transition-all flex items-center justify-center hover:bg-amber-500/10 rounded-lg"
                                                title={isHost ? "管理角色卡" : "查看角色卡"}
                                            >
                                                <i className="fa-solid fa-user-pen text-xs"></i>
                                            </button>
                                        )}
                                        {isHost && p.id !== myId && (
                                            <button
                                                onClick={() => kickPlayer(p.id)}
                                                className="w-8 h-8 text-slate-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-red-500/10 rounded-lg"
                                            >
                                                <i className="fa-solid fa-user-minus"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Footer */}
                <div className="p-6 bg-[#141420]/50 border-t border-[#bf953f]/10 mt-auto">
                    <button
                        onClick={() => { leaveRoom(); setManagerOpen(false); }}
                        className="w-full bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 py-4 rounded-xl font-black text-[12px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-black/20"
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
