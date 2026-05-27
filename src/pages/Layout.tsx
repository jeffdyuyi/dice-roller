import { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useMqttContext } from '../contexts/MqttContext';
import { RoomManagerDrawer } from '../components/RoomManagerDrawer';
import { RoomManagerPanel } from '../components/RoomManagerPanel';

import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { Sidebar } from '../components/Sidebar';
import { MainArea } from '../components/MainArea';

export function Layout() {
    const { commState, roomId, roomName, myName, latestNotification, setManagerOpen, addLocalRoll, diceHistory } = useMqttContext();
    const [infoOpen, setInfoOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'whiteboard'>('chat');

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
                            <Link
                                to="/rooms?mode=create"
                                className="flex items-center justify-center h-8 px-4 bg-ibm-primary text-ibm-textOnColor hover:bg-ibm-primaryHover transition-all font-sans text-[13px] border border-ibm-primary"
                            >
                                联机: 新联机房间
                            </Link>
                        )}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    {commState === 'CONNECTED' && (
                        <>
                            {/* Segmented Switcher for Sub-pages */}
                            <div className="flex bg-ibm-background border border-ibm-border p-0.5 mr-2">
                                <button
                                    onClick={() => setActiveTab('chat')}
                                    className={`h-7 px-3.5 text-[12px] font-mono transition-all flex items-center gap-1.5 ${
                                        activeTab === 'chat'
                                            ? 'bg-[#ff832b] text-white font-bold'
                                            : 'text-ibm-textSecondary hover:text-ibm-text hover:bg-ibm-layerHover'
                                    }`}
                                >
                                    <span>💬</span>
                                    <span>战役与聊天</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('whiteboard')}
                                    className={`h-7 px-3.5 text-[12px] font-mono transition-all flex items-center gap-1.5 ${
                                        activeTab === 'whiteboard'
                                            ? 'bg-[#ff832b] text-white font-bold'
                                            : 'text-ibm-textSecondary hover:text-ibm-text hover:bg-ibm-layerHover'
                                    }`}
                                >
                                    <span>🗺️</span>
                                    <span>战术白板</span>
                                </button>
                            </div>

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
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-ibm-background/95 backdrop-blur-md transition-all animate-in fade-in duration-200">
                    <div className="bg-ibm-layer w-full max-w-lg relative z-10 border border-ibm-borderStrong shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Header bar */}
                        <div className="p-6 border-b border-ibm-border flex justify-between items-center bg-ibm-background/40">
                            <div className="flex flex-col">
                                <span className="text-[11px] font-mono text-ibm-primary uppercase tracking-widest">成都秘密基地 · TRPG 工具套件</span>
                                <h2 className="text-ibm-text text-2xl font-sans font-light tracking-tight mt-1">关于工具与创作者</h2>
                            </div>
                            <button 
                                onClick={() => setInfoOpen(false)} 
                                className="w-8 h-8 border border-ibm-border flex items-center justify-center text-ibm-textSecondary hover:text-ibm-text hover:border-ibm-borderStrong hover:bg-ibm-layerHover transition-all font-mono"
                            >
                                X
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="p-8 space-y-6">
                            {/* Creators Info */}
                            <div className="flex flex-col gap-4 border border-ibm-border p-5 bg-ibm-background/20">
                                <div className="flex justify-between items-center">
                                    <span className="text-[12px] font-mono text-ibm-textSecondary uppercase tracking-widest">作者 / Creator</span>
                                    <span className="font-sans text-ibm-text text-[15px] font-medium">不咕鸟（基德）</span>
                                </div>
                                <div className="h-px bg-ibm-border/45"></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[12px] font-mono text-ibm-textSecondary uppercase tracking-widest">技术辅助 / Co-pilot</span>
                                    <span className="font-sans text-ibm-text text-[15px] font-medium">Antigravity Gemini</span>
                                </div>
                            </div>

                            {/* Base Information */}
                            <div className="space-y-3">
                                {/* Website */}
                                <a 
                                    href="https://nogubird.top/" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="p-4 border border-ibm-border bg-ibm-background/20 hover:border-ibm-borderStrong transition-all flex items-start gap-4 group"
                                >
                                    <span className="text-lg mt-0.5 group-hover:scale-110 transition-transform">🌐</span>
                                    <div>
                                        <p className="text-[10px] font-mono text-ibm-textSecondary uppercase tracking-widest">成都秘密基地 / Official Website</p>
                                        <p className="font-sans text-ibm-primary group-hover:underline text-[14px] mt-1 font-medium">https://nogubird.top/</p>
                                    </div>
                                </a>

                                {/* QQ Group */}
                                <div className="p-4 border border-ibm-border bg-ibm-background/20 flex items-start gap-4">
                                    <span className="text-lg mt-0.5">💬</span>
                                    <div>
                                        <p className="text-[10px] font-mono text-ibm-textSecondary uppercase tracking-widest">不咕鸟TRPG创想俱乐部 / QQ Group</p>
                                        <p className="font-sans text-ibm-text text-[14px] mt-1 font-mono font-medium select-all">261751459</p>
                                    </div>
                                </div>
                            </div>

                            {/* Wishlist and Pressure Banner */}
                            <div className="p-4 border-l-2 border-ibm-primary bg-ibm-layer/60 space-y-2">
                                <p className="text-[13px] font-sans text-ibm-text flex items-center gap-1.5 font-medium">
                                    <span>💡</span> 欢迎反馈 BUG 和提交需求
                                </p>
                                <p className="text-[12px] font-sans text-ibm-textSecondary flex items-center gap-1.5">
                                    <span>🔥</span> 想要接入其他规则也请直接压力作者
                                </p>
                            </div>

                            {/* Sponsor Button */}
                            <a 
                                href="https://ifdian.net/a/nogubird" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="block w-full bg-ibm-primary text-ibm-textOnColor py-3.5 text-center font-sans text-[14px] font-medium hover:bg-ibm-primaryHover transition-all tracking-wider flex items-center justify-center gap-2"
                            >
                                <span className="text-[14px]">❤️</span> 为作者加油 / Support the Creator
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Viewport */}
            <main className="flex-1 w-full overflow-hidden relative z-10 flex flex-col md:flex-row border-t border-ibm-border">
                {commState === 'CONNECTED' ? (
                    activeTab === 'chat' ? (
                        <>
                            {/* 1. Tools Sidebar (narrower for best compact display) */}
                            <div className="w-full md:w-[280px] lg:w-[300px] shrink-0 border-b md:border-b-0 md:border-r border-ibm-border bg-ibm-layer z-20 h-auto md:h-full overflow-y-auto custom-scrollbar flex flex-col">
                                <Sidebar onRoll={addLocalRoll} />
                            </div>
                            
                            {/* 2. Room Management Panel (Integrated to the left of the chat box) */}
                            <div className="w-full md:w-[290px] lg:w-[320px] shrink-0 border-b md:border-b-0 md:border-r border-ibm-border bg-ibm-background z-20 h-auto md:h-full overflow-y-auto custom-scrollbar flex flex-col">
                                <RoomManagerPanel />
                            </div>

                            {/* 3. Chat Area / Dice History (Visual ratio maximized) */}
                            <div className="flex-grow flex-1 shrink-0 bg-ibm-background z-20 h-[50vh] md:h-full flex flex-col">
                                <MainArea diceHistory={diceHistory} />
                            </div>
                        </>
                    ) : (
                        /* 4. Whiteboard Sub-page - full screen for perfect editing workspace */
                        <div className="flex-1 h-full overflow-y-auto custom-scrollbar relative bg-ibm-layer flex flex-col">
                            <Outlet />
                        </div>
                    )
                ) : (
                    /* DISCONNECTED State - Standard Outlet list on Home Page */
                    <div className="flex-1 h-full overflow-y-auto custom-scrollbar relative bg-ibm-layer flex flex-col">
                        <Outlet />
                    </div>
                )}
            </main>

            {/* Room Management Drawer (Backup drawer if needed elsewhere) */}
            <RoomManagerDrawer />
        </div>
    );
}
