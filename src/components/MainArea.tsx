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
            <div key={idx} className={`bg-transparent border p-6 transition-all duration-500 relative ${isLatest ? 'border-x-white z-10' : 'border-x-border'
                }`}>
                <div className="flex justify-between items-center mb-5 pb-4 border-b border-x-border">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 flex items-center justify-center border border-x-border ${isDaggerheart ? 'bg-x-white text-x-dark' : 'bg-transparent text-x-white'
                            }`}>
                            <span className="font-mono text-xl">{roll.historyTitle === '公式' ? 'F' : isDaggerheart ? 'H' : 'D'}</span>
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3">
                                <span className="text-[16px] font-sans text-x-white">{roll.userName || '未知领域者'}</span>
                                {roll.tag && (
                                    <span className={`text-[10px] font-mono border border-x-border px-2 py-1 uppercase tracking-xai text-x-white`}>
                                        {roll.tag.text}
                                    </span>
                                )}
                            </div>
                            <span className="text-[12px] font-mono text-x-muted uppercase tracking-xai mt-2 flex items-center gap-2">
                                {roll.historyTitle} · {new Date(roll.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[12px] font-mono text-x-muted uppercase tracking-xai mb-2 leading-none">操作指令</div>
                        <div className="text-[14px] font-mono text-x-white px-4 py-2 border border-x-border bg-x-surface">{roll.historyFormula}</div>
                    </div>
                </div>

                <div className="flex items-center justify-between px-2 gap-10">
                    <div className="flex-1 flex flex-col gap-4 min-w-0">
                        <span className="text-[12px] font-mono text-x-muted uppercase tracking-xai leading-none">掷骰详情分析</span>

                        {isDaggerheart ? (
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-4 border border-x-border px-5 py-3 text-x-white">
                                    <span className="text-[14px] font-mono tracking-xai uppercase">希望</span>
                                    <span className="text-[20px] font-mono">{roll.hope}</span>
                                </div>
                                <div className="text-[14px] font-mono text-x-muted tracking-xai">VS</div>
                                <div className="flex items-center gap-4 border border-x-border px-5 py-3 text-x-muted">
                                    <span className="text-[14px] font-mono tracking-xai uppercase">恐惧</span>
                                    <span className="text-[20px] font-mono">{roll.fear}</span>
                                </div>
                                {roll.advDice && (
                                    <>
                                        <div className="text-[14px] font-mono text-x-muted tracking-xai">{roll.advType === 'advantage' ? '+' : '-'}</div>
                                        <div className={`flex items-center gap-4 border border-x-border px-5 py-3 ${roll.advType === 'advantage' ? 'text-x-white' : 'text-x-muted'}`}>
                                            <span className="text-[14px] font-mono tracking-xai uppercase">{roll.advType === 'advantage' ? '优势' : '劣势'}</span>
                                            <span className={`text-[20px] font-mono`}>{roll.advDice}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="text-[16px] font-mono text-x-white px-6 py-4 border border-x-border break-all leading-relaxed bg-x-surface">
                                {roll.breakdown}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-end shrink-0">
                        <span className="text-[12px] font-mono text-x-muted uppercase tracking-xai mb-2">结果</span>
                        <div className="text-[48px] font-mono text-x-white leading-none">
                            {roll.total}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <main className="flex-1 flex flex-col overflow-hidden bg-x-dark relative">
            <div className="flex-1 overflow-y-auto p-4 md:p-12 md:custom-scrollbar space-y-12 relative z-10" ref={scrollRef}>
                {diceHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center animate-in fade-in zoom-in duration-1000">
                        <span className="font-mono text-x-muted text-[48px] opacity-20">_</span>
                        <p className="text-[12px] font-mono text-x-muted tracking-xai uppercase mt-8 opacity-50">待机中 / WAITING</p>
                    </div>
                ) : (
                    diceHistory.map((roll, idx) => renderRollCard(roll, idx, idx === diceHistory.length - 1))
                )}
            </div>

            {/* Premium Latest Result Banner - Style Guide: bg-panel */}
            {latestRoll && (
                <div className="p-6 md:p-8 bg-x-dark border-t border-x-border relative z-20">
                    <div className="max-w-6xl mx-auto flex items-center gap-10">
                        <div className={`w-32 h-32 flex items-center justify-center border border-x-border bg-x-surface`}>
                            <span className="text-[64px] font-mono text-x-white">{latestRoll.total}</span>
                        </div>

                        <div className="flex-1 flex flex-col justify-center">
                            <div className="flex items-center gap-6 mb-4">
                                <span className="border border-x-border text-x-white text-[12px] font-mono px-4 py-2 uppercase tracking-xai">
                                    最新结果
                                </span>
                                {latestRoll.tag && (
                                    <span className={`text-[12px] font-mono border border-x-borderStrong px-4 py-2 text-x-white uppercase tracking-xai`}>
                                        {latestRoll.tag.text}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-baseline gap-5">
                                <span className="text-[30px] font-sans text-x-white">{latestRoll.userName}</span>
                                <span className="text-[16px] font-sans text-x-muted">掷出了</span>
                                <span className="text-[48px] font-mono text-x-white leading-none">{latestRoll.total}</span>
                            </div>

                            <div className="mt-6 flex items-center gap-5">
                                <p className="text-[14px] font-mono text-x-muted tracking-xai uppercase flex items-center gap-4">
                                    <span className="text-x-white border-b border-x-borderStrong pb-0.5">[{latestRoll.historyTitle}]</span>
                                    <span>{latestRoll.breakdown}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Character HUD */}
            {activeCharacter && (
                <div className="absolute top-6 left-6 z-[30]">
                    <div className="group relative flex items-center gap-4 bg-x-dark border border-x-border p-2 pr-6 hover:border-x-borderStrong transition-all cursor-pointer"
                        onClick={() => setInspectingSelf(true)}>
                        <div className="w-10 h-10 border border-x-border bg-x-surface flex items-center justify-center text-x-white overflow-hidden">
                            {activeCharacter.avatarUrl ? (
                                <img src={activeCharacter.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="font-mono">P</span>
                            )}
                        </div>

                        <div className="flex flex-col">
                            <span className="text-[14px] font-sans text-x-white truncate max-w-[120px]">{activeCharacter.name}</span>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-mono text-x-muted tracking-xai uppercase">{activeCharacter.characterData.class || '冒险者'}</span>
                                {activeCharacter.characterData.hp && (
                                    <span className="text-[10px] font-mono text-x-white tracking-xai">HP {activeCharacter.characterData.hp.current}</span>
                                )}
                            </div>
                        </div>

                        {/* Hover Tooltip */}
                        <div className="absolute -bottom-8 left-0 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap">
                            <span className="text-[10px] font-mono text-x-white uppercase tracking-xai bg-x-dark px-2 py-1 border border-x-border">点击查看资料</span>
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
