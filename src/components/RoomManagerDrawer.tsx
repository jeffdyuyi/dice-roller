import { useMqttContext } from '../contexts/MqttContext';

export function RoomManagerDrawer() {
    const {
        isManagerOpen, setManagerOpen, commState, roomId, isHost, connectedPlayers, pendingPlayers, myId,
        acceptPlayer, rejectPlayer, kickPlayer, leaveRoom
    } = useMqttContext();

    if (!isManagerOpen || commState !== 'CONNECTED') return null;

    return (
        <div className="fixed inset-0 z-[60] flex justify-end animate-in fade-in duration-300">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-[#0c0c10]/60 backdrop-blur-md" onClick={() => setManagerOpen(false)}></div>

            {/* Sidebar Drawer */}
            <div className="relative w-full max-w-sm bg-[#18182a] h-full shadow-[0_0_100px_rgba(0,0,0,0.8)] border-l border-[#bf953f]/20 flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
                {/* Noise Texture */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

                <div className="p-8 border-b border-[#bf953f]/10 flex justify-between items-center bg-[#141420]/50 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#bf953f] to-[#aa771c] rounded-xl flex items-center justify-center shadow-xl shadow-black/40">
                            <i className="fa-solid fa-users-gear text-[#0c0c10] text-lg"></i>
                        </div>
                        <h3 className="text-xl font-black text-[#f0ead8] tracking-widest uppercase">房间管理</h3>
                    </div>
                    <button onClick={() => setManagerOpen(false)} className="w-10 h-10 flex items-center justify-center text-[#6b6250] hover:text-[#bf953f] transition-all hover:rotate-90">
                        <i className="fa-solid fa-xmark text-2xl"></i>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar relative z-10">
                    {/* Room Info Card */}
                    <div className="bg-gradient-to-br from-[#141420] to-[#0c0c10] p-8 rounded-xl border border-[#bf953f]/20 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-[#bf953f]/5 rotate-45 translate-x-16 -translate-y-16 group-hover:bg-[#bf953f]/10 transition-all duration-700"></div>
                        <div className="relative">
                            <div className="text-[10px] text-[#bf953f]/60 font-black uppercase tracking-[0.4em] mb-2">领域时空坐标 ID</div>
                            <div className="text-5xl font-mono font-black golden-text leading-none select-all">{roomId}</div>
                            <div className="mt-8 flex gap-4">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(roomId || '');
                                        alert('坐标已复制到剪贴板');
                                    }}
                                    className="flex-1 bg-[#bf953f]/10 hover:bg-[#bf953f]/20 text-[#bf953f] border border-[#bf953f]/30 px-4 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-black/20"
                                >
                                    复制坐标
                                </button>
                                <button onClick={() => { leaveRoom(); setManagerOpen(false); }} className="flex-1 bg-red-950/20 hover:bg-red-900/40 text-red-500 border border-red-900/30 px-4 py-3 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-black/20">
                                    断开联接
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Member List */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center border-b border-[#bf953f]/10 pb-3">
                            <h4 className="text-[11px] font-black text-[#6b6250] uppercase tracking-[0.4em]">已同步成员 ({connectedPlayers.length})</h4>
                        </div>
                        <ul className="space-y-4">
                            {connectedPlayers.map(p => (
                                <li key={p.id} className={`bg-[#141420]/60 border border-[#bf953f]/object-5 p-5 rounded-xl flex justify-between items-center group transition-all hover:bg-[#1e1e30] hover:border-[#bf953f]/30 hover:shadow-2xl shadow-black/20 ${p.id === myId ? 'ring-1 ring-[#bf953f]/20' : ''}`}>
                                    <div className="flex items-center gap-5">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black shadow-xl border ${p.isHost ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-[#0c0c10] border-[#fcf6ba]/30' : 'bg-[#1e1e30] text-[#a89b7a] border-[#bf953f]/10 group-hover:border-[#bf953f]/30 transition-colors'}`}>
                                            {p.isHost ? <i className="fa-solid fa-crown text-base"></i> : (p.name[0] || '?')}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-3">
                                                <span className={`text-base font-black tracking-tight ${p.id === myId ? 'golden-text' : 'text-[#f0ead8]'}`}>
                                                    {p.name} {p.id === myId && '(您)'}
                                                </span>
                                            </div>
                                            <div className="flex gap-2 mt-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                {p.guestMode ? (
                                                    <span className="text-[10px] font-black px-2.5 py-1 bg-[#1e1e30] border border-[#bf953f]/10 text-[#6b6250] rounded uppercase tracking-widest">访客模式</span>
                                                ) : p.ruleSystem ? (
                                                    <span className="text-[10px] font-black px-2.5 py-1 bg-[#bf953f]/10 border border-[#bf953f]/20 text-[#bf953f] rounded uppercase tracking-widest">{p.ruleSystem}</span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                    {isHost && p.id !== myId && (
                                        <button onClick={() => kickPlayer(p.id)} className="w-12 h-12 text-[#6b6250] hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all active:scale-90 border border-transparent hover:border-red-500/20" title="移出房间">
                                            <i className="fa-solid fa-user-xmark text-lg"></i>
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Pending Players (HOST ONLY) */}
                    {isHost && (
                        <div className="pt-6 space-y-6">
                            <div className="flex justify-between items-center border-b border-amber-900/30 pb-3">
                                <h4 className="text-[11px] font-black text-amber-500 uppercase tracking-[0.4em]">接入请求 待处理 ({pendingPlayers.length})</h4>
                            </div>
                            <ul className="space-y-4">
                                {pendingPlayers.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 bg-[#141420]/40 rounded-xl border-2 border-dashed border-[#bf953f]/10 group hover:border-[#bf953f]/20 transition-colors">
                                        <i className="fa-solid fa-id-card-clip text-[#6b6250] text-3xl mb-4 opacity-30 group-hover:opacity-50 transition-opacity"></i>
                                        <p className="text-[11px] text-[#6b6250] font-black uppercase tracking-[0.3em] opacity-40">暂无接入请求</p>
                                    </div>
                                ) : pendingPlayers.map(p => (
                                    <li key={p.id} className="bg-amber-900/10 border border-amber-900/20 p-5 rounded-xl flex justify-between items-center animate-in slide-in-from-bottom-4 duration-500 shadow-2xl shadow-black/40">
                                        <div className="flex flex-col">
                                            <span className="text-lg font-black text-[#f0ead8] tracking-tight">{p.name}</span>
                                            <span className="text-[11px] font-black text-amber-500 uppercase tracking-widest mt-2 flex items-center gap-2">
                                                <i className="fa-solid fa-fingerprint animate-pulse text-[10px]"></i>
                                                {p.guestMode ? '以访客身份接入' : `${p.ruleSystem} 档案`}
                                            </span>
                                        </div>
                                        <div className="flex gap-3">
                                            <button onClick={() => acceptPlayer(p.id, p.name)} className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-700 text-[#0c0c10] rounded-xl shadow-xl shadow-green-950/20 hover:scale-110 transition-all active:scale-95 flex items-center justify-center">
                                                <i className="fa-solid fa-check text-lg"></i>
                                            </button>
                                            <button onClick={() => rejectPlayer(p.id)} className="w-12 h-12 bg-[#1e1e30] border border-[#bf953f]/20 text-[#6b6250] rounded-xl hover:text-red-500 hover:border-red-900/40 transition-all active:scale-95 flex items-center justify-center">
                                                <i className="fa-solid fa-xmark text-xl"></i>
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="p-8 bg-[#141420] border-t border-[#bf953f]/10 relative z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.4)]">
                    <div className="flex items-center justify-between text-[11px] font-black text-[#6b6250] uppercase tracking-[0.5em]">
                        <span className="flex items-center gap-3">
                            <i className="fa-solid fa-tower-broadcast text-[#bf953f]"></i> MQTT 服务活跃
                        </span>
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                            <span className="text-emerald-500/80">已建立通讯同步</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
