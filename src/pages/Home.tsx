import { Sidebar } from '../components/Sidebar';
import { MainArea } from '../components/MainArea';
import { useMqttContext } from '../contexts/MqttContext';
import { useOutletContext, Link } from 'react-router-dom';
import { useState } from 'react';

export function Home() {
    const { diceHistory, latestRoll, addLocalRoll, commState } = useMqttContext();
    const { openRoomModal } = useOutletContext<{ openRoomModal: () => void }>();
    const [forceLocalDice, setForceLocalDice] = useState(false);

    // If connected to a room, or user explicitly chose local dice, show the dice interface
    if (commState === 'CONNECTED' || forceLocalDice) {
        return (
            <div className="flex flex-col md:flex-row h-full w-full bg-x-dark overflow-hidden relative">
                {forceLocalDice && commState !== 'CONNECTED' && (
                    <button 
                        onClick={() => setForceLocalDice(false)}
                        className="absolute top-4 right-4 z-[50] bg-x-dark border border-x-border px-4 py-2 text-[12px] font-mono text-x-white hover:bg-x-surface uppercase tracking-xai transition-all"
                    >
                        退出单机模式 / BACK
                    </button>
                )}
                <Sidebar onRoll={addLocalRoll} />
                <MainArea diceHistory={diceHistory} />
            </div>
        );
    }

    // Dashboard View for disconnected state
    return (
        <div className="flex-1 h-full w-full bg-x-dark p-8 overflow-y-auto custom-scrollbar flex flex-col items-center justify-center">
            <div className="max-w-6xl w-full">
                
                <div className="mb-12">
                    <h1 className="text-[48px] md:text-[80px] font-sans font-black text-x-white leading-none tracking-tight mb-2">SYSTEM.CORE</h1>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Room Connection */}
                    <button 
                        onClick={openRoomModal}
                        className="group flex flex-col text-left border border-x-border bg-transparent p-8 md:p-12 hover:bg-x-white hover:text-x-dark transition-all duration-300 relative overflow-hidden h-64"
                    >
                        <div className="absolute top-8 right-8 font-mono text-x-muted group-hover:text-x-dark/50 text-6xl opacity-20">01</div>
                        <h2 className="text-[32px] md:text-[40px] font-sans text-x-white group-hover:text-x-dark leading-none mb-4 z-10">联机大厅</h2>
                        <p className="text-[12px] font-mono text-x-muted group-hover:text-x-dark/70 uppercase tracking-xai z-10">MULTIPLAYER ROOM</p>
                        <div className="mt-auto z-10">
                            <span className="inline-block border border-x-border group-hover:border-x-dark px-3 py-1 text-[10px] font-mono uppercase tracking-xai group-hover:text-x-dark text-x-white">创建或加入房间</span>
                        </div>
                    </button>

                    {/* Character Library */}
                    <Link 
                        to="/characters"
                        className="group flex flex-col text-left border border-x-border bg-transparent p-8 md:p-12 hover:bg-x-white hover:text-x-dark transition-all duration-300 relative overflow-hidden h-64"
                    >
                        <div className="absolute top-8 right-8 font-mono text-x-muted group-hover:text-x-dark/50 text-6xl opacity-20">02</div>
                        <h2 className="text-[32px] md:text-[40px] font-sans text-x-white group-hover:text-x-dark leading-none mb-4 z-10">角色库</h2>
                        <p className="text-[12px] font-mono text-x-muted group-hover:text-x-dark/70 uppercase tracking-xai z-10">CHARACTER ARCHIVE</p>
                        <div className="mt-auto z-10">
                            <span className="inline-block border border-x-border group-hover:border-x-dark px-3 py-1 text-[10px] font-mono uppercase tracking-xai group-hover:text-x-dark text-x-white">创建/管理/导出卡片</span>
                        </div>
                    </Link>

                    {/* Template Builder */}
                    <Link 
                        to="/template-builder"
                        className="group flex flex-col text-left border border-x-border bg-transparent p-8 md:p-12 hover:bg-x-white hover:text-x-dark transition-all duration-300 relative overflow-hidden h-64"
                    >
                        <div className="absolute top-8 right-8 font-mono text-x-muted group-hover:text-x-dark/50 text-6xl opacity-20">03</div>
                        <h2 className="text-[32px] md:text-[40px] font-sans text-x-white group-hover:text-x-dark leading-none mb-4 z-10">模板开发</h2>
                        <p className="text-[12px] font-mono text-x-muted group-hover:text-x-dark/70 uppercase tracking-xai z-10">TEMPLATE ENGINE</p>
                        <div className="mt-auto z-10">
                            <span className="inline-block border border-x-border group-hover:border-x-dark px-3 py-1 text-[10px] font-mono uppercase tracking-xai group-hover:text-x-dark text-x-white">自定义规则与动态表单</span>
                        </div>
                    </Link>

                    {/* Local Dice */}
                    <button 
                        onClick={() => setForceLocalDice(true)}
                        className="group flex flex-col text-left border border-x-border bg-x-surface p-8 md:p-12 hover:bg-x-white hover:text-x-dark transition-all duration-300 relative overflow-hidden h-64"
                    >
                        <div className="absolute top-8 right-8 font-mono text-x-muted group-hover:text-x-dark/50 text-6xl opacity-20">04</div>
                        <h2 className="text-[32px] md:text-[40px] font-sans text-x-white group-hover:text-x-dark leading-none mb-4 z-10">单机骰子</h2>
                        <p className="text-[12px] font-mono text-x-muted group-hover:text-x-dark/70 uppercase tracking-xai z-10">LOCAL DICE ROLLER</p>
                        <div className="mt-auto z-10 flex gap-2">
                            <span className="inline-block border border-x-border group-hover:border-x-dark px-3 py-1 text-[10px] font-mono uppercase tracking-xai group-hover:text-x-dark text-x-white">无需联机的本地投掷</span>
                        </div>
                    </button>

                </div>

                <div className="mt-12 pt-6 border-t border-x-border flex justify-between items-center opacity-50 font-mono text-[10px] uppercase tracking-xai text-x-muted">
                    <span>X-AI / BRUTALIST UI</span>
                    <span>ALL SYSTEMS OPERATIONAL</span>
                </div>
            </div>
        </div>
    );
}
