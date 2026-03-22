import React from 'react';

interface MainAreaProps {
    latestRoll: any;
    diceHistory: any[];
    onClearHistory: () => void;
}

export function MainArea({ latestRoll, diceHistory, onClearHistory }: MainAreaProps) {
    return (
        <div className="flex-1 flex flex-col bg-slate-900 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/2"></div>

            {/* HERO RESULT AREA */}
            <div className="h-[55%] md:h-[40%] min-h-[160px] md:min-h-[250px] shrink-0 flex flex-col items-center justify-center relative border-b border-slate-800 z-10 transition-colors duration-500">
                {!latestRoll ? (
                    <div className="text-slate-600 text-sm font-mono animate-pulse">等待投掷...</div>
                ) : (
                    <div className="flex flex-col items-center text-center w-full px-4">
                        <div className="text-xs md:text-sm font-bold tracking-[0.2em] text-slate-400 mb-1 md:mb-2 uppercase">
                            {latestRoll.historyTitle || (latestRoll.isLocal ? "本地投掷" : `来自 ${latestRoll.senderName}`)}
                        </div>

                        <div className="relative group cursor-default">
                            <div
                                key={latestRoll.timestamp}
                                className={`text-[5rem] md:text-[8rem] leading-none font-black drop-shadow-2xl result-enter select-all transition-colors duration-300 ${latestRoll.tag?.color || 'text-white'}`}
                            >
                                {latestRoll.total}
                            </div>
                            <div className="absolute -right-6 md:-right-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] md:text-xs text-slate-500 vertical-lr" style={{ writingMode: 'vertical-lr' }}>总计</div>
                        </div>

                        {latestRoll.tag && (
                            <div className={`mt-2 md:mt-4 px-3 md:px-4 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-bold uppercase tracking-widest border backdrop-blur-md shadow-lg transform transition-all duration-300 hover:scale-105 ${latestRoll.tag.color} ${latestRoll.tag.bg} ${latestRoll.tag.border}`}>
                                {latestRoll.tag.text}
                            </div>
                        )}

                        <div
                            className="mt-3 md:mt-6 text-slate-500 font-mono text-xs md:text-sm bg-slate-900/50 px-3 md:px-4 py-1.5 md:py-2 rounded-lg border border-slate-800/50"
                            dangerouslySetInnerHTML={{ __html: latestRoll.breakdownHTML || latestRoll.breakdown }}
                        />
                    </div>
                )}
            </div>

            {/* HISTORY LIST */}
            <div className="flex-1 overflow-y-auto bg-slate-900/50 relative">
                <div className="sticky top-0 bg-slate-900/95 backdrop-blur border-b border-slate-800 p-3 flex justify-between items-center z-10">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-2">
                        <i className="fa-solid fa-clock-rotate-left mr-2"></i> 历史记录
                    </h3>
                    <button onClick={onClearHistory} className="text-[10px] text-slate-600 hover:text-red-400 transition uppercase font-bold tracking-wider px-2">清除</button>
                </div>

                <ul className="p-4 space-y-3 pb-20">
                    {diceHistory.length === 0 ? (
                        <div className="text-center text-slate-600 py-8 italic text-xs">暂无记录</div>
                    ) : diceHistory.map((item, idx) => (
                        <li key={item.timestamp + idx} className="flex items-start gap-4 p-4 bg-slate-800 rounded-xl border border-slate-700/50 hover:border-indigo-500/30 transition result-enter">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                                            {item.historyTitle} | {item.senderName || "我"}
                                        </span>
                                        {item.tag && <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${item.tag.bg} ${item.tag.color} border ${item.tag.border} ml-2`}>{item.tag.text}</span>}
                                    </div>
                                    <span className="text-xs text-slate-600 font-mono">{new Date(item.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div className="text-sm text-slate-300 font-mono break-all">{item.historyFormula || item.formulaStr}</div>
                                <div className="text-xs text-slate-500 break-all mt-0.5" dangerouslySetInnerHTML={{ __html: item.breakdownHTML || item.breakdown }} />
                            </div>
                            <div className={`text-3xl font-bold pl-4 border-l border-slate-700/50 flex items-center h-full ${item.tag?.color || 'text-white'}`}>
                                {item.total}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
