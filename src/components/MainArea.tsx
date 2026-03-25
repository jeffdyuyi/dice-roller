import { useRef, useEffect, useState } from 'react';
import { useMqttContext } from '../contexts/MqttContext';
import { CharacterInspector } from './CharacterInspector';

interface MainAreaProps {
    latestRoll: any;
    diceHistory: any[];
}

export function MainArea({ latestRoll, diceHistory }: MainAreaProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const { activeCharacter, myId } = useMqttContext();
    const [isInspectingSelf, setInspectingSelf] = useState(false);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [diceHistory]);

    const renderRollCard = (roll: any, idx: number, isLatest: boolean = false) => {
        const isDaggerheart = roll.historyTitle === '匕首心';

        return (
            <div key={idx} className={`bg-[#141420]/80 backdrop-blur-xl border rounded-xl p-5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] transition-all duration-500 group relative overflow-hidden ${isLatest ? 'border-[#bf953f] ring-2 ring-[#bf953f]/20 scale-[1.01] z-10' : 'border-[#bf953f]/10'
                }`}>
                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-[#bf953f]/5 to-transparent blur-3xl pointer-events-none -mr-12 -mt-12"></div>

                <div className="flex justify-between items-center mb-5 pb-4 border-b border-[#bf953f]/10">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 ${isDaggerheart ? 'bg-[#bf953f] text-[#0c0c10]' : 'bg-[#1e1e30] text-[#bf953f] border border-[#bf953f]/10'
                            }`}>
                            <i className={`fa-solid ${roll.historyTitle === '公式' ? 'fa-scroll' : isDaggerheart ? 'fa-shield-heart' : 'fa-dice-d20'} text-base`}></i>
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3">
                                <span className="text-base font-black text-[#f0ead8] tracking-tight">{roll.userName || '未知领域者'}</span>
                                {roll.tag && (
                                    <span className={`text-[10px] font-black px-3 py-1 rounded-lg border shadow-lg ${roll.tag.bg} ${roll.tag.color} ${roll.tag.border} uppercase tracking-[0.2em]`}>
                                        {roll.tag.text}
                                    </span>
                                )}
                            </div>
                            <span className="text-[11px] font-black text-[#6b6250] uppercase tracking-[0.3em] leading-none mt-2 flex items-center gap-2">
                                <span className="w-1.5 h-1.5 bg-[#bf953f] rounded-full animate-pulse shadow-[0_0_8px_rgba(191,149,63,0.6)]"></span>
                                {roll.historyTitle} · {new Date(roll.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-black text-[#6b6250] uppercase tracking-[0.4em] mb-2 leading-none">操作指令</div>
                        <div className="text-sm font-bold text-[#bf953f]/80 font-mono bg-[#0c0c10]/60 px-5 py-2 rounded-lg border border-[#bf953f]/10 shadow-inner group-hover:border-[#bf953f]/40 transition-colors">{roll.historyFormula}</div>
                    </div>
                </div>

                <div className="flex items-center justify-between px-2 gap-10">
                    <div className="flex-1 flex flex-col gap-4 min-w-0">
                        <span className="text-[10px] font-black text-[#6b6250] uppercase tracking-[0.4em] leading-none">掷骰详情分析</span>

                        {isDaggerheart ? (
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-4 bg-[#bf953f]/5 border border-[#bf953f]/20 rounded-xl px-5 py-3 shadow-xl transition-all hover:bg-[#bf953f]/10">
                                    <i className="fa-solid fa-sun text-[#bf953f] text-base"></i>
                                    <span className="text-xl font-black text-[#bf953f] font-mono">{roll.hope}</span>
                                </div>
                                <div className="text-[12px] font-black text-[#6b6250] italic tracking-[0.3em]">VS</div>
                                <div className="flex items-center gap-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl px-5 py-3 shadow-xl transition-all hover:bg-indigo-500/10">
                                    <i className="fa-solid fa-moon text-indigo-400 text-base"></i>
                                    <span className="text-xl font-black text-indigo-400 font-mono">{roll.fear}</span>
                                </div>
                                {roll.advDice && (
                                    <>
                                        <div className="text-[12px] font-black text-[#6b6250] italic tracking-[0.3em]">{roll.advType === 'advantage' ? '+' : '-'}</div>
                                        <div className={`flex items-center gap-4 border rounded-xl px-5 py-3 shadow-xl transition-all ${roll.advType === 'advantage' ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10' : 'bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10'}`}>
                                            <i className={`fa-solid fa-dice-d6 ${roll.advType === 'advantage' ? 'text-emerald-400' : 'text-rose-400'} text-base`}></i>
                                            <span className={`text-xl font-black ${roll.advType === 'advantage' ? 'text-emerald-400' : 'text-rose-400'} font-mono`}>{roll.advDice}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="text-[15px] font-bold text-[#a89b7a] font-mono bg-[#0c0c10]/40 px-6 py-4 rounded-xl border border-[#bf953f]/5 break-all leading-relaxed shadow-inner group-hover:border-[#bf953f]/10 transition-colors">
                                {roll.breakdown}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                        <span className="text-[10px] font-black text-[#bf953f] uppercase tracking-[0.5em] mb-1 leading-none opacity-60">结果</span>
                        <div className={`text-5xl font-black leading-none drop-shadow-[0_10px_30px_rgba(0,0,0,0.8)] transition-all duration-700 group-hover:scale-105 group-hover:-rotate-3 ${roll.tag?.color.includes('green') || roll.tag?.color.includes('emerald') ? 'text-emerald-500' :
                            roll.tag?.color.includes('red') ? 'text-red-500' :
                                roll.tag?.color.includes('order-[#bf953f]') ? 'text-[#bf953f]' :
                                    roll.tag?.color.includes('order-emerald-500') ? 'text-emerald-500' :
                                        roll.tag?.color.includes('order-red-500') ? 'text-red-500' :
                                            'text-[#6b6250]'
                            }`}>
                            {roll.total}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <main className="flex-1 flex flex-col overflow-hidden bg-[#0c0c10] relative">
            {/* Deep Dark Background Decor */}
            <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-amber-900/5 rounded-full blur-[140px] -mr-[30vw] -mt-[30vw] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-indigo-950/5 rounded-full blur-[120px] -ml-[25vw] -mb-[25vw] pointer-events-none"></div>

            <div className="flex-1 overflow-y-auto p-4 md:p-12 md:custom-scrollbar space-y-12 relative z-10" ref={scrollRef}>
                {diceHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center animate-in fade-in zoom-in duration-1000">
                        <div className="relative group">
                            <i className="fa-solid fa-dice-d20 text-[14rem] opacity-[0.05] text-[#bf953f] transition-all duration-700 group-hover:opacity-[0.1] group-hover:rotate-12 group-hover:scale-110"></i>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <i className="fa-solid fa-sparkles text-5xl opacity-20 animate-pulse text-[#bf953f]"></i>
                            </div>
                        </div>
                        <p className="text-[12px] font-black text-[#bf953f] tracking-[1em] uppercase opacity-20 mt-16 animate-pulse leading-none">空灵待机中</p>
                    </div>
                ) : (
                    diceHistory.map((roll, idx) => renderRollCard(roll, idx, idx === diceHistory.length - 1))
                )}
            </div>

            {/* Premium Latest Result Banner - Style Guide: bg-panel */}
            {latestRoll && (
                <div className="p-6 md:p-8 bg-[#18182a]/95 backdrop-blur-3xl border-t border-[#bf953f]/30 shadow-[0_-20px_100px_rgba(0,0,0,0.8)] relative z-20 animate-in slide-in-from-bottom-20 duration-700">
                    <div className="max-w-6xl mx-auto flex items-center gap-10">
                        <div className={`w-32 h-32 rounded-[2rem] flex items-center justify-center shadow-[0_15px_60px_rgba(0,0,0,0.6)] relative overflow-hidden transition-all duration-700 hover:scale-110 hover:-rotate-3 border border-[#fcf6ba]/20 ${latestRoll.tag?.bg.includes('emerald') ? 'bg-emerald-600' :
                            latestRoll.tag?.bg.includes('green') ? 'bg-green-600' :
                                latestRoll.tag?.bg.includes('red') ? 'bg-red-600' :
                                    latestRoll.tag?.bg.includes('orange') ? 'bg-orange-600' :
                                        latestRoll.tag?.bg.includes('purple') ? 'bg-purple-700' :
                                            'bg-gradient-to-br from-[#bf953f] via-[#aa771c] to-[#0c0c10]'
                            }`}>
                            <div className="absolute inset-0 bg-white/10 opacity-20 pointer-events-none"></div>
                            <span className="text-6xl font-black text-[#0c0c10] relative z-10 drop-shadow-md drop-shadow-black/20">{latestRoll.total}</span>
                            <div className="absolute inset-0 gold-glow opacity-30"></div>
                        </div>

                        <div className="flex-1 flex flex-col justify-center">
                            <div className="flex items-center gap-6 mb-6">
                                <span className="bg-[#bf953f]/10 text-[#bf953f] text-[11px] font-black px-5 py-2 rounded-lg border border-[#bf953f]/30 uppercase tracking-[0.4em] leading-none shadow-xl shadow-black/20">
                                    检测到最新掷骰结果
                                </span>
                                {latestRoll.tag && (
                                    <span className={`text-[12px] font-black px-6 py-2.5 rounded-lg border shadow-2xl animate-pulse ${latestRoll.tag.bg} ${latestRoll.tag.color} ${latestRoll.tag.border} uppercase tracking-[0.2em] shadow-black/40`}>
                                        {latestRoll.tag.text}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-baseline gap-5">
                                <span className="text-3xl font-black text-[#f0ead8] tracking-tighter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">{latestRoll.userName}</span>
                                <span className="text-lg font-black text-[#6b6250] uppercase tracking-[0.3em] italic opacity-40">掷出了</span>
                                <span className="text-5xl font-black golden-text tracking-tighter drop-shadow-[0_10px_40px_rgba(0,0,0,0.8)] select-none leading-none">{latestRoll.total}</span>
                            </div>

                            <div className="mt-8 flex items-center gap-5">
                                <div className="h-2.5 w-2.5 rounded-full bg-[#bf953f] shadow-[0_0_15px_rgba(191,149,63,0.8)] animate-pulse"></div>
                                <p className="text-[13px] font-black text-[#a89b7a] font-mono tracking-widest leading-none uppercase flex items-center gap-4">
                                    <span className="text-[#bf953f]/60 opacity-80 decoration-[#bf953f] underline underline-offset-8">[{latestRoll.historyTitle}]</span>
                                    <span className="text-[#f0ead8]/80">{latestRoll.breakdown}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Character HUD */}
            {activeCharacter && (
                <div className="absolute top-6 left-6 z-[30] animate-in slide-in-from-left-10 duration-700">
                    <div className="group relative flex items-center gap-4 bg-[#141420]/60 backdrop-blur-3xl border border-[#bf953f]/30 rounded-2xl p-1.5 pr-6 shadow-2xl hover:bg-[#1e1e30]/80 transition-all cursor-pointer"
                        onClick={() => setInspectingSelf(true)}>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#bf953f] to-[#aa771c] shadow-lg flex items-center justify-center text-[#0c0c10] overflow-hidden">
                            {activeCharacter.avatarUrl ? (
                                <img src={activeCharacter.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <i className="fa-solid fa-user-shield text-xl"></i>
                            )}
                        </div>

                        <div className="flex flex-col">
                            <span className="text-xs font-black text-[#f0ead8] tracking-tight truncate max-w-[120px]">{activeCharacter.name}</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[8px] font-black text-[#6b6250] uppercase tracking-widest">{activeCharacter.characterData.class || '冒险者'}</span>
                                {activeCharacter.characterData.hp && (
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                            <div
                                                className="h-full bg-gradient-to-r from-red-500 to-rose-500 transition-all duration-500"
                                                style={{ width: `${(activeCharacter.characterData.hp.current / activeCharacter.characterData.hp.max) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-[8px] font-black text-red-500/80">{activeCharacter.characterData.hp.current}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Hover Tooltip */}
                        <div className="absolute -bottom-8 left-0 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap">
                            <span className="text-[7px] font-black text-[#bf953f] uppercase tracking-[0.2em] bg-black/80 px-2 py-1 rounded-md border border-[#bf953f]/20 shadow-xl">点击查看详细资料</span>
                        </div>
                    </div>
                </div>
            )}

            {isInspectingSelf && myId && (
                <CharacterInspector
                    playerId={myId}
                    onClose={() => setInspectingSelf(false)}
                />
            )}
        </main>
    );
}
