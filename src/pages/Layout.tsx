import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';

export function Layout() {
    const { user, isLoggedIn, login, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#fdf8f4] flex flex-col font-sans antialiased text-slate-800 h-screen overflow-hidden">
            {/* Top Navigation Bar */}
            <header className="h-[70px] bg-white/70 backdrop-blur-md border-b border-orange-100 flex justify-between items-center px-6 shrink-0 z-50 shadow-sm">
                <div className="flex items-center gap-8">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200 group-hover:scale-110 transition-transform">
                            <i className="fa-solid fa-house text-white text-sm"></i>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-800 leading-tight">成都秘密基地</span>
                            <span className="text-[10px] font-bold text-orange-500 uppercase tracking-tighter">Dice Roller</span>
                        </div>
                    </Link>

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

            {/* Main Content Viewport */}
            <main className="flex-1 w-full bg-[#fdf8f4] overflow-hidden relative">
                <Outlet />
            </main>
        </div>
    );
}
