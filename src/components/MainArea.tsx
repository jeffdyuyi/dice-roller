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
            <div key={idx} className={`bg-white border rounded-[2.5rem] p-6 shadow-2xl transition-all duration-300 group relative overflow-hidden ${isLatest ? 'border-indigo-200 ring-4 ring-indigo-50/50 scale-[1.02] z-10' : 'border-slate-100 shadow-slate-200/50'
                }`}>
                {/* Decorative background for Daggerheart */}
                {isDaggerheart && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-50/50 to-purple-50/50 blur-3xl pointer-events-none -mr-16 -mt-16"></div>
                )}

                <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-50">
                    <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:rotate-12 ${isDaggerheart ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-indigo-400'
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
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mt-0.5">
                                {roll.historyTitle} · {new Date(roll.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Formula</div>
                        <div className="text-xs font-bold text-slate-400 font-mono bg-slate-50 px-3 py-1 rounded-lg border border-slate-100/50">{roll.historyFormula}</div>
                    </div>
                </div>

                <div className="flex items-center justify-between px-2 gap-6">
                    <div className="flex-1 flex flex-col gap-2 min-w-0">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Breakdown Analysis</span>

                        {isDaggerheart ? (
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2">
                                    <i className="fa-solid fa-sun text-orange-400 text-xs"></i>
                                    <span className="text-sm font-black text-orange-600 font-mono">{roll.hope}</span>
                                </div>
                                <div className="text-[10px] font-black text-slate-200">VS</div>
                                <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl px-3 py-2">
                                    <i className="fa-solid fa-moon text-purple-400 text-xs"></i>
                                    <span className="text-sm font-black text-purple-600 font-mono">{roll.fear}</span>
                                </div>
                                {roll.historyFormula.includes('+') || roll.historyFormula.includes('-') ? (
                                    <div className="text-sm font-bold text-slate-400 font-mono">
                                        + Mod
                                    </div>
                                ) : null}
                            </div>
                        ) : (
                            <div className="text-sm font-bold text-slate-500 font-mono bg-slate-50/80 px-4 py-2.5 rounded-2xl border border-slate-100/50 break-all leading-relaxed">
                                {roll.breakdown}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Result</span>
                        <div className={`text-[4.5rem] font-black leading-none drop-shadow-md transition-transform group-hover:scale-110 group-active:scale-95 ${roll.tag?.color.includes('green') || roll.tag?.color.includes('emerald') ? 'text-emerald-500' :
                                roll.tag?.color.includes('red') ? 'text-red-500' :
                                    roll.tag?.color.includes('orange') ? 'text-orange-500' :
                                        roll.tag?.color.includes('purple') ? 'text-purple-600' :
                                            'text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 to-purple-800'
                            }`}>
                            {roll.total}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <main className="flex-1 flex flex-col overflow-hidden bg-[#fdfaf8] relative">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-indigo-50/20 rounded-full blur-[120px] -mr-[25vw] -mt-[25vw] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-orange-50/20 rounded-full blur-[100px] -ml-[20vw] -mb-[20vw] pointer-events-none"></div>

            <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar space-y-10 relative z-10" ref={scrollRef}>
                {diceHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-200 animate-in fade-in duration-700">
                        <div className="relative">
                            <i className="fa-solid fa-dice-d20 text-[10rem] opacity-[0.05]"></i>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <i className="fa-solid fa-sparkles text-3xl opacity-20 animate-pulse"></i>
                            </div>
                        </div>
                        <p className="text-sm font-black tracking-[0.5em] uppercase opacity-30 mt-8">等待时空共鸣 Initializing...</p>
                    </div>
                ) : (
                    diceHistory.map((roll, idx) => renderRollCard(roll, idx))
                )}
            </div>

            {/* Latest Result Banner */}
            {latestRoll && (
                <div className="p-8 bg-white/90 backdrop-blur-2xl border-t border-indigo-100 shadow-[0_-20px_50px_rgba(0,0,0,0.08)] relative z-20 animate-in slide-in-from-bottom-6 duration-500 ease-out">
                    <div className="max-w-4xl mx-auto flex items-center gap-10">
                        <div className={`w-32 h-32 rounded-[2.5rem] flex items-center justify-center shadow-2xl relative overflow-hidden transition-all duration-500 hover:scale-110 active:scale-95 ${latestRoll.tag?.color.includes('emerald') ? 'bg-emerald-500 shadow-emerald-200' :
                                latestRoll.tag?.color.includes('green') ? 'bg-green-500 shadow-green-200' :
                                    latestRoll.tag?.color.includes('red') ? 'bg-red-500 shadow-red-200' :
                                        latestRoll.tag?.color.includes('orange') ? 'bg-orange-500 shadow-orange-200' :
                                            latestRoll.tag?.color.includes('purple') ? 'bg-purple-600 shadow-purple-200' :
                                                'bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 shadow-indigo-100'
                            }`}>
                            <div className="absolute inset-0 bg-white/10 group-hover:translate-x-full transition-transform duration-1000"></div>
                            <span className="text-7xl font-black text-white relative z-10 drop-shadow-lg">{latestRoll.total}</span>
                        </div>

                        <div className="flex-1 flex flex-col justify-center">
                            <div className="flex items-center gap-4 mb-3">
                                <span className="bg-indigo-50 text-indigo-500 text-[10px] font-black px-3 py-1 rounded-full border border-indigo-100 uppercase tracking-widest">
                                    Latest Roll Result
                                </span>
                                {latestRoll.tag && (
                                    <span className={`text-[10px] font-black px-4 py-1.5 rounded-xl border shadow-md animate-pulse ${latestRoll.tag.bg} ${latestRoll.tag.color} ${latestRoll.tag.border} uppercase`}>
                                        {latestRoll.tag.text}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-baseline gap-3">
                                <span className="text-4xl font-black text-slate-800 tracking-tighter">{latestRoll.userName}</span>
                                <span className="text-xl font-bold text-slate-400">掷出了</span>
                                <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tighter">{latestRoll.total}</span>
                            </div>

                            <div className="mt-4 flex items-center gap-3">
                                <div className="h-2 w-2 rounded-full bg-indigo-500 animate-ping"></div>
                                <p className="text-sm font-bold text-slate-400 font-mono tracking-wide">
                                    <span className="text-slate-300 mr-2">[{latestRoll.historyTitle}]</span>
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
