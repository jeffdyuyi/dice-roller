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

    const handleStandardRoll = (sides: number) => {
        const result = rollStandardDice(diceCount, sides, diceMod);
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
        const result = rollDaggerheart(dhMod);
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
        <aside className="w-full md:w-[320px] bg-[#0a0c1d] border-r border-white/5 flex flex-col h-[60%] md:h-full shrink-0 shadow-2xl z-20 overflow-hidden relative">
            {/* Dark Background Decor */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-900/10 rounded-full blur-[80px] -mr-24 -mt-24 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-900/10 rounded-full blur-[60px] -ml-16 -mb-16 pointer-events-none"></div>

            {/* Premium Dark Tabs */}
            <div className="flex bg-black/40 border-b border-white/5 shrink-0 p-1.5 gap-1.5 backdrop-blur-md">
                {(['standard', 'formula', 'daggerheart'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider transition-all rounded-xl ${activeTab === tab
                            ? 'bg-amber-600 text-black shadow-lg shadow-amber-900/20'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                            }`}
                    >
                        {tab === 'standard' ? '标准' : tab === 'formula' ? '公式' : '判定'}
                    </button>
                ))}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 md:px-6 md:py-8 md:custom-scrollbar relative z-10 space-y-8">
                {activeTab === 'standard' && (
                    <div className="animate-in fade-in slide-in-from-left-2 duration-400 space-y-8">
                        {/* Compact Counter & Mod */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[9px] font-black text-amber-500/50 uppercase tracking-[0.2em] leading-none mb-1">数量 Count</label>
                                <div className="flex items-center h-12 bg-white/5 border border-white/10 rounded-2xl focus-within:border-amber-500/50 transition-all overflow-hidden backdrop-blur-sm">
                                    <button onClick={() => adjustValue(setDiceCount, -1, 1)} className="w-12 h-full text-slate-500 hover:text-amber-500 hover:bg-white/5 transition-colors"><i className="fa-solid fa-minus text-[11px]"></i></button>
                                    <input type="number" value={diceCount} onChange={e => setDiceCount(Math.max(1, parseInt(e.target.value) || 1))} className="flex-1 w-full bg-transparent text-center font-black text-white outline-none text-base" />
                                    <button onClick={() => adjustValue(setDiceCount, 1)} className="w-12 h-full text-slate-500 hover:text-amber-500 hover:bg-white/5 transition-colors"><i className="fa-solid fa-plus text-[11px]"></i></button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[9px] font-black text-amber-500/50 uppercase tracking-[0.2em] leading-none mb-1">修正 Mod</label>
                                <div className="flex items-center h-12 bg-white/5 border border-white/10 rounded-2xl focus-within:border-amber-500/50 transition-all overflow-hidden backdrop-blur-sm">
                                    <button onClick={() => adjustValue(setDiceMod, -1)} className="w-12 h-full text-slate-500 hover:text-amber-500 hover:bg-white/5 transition-colors"><i className="fa-solid fa-minus text-[11px]"></i></button>
                                    <input type="number" value={diceMod} onChange={e => setDiceMod(parseInt(e.target.value) || 0)} className="flex-1 w-full bg-transparent text-center font-black text-white outline-none text-base" />
                                    <button onClick={() => adjustValue(setDiceMod, 1)} className="w-12 h-full text-slate-500 hover:text-amber-500 hover:bg-white/5 transition-colors"><i className="fa-solid fa-plus text-[11px]"></i></button>
                                </div>
                            </div>
                        </div>

                        {/* Custom Dice Field */}
                        <div className="pt-2 flex gap-3 h-12">
                            <div className="relative flex-1 group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none opacity-30 group-focus-within:opacity-100 transition-opacity">
                                    <i className="fa-solid fa-dice-d6 text-amber-500 text-[11px]"></i>
                                    <span className="text-amber-500 font-mono text-[11px] font-black">D</span>
                                </div>
                                <input type="number" value={customSides} onChange={e => setCustomSides(parseInt(e.target.value) || 0)} className="w-full h-full bg-white/5 border border-white/10 focus:border-amber-500/50 pl-12 pr-4 rounded-2xl text-white font-black outline-none transition-all text-sm backdrop-blur-sm" placeholder="Sides" />
                            </div>
                            <button onClick={() => handleStandardRoll(customSides)} className="bg-amber-600 hover:bg-amber-500 text-black px-6 rounded-2xl flex items-center gap-2 transition-all active:scale-95 shadow-xl shadow-amber-900/20 font-black text-[11px] uppercase">
                                <i className="fa-solid fa-bolt text-[10px]"></i>
                                <span>掷</span>
                            </button>
                        </div>

                        {/* Space-Optimized Grid */}
                        <div className="grid grid-cols-3 gap-4 pt-4">
                            {(['d20', 'd6', 'd100', 'd4', 'd8', 'd10', 'd12'] as const).map(type => (
                                <button
                                    key={type}
                                    onClick={() => handleStandardRoll(DICE_TYPES[type].sides)}
                                    className={`group relative aspect-square rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-lg border-2 ${type === 'd20'
                                        ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-amber-900/10'
                                        : 'bg-white/5 border-white/5 text-slate-400 hover:border-amber-500/30 hover:text-amber-500 hover:bg-amber-500/5'
                                        }`}
                                >
                                    <span className="text-xs font-black tracking-tight uppercase">{type}</span>
                                    <div className={`absolute inset-0 rounded-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-amber-500/10 to-transparent pointer-events-none`}></div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'formula' && (
                    <div className="animate-in fade-in slide-in-from-right-2 duration-400 space-y-5">
                        <div className="bg-black/40 rounded-3xl p-6 shadow-2xl border border-white/10 relative overflow-hidden group backdrop-blur-xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl pointer-events-none"></div>
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-[10px] font-black text-amber-500/40 uppercase tracking-[0.2em] flex items-center gap-2">
                                    <i className="fa-solid fa-code animate-pulse"></i> Formula Terminal
                                </label>
                                <button onClick={() => setFormulaText('')} className="text-slate-600 hover:text-red-500 transition-colors">
                                    <i className="fa-solid fa-circle-xmark"></i>
                                </button>
                            </div>
                            <textarea
                                value={formulaText}
                                onChange={e => setFormulaText(e.target.value)}
                                rows={2}
                                className="w-full bg-transparent text-white font-mono text-2xl focus:outline-none placeholder-slate-700 resize-none leading-relaxed"
                                placeholder="2d20 + 8"
                            />
                            <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center">
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">NdX + Modifier</span>
                                <button onClick={handleFormulaRoll} className="bg-amber-600 hover:bg-amber-500 text-black px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-900/20">Execute</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2.5">
                            {['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].map(d => (
                                <button key={d} onClick={() => insertText(d)} className="h-11 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black text-slate-400 hover:bg-amber-500 hover:text-black transition-all active:scale-95">{d.toUpperCase()}</button>
                            ))}
                            <button onClick={() => setFormulaText(p => p.slice(0, -1))} className="h-11 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center border border-red-500/20 hover:bg-red-500 hover:text-white transition-all"><i className="fa-solid fa-delete-left"></i></button>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <button onClick={() => insertText('+')} className="h-14 bg-white/5 text-slate-300 rounded-2xl font-black text-2xl hover:bg-white/10 border border-white/5 transition-all active:scale-95">+</button>
                            <button onClick={() => insertText('-')} className="h-14 bg-white/5 text-slate-300 rounded-2xl font-black text-2xl hover:bg-white/10 border border-white/5 transition-all active:scale-95">-</button>
                            <button onClick={handleFormulaRoll} className="h-14 bg-amber-600 text-black rounded-2xl font-black text-lg shadow-xl shadow-amber-900/20 active:scale-95 hover:bg-amber-500 transition-all"><i className="fa-solid fa-wand-magic-sparkles"></i></button>
                        </div>
                    </div>
                )}

                {activeTab === 'daggerheart' && (
                    <div className="animate-in fade-in slide-in-from-right-2 duration-400 flex flex-col items-center space-y-8">
                        <div className="flex gap-6 items-center bg-black/40 p-8 rounded-[2.5rem] shadow-2xl border border-white/5 backdrop-blur-md">
                            <div className="flex flex-col items-center gap-3 group">
                                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl shadow-xl shadow-amber-900/20 flex items-center justify-center text-black text-3xl group-hover:scale-110 group-hover:rotate-3 transition-all"><i className="fa-solid fa-sun animate-spin-slow"></i></div>
                                <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">Hope</span>
                            </div>
                            <div className="text-white/10 font-black italic text-xl select-none">VS</div>
                            <div className="flex flex-col items-center gap-3 group">
                                <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-800 rounded-3xl shadow-xl shadow-indigo-900/20 flex items-center justify-center text-white text-3xl group-hover:scale-110 group-hover:-rotate-3 transition-all"><i className="fa-solid fa-moon"></i></div>
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Fear</span>
                            </div>
                        </div>

                        <div className="w-full space-y-5">
                            <div className="flex items-center justify-center h-16 bg-white/5 border border-white/10 rounded-2xl focus-within:border-amber-500/50 transition-all overflow-hidden backdrop-blur-sm mx-2">
                                <button onClick={() => adjustValue(setDhMod, -1)} className="w-16 h-full text-slate-600 hover:text-white transition-colors"><i className="fa-solid fa-minus"></i></button>
                                <input type="number" value={dhMod} onChange={e => setDhMod(parseInt(e.target.value) || 0)} className="w-20 bg-transparent text-center font-black text-white outline-none text-2xl" />
                                <button onClick={() => adjustValue(setDhMod, 1)} className="w-16 h-full text-slate-600 hover:text-white transition-colors"><i className="fa-solid fa-plus"></i></button>
                            </div>
                            <button onClick={handleDhRoll} className="w-full bg-gradient-to-r from-amber-600 to-amber-700 text-black font-black py-5 rounded-[2rem] shadow-2xl shadow-amber-900/20 active:scale-95 transition-all flex items-center justify-center gap-4 hover:from-amber-500 hover:to-amber-600">
                                <i className="fa-solid fa-shield-heart text-black/50 text-xl"></i>
                                <span className="text-[12px] uppercase tracking-[0.3em]">Roll Check</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}
