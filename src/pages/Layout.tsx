import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';
import { useMqttContext } from '../contexts/MqttContext';
import { RoomManagerDrawer } from '../components/RoomManagerDrawer';
import { RoomModal } from '../components/RoomModal';

export function Layout() {
    const { user, isLoggedIn, login, logout } = useAuth();
    const { commState, setManagerOpen, roomId } = useMqttContext();
    const [infoOpen, setInfoOpen] = useState(false);
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#05070a] flex flex-col font-sans antialiased text-slate-200 h-screen overflow-hidden relative">
            {/* Dark Premium Background Decor */}
            <div className="absolute top-0 right-0 w-[70vw] h-[70vw] bg-indigo-900/10 rounded-full blur-[140px] -mr-[35vw] -mt-[35vw] pointer-events-none z-0"></div>
            <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-amber-900/5 rounded-full blur-[120px] -ml-[25vw] -mb-[25vw] pointer-events-none z-0"></div>

            {/* Premium Dark Header */}
            <header className="h-[60px] bg-[#0a0c14]/80 backdrop-blur-2xl border-b border-amber-900/30 flex justify-between items-center px-6 shrink-0 z-50 shadow-2xl relative">
                <div className="flex items-center gap-8">
                    <button onClick={() => setInfoOpen(true)} className="flex items-center gap-3 group text-left">
                        <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-amber-700 rounded-xl flex items-center justify-center shadow-lg shadow-amber-900/20 group-hover:scale-110 transition-all duration-300">
                            <i className="fa-solid fa-house text-white text-xs"></i>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[13px] font-black text-white leading-none tracking-tight">成都秘密基地</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] font-bold text-amber-500 uppercase tracking-[0.2em]">Dice Roller</span>
                                <span className="text-[7px] font-black text-amber-500/60 uppercase tracking-widest px-2 py-0.5 bg-amber-900/20 rounded-full border border-amber-500/20">v2.5 Stable</span>
                            </div>
                        </div>
                    </button>

                    <nav className="flex gap-1.5">
                        <Link to="/" className="flex items-center gap-2.5 px-4 py-2 rounded-xl hover:bg-white/5 transition-all group">
                            <div className="w-6 h-6 bg-amber-500/10 text-amber-500 rounded-lg flex items-center justify-center group-hover:bg-amber-500 group-hover:text-black transition-all">
                                <i className="fa-solid fa-dice-d20 text-[11px]"></i>
                            </div>
                            <span className="text-[12px] font-bold text-slate-400 group-hover:text-amber-500 transition-colors uppercase tracking-tight">骰子</span>
                        </Link>

                        {commState !== 'CONNECTED' && (
                            <button
                                onClick={() => setIsRoomModalOpen(true)}
                                className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-amber-500/5 text-amber-500 hover:bg-amber-500 hover:text-black transition-all group border border-amber-500/20 shadow-lg shadow-amber-950/20"
                            >
                                <i className="fa-solid fa-network-wired text-[11px]"></i>
                                <span className="text-[11px] font-black uppercase tracking-tight">建立时空联结</span>
                            </button>
                        )}
                        {isLoggedIn && (
                            <Link to="/characters" className="flex items-center gap-2.5 px-4 py-2 rounded-xl hover:bg-white/5 transition-all group">
                                <div className="w-6 h-6 bg-orange-500/10 text-orange-500 rounded-lg flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-all">
                                    <i className="fa-solid fa-user-pen text-[11px]"></i>
                                </div>
                                <span className="text-[12px] font-bold text-slate-400 group-hover:text-orange-500 transition-colors uppercase tracking-tight">角色卡</span>
                            </Link>
                        )}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    {commState === 'CONNECTED' && (
                        <button
                            onClick={() => setManagerOpen(true)}
                            className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all group border border-emerald-500/20"
                        >
                            <i className="fa-solid fa-tower-broadcast text-[11px]"></i>
                            <span className="text-[11px] font-black uppercase tracking-tight">房间 ({roomId})</span>
                        </button>
                    )}

                    {!isLoggedIn ? (
                        <button onClick={() => {
                            const un = prompt('模拟登录，请输入昵称:');
                            if (un) login(un);
                        }} className="flex items-center gap-2.5 bg-amber-600 hover:bg-amber-500 text-black px-5 py-2 rounded-xl shadow-xl shadow-amber-900/20 transition-all active:scale-95 group font-black uppercase text-[11px]">
                            <i className="fa-solid fa-right-to-bracket text-[11px]"></i>
                            <span>Login</span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-4 border-l border-white/5 pl-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[11px] font-black text-white leading-none">{user?.displayName}</span>
                                <button onClick={() => { logout(); navigate('/'); }} className="text-[9px] font-bold text-slate-500 hover:text-red-500 transition-colors uppercase tracking-widest mt-1.5 focus:outline-none">Logout</button>
                            </div>
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-700 flex items-center justify-center text-white text-[12px] font-black shadow-lg border border-white/10 group-hover:scale-105 transition-transform">
                                {user?.displayName[0]}
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Premium Dark Author Info Modal */}
            {infoOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setInfoOpen(false)}></div>
                    <div className="bg-[#0d111a] rounded-[2rem] w-full max-w-md relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-200 border border-amber-900/20">
                        <div className="h-32 bg-gradient-to-br from-amber-600 via-amber-700 to-amber-900 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10 pointer-events-none">
                                <i className="fa-solid fa-sparkles text-7xl absolute -left-4 -top-4"></i>
                                <i className="fa-solid fa-dice-d20 text-[12rem] absolute -right-12 -bottom-12"></i>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <h2 className="text-black/90 text-[10px] font-black tracking-[0.4em] uppercase">Secret Base</h2>
                                <h2 className="text-white text-xl font-black tracking-widest uppercase">Member Information</h2>
                            </div>
                            <button onClick={() => setInfoOpen(false)} className="absolute top-6 right-6 w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 transition-colors">
                                <i className="fa-solid fa-xmark text-sm"></i>
                            </button>
                        </div>

                        <div className="p-10 space-y-8">
                            <div className="space-y-5">
                                <div className="flex items-center gap-5 group">
                                    <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-500/20 transition-transform group-hover:scale-110">
                                        <i className="fa-solid fa-user-gear text-xl"></i>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-amber-500/40 uppercase tracking-widest leading-none mb-2">Architect / Creator</p>
                                        <p className="font-black text-slate-100 tracking-tight text-base">不咕鸟（哈基米德）</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5 group">
                                    <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 transition-transform group-hover:scale-110">
                                        <i className="fa-solid fa-robot text-xl"></i>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-indigo-400/40 uppercase tracking-widest leading-none mb-2">Core AI Assistant</p>
                                        <p className="font-black text-slate-100 tracking-tight text-base">Antigravity Gemini</p>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-white/5"></div>

                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 rounded-2xl flex items-start gap-4 hover:bg-amber-500/5 transition-all border border-transparent hover:border-amber-500/20">
                                    <i className="fa-solid fa-calendar-check text-amber-600 mt-1"></i>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">成都秘密基地约团系统</p>
                                        <a href="https://nogubird.top/schedule" target="_blank" rel="noopener" className="text-sm font-bold text-amber-500 hover:text-amber-400 transition-colors">nogubird.top/schedule</a>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/5 rounded-2xl flex items-start gap-3 border border-transparent hover:border-white/10 transition-all">
                                        <i className="fa-brands fa-qq text-slate-500 mt-1"></i>
                                        <div className="flex-1">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">基地群 QQ</p>
                                            <p className="text-sm font-bold text-slate-200 select-all tracking-tight">691707475</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-2xl flex items-start gap-3 border border-transparent hover:border-white/10 transition-all">
                                        <i className="fa-solid fa-users text-slate-500 mt-1"></i>
                                        <div className="flex-1">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">TRPG创想俱乐部</p>
                                            <p className="text-sm font-bold text-slate-200 select-all tracking-tight">261751459</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <a href="https://ifdian.net/a/nogubird" target="_blank" rel="noopener" className="block w-full bg-amber-600 hover:bg-amber-500 text-black py-4 rounded-2xl text-center font-black text-xs shadow-2xl transition-all active:scale-95 group">
                                <i className="fa-solid fa-glass-cheers text-[11px] mr-2 animate-bounce"></i>
                                为作者加油 / Support the Creator
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Viewport */}
            <main className="flex-1 w-full overflow-hidden relative z-10 flex border-t border-white/5">
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
