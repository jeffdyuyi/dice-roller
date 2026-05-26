import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useMqttContext } from '../contexts/MqttContext';
import { RoomManagerDrawer } from '../components/RoomManagerDrawer';
import { RoomModal } from '../components/RoomModal';

import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { Sidebar } from '../components/Sidebar';
import { MainArea } from '../components/MainArea';

export function Layout() {
    const { commState, roomId, roomName, myName, latestNotification, setManagerOpen, addLocalRoll, diceHistory } = useMqttContext();
    const [infoOpen, setInfoOpen] = useState(false);
    const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
    const [roomModalMode, setRoomModalMode] = useState<'create' | 'join'>('join');
    const [roomModalId, setRoomModalId] = useState<string>('');

    const openRoomModal = (mode: 'create' | 'join' = 'join', rId: string = '') => {
        setRoomModalMode(mode);
        setRoomModalId(rId);
        setIsRoomModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-ibm-background flex flex-col font-sans antialiased text-ibm-text h-screen overflow-hidden relative">
            {/* Global Notification Toast */}
            {latestNotification && (
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[9999]">
                    <div className="px-6 py-3 border border-ibm-borderStrong bg-ibm-layer flex items-center gap-3">
                        <span className="text-sm font-mono tracking-xai uppercase text-ibm-text">{latestNotification.message}</span>
                    </div>
                </div>
            )}

            {/* Premium Header - Style Guide: bg-card */}
            <header className="h-[48px] bg-ibm-layer border-b border-ibm-border flex justify-between items-center px-6 shrink-0 z-50 relative">
                <div className="flex items-center gap-8">
                    <button onClick={() => setInfoOpen(true)} className="flex items-center gap-3 group text-left">
                        <div className="w-8 h-8 border border-ibm-border flex items-center justify-center group-hover:bg-ibm-layerHover transition-all">
                            <span className="font-mono text-ibm-text text-sm">#</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[14px] font-sans font-semibold text-ibm-text leading-none">成都秘密基地</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[11px] font-sans text-ibm-textSecondary uppercase tracking-widest">骰子工具</span>
                                <span className="text-[10px] font-mono text-ibm-textSecondary border border-ibm-border px-1.5 py-0.5 tracking-xai uppercase">v2.5</span>
                            </div>
                        </div>
                    </button>

                    <nav className="flex items-center gap-3 border-l border-ibm-border pl-6 ml-2">
                        <Link to="/" className="flex items-center justify-center h-8 px-4 border border-ibm-border text-ibm-text hover:bg-ibm-layerHover hover:border-ibm-borderStrong transition-all font-sans text-[13px]">
                            主控制台
                        </Link>
                        <Link to="/characters" className="flex items-center justify-center h-8 px-4 border border-ibm-border text-ibm-text hover:bg-ibm-layerHover hover:border-ibm-borderStrong transition-all font-sans text-[13px]">
                            备忘库存
                        </Link>
                        <Link to="/whiteboards" className="flex items-center justify-center h-8 px-4 border border-ibm-border text-ibm-text hover:bg-ibm-layerHover hover:border-ibm-borderStrong transition-all font-sans text-[13px]">
                            白板库存
                        </Link>
                        {commState !== 'CONNECTED' && (
                            <button
                                onClick={() => setIsRoomModalOpen(true)}
                                className="flex items-center justify-center h-8 px-4 bg-ibm-primary text-ibm-textOnColor hover:bg-ibm-primaryHover transition-all font-sans text-[13px] border border-ibm-primary"
                            >
                                联机: 新联机房间
                            </button>
                        )}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    {commState === 'CONNECTED' && (
                        <>
                            <button
                                onClick={() => setManagerOpen(true)}
                                className="flex items-center justify-center h-8 px-4 border border-ibm-border bg-ibm-layerHover text-ibm-text hover:border-ibm-borderStrong transition-all font-sans text-[13px]"
                            >
                                联机中: {roomName || roomId}
                            </button>
                            <div className="w-8 h-8 border border-ibm-border bg-ibm-background flex items-center justify-center text-ibm-text text-[13px] font-mono shrink-0">
                                {myName?.[0] || '?'}
                            </div>
                        </>
                    )}
                    <div className="border-l border-ibm-border pl-4">
                        <ThemeSwitcher />
                    </div>
                </div>
            </header>

            {/* Author Info Modal */}
            {infoOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-ibm-background/90 backdrop-blur-sm">
                    <div className="bg-ibm-layer w-full max-w-md relative z-10 border border-ibm-borderStrong shadow-md">
                        <div className="p-8 border-b border-ibm-border">
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col gap-2">
                                    <h2 className="text-ibm-text text-[28px] font-sans font-light leading-tight">关于工具</h2>
                                </div>
                                <button onClick={() => setInfoOpen(false)} className="text-ibm-textSecondary hover:text-ibm-text transition-colors">
                                    <span className="font-mono text-xl">X</span>
                                </button>
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 border border-ibm-border flex items-center justify-center text-ibm-text font-mono text-xl bg-ibm-layerHover">
                                        P
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-mono text-ibm-textSecondary uppercase tracking-xai mb-1">制作者</p>
                                        <p className="font-sans text-ibm-text text-[16px]">不咕鸟（哈基米德）</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 border border-ibm-border flex items-center justify-center text-ibm-text font-mono text-xl bg-ibm-layerHover">
                                        AI
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-mono text-ibm-textSecondary uppercase tracking-xai mb-1">技术辅助</p>
                                        <p className="font-sans text-ibm-text text-[16px]">Antigravity</p>
                                    </div>
                                </div>
                            </div>
                            <div className="h-px bg-ibm-border"></div>

                            <div className="space-y-4">
                                <div className="p-4 bg-transparent border border-ibm-border hover:border-ibm-borderStrong transition-all flex items-start gap-3">
                                    <div className="flex-1">
                                        <p className="text-[12px] font-mono text-ibm-textSecondary uppercase tracking-xai mb-2">日常排团</p>
                                        <a href="https://nogubird.top/schedule" target="_blank" rel="noopener" className="text-[16px] font-sans text-ibm-primary hover:text-ibm-primaryHover transition-colors">nogubird.top/schedule</a>
                                    </div>
                                </div>
                            </div>

                            <a href="https://ifdian.net/a/nogubird" target="_blank" rel="noopener" className="block w-full bg-ibm-primary text-ibm-textOnColor py-3 text-center font-sans text-[14px] hover:bg-ibm-primaryHover transition-all">
                                为作者加油
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Viewport */}
            <main className="flex-1 w-full overflow-hidden relative z-10 flex flex-col md:flex-row border-t border-ibm-border">
                {commState === 'CONNECTED' && (
                    <>
                        <div className="w-full md:w-[320px] lg:w-[350px] shrink-0 border-b md:border-b-0 md:border-r border-ibm-border bg-ibm-layer z-20 h-auto md:h-full overflow-y-auto custom-scrollbar flex flex-col">
                            <Sidebar onRoll={addLocalRoll} />
                        </div>
                        <div className="w-full md:w-[350px] lg:w-[450px] shrink-0 border-b md:border-b-0 md:border-r border-ibm-border bg-ibm-background z-20 h-[50vh] md:h-full flex flex-col">
                            <MainArea diceHistory={diceHistory} />
                        </div>
                    </>
                )}
                <div className="flex-1 h-full overflow-y-auto custom-scrollbar relative bg-ibm-layer flex flex-col">
                    <Outlet context={{ openRoomModal }} />
                </div>
            </main>

            {/* Room Management Drawer */}
            <RoomManagerDrawer />

            {/* Global Room Modal */}
            <RoomModal
                isOpen={isRoomModalOpen}
                onClose={() => setIsRoomModalOpen(false)}
                defaultMode={roomModalMode}
                defaultRoomId={roomModalId}
            />
        </div>
    );
}
