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
                    <div className="flex items-baseline gap-2 mb-1.5 ml-1">
                        <span className="text-[14px] font-sans font-medium text-white/90">{roll.userName}</span>
                        <span className="text-[11px] font-sans text-white/40">
                            {new Date(roll.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <div className="bg-[#2c2c2e] rounded-2xl rounded-tl-sm px-4 py-3 text-[15px] font-sans text-white/90 leading-relaxed inline-block max-w-[85%] shadow-sm">
                        {roll.text}
                    </div>
                </div>
            );
        }

        const isDaggerheart = roll.historyTitle === '匕首心';

        return (
            <div key={idx} className={`flex flex-col mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300 ${isLatest ? 'opacity-100' : 'opacity-80 hover:opacity-100 transition-opacity'}`}>
                <div className="flex items-baseline gap-2 mb-1.5 ml-1">
                    <span className="text-[14px] font-sans font-medium text-white/90">{roll.userName || '未知领域者'}</span>
                    <span className="text-[11px] font-sans text-white/40">
                        {new Date(roll.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {roll.tag && (
                        <span className="text-[11px] font-sans bg-white/10 px-2 py-0.5 rounded-full text-white/80 ml-2">
                            {roll.tag.text}
                        </span>
                    )}
                    {roll.isHidden && (
                        <span className="text-[11px] font-sans bg-apple-blue/20 text-apple-blue px-2 py-0.5 rounded-full ml-2">
                            暗骰
                        </span>
                    )}
                </div>
                
                <div className="bg-[#1c1c1e] rounded-2xl rounded-tl-sm p-4 inline-flex flex-wrap items-center gap-5 max-w-[85%] shadow-sm border border-white/5">
                    <div className="flex flex-col min-w-[80px]">
                        <span className="text-[12px] font-sans text-white/50 mb-1">{roll.historyTitle || '系统判定'}</span>
                        <span className="text-[14px] font-mono text-white/90 bg-[#2c2c2e] px-2.5 py-1 rounded-md inline-block w-fit">{roll.historyFormula}</span>
                    </div>
                    
                    <div className="hidden sm:block h-10 w-px bg-white/10"></div>
                    
                    <div className="flex items-center gap-4 flex-1 min-w-[150px]">
                        {isDaggerheart ? (
                            <span className="text-[13px] font-sans text-white/60">
                                希望 <span className="text-white font-medium">{roll.hope}</span> / 恐惧 <span className="text-white font-medium">{roll.fear}</span>
                                {roll.advDice && <span className="ml-1 opacity-70">({roll.advType === 'advantage' ? '+' : '-'}{roll.advDice})</span>}
                            </span>
                        ) : (
                            <span className="text-[13px] font-sans text-white/60 truncate max-w-[250px]" title={roll.breakdown}>
                                {roll.breakdown}
                            </span>
                        )}
                        <span className="text-[28px] font-sans font-semibold tracking-tight text-white leading-none ml-auto pl-5 border-l border-white/10">
                            {roll.total}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <main className="flex-1 flex flex-col overflow-hidden bg-black relative">
            <div className="flex-1 overflow-y-auto p-4 md:p-8 md:custom-scrollbar space-y-6 relative z-10" ref={scrollRef}>
                {diceHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center animate-in fade-in zoom-in duration-1000">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-6">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white/20" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        </div>
                        <p className="text-[14px] font-sans text-white/40 tracking-wide mt-2">没有任何活动记录</p>
                    </div>
                ) : (
                    diceHistory.map((roll, idx) => renderRollCard(roll, idx, idx === diceHistory.length - 1))
                )}
            </div>

            {/* Chat Input Area */}
            {commState === 'CONNECTED' && (
                <div className="p-4 md:p-6 bg-black relative z-20 shrink-0">
                    <div className="max-w-4xl mx-auto flex gap-3 bg-[#1d1d1f] p-2 rounded-full border border-white/10 shadow-sm">
                        <input 
                            type="text" 
                            value={chatInput} 
                            onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                            placeholder="输入消息..." 
                            className="flex-1 bg-transparent px-4 py-2 text-white font-sans text-[15px] outline-none transition-all placeholder:text-white/30"
                        />
                        <button 
                            onClick={handleSendChat}
                            className="bg-apple-blue text-white px-6 rounded-full font-sans font-medium text-[14px] hover:bg-apple-blue/90 hover:scale-[0.98] active:bg-[#ededf2] active:text-[#1d1d1f] transition-all shadow-sm"
                        >
                            发送
                        </button>
                    </div>
                </div>
            )}



            {/* Active Character HUD */}
            {activeCharacter && (
                <div className="absolute top-6 left-6 z-[30]">
                    <div className="group relative flex items-center gap-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full p-1.5 pr-5 hover:bg-black/60 transition-all cursor-pointer shadow-apple"
                        onClick={() => setInspectingSelf(true)}>
                        <div className="w-10 h-10 rounded-full bg-[#2c2c2e] flex items-center justify-center text-white overflow-hidden shadow-sm">
                            {activeCharacter.avatarUrl ? (
                                <img src={activeCharacter.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="font-sans font-medium">{activeCharacter.name?.charAt(0) || 'P'}</span>
                            )}
                        </div>

                        <div className="flex flex-col pr-2">
                            <span className="text-[14px] font-sans font-medium text-white truncate max-w-[120px]">{activeCharacter.name}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] font-sans text-white/60">{activeCharacter.characterData.class || '冒险者'}</span>
                                {activeCharacter.characterData.hp && (
                                    <span className="text-[11px] font-sans text-white/80 bg-white/10 px-1.5 rounded-sm">HP {activeCharacter.characterData.hp.current}</span>
                                )}
                            </div>
                        </div>

                        {/* Hover Tooltip */}
                        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap">
                            <span className="text-[12px] font-sans bg-[#1d1d1f] text-white px-3 py-1.5 rounded-lg shadow-md border border-white/10">点击查看资料</span>
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
