import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';
import { useMqttContext } from '../contexts/MqttContext';
import { RoomManagerDrawer } from '../components/RoomManagerDrawer';
import { RoomModal } from '../components/RoomModal';

export function Layout() {
    const { user, isLoggedIn, login, logout } = useAuth();
    const { commState, roomId, latestNotification, setManagerOpen } = useMqttContext();
    const [infoOpen, setInfoOpen] = useState(false);
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#0c0c10] flex flex-col font-sans antialiased text-[#f0ead8] h-screen overflow-hidden relative">
            {/* Global Notification Toast */}
            {latestNotification && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-top-4 duration-300">
                    <div className={`px-6 py-3 rounded-2xl border flex items-center gap-3 shadow-2xl backdrop-blur-md ${latestNotification.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-500' :
                        latestNotification.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-500' :
                            'bg-amber-500/20 border-amber-500/30 text-amber-500'
                        }`}>
                        <i className={`fa-solid ${latestNotification.type === 'error' ? 'fa-circle-exclamation' :
                            latestNotification.type === 'success' ? 'fa-circle-check' :
                                'fa-circle-info'
                            } text-base`}></i>
                        <span className="text-xs font-black uppercase tracking-widest">{latestNotification.message}</span>
                    </div>
                </div>
            )}

            {/* Dark Premium Background Decor */}
            <div className="absolute top-0 right-0 w-[70vw] h-[70vw] bg-amber-900/5 rounded-full blur-[140px] -mr-[35vw] -mt-[35vw] pointer-events-none z-0"></div>
            <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-indigo-900/5 rounded-full blur-[120px] -ml-[25vw] -mb-[25vw] pointer-events-none z-0"></div>

            {/* Premium Header - Style Guide: bg-card */}
            <header className="h-[60px] bg-[#141420]/90 backdrop-blur-2xl border-b border-[#bf953f]/20 flex justify-between items-center px-6 shrink-0 z-50 shadow-2xl relative">
                <div className="flex items-center gap-8">
                    <button onClick={() => setInfoOpen(true)} className="flex items-center gap-3 group text-left">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#bf953f] to-[#aa771c] rounded-xl flex items-center justify-center shadow-lg shadow-black/40 group-hover:scale-110 transition-all duration-300">
                            <i className="fa-solid fa-house text-[#0c0c10] text-sm"></i>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[14px] font-black golden-text leading-none tracking-tight">成都秘密基地</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-bold text-[#fcf6ba] uppercase tracking-[0.2em]">骰子工具</span>
                                <span className="text-[7px] font-black text-[#fcf6ba]/60 uppercase tracking-widest px-2 py-0.5 bg-[#bf953f]/10 rounded-full border border-[#bf953f]/20">v2.5 稳定版</span>
                            </div>
                        </div>
                    </button>

                    <nav className="flex gap-2">
                        <Link to="/" className="flex items-center gap-2.5 px-4 py-2 rounded-xl hover:bg-white/5 transition-all group">
                            <div className="w-6 h-6 bg-[#bf953f]/10 text-[#bf953f] rounded-lg flex items-center justify-center group-hover:bg-[#bf953f] group-hover:text-[#141420] transition-all">
                                <i className="fa-solid fa-dice-d20 text-[11px]"></i>
                            </div>
                            <span className="text-[12px] font-bold text-[#a89b7a] group-hover:text-[#fcf6ba] transition-colors uppercase tracking-tight">骰子投掷</span>
                        </Link>

                        {commState !== 'CONNECTED' && (
                            <button
                                onClick={() => setIsRoomModalOpen(true)}
                                className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#bf953f]/5 text-[#bf953f] hover:bg-[#bf953f] hover:text-[#141420] transition-all group border border-[#bf953f]/20 shadow-lg shadow-black/20"
                            >
                                <i className="fa-solid fa-network-wired text-[11px]"></i>
                                <span className="text-[11px] font-black uppercase tracking-tight">房间联机</span>
                            </button>
                        )}
                        {isLoggedIn && (
                            <Link to="/characters" className="flex items-center gap-2.5 px-4 py-2 rounded-xl hover:bg-white/5 transition-all group border border-transparent hover:border-[#bf953f]/10">
                                <div className="w-6 h-6 bg-[#aa771c]/10 text-[#aa771c] rounded-lg flex items-center justify-center group-hover:bg-[#aa771c] group-hover:text-[#141420] transition-all">
                                    <i className="fa-solid fa-user-pen text-[11px]"></i>
                                </div>
                                <span className="text-[12px] font-bold text-[#a89b7a] group-hover:text-[#aa771c] transition-colors uppercase tracking-tight">角色档案</span>
                            </Link>
                        )}
                    </nav>
                </div>

                <div className="flex items-center gap-6">
                    {commState === 'CONNECTED' && (
                        <button
                            onClick={() => setManagerOpen(true)}
                            className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all group border border-emerald-500/20"
                        >
                            <i className="fa-solid fa-tower-broadcast text-[11px]"></i>
                            <span className="text-[11px] font-black uppercase tracking-tight">区域房间 ({roomId})</span>
                        </button>
                    )}

                    {!isLoggedIn ? (
                        <button onClick={() => {
                            const un = prompt('模拟登录，请输入昵称:');
                            if (un) login(un);
                        }} className="flex items-center gap-2.5 bg-[#bf953f] hover:bg-[#fcf6ba] text-[#0c0c10] px-5 py-2 rounded-xl shadow-xl shadow-black/40 transition-all active:scale-95 group font-black uppercase text-[11px]">
                            <i className="fa-solid fa-right-to-bracket text-[11px]"></i>
                            <span>登 录</span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-4 border-l border-[#bf953f]/20 pl-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[11px] font-black text-[#f0ead8] leading-none">{user?.displayName}</span>
                                <button onClick={() => { logout(); navigate('/'); }} className="text-[9px] font-bold text-[#6b6250] hover:text-red-500 transition-colors uppercase tracking-widest mt-1.5 focus:outline-none">退出登录</button>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#bf953f] to-[#aa771c] flex items-center justify-center text-[#0c0c10] text-sm font-black shadow-lg border border-[#fcf6ba]/20 group-hover:scale-105 transition-transform">
                                {user?.displayName[0]}
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Author Info Modal */}
            {infoOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setInfoOpen(false)}></div>
                    <div className="bg-[#141420] rounded-xl w-full max-w-md relative z-10 shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden animate-in zoom-in-95 duration-200 border border-[#bf953f]/30">
                        <div className="h-32 bg-gradient-to-br from-[#18182a] to-[#0c0c10] flex items-center justify-center relative overflow-hidden border-b border-[#bf953f]/20">
                            <div className="absolute inset-0 opacity-10 pointer-events-none">
                                <i className="fa-solid fa-sparkles text-7xl absolute -left-4 -top-4 text-[#bf953f]"></i>
                                <i className="fa-solid fa-dice-d20 text-[12rem] absolute -right-12 -bottom-12 text-[#bf953f]"></i>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <h2 className="text-[#a89b7a] text-[10px] font-black tracking-[0.4em] uppercase">关于工具</h2>
                                <h2 className="golden-text text-xl uppercase tracking-widest">开发团队与指南</h2>
                            </div>
                            <button onClick={() => setInfoOpen(false)} className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 text-[#f0ead8] flex items-center justify-center hover:bg-[#bf953f]/20 transition-colors">
                                <i className="fa-solid fa-xmark text-sm"></i>
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 bg-[#bf953f]/10 rounded-xl flex items-center justify-center text-[#bf953f] border border-[#bf953f]/20 transition-transform group-hover:scale-110">
                                        <i className="fa-solid fa-user-gear text-lg"></i>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-[#6b6250] uppercase tracking-widest leading-none mb-1.5">制作者</p>
                                        <p className="font-black text-[#f0ead8] tracking-tight text-sm">不咕鸟（哈基米德）</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 bg-[#aa771c]/10 rounded-xl flex items-center justify-center text-[#aa771c] border border-[#aa771c]/20 transition-transform group-hover:scale-110">
                                        <i className="fa-solid fa-robot text-lg"></i>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-[#6b6250] uppercase tracking-widest leading-none mb-1.5">AI 技术辅助</p>
                                        <p className="font-black text-[#f0ead8] tracking-tight text-sm">Antigravity Gemini</p>
                                    </div>
                                </div>
                            </div>
                            <div className="h-px bg-[#bf953f]/5"></div>

                            <div className="space-y-3">
                                <div className="p-3 bg-white/5 rounded-xl flex items-start gap-3 hover:bg-[#bf953f]/5 transition-all border border-[#bf953f]/5 hover:border-[#bf953f]/20">
                                    <i className="fa-solid fa-calendar-check text-[#bf953f] text-sm mt-0.5"></i>
                                    <div className="flex-1">
                                        <p className="text-[9px] font-black text-[#6b6250] uppercase tracking-widest mb-1">日常排团</p>
                                        <a href="https://nogubird.top/schedule" target="_blank" rel="noopener" className="text-xs font-bold text-[#fcf6ba] hover:text-[#bf953f] transition-colors">nogubird.top/schedule</a>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-white/5 rounded-xl flex items-start gap-3 border border-white/5 hover:border-[#bf953f]/20 transition-all">
                                        <i className="fa-brands fa-qq text-[#a89b7a] text-sm mt-0.5"></i>
                                        <div className="flex-1">
                                            <p className="text-[8px] font-black text-[#6b6250] uppercase tracking-widest mb-0.5">交流群 (QQ)</p>
                                            <p className="text-xs font-bold text-[#f0ead8] select-all tracking-tight">691707475</p>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-xl flex items-start gap-3 border border-white/5 hover:border-[#bf953f]/20 transition-all">
                                        <i className="fa-solid fa-users text-[#a89b7a] text-sm mt-0.5"></i>
                                        <div className="flex-1">
                                            <p className="text-[8px] font-black text-[#6b6250] uppercase tracking-widest mb-0.5">创想俱乐部</p>
                                            <p className="text-xs font-bold text-[#f0ead8] select-all tracking-tight">261751459</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <a href="https://ifdian.net/a/nogubird" target="_blank" rel="noopener" className="block w-full bg-gradient-to-r from-[#bf953f] to-[#aa771c] hover:from-[#fcf6ba] hover:to-[#bf953f] text-[#0c0c10] py-4 rounded-xl text-center font-black text-xs shadow-2xl transition-all active:scale-95 group">
                                <i className="fa-solid fa-glass-cheers text-[11px] mr-2 animate-bounce"></i>
                                为作者加油 Support Creator
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Viewport */}
            <main className="flex-1 w-full overflow-hidden relative z-10 flex border-t border-[#bf953f]/10">
                <Outlet />
            </main>

            {/* Room Management Drawer */}
            <RoomManagerDrawer />

            {/* Global Room Modal */}
            <RoomModal
                isOpen={isRoomModalOpen}
                onClose={() => setIsRoomModalOpen(false)}
            />
        </div>
    );
}
