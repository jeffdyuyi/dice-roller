import { useState, useMemo } from 'react';
import { DICE_TYPES, type DiceType, rollStandardDice, parseAndRollFormula, rollDaggerheart } from '../lib/diceCore';
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

    const diceGroups = useMemo(() => {
        const groups: Record<string, DiceType[]> = {
            '常用/Core': ['d20', 'd6', 'd100'],
            '进阶/Special': ['d4', 'd8', 'd10', 'd12']
        };
        return groups;
    }, []);

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
        <aside className="w-full md:w-[360px] bg-white border-r border-slate-100 flex flex-col h-[60%] md:h-full shrink-0 shadow-2xl z-20 overflow-hidden relative">
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50/40 rounded-full blur-[80px] -mr-24 -mt-24 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-50/30 rounded-full blur-[60px] -ml-16 -mb-16 pointer-events-none"></div>

            {/* Connection Status Button */}
            <div className="p-4 border-b border-slate-50 relative z-10 shrink-0">
                <button
                    onClick={commState === 'CONNECTED' ? () => setManagerOpen(true) : onOpenRoom}
                    className={`w-full group relative overflow-hidden py-3.5 rounded-2xl flex flex-col items-center justify-center transition-all shadow-xl active:scale-95 border-2 ${commState === 'CONNECTED'
                        ? 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white border-indigo-200 shadow-indigo-100'
                        : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-600 hover:text-indigo-600'
                        }`}
                >
                    {commState === 'CONNECTED' && (
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    )}
                    <div className="flex items-center gap-2.5 relative">
                        <i className={`fa-solid ${commState === 'CONNECTED' ? 'fa-tower-broadcast' : 'fa-network-wired'} text-base animate-pulse-slow`}></i>
                        <span className="text-[11px] font-black uppercase tracking-[0.15em]">{commState === 'CONNECTED' ? '时空接入管理' : '建立时空联接'}</span>
                    </div>
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-slate-50/80 backdrop-blur-sm border-b border-slate-100 shrink-0 px-2 py-1 gap-1">
                {(['standard', 'formula', 'daggerheart'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all rounded-xl ${activeTab === tab
                            ? 'bg-white text-indigo-600 shadow-sm border border-slate-100'
                            : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                            }`}
                    >
                        {tab === 'standard' ? '标准' : tab === 'formula' ? '公式' : '匕首心'}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:custom-scrollbar relative z-10 space-y-10 pb-32">

                {activeTab === 'standard' && (
                    <div className="animate-in fade-in slide-in-from-left-2 duration-300 space-y-8">
                        {/* Adjusters */}
                        <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    <i className="fa-solid fa-layer-group text-[8px]"></i>
                                    投掷数量
                                </label>
                                <div className="flex items-center h-12 bg-white border-2 border-slate-100 rounded-2xl shadow-sm focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-50 transition-all overflow-hidden">
                                    <button onClick={() => adjustValue(setDiceCount, -1, 1)} className="w-12 h-full flex items-center justify-center text-slate-400 hover:bg-slate-50 active:scale-90 transition-all">
                                        <i className="fa-solid fa-minus text-xs"></i>
                                    </button>
                                    <input type="number" value={diceCount} onChange={e => setDiceCount(Math.max(1, parseInt(e.target.value) || 1))} className="flex-1 min-w-0 bg-transparent text-center font-black text-slate-800 outline-none text-base" />
                                    <button onClick={() => adjustValue(setDiceCount, 1)} className="w-12 h-full flex items-center justify-center text-slate-400 hover:bg-slate-50 active:scale-90 transition-all">
                                        <i className="fa-solid fa-plus text-xs"></i>
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    <i className="fa-solid fa-calculator text-[8px]"></i>
                                    额外修正
                                </label>
                                <div className="flex items-center h-12 bg-white border-2 border-slate-100 rounded-2xl shadow-sm focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-50 transition-all overflow-hidden">
                                    <button onClick={() => adjustValue(setDiceMod, -1)} className="w-12 h-full flex items-center justify-center text-slate-400 hover:bg-slate-50 active:scale-90 transition-all">
                                        <i className="fa-solid fa-minus text-xs"></i>
                                    </button>
                                    <input type="number" value={diceMod} onChange={e => setDiceMod(parseInt(e.target.value) || 0)} className="flex-1 min-w-0 bg-transparent text-center font-black text-slate-800 outline-none text-base" />
                                    <button onClick={() => adjustValue(setDiceMod, 1)} className="w-12 h-full flex items-center justify-center text-slate-400 hover:bg-slate-50 active:scale-90 transition-all">
                                        <i className="fa-solid fa-plus text-xs"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Dice Grids */}
                        {Object.entries(diceGroups).map(([groupName, dices]) => (
                            <div key={groupName} className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-3.5 bg-indigo-600 rounded-full"></div>
                                        <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{groupName}</h3>
                                    </div>
                                    <div className="h-px flex-1 bg-slate-100 ml-4"></div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    {dices.map(type => (
                                        <button
                                            key={type}
                                            onClick={() => handleStandardRoll(DICE_TYPES[type].sides)}
                                            className={`group relative aspect-square rounded-[2rem] flex flex-col items-center justify-center transition-all active:scale-90 shadow-lg border-2 border-transparent overflow-hidden ${type === 'd20'
                                                ? 'bg-slate-50 border-indigo-200 text-slate-900 shadow-indigo-100'
                                                : 'bg-white border-slate-100 text-slate-900 hover:border-indigo-600 shadow-slate-100'
                                                }`}
                                        >
                                            {/* Sparkle effect on d20 */}
                                            {type === 'd20' && (
                                                <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-500/10 blur-xl -mr-4 -mt-4 group-hover:bg-indigo-500/20 transition-all"></div>
                                            )}
                                            <i className={`fa-solid ${DICE_TYPES[type].icon} ${type === 'd20' ? 'text-4xl' : 'text-2xl'} mb-1.5 drop-shadow-sm group-hover:translate-y-[-2px] transition-transform text-slate-900`}></i>
                                            <span className={`text-[10px] font-black tracking-widest uppercase ${type === 'd20' ? 'text-indigo-600' : 'text-slate-400 group-hover:text-indigo-400'}`}>{type}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Custom Sides */}
                        <div className="pt-6 border-t-2 border-dashed border-slate-100 space-y-3">
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">自定义异形骰 (Custom)</label>
                            <div className="flex gap-3 h-12">
                                <div className="relative flex-1 group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                                        <i className="fa-solid fa-dice-d6 text-slate-300 text-xs group-focus-within:text-indigo-500 transition-colors"></i>
                                        <span className="text-slate-300 font-mono text-xs group-focus-within:text-indigo-400 font-black">D</span>
                                    </div>
                                    <input type="number" value={customSides} onChange={e => setCustomSides(parseInt(e.target.value) || 0)} className="w-full h-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-600 pl-14 pr-4 rounded-2xl text-slate-700 font-bold outline-none transition-all text-sm" />
                                </div>
                                <button onClick={() => handleStandardRoll(customSides)} className="bg-slate-800 hover:bg-slate-900 text-white px-8 rounded-2xl transition-all font-black text-[11px] uppercase tracking-widest shadow-lg shadow-slate-200 active:scale-95 flex items-center gap-2">
                                    <i className="fa-solid fa-paper-plane text-[9px]"></i>
                                    投掷
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'formula' && (
                    <div className="animate-in slide-in-from-right-2 duration-300 space-y-8">
                        {/* Independent Formula Board */}
                        <div className="bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden group ring-8 ring-slate-100">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-3xl pointer-events-none"></div>

                            <div className="flex justify-between items-center mb-4">
                                <label className="flex items-center gap-2 text-[9px] font-black text-indigo-400 uppercase tracking-widest leading-none">
                                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                                    公式运算板 Board
                                </label>
                                <button onClick={() => setFormulaText('')} className="text-slate-500 hover:text-white transition-colors">
                                    <i className="fa-solid fa-trash-can text-sm"></i>
                                </button>
                            </div>

                            <textarea
                                value={formulaText}
                                onChange={e => setFormulaText(e.target.value)}
                                rows={2}
                                className="w-full bg-transparent text-white font-mono text-2xl focus:outline-none placeholder-slate-700 resize-none custom-scrollbar"
                                placeholder="2d20 + 1d6 + 8"
                            ></textarea>

                            <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                                <div className="flex gap-2 text-[10px] font-black text-slate-500">
                                    <span className="text-indigo-500">FORMAT:</span>
                                    <span>NdX + M</span>
                                </div>
                                <button onClick={handleFormulaRoll} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-indigo-900 transition-all active:scale-95 flex items-center gap-2">
                                    <i className="fa-solid fa-bolt-lightning"></i>
                                    计算
                                </button>
                            </div>
                        </div>

                        {/* Specialized Keypad */}
                        <div className="bg-white border-2 border-slate-100 rounded-[2rem] p-4 shadow-sm space-y-4">
                            <div className="grid grid-cols-4 gap-2.5">
                                {['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].map(d => (
                                    <button
                                        key={d}
                                        onClick={() => insertText(d)}
                                        className="h-12 bg-slate-50 text-slate-500 rounded-xl text-[11px] font-black hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-90"
                                    >
                                        {d.toUpperCase()}
                                    </button>
                                ))}
                                <button onClick={() => {
                                    const lastChar = formulaText.trim().slice(-1);
                                    if (['+', '-'].includes(lastChar)) {
                                        setFormulaText(prev => prev.trim().slice(0, -1));
                                    } else {
                                        setFormulaText(prev => prev.slice(0, -1));
                                    }
                                }} className="h-12 bg-red-50 text-red-400 rounded-xl text-lg flex items-center justify-center hover:bg-red-400 hover:text-white transition-all">
                                    <i className="fa-solid fa-delete-left"></i>
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => insertText('+')} className="h-14 bg-slate-100 text-slate-700 rounded-2xl font-black text-xl hover:bg-indigo-100 hover:text-indigo-600 transition-all active:scale-90">+</button>
                                    <button onClick={() => insertText('-')} className="h-14 bg-slate-100 text-slate-700 rounded-2xl font-black text-2xl hover:bg-indigo-100 hover:text-indigo-600 transition-all active:scale-90">-</button>
                                </div>
                                <div className="grid grid-cols-1">
                                    <button onClick={handleFormulaRoll} className="h-14 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl font-black text-xs shadow-xl shadow-indigo-100 active:scale-95 flex items-center justify-center gap-2">
                                        <i className="fa-solid fa-wand-magic-sparkles"></i>
                                        快速施放
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'daggerheart' && (
                    <div className="animate-in slide-in-from-right-2 duration-300 flex flex-col items-center space-y-12 py-4">
                        <div className="flex gap-10 items-center relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/5 rounded-full blur-[40px] pointer-events-none"></div>

                            <div className="flex flex-col items-center gap-3 group">
                                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-500 rounded-[2.5rem] shadow-2xl shadow-orange-100 flex items-center justify-center border-4 border-white transform transition-transform group-hover:rotate-12">
                                    <i className="fa-solid fa-sun text-white text-3xl"></i>
                                </div>
                                <span className="text-[11px] font-black text-orange-400 uppercase tracking-[0.2em]">希望骰 Hope</span>
                            </div>

                            <div className="z-10 bg-white px-3 py-1 rounded-full border-2 border-slate-100 text-slate-200 font-black text-lg italic shadow-sm">VS</div>

                            <div className="flex flex-col items-center gap-3 group">
                                <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-800 rounded-[2.5rem] shadow-2xl shadow-purple-100 flex items-center justify-center border-4 border-white transform transition-transform group-hover:-rotate-12">
                                    <i className="fa-solid fa-moon text-white text-3xl"></i>
                                </div>
                                <span className="text-[11px] font-black text-purple-600 uppercase tracking-[0.2em]">恐惧骰 Fear</span>
                            </div>
                        </div>

                        <div className="w-full space-y-4 px-4">
                            <label className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                <div className="h-px flex-1 bg-slate-100"></div>
                                属性与难度修正
                                <div className="h-px flex-1 bg-slate-100"></div>
                            </label>
                            <div className="flex items-center justify-center h-16 bg-white border-2 border-slate-100 rounded-3xl shadow-sm focus-within:ring-8 focus-within:ring-indigo-50 focus-within:border-indigo-600 transition-all overflow-hidden mx-8">
                                <button onClick={() => adjustValue(setDhMod, -1)} className="w-16 h-full text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all active:scale-75">
                                    <i className="fa-solid fa-minus text-lg"></i>
                                </button>
                                <input type="number" value={dhMod} onChange={e => setDhMod(parseInt(e.target.value) || 0)} className="w-20 bg-transparent text-center font-black text-slate-800 outline-none text-2xl" />
                                <button onClick={() => adjustValue(setDhMod, 1)} className="w-16 h-full text-slate-300 hover:text-green-500 hover:bg-green-50 transition-all active:scale-75">
                                    <i className="fa-solid fa-plus text-lg"></i>
                                </button>
                            </div>
                        </div>

                        <button onClick={handleDhRoll} className="w-full relative group bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-3xl shadow-2xl shadow-indigo-100 active:scale-95 transition-all overflow-hidden flex items-center justify-center gap-4">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                            <i className="fa-solid fa-shield-heart text-xl text-indigo-200"></i>
                            <span className="text-sm uppercase tracking-[0.2em]">执行判定 Roll Check</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="p-5 bg-slate-50/50 border-t border-slate-100 relative z-10 shrink-0">
                <div className="flex items-center justify-center gap-2 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
                    <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                    <div className="text-[9px] font-black text-slate-400 tracking-[0.4em] uppercase">Engine v2.5 Stable</div>
                    <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                </div>
            </div>
        </aside>
    );
}
