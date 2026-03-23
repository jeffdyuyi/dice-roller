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

    const renderRollCard = (roll: any, idx: number, isLatest: boolean = false) => {
        const isDaggerheart = roll.historyTitle === '匕首心';

        return (
            <div key={idx} className={`bg-white/5 backdrop-blur-md border rounded-[2.5rem] p-8 shadow-2xl transition-all duration-500 group relative overflow-hidden ${isLatest ? 'border-amber-500 ring-4 ring-amber-500/10 scale-[1.02] z-10' : 'border-white/5 shadow-black/40'
                }`}>
                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-amber-500/10 to-transparent blur-3xl pointer-events-none -mr-24 -mt-24"></div>

                <div className="flex justify-between items-center mb-6 pb-5 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-[1.2rem] flex items-center justify-center shadow-lg transition-all duration-300 group-hover:rotate-12 group-hover:scale-110 ${isDaggerheart ? 'bg-amber-600 text-black' : 'bg-white/5 text-amber-500 border border-white/10'
                            }`}>
                            <i className={`fa-solid ${roll.historyTitle === '公式' ? 'fa-calculator' : isDaggerheart ? 'fa-shield-heart' : 'fa-dice-d20'} text-base`}></i>
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3">
                                <span className="text-base font-black text-white tracking-tight">{roll.userName || '未知投掷者'}</span>
                                {roll.tag && (
                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full border shadow-lg ${roll.tag.bg} ${roll.tag.color} ${roll.tag.border} uppercase tracking-widest`}>
                                        {roll.tag.text}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] leading-none mt-1.5 flex items-center gap-2">
                                <span className="w-1 h-1 bg-amber-500 rounded-full animate-pulse"></span>
                                {roll.historyTitle} · {new Date(roll.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-1.5 leading-none">Formula</div>
                        <div className="text-sm font-bold text-amber-500/60 font-mono bg-black/40 px-4 py-1.5 rounded-xl border border-white/5">{roll.historyFormula}</div>
                    </div>
                </div>

                <div className="flex items-center justify-between px-2 gap-8">
                    <div className="flex-1 flex flex-col gap-3 min-w-0">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] leading-none">Breakdown Analysis</span>

                        {isDaggerheart ? (
                            <div className="flex items-center gap-5">
                                <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-2.5 shadow-lg shadow-amber-900/5 transition-transform hover:scale-105">
                                    <i className="fa-solid fa-sun text-amber-500 text-sm"></i>
                                    <span className="text-base font-black text-amber-500 font-mono">{roll.hope}</span>
                                </div>
                                <div className="text-[11px] font-black text-slate-700 italic tracking-[0.2em]">VS</div>
                                <div className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl px-4 py-2.5 shadow-lg shadow-indigo-900/5 transition-transform hover:scale-105">
                                    <i className="fa-solid fa-moon text-indigo-400 text-sm"></i>
                                    <span className="text-base font-black text-indigo-400 font-mono">{roll.fear}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm font-bold text-slate-400 font-mono bg-black/20 px-5 py-3 rounded-2xl border border-white/5 break-all leading-relaxed shadow-inner">
                                {roll.breakdown}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                        <span className="text-[11px] font-black text-amber-500 uppercase tracking-[0.4em] mb-1 leading-none">Result</span>
                        <div className={`text-[5.5rem] font-black leading-none drop-shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-2 group-active:scale-95 ${roll.tag?.color.includes('green') || roll.tag?.color.includes('emerald') ? 'text-emerald-500' :
                            roll.tag?.color.includes('red') ? 'text-red-500' :
                                roll.tag?.color.includes('order-amber-600') ? 'text-amber-600' :
                                    roll.tag?.color.includes('purple') ? 'text-purple-600' :
                                        'text-transparent bg-clip-text bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700'
                            }`}>
                            {roll.total}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <main className="flex-1 flex flex-col overflow-hidden bg-[#05070a] relative">
            {/* Deep Dark Background Decor */}
            <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-indigo-950/10 rounded-full blur-[140px] -mr-[30vw] -mt-[30vw] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-amber-950/5 rounded-full blur-[120px] -ml-[25vw] -mb-[25vw] pointer-events-none"></div>

            <div className="flex-1 overflow-y-auto p-4 md:p-12 md:custom-scrollbar space-y-10 relative z-10" ref={scrollRef}>
                {diceHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-800 animate-in fade-in zoom-in duration-1000">
                        <div className="relative group">
                            <i className="fa-solid fa-dice-d20 text-[12rem] opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-500"></i>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <i className="fa-solid fa-sparkles text-4xl opacity-10 animate-pulse text-amber-600"></i>
                            </div>
                        </div>
                        <p className="text-[11px] font-black tracking-[0.8em] uppercase opacity-20 mt-12 animate-pulse">Initializing Resonance Sequence</p>
                    </div>
                ) : (
                    diceHistory.map((roll, idx) => renderRollCard(roll, idx, idx === diceHistory.length - 1))
                )}
            </div>

            {/* Premium Dark Latest Result Banner */}
            {latestRoll && (
                <div className="p-10 bg-[#0a0c14]/95 backdrop-blur-3xl border-t border-amber-900/30 shadow-[0_-20px_80px_rgba(0,0,0,0.6)] relative z-20 animate-in slide-in-from-bottom-12 duration-600">
                    <div className="max-w-5xl mx-auto flex items-center gap-14">
                        <div className={`w-36 h-36 rounded-[3rem] flex items-center justify-center shadow-2xl relative overflow-hidden transition-all duration-500 hover:scale-110 hover:-rotate-3 border-2 border-white/10 ${latestRoll.tag?.bg.includes('emerald') ? 'bg-emerald-600' :
                            latestRoll.tag?.bg.includes('green') ? 'bg-green-600' :
                                latestRoll.tag?.bg.includes('red') ? 'bg-red-600' :
                                    latestRoll.tag?.bg.includes('orange') ? 'bg-orange-600' :
                                        latestRoll.tag?.bg.includes('purple') ? 'bg-purple-700' :
                                            'bg-gradient-to-br from-amber-500 via-amber-600 to-amber-800'
                            }`}>
                            <div className="absolute inset-0 bg-white/10 opacity-20 pointer-events-none"></div>
                            <span className="text-8xl font-black text-white relative z-10 drop-shadow-[0_4px_12px_rgba(0,0,0,0.3)]">{latestRoll.total}</span>
                        </div>

                        <div className="flex-1 flex flex-col justify-center">
                            <div className="flex items-center gap-5 mb-5">
                                <span className="bg-amber-500/10 text-amber-500 text-[11px] font-black px-4 py-1.5 rounded-full border border-amber-500/20 uppercase tracking-[0.3em] leading-none shadow-lg shadow-amber-900/10">
                                    Latest Sequence Detected
                                </span>
                                {latestRoll.tag && (
                                    <span className={`text-[11px] font-black px-5 py-2 rounded-xl border shadow-2xl animate-pulse ${latestRoll.tag.bg} ${latestRoll.tag.color} ${latestRoll.tag.border} uppercase tracking-[0.1em]`}>
                                        {latestRoll.tag.text}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-baseline gap-4">
                                <span className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">{latestRoll.userName}</span>
                                <span className="text-2xl font-black text-amber-500/30 uppercase tracking-[0.2em] italic">is</span>
                                <span className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 tracking-tighter drop-shadow-xl select-none">{latestRoll.total}</span>
                            </div>

                            <div className="mt-6 flex items-center gap-4">
                                <div className="h-2 w-2 rounded-full bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.6)] animate-pulse"></div>
                                <p className="text-[12px] font-bold text-slate-500 font-mono tracking-wider leading-none uppercase flex items-center gap-3">
                                    <span className="text-amber-500/40">[{latestRoll.historyTitle}]</span>
                                    <span className="opacity-80">{latestRoll.breakdown}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
