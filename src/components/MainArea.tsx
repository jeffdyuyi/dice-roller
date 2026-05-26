import { useRef, useEffect, useState } from 'react';
import { useMqttContext } from '../contexts/MqttContext';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MainAreaProps {
    diceHistory: any[];
}

export function MainArea({ diceHistory }: MainAreaProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const { activeCharacter, myName, sendChatMessage, commState } = useMqttContext();
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
            const isLocal = roll.userName === myName || roll.isLocal;
            return (
                <div key={idx} className={`flex flex-col mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300 w-full ${isLocal ? 'items-end' : 'items-start'}`}>
                    <div className={`flex items-baseline gap-2 mb-1.5 ${isLocal ? 'mr-1 flex-row-reverse' : 'ml-1'}`}>
                        <span className="text-[12px] font-sans font-medium text-ibm-textSecondary">{roll.userName}</span>
                        <span className="text-[10px] font-mono text-ibm-textPlaceholder uppercase tracking-xai">
                            {new Date(roll.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                    <div className={`px-4 py-3 text-[15px] font-sans leading-relaxed inline-block max-w-[85%] rounded-none ${
                        isLocal 
                        ? 'bg-ibm-primary text-ibm-textOnColor' 
                        : 'bg-ibm-layer text-ibm-text border border-ibm-border'
                    }`}>
                        {roll.text}
                    </div>
                </div>
            );
        }

        if (roll.type === 'memo') {
            return (
                <div key={idx} className="flex flex-col mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300 w-full max-w-[85%] border-l-4 border-ibm-primary bg-ibm-layer p-4 border border-ibm-border border-l-ibm-primary">
                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-ibm-border/30">
                        <div className="flex items-baseline gap-2">
                            <span className="text-[12px] font-sans font-semibold text-ibm-text">📢 {roll.userName} 下发的笔记</span>
                            <span className="text-[10px] font-mono text-ibm-textPlaceholder uppercase tracking-xai">
                                {new Date(roll.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                    <div className="text-[13px] leading-relaxed select-text mt-1 text-ibm-text">
                        <MarkdownRenderer content={roll.text} />
                    </div>
                </div>
            );
        }

        const isDaggerheart = roll.historyTitle === '匕首心';

        return (
            <div key={idx} className={`flex flex-col mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300 ${isLatest ? 'opacity-100' : 'opacity-80 hover:opacity-100 transition-opacity'}`}>
                <div className="flex items-baseline gap-2 mb-1.5 ml-1">
                    <span className="text-[14px] font-sans font-medium text-ibm-text">{roll.userName || '未知领域者'}</span>
                    <span className="text-[11px] font-mono text-ibm-textPlaceholder uppercase tracking-xai">
                        {new Date(roll.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {roll.tag && (
                        <span className="text-[10px] font-mono bg-ibm-layer border border-ibm-border px-2 py-0.5 rounded-none text-ibm-textSecondary ml-2 uppercase tracking-xai">
                            {roll.tag.text}
                        </span>
                    )}
                    {roll.isHidden && (
                        <span className="text-[10px] font-mono bg-ibm-text text-ibm-background px-2 py-0.5 rounded-none ml-2 uppercase tracking-xai">
                            暗骰
                        </span>
                    )}
                </div>
                
                <div className="bg-ibm-layer rounded-none p-4 inline-flex flex-wrap items-center gap-5 max-w-[85%] border border-ibm-border">
                    <div className="flex flex-col min-w-[80px]">
                        <span className="text-[12px] font-sans text-ibm-textSecondary mb-1">{roll.historyTitle || '系统判定'}</span>
                        <span className="text-[14px] font-mono text-ibm-text bg-transparent border border-ibm-border px-2.5 py-1 rounded-none inline-block w-fit">{roll.historyFormula}</span>
                    </div>
                    
                    <div className="hidden sm:block h-10 w-px bg-ibm-border"></div>
                    
                    <div className="flex items-center gap-4 flex-1 min-w-[150px]">
                        {isDaggerheart ? (
                            <span className="text-[13px] font-sans text-ibm-textSecondary">
                                希望 <span className="text-ibm-text font-medium">{roll.hope}</span> / 恐惧 <span className="text-ibm-text font-medium">{roll.fear}</span>
                                {roll.advDice && <span className="ml-1 opacity-70">({roll.advType === 'advantage' ? '+' : '-'}{roll.advDice})</span>}
                            </span>
                        ) : (
                            <span className="text-[14px] font-mono text-ibm-text truncate max-w-[250px]" title={roll.breakdown}>
                                {roll.breakdown}
                            </span>
                        )}
                        <span className="text-[28px] font-sans font-semibold tracking-tight text-ibm-text leading-none ml-auto pl-5 border-l border-ibm-border">
                            {roll.total}
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <main className="flex-1 flex flex-col overflow-hidden bg-ibm-background relative">
            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar space-y-6 relative z-10" ref={scrollRef}>
                {diceHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center animate-in fade-in zoom-in duration-1000">
                        <div className="w-16 h-16 rounded-none border border-ibm-border bg-transparent flex items-center justify-center mb-6">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-ibm-textPlaceholder" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        </div>
                        <p className="text-[12px] font-mono text-ibm-textPlaceholder tracking-xai uppercase mt-2">没有任何活动记录</p>
                    </div>
                ) : (
                    diceHistory.map((roll, idx) => renderRollCard(roll, idx, idx === diceHistory.length - 1))
                )}
            </div>

            {/* Chat Input Area */}
            {commState === 'CONNECTED' && (
                <div className="p-4 md:p-6 bg-ibm-layer border-t border-ibm-border relative z-20 shrink-0">
                    <div className="max-w-4xl mx-auto flex gap-3">
                        <input 
                            type="text" 
                            value={chatInput} 
                            onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                            placeholder="输入消息..." 
                            className="flex-1 bg-ibm-layerHover border-b-2 border-transparent focus:border-ibm-primary px-4 py-3 text-ibm-text font-sans text-[14px] outline-none transition-all placeholder:text-ibm-textPlaceholder rounded-none"
                        />
                        <button 
                            onClick={handleSendChat}
                            className="bg-ibm-primary text-ibm-textOnColor px-8 rounded-none font-sans font-normal text-[14px] hover:bg-ibm-primaryHover transition-all"
                        >
                            发送消息
                        </button>
                    </div>
                </div>
            )}



            {/* Active Character HUD */}
            {activeCharacter && (
                <div className="absolute top-6 left-6 z-[30]">
                    <div className="group relative flex items-center gap-4 bg-ibm-layer border border-ibm-borderStrong rounded-none p-3 pr-6 shadow-md">
                        <div className="w-10 h-10 rounded-none border border-ibm-border bg-ibm-layerHover flex items-center justify-center text-ibm-text overflow-hidden">
                            {activeCharacter.avatarUrl ? (
                                <img src={activeCharacter.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="font-mono font-medium">{activeCharacter.name?.charAt(0) || 'P'}</span>
                            )}
                        </div>

                        <div className="flex flex-col">
                            <span className="text-[14px] font-sans font-medium text-ibm-text truncate max-w-[120px]">{activeCharacter.name}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[11px] font-mono uppercase tracking-xai text-ibm-textSecondary">{activeCharacter.summary || '备忘录激活'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
