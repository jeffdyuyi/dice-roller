import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';
import { useMqttContext } from '../contexts/MqttContext';
import { RoomManagerDrawer } from '../components/RoomManagerDrawer';

export function Layout() {
    const { user, isLoggedIn, login, logout } = useAuth();
    const { commState, setManagerOpen, roomId } = useMqttContext();
    const [infoOpen, setInfoOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#fdf8f4] flex flex-col font-sans antialiased text-slate-800 h-screen overflow-hidden">
            {/* Top Navigation Bar */}
            <header className="h-[70px] bg-white/70 backdrop-blur-md border-b border-orange-100 flex justify-between items-center px-6 shrink-0 z-50 shadow-sm">
                <div className="flex items-center gap-8">
                    <button onClick={() => setInfoOpen(true)} className="flex items-center gap-2 group text-left">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200 group-hover:scale-110 transition-transform">
                            <i className="fa-solid fa-house text-white text-sm"></i>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-800 leading-tight">成都秘密基地</span>
                            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-tighter">Dice Roller</span>
                        </div>
                    </button>

                    <nav className="flex gap-2">
                        <Link to="/" className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white transition-all group">
                            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                                <i className="fa-solid fa-dice-d20 text-xs"></i>
                            </div>
                            <span className="text-xs font-bold text-slate-600">联机骰子</span>
                        </Link>
                        {isLoggedIn && (
                            <Link to="/characters" className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white transition-all group">
                                <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-sm">
                                    <i className="fa-solid fa-user-pen text-xs"></i>
                                </div>
                                <span className="text-xs font-bold text-slate-600">我的角色卡</span>
                            </Link>
                        )}
                        {commState === 'CONNECTED' && (
                            <button
                                onClick={() => setManagerOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all group shadow-sm"
                            >
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors">
                                    <i className="fa-solid fa-tower-broadcast text-xs"></i>
                                </div>
                                <span className="text-xs font-black">房间管理 ({roomId})</span>
                            </button>
                        )}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    {!isLoggedIn ? (
                        <button onClick={() => {
                            const un = prompt('模拟登录，请输入昵称:');
                            if (un) login(un);
                        }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-2xl shadow-lg shadow-indigo-100 transition-all active:scale-95 group">
                            <i className="fa-solid fa-right-to-bracket text-xs opacity-70 group-hover:opacity-100"></i>
                            <span className="text-xs font-black">登录/注册</span>
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="flex flex-col items-end">
                                <span className="text-xs font-black text-slate-800">{user?.displayName}</span>
                                <button onClick={() => { logout(); navigate('/'); }} className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors">退出登录</button>
                            </div>
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-indigo-100 border-2 border-white">
                                {user?.displayName[0]}
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Author Info Modal */}
            {infoOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setInfoOpen(false)}></div>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md relative z-10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="h-24 bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-20 pointer-events-none">
                                <i className="fa-solid fa-sparkles text-6xl absolute -left-4 -top-4"></i>
                                <i className="fa-solid fa-dice-d20 text-[10rem] absolute -right-8 -bottom-8"></i>
                            </div>
                            <h2 className="text-white text-xl font-black tracking-widest uppercase">Secret Base Information</h2>
                            <button onClick={() => setInfoOpen(false)} className="absolute top-6 right-6 w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 transition-colors">
                                <i className="fa-solid fa-xmark text-sm"></i>
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
                                        <i className="fa-solid fa-user-gear"></i>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1.5">Architect / Creator</p>
                                        <p className="font-black text-slate-800 tracking-tight">不咕鸟（哈基米德）</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 group">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500">
                                        <i className="fa-solid fa-robot"></i>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1.5">Core AI Assistant</p>
                                        <p className="font-black text-slate-800 tracking-tight">Antigravity Gemini</p>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px bg-slate-100"></div>

                            <div className="space-y-3">
                                <div className="p-3.5 bg-slate-50 rounded-2xl flex items-start gap-4 hover:bg-slate-100 transition-colors">
                                    <i className="fa-solid fa-calendar-check text-slate-400 mt-0.5"></i>
                                    <div className="flex-1">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">成都秘密基地约团系统</p>
                                        <a href="https://nogubird.top/schedule" target="_blank" rel="noopener" className="text-xs font-bold text-indigo-600 hover:underline">nogubird.top/schedule</a>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3.5 bg-slate-50 rounded-2xl flex items-start gap-3">
                                        <i className="fa-brands fa-qq text-slate-400 mt-0.5"></i>
                                        <div className="flex-1">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">基地群 QQ</p>
                                            <p className="text-xs font-bold text-slate-700 select-all tracking-tighter">691707475</p>
                                        </div>
                                    </div>
                                    <div className="p-3.5 bg-slate-50 rounded-2xl flex items-start gap-3">
                                        <i className="fa-solid fa-users text-slate-400 mt-0.5"></i>
                                        <div className="flex-1">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">TRPG创想俱乐部</p>
                                            <p className="text-xs font-bold text-slate-700 select-all tracking-tighter">261751459</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <a href="https://ifdian.net/a/nogubird" target="_blank" rel="noopener" className="block w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-2xl text-center font-black text-xs shadow-xl shadow-slate-100 transition-all active:scale-95 group">
                                <i className="fa-solid fa-coffee text-[10px] mr-2 text-orange-400 animate-bounce"></i>
                                为作者加油 / Support the Creator
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Viewport */}
            <main className="flex-1 w-full bg-[#fdf8f4] overflow-hidden relative">
                <Outlet />
            </main>

            {/* Room Management Drawer */}
            <RoomManagerDrawer />
        </div>
    );
}
