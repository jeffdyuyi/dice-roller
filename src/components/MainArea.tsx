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

            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar space-y-8 relative z-10" ref={scrollRef}>
                {diceHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                        <i className="fa-solid fa-dice-d6 text-6xl mb-4 opacity-20"></i>
                        <p className="text-sm font-bold tracking-widest uppercase opacity-40">等待投掷结果初始化...</p>
                    </div>
                ) : (
                    diceHistory.map((roll, idx) => (
                        <div key={idx} className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-2xl shadow-slate-200/50 animate-in slide-in-from-bottom-2 duration-300 group">
                            <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                        <i className={`fa-solid ${roll.historyTitle === '公式' ? 'fa-calculator' : roll.historyTitle === '匕首心' ? 'fa-shield-heart' : 'fa-dice-d20'} text-[12px] text-indigo-400`}></i>
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-slate-800">{roll.userName || '未知投掷者'}</span>
                                            {roll.tag && (
                                                <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${roll.tag.bg} ${roll.tag.color} ${roll.tag.border} uppercase tracking-tight`}>
                                                    {roll.tag.text}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none">
                                            {roll.historyTitle} · {new Date(roll.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Formula</div>
                                    <div className="text-xs font-bold text-slate-400 font-mono tracking-tight">{roll.historyFormula}</div>
                                </div>
                            </div>

                            <div className="flex items-end justify-between px-2">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Segment Breakdown</span>
                                    <div className="text-sm font-bold text-slate-500 font-mono bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100/50 break-all">
                                        {roll.breakdown}
                                    </div>
                                </div>

                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Final Result</span>
                                    <div className={`text-[4rem] font-black leading-none drop-shadow-sm group-hover:scale-105 transition-transform ${roll.tag?.color.includes('green') || roll.tag?.color.includes('emerald') ? 'text-green-500' :
                                        roll.tag?.color.includes('red') ? 'text-red-500' :
                                            roll.tag?.color.includes('orange') ? 'text-orange-500' :
                                                roll.tag?.color.includes('purple') ? 'text-purple-500' :
                                                    'text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-purple-800'
                                        }`}>
                                        {roll.total}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {latestRoll && (
                <div className="p-8 bg-white/80 backdrop-blur-xl border-t border-indigo-100 shadow-[0_-15px_40px_rgba(0,0,0,0.05)] relative z-20 animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-8 group">
                        <div className={`w-28 h-28 rounded-[2rem] flex items-center justify-center shadow-2xl relative overflow-hidden transition-all duration-300 group-hover:scale-105 ${latestRoll.tag?.color.includes('emerald') ? 'bg-emerald-500 shadow-emerald-200' :
                            latestRoll.tag?.color.includes('green') ? 'bg-green-500 shadow-green-200' :
                                latestRoll.tag?.color.includes('red') ? 'bg-red-500 shadow-red-200' :
                                    latestRoll.tag?.color.includes('orange') ? 'bg-orange-500 shadow-orange-200' :
                                        latestRoll.tag?.color.includes('purple') ? 'bg-purple-600 shadow-purple-200' :
                                            'bg-gradient-to-br from-indigo-600 to-purple-700 shadow-indigo-100'
                            }`}>
                            <div className="absolute inset-0 bg-white/10 group-hover:translate-x-full transition-transform duration-1000"></div>
                            <span className="text-6xl font-black text-white relative z-10 selection:bg-white/30">{latestRoll.total}</span>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none">Synchronized Segment Data</h4>
                                {latestRoll.tag && (
                                    <span className={`text-[10px] font-black px-3 py-1 rounded-lg border shadow-sm animate-bounce ${latestRoll.tag.bg} ${latestRoll.tag.color} ${latestRoll.tag.border}`}>
                                        {latestRoll.tag.text}
                                    </span>
                                )}
                            </div>
                            <div className="text-3xl font-black text-slate-800 tracking-tight">
                                {latestRoll.userName} <span className="text-slate-400">掷出了</span> <span className="text-indigo-600">{latestRoll.total}</span>
                            </div>
                            <p className="text-sm font-bold text-slate-400 mt-2 font-mono flex items-center gap-2">
                                <i className="fa-solid fa-code text-[10px]"></i>
                                {latestRoll.historyTitle}: {latestRoll.breakdown}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
