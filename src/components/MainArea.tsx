import { useRef, useEffect } from 'react';

interface MainAreaProps {
    latestRoll: any;
    diceHistory: any[];
}

export function MainArea({ latestRoll, diceHistory }: MainAreaProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [diceHistory]);

    return (
        <main className="flex-1 flex flex-col overflow-hidden bg-[#fdf8f4]/50 relative">
            {/* Background Branding Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none overflow-hidden">
                <span className="text-[20vw] font-black uppercase rotate-12 -translate-x-1/4">BASE</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar space-y-6 relative z-10" ref={scrollRef}>
                {diceHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                        <i className="fa-solid fa-dice-d6 text-6xl mb-4 opacity-20"></i>
                        <p className="text-sm font-bold tracking-widest uppercase opacity-40">等待投掷结果初始化...</p>
                    </div>
                ) : (
                    diceHistory.map((roll, idx) => (
                        <div key={idx} className="bg-white border border-slate-100 rounded-[2rem] p-5 shadow-xl shadow-slate-200/50 animate-in slide-in-from-bottom-2 duration-300">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center shadow-inner">
                                        <i className="fa-solid fa-user-tag text-[10px] text-slate-400"></i>
                                    </div>
                                    <span className="text-xs font-black text-slate-800">{roll.userName || '未知投掷者'}</span>
                                </div>
                                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-none">
                                    {new Date(roll.timestamp).toLocaleTimeString()}
                                </span>
                            </div>

                            <div className="flex items-end gap-3 px-2">
                                <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-purple-600 drop-shadow-sm leading-none">
                                    {roll.total}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Result Formula</span>
                                    <div className="text-xs font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                                        {roll.type?.toUpperCase()} {roll.bonus > 0 ? `+ ${roll.bonus}` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {latestRoll && (
                <div className="p-6 bg-white border-t border-orange-100 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] relative z-20">
                    <div className="flex items-center gap-4 animate-in zoom-in-95 duration-200">
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden group ${latestRoll.total === 20 ? 'bg-orange-500 shadow-orange-200' : 'bg-indigo-600 shadow-indigo-200'
                            }`}>
                            <div className="absolute inset-0 bg-white/10 group-hover:translate-x-full transition-transform duration-1000"></div>
                            <span className="text-4xl font-black text-white relative z-10">{latestRoll.total}</span>
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">最新回传数据 (Latest Segment)</h4>
                            <div className="text-xl font-black text-slate-800">
                                {latestRoll.userName} 掷出了 <span className="text-indigo-600">{latestRoll.total}</span>
                            </div>
                            <p className="text-xs font-bold text-slate-400">使用骰子: {latestRoll.type?.toUpperCase()}</p>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
