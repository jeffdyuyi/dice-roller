import { useRef, useEffect, useState } from 'react';
import { useMqttContext } from '../contexts/MqttContext';
import { CharacterInspector } from './CharacterInspector';

interface MainAreaProps {
    diceHistory: any[];
}

export function MainArea({ diceHistory }: MainAreaProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const { activeCharacter, myId, sendChatMessage, commState } = useMqttContext();
    const [isInspectingSelf, setInspectingSelf] = useState(false);
    const [chatInput, setChatInput] = useState('');

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [diceHistory]);

    const handleSendChat = () => {
        if (!chatInput.trim()) return;
        sendChatMessage(chatInput.trim());
        setChatInput('');
    };

    const renderRollCard = (roll: any, idx: number, isLatest: boolean = false) => {
        if (roll.type === 'chat') {
            return (
                <div key={idx} className="flex flex-col mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-[14px] font-sans text-x-white">{roll.userName}</span>
                        <span className="text-[10px] font-mono text-x-muted tracking-xai uppercase">
                            {new Date(roll.timestamp).toLocaleTimeString()}
                        </span>
                    </div>
                    <div className="bg-x-surface border border-x-border px-4 py-3 text-[14px] font-sans text-x-white leading-relaxed inline-block max-w-[85%]">
                        {roll.text}
                    </div>
                </div>
            );
        }

        const isDaggerheart = roll.historyTitle === '匕首心';

        return (
            <div key={idx} className={`flex flex-col mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300 ${isLatest ? 'opacity-100' : 'opacity-80 hover:opacity-100 transition-opacity'}`}>
                <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-[14px] font-sans text-x-white">{roll.userName || '未知领域者'}</span>
                    <span className="text-[10px] font-mono text-x-muted tracking-xai uppercase">
                        {new Date(roll.timestamp).toLocaleTimeString()}
                    </span>
                    {roll.tag && (
                        <span className="text-[10px] font-mono border border-x-border px-1.5 py-0.5 uppercase tracking-xai text-x-white ml-2">
                            {roll.tag.text}
                        </span>
                    )}
                    {roll.isHidden && (
                        <span className="text-[10px] font-mono bg-x-white text-x-dark px-1.5 py-0.5 uppercase tracking-xai ml-2">
                            暗骰
                        </span>
                    )}
                </div>
                
                <div className="bg-transparent border border-x-border p-3 inline-flex flex-wrap items-center gap-4 max-w-[85%]">
                    <div className="flex flex-col min-w-[80px]">
                        <span className="text-[10px] font-mono text-x-muted uppercase tracking-xai mb-0.5">{roll.historyTitle || '系统判定'}</span>
                        <span className="text-[14px] font-mono text-x-white bg-x-surface px-2 py-0.5 border border-x-border inline-block w-fit">{roll.historyFormula}</span>
                    </div>
                    
                    <div className="hidden sm:block h-8 w-px bg-x-border"></div>
                    
                    <div className="flex items-center gap-3 flex-1 min-w-[150px]">
                        {isDaggerheart ? (
                            <span className="text-[12px] font-mono text-x-muted">
                                希 <span className="text-x-white">{roll.hope}</span> / 惧 <span className="text-x-white">{roll.fear}</span>
                                {roll.advDice && ` / ${roll.advType === 'advantage' ? '+' : '-'}${roll.advDice}`}
                            </span>
                        ) : (
                            <span className="text-[12px] font-mono text-x-muted truncate max-w-[250px]" title={roll.breakdown}>
                                {roll.breakdown}
                            </span>
                        )}
                        <span className="text-[24px] font-mono text-x-white leading-none ml-auto pl-4 border-l border-x-border border-dashed">
                            {roll.total}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <main className="flex-1 flex flex-col overflow-hidden bg-x-dark relative">
            <div className="flex-1 overflow-y-auto p-4 md:p-12 md:custom-scrollbar space-y-6 relative z-10" ref={scrollRef}>
                {diceHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center animate-in fade-in zoom-in duration-1000">
                        <span className="font-mono text-x-muted text-[48px] opacity-20">_</span>
                        <p className="text-[12px] font-mono text-x-muted tracking-xai uppercase mt-8 opacity-50">待机中 / WAITING</p>
                    </div>
                ) : (
                    diceHistory.map((roll, idx) => renderRollCard(roll, idx, idx === diceHistory.length - 1))
                )}
            </div>

            {/* Chat Input Area */}
            {commState === 'CONNECTED' && (
                <div className="p-4 border-t border-x-border bg-x-dark relative z-20 shrink-0">
                    <div className="max-w-6xl mx-auto flex gap-4">
                        <input 
                            type="text" 
                            value={chatInput} 
                            onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                            placeholder="输入消息..." 
                            className="flex-1 bg-transparent border border-x-border focus:border-x-borderStrong px-4 py-3 text-x-white font-sans text-[14px] outline-none transition-all placeholder:text-x-muted"
                        />
                        <button 
                            onClick={handleSendChat}
                            className="bg-x-accent text-x-accentText px-8 font-mono text-[14px] uppercase tracking-xai hover:opacity-90 transition-all border border-transparent hover:border-x-borderStrong"
                        >
                            发送
                        </button>
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
