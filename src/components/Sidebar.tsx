import { useState, useRef } from 'react';
import { parseAndRollFormula, rollDaggerheart } from '../lib/diceCore';
import { useMqttContext } from '../contexts/MqttContext';

interface SidebarProps {
    onRoll: (rollData: any) => void;
}

export function Sidebar({ onRoll }: SidebarProps) {
    const { isHost, connectedPlayers, patchCharacter, commState } = useMqttContext();

    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        formula: true,
        daggerheart: false,
        hostItems: false
    });

    const toggleSection = (section: string) => {
        setOpenSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };
    const [formulaText, setFormulaText] = useState('');
    const [dhMod, setDhMod] = useState(0);
    const [dhAdv, setDhAdv] = useState<'none' | 'advantage' | 'disadvantage'>('none');
    const [isHidden, setIsHidden] = useState(false);

    // Host Tools State
    const [itemTargetPlayer, setItemTargetPlayer] = useState<string>('all');
    const [itemText, setItemText] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const insertMarkdown = (prefix: string, suffix: string = '') => {
        if (!textareaRef.current) return;
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const text = itemText;
        const selected = text.slice(start, end);
        const before = text.slice(0, start);
        const after = text.slice(end);
        
        const inserted = suffix ? `${prefix}${selected || '内容'}${suffix}` : `${prefix}${selected}`;
        setItemText(before + inserted + after);
        
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const newPos = start + prefix.length + (selected ? selected.length : '内容'.length);
                textareaRef.current.setSelectionRange(newPos, newPos);
            }
        }, 0);
    };

    const validPlayers = connectedPlayers.filter(p => !p.isHost && p.characterId); // Using characterId to identify valid players with memos

    const handleItemSend = () => {
        if (!itemText.trim()) return;
        
        const targetIds = itemTargetPlayer === 'all' 
            ? validPlayers.map(p => p.id)
            : [itemTargetPlayer];

        if (targetIds.length === 0) {
            alert('没有有效的目标玩家');
            return;
        }

        targetIds.forEach(id => {
            patchCharacter(id, itemText);
        });

        setItemText('');
    };

    const handleFormulaRoll = () => {
        try {
            const result = parseAndRollFormula(formulaText || '0');
            onRoll({ ...result, isHidden });
        } catch (e: any) {
            alert(e.message || '公式格式错误');
        }
    };

    const handleDhRoll = () => {
        const result = rollDaggerheart(dhMod, dhAdv);
        onRoll({ ...result, isHidden });
    };

    const insertText = (text: string) => {
        let val = text;
        if (text === '+' || text === '-') val = ` ${text} `;
        setFormulaText(prev => prev + val);
    };

    const adjustValue = (setter: React.Dispatch<React.SetStateAction<number>>, delta: number, min?: number) => {
        setter(prev => {
            const next = prev + delta;
            if (min !== undefined && next < min) return min;
            return next;
        });
    };

    return (
        <aside className="w-full md:w-[320px] bg-black/60 backdrop-blur-3xl border-r border-white/5 flex flex-col h-[60%] md:h-full shrink-0 z-20 overflow-hidden relative">
            <div className="flex-1 overflow-y-auto custom-scrollbar relative z-10 p-2">

                {/* Formula Section */}
                <div className="mb-4 bg-transparent border border-x-borderStrong rounded-none overflow-hidden">
                    <button 
                        onClick={() => toggleSection('formula')}
                        className="w-full flex justify-between items-center px-5 py-4 hover:bg-x-surface transition-colors text-left border-b border-x-border"
                    >
                        <span className="text-[15px] font-sans font-semibold text-x-white uppercase tracking-wider">公式解析</span>
                        <span className="font-mono text-x-muted text-[18px] transition-transform duration-300" style={{ transform: openSections.formula ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
                    </button>
                    {openSections.formula && (
                        <div className="p-4 space-y-4 animate-in fade-in duration-300 bg-x-dark">
                            <div className="bg-x-surface border border-x-border rounded-none p-4 relative">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[13px] font-sans font-medium text-x-muted uppercase tracking-xai">
                                        输入掷骰公式
                                    </label>
                                    <button onClick={() => setFormulaText('')} className="text-x-muted hover:text-x-white transition-colors p-1 bg-transparent border border-x-border hover:bg-x-surface rounded-sm">
                                        <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 1L1 13M1 1L13 13"/></svg>
                                    </button>
                                </div>
                                <textarea
                                    value={formulaText}
                                    onChange={e => setFormulaText(e.target.value)}
                                    rows={2}
                                    className="w-full bg-transparent text-white font-mono text-[22px] focus:outline-none placeholder:text-white/20 resize-none leading-relaxed"
                                    placeholder="如 2d20 + 8"
                                />
                                
                                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input type="checkbox" checked={isHidden} onChange={e => setIsHidden(e.target.checked)} className="peer sr-only" />
                                            <div className="w-10 h-5 bg-x-surface border border-x-border rounded-none peer-checked:bg-x-white transition-colors"></div>
                                            <div className="absolute left-[2px] top-[2px] w-4 h-4 bg-x-muted rounded-none transition-transform peer-checked:translate-x-5 peer-checked:bg-x-dark"></div>
                                        </div>
                                        <span className="text-[13px] font-mono text-x-muted group-hover:text-x-white transition-colors select-none uppercase tracking-xai">暗骰</span>
                                    </label>
                                    <button onClick={handleFormulaRoll} className="bg-x-white text-x-dark border border-x-white px-6 py-2 rounded-none text-[12px] font-mono font-medium transition-all hover:bg-white/90 uppercase tracking-xai">执行</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                                {/* Dice Shortcuts */}
                                {[ 'd4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100' ].map(d => (
                                    <button key={d} onClick={() => insertText(d)} className="h-10 bg-x-surface border border-x-border hover:bg-x-white hover:text-x-dark rounded-none text-[14px] font-mono font-medium text-x-white transition-all uppercase">{d}</button>
                                ))}
                                <button onClick={() => setFormulaText(p => p.slice(0, -1))} className="h-10 bg-transparent border border-x-border hover:bg-red-500/20 rounded-none text-x-white font-mono font-medium transition-all flex items-center justify-center">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path><line x1="18" y1="9" x2="12" y2="15"></line><line x1="12" y1="9" x2="18" y2="15"></line></svg>
                                </button>

                                {/* Number Pad and Operators */}
                                {[7, 8, 9, '+', 4, 5, 6, '-', 1, 2, 3, 'd', 0].map((item, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => insertText(item.toString())}
                                        className={`h-10 font-mono font-medium rounded-none transition-all text-[16px] border ${typeof item === 'number' || item === '0' || item === 'd'
                                            ? 'bg-transparent border-x-border text-x-white hover:bg-x-surface'
                                            : 'bg-x-surface border-x-border text-x-white hover:bg-x-white hover:text-x-dark'
                                            }`}
                                    >
                                        {item}
                                    </button>
                                ))}

                                {/* Execute Button in Grid */}
                                <button onClick={handleFormulaRoll} className="col-span-3 h-10 bg-x-white text-x-dark rounded-none font-mono font-medium hover:bg-white/90 transition-all uppercase tracking-xai">
                                    执 行
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Daggerheart Section */}
                <div className="mb-4 bg-transparent border border-x-borderStrong rounded-none overflow-hidden">
                    <button 
                        onClick={() => toggleSection('daggerheart')}
                        className="w-full flex justify-between items-center px-5 py-4 hover:bg-x-surface transition-colors text-left border-b border-x-border"
                    >
                        <span className="text-[15px] font-sans font-semibold text-x-white uppercase tracking-wider">二元系统</span>
                        <span className="font-mono text-x-muted text-[18px] transition-transform duration-300" style={{ transform: openSections.daggerheart ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
                    </button>
                    {openSections.daggerheart && (
                        <div className="p-4 flex flex-col items-center space-y-5 animate-in fade-in duration-300 bg-x-dark">
                            <div className="flex gap-6 items-center bg-x-surface border border-x-border rounded-none p-5 w-full justify-center">
                                <div className="flex flex-col items-center">
                                    <span className="text-[14px] font-sans font-medium text-white">希望</span>
                                </div>
                                <div className="text-white/70 font-sans italic text-sm">VS</div>
                                <div className="flex flex-col items-center">
                                    <span className="text-[14px] font-sans font-medium text-white/70">恐惧</span>
                                </div>
                            </div>

                            <div className="w-full space-y-4">
                                <div className="flex items-center justify-center h-12 bg-transparent border border-x-border rounded-none overflow-hidden">
                                    <button onClick={() => adjustValue(setDhMod, -1)} className="w-16 h-full bg-x-surface text-x-white hover:bg-x-white hover:text-x-dark transition-colors font-mono text-lg border-r border-x-border">-</button>
                                    <input type="number" value={dhMod} onChange={e => setDhMod(parseInt(e.target.value) || 0)} className="w-full max-w-[80px] bg-transparent text-center font-mono font-medium text-x-white outline-none text-[20px]" />
                                    <button onClick={() => adjustValue(setDhMod, 1)} className="w-16 h-full bg-x-surface text-x-white hover:bg-x-white hover:text-x-dark transition-colors font-mono text-lg border-l border-x-border">+</button>
                                </div>

                                {/* Daggerheart Advantage Toggle */}
                                <div className="flex border border-x-border p-1 rounded-none bg-transparent">
                                    {(['none', 'advantage', 'disadvantage'] as const).map((type) => (
                                        <button
                                            key={type}
                                            onClick={() => setDhAdv(type)}
                                            className={`flex-1 py-2 text-[12px] font-mono uppercase tracking-xai font-medium rounded-none transition-all ${dhAdv === type
                                                ? 'bg-x-white text-x-dark'
                                                : 'text-x-muted hover:text-x-white'
                                                }`}
                                        >
                                            {type === 'none' ? '常规' : type === 'advantage' ? '优势' : '劣势'}
                                        </button>
                                    ))}
                                </div>

                                <button onClick={handleDhRoll} className="w-full bg-x-white text-x-dark rounded-none font-mono uppercase tracking-xai font-medium py-3 hover:bg-white/90 transition-all">
                                    进行判定
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Host Tools */}
                {commState === 'CONNECTED' && isHost && (
                    <>

                        {/* Host Items/Memo Section */}
                        <div className="mb-4 bg-transparent border border-x-borderStrong rounded-none overflow-hidden">
                            <button 
                                onClick={() => toggleSection('hostItems')}
                                className="w-full flex justify-between items-center px-5 py-4 hover:bg-x-surface transition-colors text-left border-b border-x-border"
                            >
                                <span className="text-[15px] font-sans font-semibold text-x-white uppercase tracking-wider">空投物品/记录 (DM)</span>
                                <span className="font-mono text-x-muted text-[18px] transition-transform duration-300" style={{ transform: openSections.hostItems ? 'rotate(45deg)' : 'rotate(0)' }}>+</span>
                            </button>
                            {openSections.hostItems && (
                                <div className="p-4 space-y-3 animate-in fade-in duration-300 bg-x-dark">
                                    <div className="relative">
                                        <select value={itemTargetPlayer} onChange={e => setItemTargetPlayer(e.target.value)} className="w-full bg-x-surface border border-x-border rounded-none px-4 py-2.5 text-[12px] font-mono uppercase tracking-xai text-x-white outline-none cursor-pointer appearance-none">
                                            <option value="all" className="bg-x-dark">发送给: 全体玩家</option>
                                            {validPlayers.map(p => <option key={p.id} value={p.id} className="bg-x-dark">仅发送给: {p.name}</option>)}
                                        </select>
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-x-muted pointer-events-none text-xs font-mono">▼</span>
                                    </div>

                                    <div className="bg-transparent border border-x-border rounded-none overflow-hidden">
                                        <div className="flex gap-1 p-1.5 border-b border-x-border bg-x-surface">
                                            <button onClick={() => insertMarkdown('**', '**')} className="w-7 h-7 rounded-sm flex items-center justify-center text-x-muted hover:text-x-white hover:bg-white/10 transition-colors font-sans font-bold" title="加粗">B</button>
                                            <button onClick={() => insertMarkdown('*', '*')} className="w-7 h-7 rounded-sm flex items-center justify-center text-x-muted hover:text-x-white hover:bg-white/10 transition-colors font-sans italic" title="斜体">I</button>
                                            <button onClick={() => insertMarkdown('~~', '~~')} className="w-7 h-7 rounded-sm flex items-center justify-center text-x-muted hover:text-x-white hover:bg-white/10 transition-colors font-sans line-through" title="删除线">S</button>
                                            <div className="w-px bg-x-border mx-1 my-1"></div>
                                            <button onClick={() => insertMarkdown('> ')} className="w-7 h-7 rounded-sm flex items-center justify-center text-x-muted hover:text-x-white hover:bg-white/10 transition-colors font-mono" title="引用">&gt;</button>
                                            <button onClick={() => insertMarkdown('- ')} className="w-7 h-7 rounded-sm flex items-center justify-center text-x-muted hover:text-x-white hover:bg-white/10 transition-colors font-mono" title="列表">•</button>
                                        </div>
                                        <textarea
                                            ref={textareaRef}
                                            value={itemText}
                                            onChange={e => setItemText(e.target.value)}
                                            rows={4}
                                            className="w-full bg-transparent text-x-white font-mono text-[13px] outline-none resize-none p-4 placeholder:text-x-muted"
                                            placeholder="输入说明文本..."
                                        />
                                    </div>
                                    <button 
                                        onClick={handleItemSend} 
                                        disabled={!itemText.trim()}
                                        className="w-full bg-x-white text-x-dark rounded-none font-mono uppercase tracking-xai font-medium py-3 transition-all hover:bg-white/90 disabled:opacity-50"
                                    >
                                        确认发放
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </aside>
    );
}
