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
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setManagerOpen(false)}></div>

            {/* Sidebar Drawer */}
            <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                            <i className="fa-solid fa-users-gear text-white text-sm"></i>
                        </div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">房间管理</h3>
                    </div>
                    <button onClick={() => setManagerOpen(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {/* Room Info Card */}
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-6 rounded-[2.5rem] shadow-xl shadow-indigo-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rotate-45 translate-x-16 -translate-y-16 group-hover:translate-x-12 group-hover:-translate-y-12 transition-transform duration-700"></div>
                        <div className="relative">
                            <div className="text-[10px] text-indigo-100 font-black uppercase tracking-widest mb-1 opacity-80">当前时空坐标</div>
                            <div className="text-5xl font-mono font-black text-white selection:bg-indigo-400">{roomId}</div>
                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(roomId || '');
                                        alert('坐标已复制到剪贴板');
                                    }}
                                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95"
                                >
                                    复制坐标
                                </button>
                                <button onClick={() => { leaveRoom(); setManagerOpen(false); }} className="bg-red-500/20 hover:bg-red-500/40 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all active:scale-95">
                                    断开联接
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Member List */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">已同步成员 ({connectedPlayers.length})</h4>
                        </div>
                        <ul className="space-y-3">
                            {connectedPlayers.map(p => (
                                <li key={p.id} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex justify-between items-center group hover:bg-white hover:border-indigo-100 hover:shadow-lg transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shadow-sm ${p.isHost ? 'bg-orange-500 text-white shadow-orange-100' : 'bg-white text-slate-400 shadow-slate-100'}`}>
                                            {p.isHost ? <i className="fa-solid fa-crown text-xs"></i> : (p.name[0] || '?')}
                                        </div>
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-black ${p.id === myId ? 'text-indigo-600' : 'text-slate-700'}`}>
                                                    {p.name} {p.id === myId && '(您)'}
                                                </span>
                                            </div>
                                            <div className="flex gap-1 mt-0.5">
                                                {p.guestMode ? (
                                                    <span className="text-[9px] font-black px-2 py-0.5 bg-slate-100 text-slate-400 rounded-md uppercase tracking-tighter">访客</span>
                                                ) : p.ruleSystem ? (
                                                    <span className="text-[9px] font-black px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded-md uppercase tracking-tighter">{p.ruleSystem}</span>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                    {isHost && p.id !== myId && (
                                        <button onClick={() => kickPlayer(p.id)} className="w-10 h-10 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90" title="移出房间">
                                            <i className="fa-solid fa-user-xmark text-sm"></i>
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Pending Players (HOST ONLY) */}
                    {isHost && (
                        <div className="pt-4 space-y-4">
                            <div className="flex justify-between items-center border-b border-orange-100 pb-2">
                                <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-widest">待审批接入 ({pendingPlayers.length})</h4>
                            </div>
                            <ul className="space-y-3">
                                {pendingPlayers.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                                        <i className="fa-solid fa-id-card-clip text-slate-200 text-2xl mb-2"></i>
                                        <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest">暂无接入请求</p>
                                    </div>
                                ) : pendingPlayers.map(p => (
                                    <li key={p.id} className="bg-orange-50/50 border border-orange-100 p-4 rounded-2xl flex justify-between items-center animate-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-700">{p.name}</span>
                                            <span className="text-[9px] font-black text-orange-400 uppercase tracking-tight mt-1">
                                                {p.guestMode ? '以访客身份接入' : `导入了 ${p.ruleSystem} 档案`}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => acceptPlayer(p.id, p.name)} className="w-10 h-10 bg-green-500 text-white rounded-xl shadow-lg shadow-green-100 hover:bg-green-600 transition-all active:scale-95 flex items-center justify-center">
                                                <i className="fa-solid fa-check"></i>
                                            </button>
                                            <button onClick={() => rejectPlayer(p.id)} className="w-10 h-10 bg-white border-2 border-slate-100 text-slate-400 rounded-xl hover:text-red-500 hover:border-red-100 transition-all active:scale-95 flex items-center justify-center">
                                                <i className="fa-solid fa-xmark"></i>
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100">
                    <div className="flex items-center justify-between text-[10px] font-black text-slate-300 uppercase tracking-widest">
                        <span>EMQX Broker Active</span>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                            <span>Connected</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
