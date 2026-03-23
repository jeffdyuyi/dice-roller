import { useState } from 'react';
import { DICE_TYPES, rollStandardDice, parseAndRollFormula, rollDaggerheart } from '../lib/diceCore';
import { useMqttContext } from '../contexts/MqttContext';

interface SidebarProps {
    onRoll: (rollData: any) => void;
    onOpenRoom: () => void;
    commState: string;
}

export function Sidebar({ onRoll, onOpenRoom, commState }: SidebarProps) {
    const { setManagerOpen } = useMqttContext();
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
        <aside className="w-full md:w-[320px] bg-[#fffdfa] border-r border-amber-50 flex flex-col h-[60%] md:h-full shrink-0 shadow-xl z-20 overflow-hidden relative">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-50/60 rounded-full blur-[80px] -mr-24 -mt-24 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-50/40 rounded-full blur-[60px] -ml-16 -mb-16 pointer-events-none"></div>

            {/* Top Bar: Connection & Version */}
            <div className="p-3 border-b border-amber-50 relative z-10 shrink-0 bg-white/40 backdrop-blur-md">
                <button
                    onClick={commState === 'CONNECTED' ? () => setManagerOpen(true) : onOpenRoom}
                    className={`w-full group relative overflow-hidden py-2.5 rounded-xl flex flex-col items-center justify-center transition-all active:scale-95 border-2 mb-2 ${commState === 'CONNECTED'
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-400 shadow-lg shadow-orange-100'
                        : 'bg-white border-amber-100 text-amber-500 hover:border-amber-500 hover:bg-amber-50/50'
                        }`}
                >
                    <div className="flex items-center gap-2 relative">
                        <i className={`fa-solid ${commState === 'CONNECTED' ? 'fa-tower-broadcast' : 'fa-network-wired'} text-[10px]`}></i>
                        <span className="text-[10px] font-black uppercase tracking-[0.1em]">{commState === 'CONNECTED' ? '时空接入管理' : '建立时空联结'}</span>
                    </div>
                </button>

                <div className="flex items-center justify-center gap-2 opacity-40">
                    <div className="w-0.5 h-0.5 bg-amber-400 rounded-full"></div>
                    <div className="text-[8px] font-black text-amber-600 tracking-[0.3em] uppercase">Engine v2.5 Stable</div>
                    <div className="w-0.5 h-0.5 bg-amber-400 rounded-full"></div>
                </div>
            </div>

            {/* Compact Tabs */}
            <div className="flex bg-amber-50/30 border-b border-amber-50 shrink-0 p-1 gap-1">
                {(['standard', 'formula', 'daggerheart'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all rounded-lg ${activeTab === tab
                            ? 'bg-white text-orange-600 shadow-sm border border-amber-100'
                            : 'text-amber-800/40 hover:text-amber-600 hover:bg-white/50'
                            }`}
                    >
                        {tab === 'standard' ? '标准' : tab === 'formula' ? '公式' : '判定'}
                    </button>
                ))}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 md:px-5 md:py-6 md:custom-scrollbar relative z-10 space-y-6">
                {activeTab === 'standard' && (
                    <div className="animate-in fade-in slide-in-from-left-1 duration-300 space-y-6">
                        {/* Compact Counter & Mod */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1 text-[8px] font-black text-amber-400 uppercase tracking-widest leading-none">数量 Count</label>
                                <div className="flex items-center h-10 bg-white border-2 border-amber-50 rounded-xl focus-within:border-orange-300 transition-all overflow-hidden">
                                    <button onClick={() => adjustValue(setDiceCount, -1, 1)} className="w-10 h-full text-amber-300 hover:bg-amber-50"><i className="fa-solid fa-minus text-[10px]"></i></button>
                                    <input type="number" value={diceCount} onChange={e => setDiceCount(Math.max(1, parseInt(e.target.value) || 1))} className="flex-1 w-full bg-transparent text-center font-black text-slate-800 outline-none text-sm" />
                                    <button onClick={() => adjustValue(setDiceCount, 1)} className="w-10 h-full text-amber-300 hover:bg-amber-50"><i className="fa-solid fa-plus text-[10px]"></i></button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="flex items-center gap-1 text-[8px] font-black text-amber-400 uppercase tracking-widest leading-none">修正 Mod</label>
                                <div className="flex items-center h-10 bg-white border-2 border-amber-50 rounded-xl focus-within:border-orange-300 transition-all overflow-hidden">
                                    <button onClick={() => adjustValue(setDiceMod, -1)} className="w-10 h-full text-amber-300 hover:bg-amber-50"><i className="fa-solid fa-minus text-[10px]"></i></button>
                                    <input type="number" value={diceMod} onChange={e => setDiceMod(parseInt(e.target.value) || 0)} className="flex-1 w-full bg-transparent text-center font-black text-slate-800 outline-none text-sm" />
                                    <button onClick={() => adjustValue(setDiceMod, 1)} className="w-10 h-full text-amber-300 hover:bg-amber-50"><i className="fa-solid fa-plus text-[10px]"></i></button>
                                </div>
                            </div>
                        </div>

                        {/* Custom Dice Field */}
                        <div className="pt-2 border-t border-amber-100 flex gap-2 h-10">
                            <div className="relative flex-1 group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
                                    <i className="fa-solid fa-dice-d6 text-orange-500 text-[10px]"></i>
                                    <span className="text-orange-600 font-mono text-[10px] font-black">D</span>
                                </div>
                                <input type="number" value={customSides} onChange={e => setCustomSides(parseInt(e.target.value) || 0)} className="w-full h-full bg-amber-50/20 border-2 border-amber-100 focus:border-orange-400 pl-10 pr-3 rounded-xl text-orange-800 font-black outline-none transition-all text-sm" placeholder="Sides" />
                            </div>
                            <button onClick={() => handleStandardRoll(customSides)} className="bg-orange-500 hover:bg-orange-600 text-white px-4 rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-100">
                                <i className="fa-solid fa-paper-plane text-[9px]"></i>
                                <span className="font-black text-[10px] uppercase">投掷</span>
                            </button>
                        </div>

                        {/* Space-Optimized Grid */}
                        <div className="grid grid-cols-3 gap-3 pt-2">
                            {(['d20', 'd6', 'd100', 'd4', 'd8', 'd10', 'd12'] as const).map(type => (
                                <button
                                    key={type}
                                    onClick={() => handleStandardRoll(DICE_TYPES[type].sides)}
                                    className={`group relative aspect-square rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-sm border-[2.5px] ${type === 'd20'
                                        ? 'bg-amber-50 border-orange-400 text-orange-700 font-black'
                                        : 'bg-white border-amber-100 text-slate-500 hover:border-orange-300 hover:text-orange-600'
                                        }`}
                                >
                                    <span className="text-[11px] font-black tracking-tighter uppercase">{type}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'formula' && (
                    <div className="animate-in fade-in slide-in-from-right-1 duration-300 space-y-4">
                        <div className="bg-amber-900 rounded-3xl p-5 shadow-inner border-2 border-amber-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/10 blur-3xl pointer-events-none"></div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[8px] font-black text-amber-400/60 uppercase tracking-widest flex items-center gap-1.5">
                                    <i className="fa-solid fa-microchip animate-pulse"></i> Calculation Log
                                </label>
                                <button onClick={() => setFormulaText('')} className="text-amber-700 hover:text-orange-400">
                                    <i className="fa-solid fa-circle-xmark"></i>
                                </button>
                            </div>
                            <textarea
                                value={formulaText}
                                onChange={e => setFormulaText(e.target.value)}
                                rows={2}
                                className="w-full bg-transparent text-white font-mono text-xl focus:outline-none placeholder-amber-800/80 resize-none"
                                placeholder="2d20 + 8"
                            />
                            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
                                <span className="text-[8px] font-black text-amber-700 uppercase">Input NdX + M</span>
                                <button onClick={handleFormulaRoll} className="bg-orange-500 hover:bg-orange-400 text-white px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all">计算 Run</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            {['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].map(d => (
                                <button key={d} onClick={() => insertText(d)} className="h-10 bg-white border border-amber-100 rounded-xl text-[9px] font-black text-slate-600 hover:bg-amber-500 hover:text-white transition-all active:scale-90">{d.toUpperCase()}</button>
                            ))}
                            <button onClick={() => setFormulaText(p => p.slice(0, -1))} className="h-10 bg-red-50 text-red-400 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"><i className="fa-solid fa-delete-left"></i></button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => insertText('+')} className="h-12 bg-amber-50 text-amber-700 rounded-2xl font-black text-xl hover:bg-amber-500 hover:text-white transition-all">+</button>
                            <button onClick={() => insertText('-')} className="h-12 bg-amber-50 text-amber-700 rounded-2xl font-black text-xl hover:bg-amber-500 hover:text-white transition-all">-</button>
                            <button onClick={handleFormulaRoll} className="h-12 bg-orange-500 text-white rounded-2xl font-black text-xs shadow-lg shadow-orange-100 active:scale-95"><i className="fa-solid fa-wand-magic-sparkles"></i></button>
                        </div>
                    </div>
                )}

                {activeTab === 'daggerheart' && (
                    <div className="animate-in fade-in slide-in-from-right-1 duration-300 flex flex-col items-center space-y-6">
                        <div className="flex gap-8 items-center bg-white p-6 rounded-[2.5rem] shadow-sm border border-amber-50">
                            <div className="flex flex-col items-center gap-2 group">
                                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl shadow-lg shadow-orange-50 flex items-center justify-center text-white text-2xl group-hover:scale-110 transition-transform"><i className="fa-solid fa-sun"></i></div>
                                <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest">希望 Hope</span>
                            </div>
                            <div className="text-amber-200 font-black italic text-lg">VS</div>
                            <div className="flex flex-col items-center gap-2 group">
                                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl shadow-lg shadow-indigo-50 flex items-center justify-center text-white text-2xl group-hover:scale-110 transition-transform"><i className="fa-solid fa-moon"></i></div>
                                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">恐惧 Fear</span>
                            </div>
                        </div>

                        <div className="w-full px-4 space-y-4">
                            <div className="flex items-center justify-center h-14 bg-white border-2 border-amber-50 rounded-2xl focus-within:border-orange-300 transition-all overflow-hidden mx-4">
                                <button onClick={() => adjustValue(setDhMod, -1)} className="w-12 h-full text-amber-200 hover:text-orange-500"><i className="fa-solid fa-minus"></i></button>
                                <input type="number" value={dhMod} onChange={e => setDhMod(parseInt(e.target.value) || 0)} className="w-16 bg-transparent text-center font-black text-slate-800 outline-none text-xl" />
                                <button onClick={() => adjustValue(setDhMod, 1)} className="w-12 h-full text-amber-200 hover:text-orange-500"><i className="fa-solid fa-plus"></i></button>
                            </div>
                            <button onClick={handleDhRoll} className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black py-4 rounded-3xl shadow-xl shadow-orange-100 active:scale-95 transition-all flex items-center justify-center gap-3">
                                <i className="fa-solid fa-shield-heart text-amber-200"></i>
                                <span className="text-[10px] uppercase tracking-[0.2em]">判定 Roll Check</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}
