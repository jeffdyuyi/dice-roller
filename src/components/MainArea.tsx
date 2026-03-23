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
            <div key={idx} className={`bg-white border rounded-[2.5rem] p-6 shadow-xl transition-all duration-300 group relative overflow-hidden ${isLatest ? 'border-amber-400 ring-4 ring-amber-50/50 scale-[1.01] z-10' : 'border-amber-50/50 shadow-amber-900/5'
                }`}>
                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-50/30 to-orange-50/30 blur-3xl pointer-events-none -mr-16 -mt-16"></div>

                <div className="flex justify-between items-center mb-5 pb-4 border-b border-amber-50/50">
                    <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:rotate-12 ${isDaggerheart ? 'bg-orange-600 text-white' : 'bg-amber-50 text-amber-500'
                            }`}>
                            <i className={`fa-solid ${roll.historyTitle === '公式' ? 'fa-calculator' : isDaggerheart ? 'fa-shield-heart' : 'fa-dice-d20'} text-sm`}></i>
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-black text-slate-800 tracking-tight">{roll.userName || '未知投掷者'}</span>
                                {roll.tag && (
                                    <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border shadow-sm ${roll.tag.bg} ${roll.tag.color} ${roll.tag.border} uppercase tracking-tight`}>
                                        {roll.tag.text}
                                    </span>
                                )}
                            </div>
                            <span className="text-[9px] font-black text-amber-500/40 uppercase tracking-widest leading-none mt-0.5">
                                {roll.historyTitle} · {new Date(roll.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[9px] font-black text-amber-400/40 uppercase tracking-[0.2em] mb-1 leading-none">Formula</div>
                        <div className="text-xs font-bold text-slate-400 font-mono bg-amber-50/30 px-3 py-1 rounded-lg border border-amber-100/50">{roll.historyFormula}</div>
                    </div>
                </div>

                <div className="flex items-center justify-between px-2 gap-6">
                    <div className="flex-1 flex flex-col gap-2 min-w-0">
                        <span className="text-[9px] font-black text-amber-500/40 uppercase tracking-[0.2em] leading-none">Breakdown Analysis</span>

                        {isDaggerheart ? (
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                                    <i className="fa-solid fa-sun text-amber-500 text-xs"></i>
                                    <span className="text-sm font-black text-amber-700 font-mono">{roll.hope}</span>
                                </div>
                                <div className="text-[10px] font-black text-amber-200 italic">VS</div>
                                <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
                                    <i className="fa-solid fa-moon text-indigo-400 text-xs"></i>
                                    <span className="text-sm font-black text-indigo-700 font-mono">{roll.fear}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-xs font-bold text-slate-500 font-mono bg-amber-50/20 px-4 py-2.5 rounded-2xl border border-amber-50/50 break-all leading-relaxed">
                                {roll.breakdown}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                        <span className="text-[10px] font-black text-amber-300 uppercase tracking-[0.2em] mb-1 leading-none">Total</span>
                        <div className={`text-[4.5rem] font-black leading-none drop-shadow-sm transition-transform group-hover:scale-110 group-active:scale-95 ${roll.tag?.color.includes('green') || roll.tag?.color.includes('emerald') ? 'text-emerald-500' :
                            roll.tag?.color.includes('red') ? 'text-red-500' :
                                roll.tag?.color.includes('orange') ? 'text-orange-600' :
                                    roll.tag?.color.includes('purple') ? 'text-purple-600' :
                                        'text-transparent bg-clip-text bg-gradient-to-br from-amber-500 to-orange-600'
                            }`}>
                            {roll.total}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <main className="flex-1 flex flex-col overflow-hidden bg-[#fffdfa] relative">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-amber-50/30 rounded-full blur-[120px] -mr-[25vw] -mt-[25vw] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-orange-50/20 rounded-full blur-[100px] -ml-[20vw] -mb-[20vw] pointer-events-none"></div>

            <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar space-y-8 relative z-10" ref={scrollRef}>
                {diceHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-amber-100 animate-in fade-in duration-1000">
                        <div className="relative">
                            <i className="fa-solid fa-dice-d20 text-[10rem] opacity-[0.05]"></i>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <i className="fa-solid fa-sparkles text-3xl opacity-20 animate-pulse text-amber-400"></i>
                            </div>
                        </div>
                        <p className="text-[10px] font-black tracking-[0.6em] uppercase opacity-40 mt-10">等待时空共鸣 Initializing Resonance</p>
                    </div>
                ) : (
                    diceHistory.map((roll, idx) => renderRollCard(roll, idx, idx === diceHistory.length - 1))
                )}
            </div>

            {/* Latest Result Banner - Warm Redesign */}
            {latestRoll && (
                <div className="p-8 bg-white/95 backdrop-blur-2xl border-t border-amber-100 shadow-[0_-15px_60px_rgba(251,191,36,0.1)] relative z-20 animate-in slide-in-from-bottom-8 duration-500">
                    <div className="max-w-4xl mx-auto flex items-center gap-10">
                        <div className={`w-32 h-32 rounded-[2.8rem] flex items-center justify-center shadow-2xl relative overflow-hidden transition-all duration-500 hover:scale-110 ${latestRoll.tag?.bg.includes('emerald') ? 'bg-emerald-500' :
                            latestRoll.tag?.bg.includes('green') ? 'bg-green-500' :
                                latestRoll.tag?.bg.includes('red') ? 'bg-red-500' :
                                    latestRoll.tag?.bg.includes('orange') ? 'bg-orange-500' :
                                        latestRoll.tag?.bg.includes('purple') ? 'bg-purple-600' :
                                            'bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600'
                            }`}>
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100"></div>
                            <span className="text-7xl font-black text-white relative z-10 drop-shadow-xl">{latestRoll.total}</span>
                        </div>

                        <div className="flex-1 flex flex-col justify-center">
                            <div className="flex items-center gap-4 mb-3">
                                <span className="bg-amber-50 text-amber-600 text-[10px] font-black px-3 py-1 rounded-full border border-amber-200 uppercase tracking-widest leading-none">
                                    Latest Sequence Detected
                                </span>
                                {latestRoll.tag && (
                                    <span className={`text-[10px] font-black px-4 py-1.5 rounded-xl border shadow-md animate-pulse ${latestRoll.tag.bg} ${latestRoll.tag.color} ${latestRoll.tag.border} uppercase`}>
                                        {latestRoll.tag.text}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-baseline gap-3">
                                <span className="text-4xl font-black text-slate-800 tracking-tighter">{latestRoll.userName}</span>
                                <span className="text-xl font-bold text-amber-300">RESULT IS</span>
                                <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600 tracking-tighter">{latestRoll.total}</span>
                            </div>

                            <div className="mt-4 flex items-center gap-3">
                                <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-ping"></div>
                                <p className="text-[11px] font-bold text-slate-400 font-mono tracking-wide leading-none uppercase">
                                    <span className="text-amber-200 mr-2">[{latestRoll.historyTitle}]</span>
                                    {latestRoll.breakdown}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
