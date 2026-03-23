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
        <div className="min-h-screen bg-[#fffdfa] flex flex-col font-sans antialiased text-slate-800 h-screen overflow-hidden relative">
            {/* Dynamic Warm Background Decor */}
            <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-amber-50/50 rounded-full blur-[140px] -mr-[30vw] -mt-[30vw] pointer-events-none z-0"></div>
            <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-orange-50/40 rounded-full blur-[100px] -ml-[20vw] -mb-[20vw] pointer-events-none z-0"></div>

            {/* Compact Header */}
            <header className="h-[56px] bg-white/80 backdrop-blur-xl border-b border-amber-100 flex justify-between items-center px-5 shrink-0 z-50 shadow-sm relative">
                <div className="flex items-center gap-6">
                    <button onClick={() => setInfoOpen(true)} className="flex items-center gap-2 group text-left">
                        <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-[10px] flex items-center justify-center shadow-md shadow-orange-100 group-hover:scale-110 transition-transform">
                            <i className="fa-solid fa-house text-white text-[10px]"></i>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-800 leading-none">成都秘密基地</span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[8px] font-bold text-orange-500 uppercase tracking-tighter">Dice Roller</span>
                                <span className="text-[7px] font-black text-amber-600/40 uppercase tracking-widest px-1.5 py-0.5 bg-amber-50 rounded-md">v2.5 Stable</span>
                            </div>
                        </div>
                    </button>

                    <nav className="flex gap-2">
                        <Link to="/" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-all group">
                            <div className="w-6 h-6 bg-amber-100 text-amber-600 rounded-md flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                <i className="fa-solid fa-dice-d20 text-[10px]"></i>
                            </div>
                            <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">骰子</span>
                        </Link>

                        {commState !== 'CONNECTED' && (
                            <button
                                onClick={() => setIsRoomModalOpen(true)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white transition-all group shadow-sm border border-orange-100"
                            >
                                <i className="fa-solid fa-network-wired text-[10px]"></i>
                                <span className="text-[10px] font-black uppercase tracking-tight">建立时空联结</span>
                            </button>
                        )}
                        {isLoggedIn && (
                            <Link to="/characters" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-all group">
                                <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded-md flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                    <i className="fa-solid fa-user-pen text-[10px]"></i>
                                </div>
                                <span className="text-[11px] font-black text-slate-600 uppercase tracking-tight">角色卡</span>
                            </Link>
                        )}
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    {commState === 'CONNECTED' && (
                        <button
                            onClick={() => setManagerOpen(true)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-orange-600 hover:text-white transition-all group shadow-sm mr-2 border border-amber-100"
                        >
                            <i className="fa-solid fa-tower-broadcast text-[10px]"></i>
                            <span className="text-[10px] font-black uppercase tracking-tight">房间 ({roomId})</span>
                        </button>
                    )}

                    {!isLoggedIn ? (
                        <button onClick={() => {
                            const un = prompt('模拟登录，请输入昵称:');
                            if (un) login(un);
                        }} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-1.5 rounded-xl shadow-md shadow-orange-100 transition-all active:scale-95 group">
                            <i className="fa-solid fa-right-to-bracket text-[10px] opacity-70"></i>
                            <span className="text-[10px] font-black uppercase">Login</span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-slate-800 leading-none">{user?.displayName}</span>
                                <button onClick={() => { logout(); navigate('/'); }} className="text-[8px] font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest mt-0.5">Logout</button>
                            </div>
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white text-[11px] font-black shadow-md border border-white">
                                {user?.displayName[0]}
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Author Info Modal */}
            {infoOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-amber-950/20 backdrop-blur-sm" onClick={() => setInfoOpen(false)}></div>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-amber-100">
                        <div className="h-24 bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20 pointer-events-none">
                                <i className="fa-solid fa-sparkles text-6xl absolute -left-4 -top-4"></i>
                                <i className="fa-solid fa-dice-d20 text-[10rem] absolute -right-8 -bottom-8"></i>
                            </div>
                            <h2 className="text-white text-lg font-black tracking-widest uppercase">Secret Base Information</h2>
                            <button onClick={() => setInfoOpen(false)} className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40 transition-colors">
                                <i className="fa-solid fa-xmark text-sm"></i>
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                                        <i className="fa-solid fa-user-gear"></i>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-amber-200 uppercase tracking-widest leading-none mb-1.5">Architect / Creator</p>
                                        <p className="font-black text-slate-800 tracking-tight text-sm">不咕鸟（哈基米德）</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
                                        <i className="fa-solid fa-robot"></i>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-amber-200 uppercase tracking-widest leading-none mb-1.5">Core AI Assistant</p>
                                        <p className="font-black text-slate-800 tracking-tight text-sm">Antigravity Gemini</p>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-amber-50"></div>

                            <div className="space-y-3">
                                <div className="p-3.5 bg-amber-50/20 rounded-2xl flex items-start gap-4 hover:bg-amber-50 transition-colors">
                                    <i className="fa-solid fa-calendar-check text-amber-300 mt-0.5"></i>
                                    <div className="flex-1">
                                        <p className="text-[8px] font-black text-amber-200 uppercase tracking-widest mb-1">成都秘密基地约团系统</p>
                                        <a href="https://nogubird.top/schedule" target="_blank" rel="noopener" className="text-xs font-bold text-orange-600 hover:underline">nogubird.top/schedule</a>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3.5 bg-amber-50/20 rounded-2xl flex items-start gap-3">
                                        <i className="fa-brands fa-qq text-amber-300 mt-0.5"></i>
                                        <div className="flex-1">
                                            <p className="text-[8px] font-black text-amber-200 uppercase tracking-widest mb-1">基地群 QQ</p>
                                            <p className="text-xs font-bold text-slate-700 select-all tracking-tighter">691707475</p>
                                        </div>
                                    </div>
                                    <div className="p-3.5 bg-amber-50/20 rounded-2xl flex items-start gap-3">
                                        <i className="fa-solid fa-users text-amber-300 mt-0.5"></i>
                                        <div className="flex-1">
                                            <p className="text-[8px] font-black text-amber-200 uppercase tracking-widest mb-1">TRPG创想俱乐部</p>
                                            <p className="text-xs font-bold text-slate-700 select-all tracking-tighter">261751459</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <a href="https://ifdian.net/a/nogubird" target="_blank" rel="noopener" className="block w-full bg-amber-600 hover:bg-orange-600 text-white py-4 rounded-2xl text-center font-black text-xs shadow-xl shadow-orange-100 transition-all active:scale-95 group">
                                <i className="fa-solid fa-coffee text-[10px] mr-2 text-white animate-bounce"></i>
                                为作者加油 / Support the Creator
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Viewport */}
            <main className="flex-1 w-full bg-[#fffdfa]/50 overflow-hidden relative z-10 flex border-t border-amber-50/50">
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
