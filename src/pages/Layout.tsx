import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';
import { useMqttContext } from '../contexts/MqttContext';
import { RoomManagerDrawer } from '../components/RoomManagerDrawer';
import { RoomModal } from '../components/RoomModal';
import { LockScreen } from '../components/LockScreen';

export function Layout() {
    const { user, isLoggedIn, login, logout } = useAuth();
    const { commState, roomId, roomName, latestNotification, setManagerOpen } = useMqttContext();
    const [infoOpen, setInfoOpen] = useState(false);
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [isLocked, setIsLocked] = useState(() => !sessionStorage.getItem('app_unlocked'));
    const navigate = useNavigate();

    const handleUnlock = () => {
        sessionStorage.setItem('app_unlocked', 'true');
        setIsLocked(false);
    };

    if (isLocked) {
        return <LockScreen onUnlock={handleUnlock} />;
    }

    return (
        <div className="min-h-screen bg-x-dark flex flex-col font-sans antialiased text-x-white h-screen overflow-hidden relative">
            {/* Global Notification Toast */}
            {latestNotification && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[9999]">
                    <div className="px-6 py-3 border border-x-borderStrong bg-x-dark flex items-center gap-3">
                        <span className="text-sm font-mono tracking-xai uppercase text-x-white">{latestNotification.message}</span>
                    </div>
                </div>
            )}

            {/* Premium Header - Style Guide: bg-card */}
            <header className="h-[60px] bg-x-dark border-b border-x-border flex justify-between items-center px-6 shrink-0 z-50 relative">
                <div className="flex items-center gap-8">
                    <button onClick={() => setInfoOpen(true)} className="flex items-center gap-3 group text-left">
                        <div className="w-10 h-10 border border-x-border flex items-center justify-center group-hover:bg-x-surface transition-all">
                            <span className="font-mono text-x-white text-sm">#</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[16px] font-sans font-normal text-x-white leading-none">成都秘密基地</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[12px] font-sans text-x-muted uppercase tracking-widest">骰子工具</span>
                                <span className="text-[10px] font-mono text-x-muted border border-x-border px-2 py-0.5 tracking-xai uppercase">v2.5</span>
                            </div>
                        </div>
                    </button>

                    <nav className="flex gap-4">
                        <Link to="/" className="flex items-center gap-2 px-3 py-2 text-x-white hover:text-x-muted transition-colors font-sans text-[14px]">
                            <span>掷骰</span>
                        </Link>

                        {commState !== 'CONNECTED' && (
                            <button
                                onClick={() => setIsRoomModalOpen(true)}
                                className="flex items-center gap-2 px-3 py-2 text-x-white border border-x-borderStrong hover:bg-x-surface transition-all font-mono text-[14px] uppercase tracking-xai"
                            >
                                房间联机
                            </button>
                        )}
                        {isLoggedIn && (
                            <Link to="/characters" className="flex items-center gap-2 px-3 py-2 text-x-white hover:text-x-muted transition-colors font-sans text-[14px]">
                                <span>角色档案</span>
                            </Link>
                        )}
                    </nav>
                </div>

                <div className="flex items-center gap-6">
                    {commState === 'CONNECTED' && (
                        <button
                            onClick={() => setManagerOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 border border-x-borderStrong text-x-white hover:bg-x-surface transition-all font-mono text-[12px] uppercase tracking-xai"
                        >
                            联机中: {roomName || roomId}
                        </button>
                    )}

                    {!isLoggedIn ? (
                        <button onClick={() => {
                            const un = prompt('请输入昵称:');
                            if (un) login(un);
                        }} className="bg-x-white text-x-dark px-6 py-2 transition-all hover:bg-white/90 font-mono uppercase text-[14px] tracking-xai">
                            登 录
                        </button>
                    ) : (
                        <div className="flex items-center gap-4 border-l border-x-border pl-4">
                            <div className="flex flex-col items-end">
                                <span className="text-[14px] font-sans text-x-white leading-none">{user?.displayName}</span>
                                <button onClick={() => { logout(); navigate('/'); }} className="text-[12px] font-mono text-x-muted hover:text-white transition-colors uppercase tracking-xai mt-1.5 focus:outline-none">退出登录</button>
                            </div>
                            <div className="w-10 h-10 border border-x-border bg-x-surface flex items-center justify-center text-x-white text-sm font-mono">
                                {user?.displayName[0]}
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Author Info Modal */}
            {infoOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-x-dark/90">
                    <div className="bg-x-dark w-full max-w-md relative z-10 border border-x-borderStrong">
                        <div className="p-8 border-b border-x-border">
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col gap-2">
                                    <h2 className="text-x-white text-[30px] font-sans leading-tight">关于工具</h2>
                                </div>
                                <button onClick={() => setInfoOpen(false)} className="text-x-muted hover:text-x-white transition-colors">
                                    <span className="font-mono text-xl">X</span>
                                </button>
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 border border-x-border flex items-center justify-center text-x-white font-mono text-xl">
                                        P
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-mono text-x-muted uppercase tracking-xai mb-1">制作者</p>
                                        <p className="font-sans text-x-white text-[16px]">不咕鸟（哈基米德）</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 border border-x-border flex items-center justify-center text-x-white font-mono text-xl">
                                        AI
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-mono text-x-muted uppercase tracking-xai mb-1">技术辅助</p>
                                        <p className="font-sans text-x-white text-[16px]">Antigravity</p>
                                    </div>
                                </div>
                            </div>
                            <div className="h-px bg-x-border"></div>

                            <div className="space-y-4">
                                <div className="p-4 bg-transparent border border-x-border hover:border-x-borderStrong transition-all flex items-start gap-3">
                                    <div className="flex-1">
                                        <p className="text-[12px] font-mono text-x-muted uppercase tracking-xai mb-2">日常排团</p>
                                        <a href="https://nogubird.top/schedule" target="_blank" rel="noopener" className="text-[16px] font-sans text-x-white hover:text-x-muted transition-colors">nogubird.top/schedule</a>
                                    </div>
                                </div>
                            </div>

                            <a href="https://ifdian.net/a/nogubird" target="_blank" rel="noopener" className="block w-full bg-x-white text-x-dark py-3 text-center font-mono text-[14px] tracking-xai uppercase hover:bg-white/90 transition-all">
                                为作者加油 / SUPPORT
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Viewport */}
            <main className="flex-1 w-full overflow-hidden relative z-10 flex border-t border-x-border">
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
