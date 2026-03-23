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
        <aside className="w-full md:w-[320px] bg-[#18182a] border-r border-[#bf953f]/10 flex flex-col h-[60%] md:h-full shrink-0 shadow-2xl z-20 overflow-hidden relative">
            {/* Dark Background Decor */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#bf953f]/5 rounded-full blur-[80px] -mr-24 -mt-24 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-900/5 rounded-full blur-[60px] -ml-16 -mb-16 pointer-events-none"></div>

            {/* Premium Tabs */}
            <div className="flex bg-[#0c0c10]/40 border-b border-[#bf953f]/10 shrink-0 p-2 gap-2 backdrop-blur-md">
                {(['standard', 'formula', 'daggerheart'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-1.5 text-[11px] font-black uppercase tracking-wider transition-all rounded-lg border ${activeTab === tab
                            ? 'bg-[#bf953f] text-[#0c0c10] border-[#fcf6ba] shadow-lg shadow-[#bf953f]/20'
                            : 'text-[#6b6250] border-transparent hover:text-[#a89b7a] hover:bg-white/5'
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
                                <label className="flex items-center gap-2 text-[10px] font-black text-[#6b6250] uppercase tracking-[0.2em] leading-none mb-1">骰子数量</label>
                                <div className="flex items-center h-12 bg-[#1e1e30] border border-[#bf953f]/10 rounded-xl focus-within:border-[#bf953f]/50 transition-all overflow-hidden backdrop-blur-sm shadow-inner group">
                                    <button onClick={() => adjustValue(setDiceCount, -1, 1)} className="w-12 h-full text-[#6b6250] hover:text-[#bf953f] hover:bg-white/5 transition-colors"><i className="fa-solid fa-minus text-[11px]"></i></button>
                                    <input type="number" value={diceCount} onChange={e => setDiceCount(Math.max(1, parseInt(e.target.value) || 1))} className="flex-1 w-full bg-transparent text-center font-black text-[#f0ead8] outline-none text-base" />
                                    <button onClick={() => adjustValue(setDiceCount, 1)} className="w-12 h-full text-[#6b6250] hover:text-[#bf953f] hover:bg-white/5 transition-colors"><i className="fa-solid fa-plus text-[11px]"></i></button>
                                </div>
                            </div>
                            <div className="space-y-2.5">
                                <label className="flex items-center gap-2 text-[10px] font-black text-[#6b6250] uppercase tracking-[0.2em] leading-none mb-1">数值修正</label>
                                <div className="flex items-center h-12 bg-[#1e1e30] border border-[#bf953f]/10 rounded-xl focus-within:border-[#bf953f]/50 transition-all overflow-hidden backdrop-blur-sm shadow-inner group">
                                    <button onClick={() => adjustValue(setDiceMod, -1)} className="w-12 h-full text-[#6b6250] hover:text-[#bf953f] hover:bg-white/5 transition-colors"><i className="fa-solid fa-minus text-[11px]"></i></button>
                                    <input type="number" value={diceMod} onChange={e => setDiceMod(parseInt(e.target.value) || 0)} className="flex-1 w-full bg-transparent text-center font-black text-[#f0ead8] outline-none text-base" />
                                    <button onClick={() => adjustValue(setDiceMod, 1)} className="w-12 h-full text-[#6b6250] hover:text-[#bf953f] hover:bg-white/5 transition-colors"><i className="fa-solid fa-plus text-[11px]"></i></button>
                                </div>
                            </div>
                        </div>

                        {/* Custom Dice Field */}
                        <div className="pt-2 flex gap-4 h-12">
                            <div className="relative flex-1 group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
                                    <i className="fa-solid fa-dice-d6 text-[#bf953f] text-[12px]"></i>
                                    <span className="text-[#bf953f] font-mono text-[11px] font-black">D</span>
                                </div>
                                <input type="number" value={customSides} onChange={e => setCustomSides(parseInt(e.target.value) || 0)} className="w-full h-full bg-[#1e1e30] border border-[#bf953f]/10 focus:border-[#bf953f]/50 pl-14 pr-4 rounded-xl text-[#f0ead8] font-black outline-none transition-all text-sm backdrop-blur-sm" placeholder="自定义面数" />
                            </div>
                            <button onClick={() => handleStandardRoll(customSides)} className="bg-gradient-to-br from-[#bf953f] to-[#aa771c] hover:from-[#fcf6ba] hover:to-[#bf953f] text-[#0c0c10] px-8 rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-xl shadow-black/40 font-black text-[12px] uppercase tracking-widest">
                                <span>掷骰</span>
                            </button>
                        </div>

                        {/* Space-Optimized Grid */}
                        <div className="grid grid-cols-3 gap-5 pt-4">
                            {(['d20', 'd6', 'd100', 'd4', 'd8', 'd10', 'd12'] as const).map(type => (
                                <button
                                    key={type}
                                    onClick={() => handleStandardRoll(DICE_TYPES[type].sides)}
                                    className={`group relative aspect-square rounded-xl flex items-center justify-center transition-all active:scale-90 border-2 ${type === 'd20'
                                        ? 'bg-[#bf953f]/10 border-[#bf953f] text-[#bf953f] shadow-[0_0_15px_rgba(191,149,63,0.1)] gold-glow'
                                        : 'bg-[#1e1e30] border-transparent text-[#6b6250] hover:border-[#bf953f]/30 hover:text-[#bf953f] hover:bg-white/5'
                                        }`}
                                >
                                    <span className={`text-[12px] font-black tracking-tight uppercase ${type === 'd20' ? 'golden-text' : ''}`}>{type}</span>
                                    <div className="absolute inset-0 rounded-xl transition-opacity duration-300 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-[#bf953f]/5 to-transparent pointer-events-none"></div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'formula' && (
                    <div className="animate-in fade-in slide-in-from-right-2 duration-500 space-y-6">
                        <div className="bg-[#1e1e30] rounded-xl p-6 shadow-2xl border border-[#bf953f]/10 relative overflow-hidden group backdrop-blur-xl">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#bf953f]/5 blur-3xl pointer-events-none"></div>
                            <div className="flex justify-between items-center mb-4">
                                <label className="text-[10px] font-black text-[#6b6250] uppercase tracking-[0.3em] flex items-center gap-2">
                                    <i className="fa-solid fa-scroll text-[#bf953f]"></i> 符文解析指令
                                </label>
                                <button onClick={() => setFormulaText('')} className="text-[#6b6250] hover:text-red-500 transition-colors">
                                    <i className="fa-solid fa-circle-xmark"></i>
                                </button>
                            </div>
                            <textarea
                                value={formulaText}
                                onChange={e => setFormulaText(e.target.value)}
                                rows={2}
                                className="w-full bg-transparent text-[#fcf6ba] font-mono text-2xl focus:outline-none placeholder-[#6b6250]/40 resize-none leading-relaxed"
                                placeholder="输入公式 如 2d20 + 8"
                            />
                            <div className="mt-8 pt-4 border-t border-[#bf953f]/10 flex justify-between items-center">
                                <span className="text-[10px] font-black text-[#6b6250] uppercase tracking-widest">执行秘法解析</span>
                                <button onClick={handleFormulaRoll} className="bg-gradient-to-r from-[#bf953f] to-[#aa771c] hover:from-[#fcf6ba] hover:to-[#bf953f] text-[#0c0c10] px-6 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-black/40">解 析</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                            {['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].map(d => (
                                <button key={d} onClick={() => insertText(d)} className="h-11 bg-[#1e1e30] border border-transparent rounded-lg text-[10px] font-black text-[#a89b7a] hover:bg-[#bf953f] hover:text-[#0c0c10] transition-all active:scale-95">{d.toUpperCase()}</button>
                            ))}
                            <button onClick={() => setFormulaText(p => p.slice(0, -1))} className="h-11 bg-red-500/5 text-red-500 rounded-lg flex items-center justify-center border border-red-500/10 hover:bg-red-500 hover:text-white transition-all"><i className="fa-solid fa-delete-left"></i></button>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <button onClick={() => insertText('+')} className="h-14 bg-[#1e1e30] text-[#f0ead8] rounded-xl font-black text-2xl hover:bg-white/5 border border-transparent hover:border-[#bf953f]/20 transition-all active:scale-95">+</button>
                            <button onClick={() => insertText('-')} className="h-14 bg-[#1e1e30] text-[#f0ead8] rounded-xl font-black text-2xl hover:bg-white/5 border border-transparent hover:border-[#bf953f]/20 transition-all active:scale-95">-</button>
                            <button onClick={handleFormulaRoll} className="h-14 bg-gradient-to-br from-[#bf953f] to-[#aa771c] text-[#0c0c10] rounded-xl font-black text-lg shadow-xl shadow-black/40 active:scale-95 hover:from-[#fcf6ba] hover:to-[#bf953f] transition-all"><i className="fa-solid fa-wand-magic-sparkles"></i></button>
                        </div>
                    </div>
                )}

                {activeTab === 'daggerheart' && (
                    <div className="animate-in fade-in slide-in-from-right-2 duration-500 flex flex-col items-center space-y-10">
                        <div className="flex gap-8 items-center bg-[#1e1e30] p-10 rounded-xl shadow-2xl border border-[#bf953f]/10 backdrop-blur-md relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#bf953f]/5 to-transparent pointer-events-none"></div>
                            <div className="flex flex-col items-center gap-4 group relative z-10">
                                <div className="w-20 h-20 bg-gradient-to-br from-[#bf953f] to-[#aa771c] rounded-xl shadow-xl shadow-black/40 flex items-center justify-center text-[#0c0c10] text-3xl group-hover:scale-110 group-hover:rotate-3 transition-all"><i className="fa-solid fa-sun text-shadow-sm"></i></div>
                                <span className="text-[12px] font-black text-[#bf953f] uppercase tracking-[0.4em]">希 望</span>
                            </div>
                            <div className="text-[#6b6250] font-black italic text-xl select-none relative z-10">VS</div>
                            <div className="flex flex-col items-center gap-4 group relative z-10">
                                <div className="w-20 h-20 bg-gradient-to-br from-indigo-700 to-purple-900 rounded-xl shadow-xl shadow-black/40 flex items-center justify-center text-white text-3xl group-hover:scale-110 group-hover:-rotate-3 transition-all"><i className="fa-solid fa-moon"></i></div>
                                <span className="text-[12px] font-black text-indigo-400 uppercase tracking-[0.4em]">恐 惧</span>
                            </div>
                        </div>

                        <div className="w-full space-y-6">
                            <div className="flex items-center justify-center h-16 bg-[#1e1e30] border border-[#bf953f]/10 rounded-xl focus-within:border-[#bf953f]/50 transition-all overflow-hidden backdrop-blur-sm mx-2 group">
                                <button onClick={() => adjustValue(setDhMod, -1)} className="w-16 h-full text-[#6b6250] hover:text-[#f0ead8] transition-colors hover:bg-white/5"><i className="fa-solid fa-minus"></i></button>
                                <input type="number" value={dhMod} onChange={e => setDhMod(parseInt(e.target.value) || 0)} className="w-20 bg-transparent text-center font-black text-[#f0ead8] outline-none text-2xl" />
                                <button onClick={() => adjustValue(setDhMod, 1)} className="w-16 h-full text-[#6b6250] hover:text-[#f0ead8] transition-colors hover:bg-white/5"><i className="fa-solid fa-plus"></i></button>
                            </div>
                            <button onClick={handleDhRoll} className="w-full bg-gradient-to-r from-[#bf953f] to-[#aa771c] hover:from-[#fcf6ba] hover:to-[#bf953f] text-[#0c0c10] font-black py-5 rounded-xl shadow-2xl shadow-black/60 active:scale-95 transition-all flex items-center justify-center gap-4">
                                <i className="fa-solid fa-shield-heart text-[#0c0c10]/50 text-xl"></i>
                                <span className="text-[14px] uppercase tracking-[0.4em]">结 果 判 定</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}
