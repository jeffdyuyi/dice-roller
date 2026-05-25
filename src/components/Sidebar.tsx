import { useState } from 'react';
import { DICE_TYPES, rollStandardDice, parseAndRollFormula, rollDaggerheart } from '../lib/diceCore';

interface SidebarProps {
    onRoll: (rollData: any) => void;
}

export function Sidebar({ onRoll }: SidebarProps) {
    const [activeTab, setActiveTab] = useState<'standard' | 'formula' | 'daggerheart'>('standard');
    const [diceCount, setDiceCount] = useState(1);
    const [diceMod, setDiceMod] = useState(0);
    const [customSides, setCustomSides] = useState(50);
    const [formulaText, setFormulaText] = useState('');
    const [dhMod, setDhMod] = useState(0);
    const [standardAdv, setStandardAdv] = useState<'none' | 'advantage' | 'disadvantage'>('none');
    const [dhAdv, setDhAdv] = useState<'none' | 'advantage' | 'disadvantage'>('none');

    const handleStandardRoll = (sides: number) => {
        const result = rollStandardDice(diceCount, sides, diceMod, standardAdv);
        onRoll(result);
    };

    const handleFormulaRoll = () => {
        try {
            const result = parseAndRollFormula(formulaText || '0');
            onRoll(result);
        } catch (e: any) {
            alert(e.message || '公式格式错误');
        }
    };

    const handleDhRoll = () => {
        const result = rollDaggerheart(dhMod, dhAdv);
        onRoll(result);
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
        <aside className="w-full md:w-[320px] bg-x-dark border-r border-x-border flex flex-col h-[60%] md:h-full shrink-0 z-20 overflow-hidden relative">
            {/* Premium Tabs */}
            <div className="flex border-b border-x-border shrink-0 p-2 gap-2">
                {(['standard', 'formula', 'daggerheart'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 text-[12px] font-mono tracking-xai uppercase transition-all border ${activeTab === tab
                            ? 'bg-x-white text-x-dark border-x-white'
                            : 'bg-transparent text-x-muted border-transparent hover:text-x-white hover:bg-x-surface'
                            }`}
                    >
                        {tab === 'standard' ? '标 准' : tab === 'formula' ? '公 式' : '判 定'}
                    </button>
                ))}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 md:px-6 md:py-8 md:custom-scrollbar relative z-10 space-y-10">
                {activeTab === 'standard' && (
                    <div className="animate-in fade-in slide-in-from-left-2 duration-500 space-y-10">
                        {/* Compact Counter & Mod */}
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2.5">
                                <label className="flex items-center gap-2 text-[12px] font-mono text-x-muted uppercase tracking-xai leading-none mb-1">骰子数量</label>
                                <div className="flex items-center h-11 bg-transparent border border-x-border focus-within:border-x-borderStrong transition-all group">
                                    <button onClick={() => adjustValue(setDiceCount, -1, 1)} className="w-10 h-full text-x-muted hover:text-x-white hover:bg-x-surface transition-colors font-mono">-</button>
                                    <input type="number" value={diceCount} onChange={e => setDiceCount(Math.max(1, parseInt(e.target.value) || 1))} className="flex-1 w-full bg-transparent text-center font-mono text-x-white outline-none text-[16px]" />
                                    <button onClick={() => adjustValue(setDiceCount, 1)} className="w-10 h-full text-x-muted hover:text-x-white hover:bg-x-surface transition-colors font-mono">+</button>
                                </div>
                            </div>
                            <div className="space-y-2.5">
                                <label className="flex items-center gap-2 text-[12px] font-mono text-x-muted uppercase tracking-xai leading-none mb-1">数值修正</label>
                                <div className="flex items-center h-11 bg-transparent border border-x-border focus-within:border-x-borderStrong transition-all group">
                                    <button onClick={() => adjustValue(setDiceMod, -1)} className="w-10 h-full text-x-muted hover:text-x-white hover:bg-x-surface transition-colors font-mono">-</button>
                                    <input type="number" value={diceMod} onChange={e => setDiceMod(parseInt(e.target.value) || 0)} className="flex-1 w-full bg-transparent text-center font-mono text-x-white outline-none text-[16px]" />
                                    <button onClick={() => adjustValue(setDiceMod, 1)} className="w-10 h-full text-x-muted hover:text-x-white hover:bg-x-surface transition-colors font-mono">+</button>
                                </div>
                            </div>
                        </div>

                        {/* Advantage/Disadvantage Toggle */}
                        <div className="space-y-2.5 pt-2">
                            <label className="flex items-center gap-2 text-[12px] font-mono text-x-muted uppercase tracking-xai leading-none mb-1">
                                优势 / 劣势
                            </label>
                            <div className="flex border border-x-border p-1 bg-x-surface">
                                {(['none', 'advantage', 'disadvantage'] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setStandardAdv(type)}
                                        className={`flex-1 py-2 text-[12px] font-mono tracking-xai transition-all border ${standardAdv === type
                                            ? 'bg-x-white text-x-dark border-transparent'
                                            : 'text-x-muted border-transparent hover:text-x-white hover:bg-x-surface'
                                            }`}
                                    >
                                        {type === 'none' ? '常规' : type === 'advantage' ? '优势' : '劣势'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom Dice Field */}
                        <div className="pt-2 flex gap-4 h-11">
                            <div className="relative flex-1 group border border-x-border focus-within:border-x-borderStrong">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
                                    <span className="text-x-white font-mono text-[14px]">D</span>
                                </div>
                                <input type="number" value={customSides} onChange={e => setCustomSides(parseInt(e.target.value) || 0)} className="w-full h-full bg-transparent pl-10 pr-4 text-x-white font-mono outline-none transition-all text-[14px]" placeholder="自定义面数" />
                            </div>
                            <button onClick={() => handleStandardRoll(customSides)} className="bg-x-white text-x-dark hover:bg-white/90 px-6 flex items-center gap-2 transition-all font-mono text-[14px] uppercase tracking-xai border border-transparent hover:border-x-borderStrong">
                                <span>掷骰</span>
                            </button>
                        </div>

                        {/* Space-Optimized Grid */}
                        <div className="grid grid-cols-3 gap-5 pt-4">
                            {(['d20', 'd6', 'd100', 'd4', 'd8', 'd10', 'd12'] as const).map(type => (
                                <button
                                    key={type}
                                    onClick={() => handleStandardRoll(DICE_TYPES[type].sides)}
                                    className={`group relative aspect-square flex items-center justify-center transition-all border ${type === 'd20'
                                        ? 'bg-x-white text-x-dark border-x-white'
                                        : 'bg-transparent border-x-border text-x-muted hover:border-x-borderStrong hover:text-x-white hover:bg-x-surface'
                                        }`}
                                >
                                    <span className={`text-[16px] font-mono tracking-xai uppercase`}>{type}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'formula' && (
                    <div className="animate-in fade-in slide-in-from-right-2 duration-500 space-y-6">
                        <div className="bg-transparent border border-x-border p-6 relative">
                            <div className="flex justify-between items-center mb-4">
                                <label className="text-[12px] font-mono text-x-muted uppercase tracking-xai flex items-center gap-2">
                                    掷骰公式
                                </label>
                                <button onClick={() => setFormulaText('')} className="text-x-muted hover:text-x-white transition-colors font-mono">
                                    X
                                </button>
                            </div>
                            <textarea
                                value={formulaText}
                                onChange={e => setFormulaText(e.target.value)}
                                rows={2}
                                className="w-full bg-transparent text-x-white font-mono text-[24px] focus:outline-none placeholder-x-muted resize-none leading-relaxed"
                                placeholder="输入公式 如 2d20 + 8"
                            />
                            <div className="mt-8 pt-4 border-t border-x-border flex justify-end items-center">
                                <button onClick={handleFormulaRoll} className="bg-x-white text-x-dark px-10 py-2.5 text-[14px] font-mono uppercase tracking-xai transition-all hover:bg-white/90">执 行</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2.5">
                            {/* Dice Shortcuts */}
                            {['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].map(d => (
                                <button key={d} onClick={() => insertText(d)} className="h-11 bg-transparent border border-x-border text-[14px] font-mono text-x-muted hover:bg-x-surface hover:text-x-white hover:border-x-borderStrong transition-all">{d.toUpperCase()}</button>
                            ))}
                            <button onClick={() => setFormulaText(p => p.slice(0, -1))} className="h-11 bg-transparent text-x-muted border border-x-border hover:bg-x-surface hover:text-x-white transition-all font-mono">DEL</button>

                            {/* Number Pad and Operators */}
                            {[7, 8, 9, '+', 4, 5, 6, '-', 1, 2, 3, 'd', 0].map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => insertText(item.toString())}
                                    className={`h-11 font-mono transition-all border border-x-border text-[16px] hover:border-x-borderStrong ${typeof item === 'number' || item === '0' || item === 'd'
                                        ? 'bg-transparent text-x-white hover:bg-x-surface'
                                        : 'bg-x-surface text-x-white hover:bg-x-borderStrong'
                                        }`}
                                >
                                    {item}
                                </button>
                            ))}

                            {/* Execute Button in Grid */}
                            <button onClick={handleFormulaRoll} className="col-span-3 h-11 bg-x-white text-x-dark font-mono text-[14px] tracking-xai uppercase hover:bg-white/90 transition-all flex items-center justify-center gap-3">
                                执 行
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'daggerheart' && (
                    <div className="animate-in fade-in slide-in-from-right-2 duration-500 flex flex-col items-center space-y-8">
                        <div className="flex gap-6 items-center bg-transparent p-6 border border-x-border relative w-full justify-center">
                            <div className="flex flex-col items-center gap-3">
                                <span className="text-[14px] font-mono text-x-white tracking-xai uppercase">希望</span>
                            </div>
                            <div className="text-x-muted font-mono text-lg">VS</div>
                            <div className="flex flex-col items-center gap-3">
                                <span className="text-[14px] font-mono text-x-muted tracking-xai uppercase">恐惧</span>
                            </div>
                        </div>

                        <div className="w-full space-y-6">
                            <div className="flex items-center justify-center h-14 bg-transparent border border-x-border focus-within:border-x-borderStrong transition-all group">
                                <button onClick={() => adjustValue(setDhMod, -1)} className="w-16 h-full text-x-muted hover:text-x-white transition-colors hover:bg-x-surface font-mono">-</button>
                                <input type="number" value={dhMod} onChange={e => setDhMod(parseInt(e.target.value) || 0)} className="w-20 bg-transparent text-center font-mono text-x-white outline-none text-[20px]" />
                                <button onClick={() => adjustValue(setDhMod, 1)} className="w-16 h-full text-x-muted hover:text-x-white transition-colors hover:bg-x-surface font-mono">+</button>
                            </div>

                            {/* Daggerheart Advantage Toggle */}
                            <div className="flex bg-x-surface p-1 border border-x-border">
                                {(['none', 'advantage', 'disadvantage'] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setDhAdv(type)}
                                        className={`flex-1 py-2.5 text-[12px] font-mono tracking-xai uppercase transition-all ${dhAdv === type
                                            ? 'bg-x-white text-x-dark border border-transparent'
                                            : 'text-x-muted hover:text-x-white hover:bg-x-surface border border-transparent'
                                            }`}
                                    >
                                        {type === 'none' ? '常规' : type === 'advantage' ? '优势' : '劣势'}
                                    </button>
                                ))}
                            </div>

                            <button onClick={handleDhRoll} className="w-full bg-x-white text-x-dark font-mono py-4 uppercase tracking-xai transition-all hover:bg-white/90">
                                结果判定
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}
