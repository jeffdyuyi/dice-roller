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
            '常用': ['d20', 'd6', 'd100'],
            '进阶': ['d4', 'd8', 'd10', 'd12']
        };
        return groups;
    }, []);

    const handleStandardRoll = (sides: number) => {
        const result = rollStandardDice(diceCount, sides, diceMod);
        onRoll(result);
    };

    const handleFormulaRoll = () => {
        try {
            const result = parseAndRollFormula(formulaText);
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
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -mr-16 -mt-16"></div>

            {/* Connection Status Button */}
            <div className="p-4 border-b border-slate-50 relative z-10 shrink-0">
                <button
                    onClick={commState === 'CONNECTED' ? () => setManagerOpen(true) : onOpenRoom}
                    className={`w-full py-3 rounded-2xl flex flex-col items-center justify-center transition-all shadow-xl group border-2 ${commState === 'CONNECTED'
                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-indigo-100 shadow-indigo-100'
                        : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-600 hover:text-indigo-600'
                        }`}
                >
                    <div className="flex items-center gap-2">
                        <i className={`fa-solid ${commState === 'CONNECTED' ? 'fa-tower-broadcast' : 'fa-network-wired'} text-base group-hover:scale-110 transition-transform`}></i>
                        <span className="text-xs font-black uppercase tracking-widest">{commState === 'CONNECTED' ? '时空接入管理' : '建立时空联接'}</span>
                    </div>
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-slate-50 border-b border-slate-100 shrink-0">
                {(['standard', 'formula', 'daggerheart'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        {tab === 'standard' ? '标准' : tab === 'formula' ? '公式' : '匕首心'}
                        {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"></div>}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-5 md:custom-scrollbar relative z-10 space-y-8 pb-32">

                {activeTab === 'standard' && (
                    <div className="animate-in fade-in duration-300 space-y-6">
                        {/* Settings */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">数量骰 (N)</label>
                                <div className="flex items-center bg-slate-50 border-2 border-slate-100 rounded-xl overflow-hidden group focus-within:border-indigo-200">
                                    <button onClick={() => adjustValue(setDiceCount, -1, 1)} className="w-10 h-10 hover:bg-white text-slate-400 active:text-indigo-600 transition-colors">-</button>
                                    <input type="number" value={diceCount} onChange={e => setDiceCount(Math.max(1, parseInt(e.target.value) || 1))} className="flex-1 bg-transparent text-center font-black text-slate-700 outline-none text-sm" />
                                    <button onClick={() => adjustValue(setDiceCount, 1)} className="w-10 h-10 hover:bg-white text-slate-400 active:text-indigo-600 transition-colors">+</button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">修正值 (+/-)</label>
                                <div className="flex items-center bg-slate-50 border-2 border-slate-100 rounded-xl overflow-hidden group focus-within:border-indigo-200">
                                    <button onClick={() => adjustValue(setDiceMod, -1)} className="w-10 h-10 hover:bg-white text-slate-400 active:text-indigo-600 transition-colors">-</button>
                                    <input type="number" value={diceMod} onChange={e => setDiceMod(parseInt(e.target.value) || 0)} className="flex-1 bg-transparent text-center font-black text-slate-700 outline-none text-sm" />
                                    <button onClick={() => adjustValue(setDiceMod, 1)} className="w-10 h-10 hover:bg-white text-slate-400 active:text-indigo-600 transition-colors">+</button>
                                </div>
                            </div>
                        </div>

                        {/* Dice Grids */}
                        {Object.entries(diceGroups).map(([groupName, dices]) => (
                            <div key={groupName} className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-3 bg-indigo-200 rounded-full"></div>
                                    <h3 className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{groupName} 骰子</h3>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {dices.map(type => (
                                        <button
                                            key={type}
                                            onClick={() => handleStandardRoll(DICE_TYPES[type].sides)}
                                            className={`aspect-square rounded-3xl flex flex-col items-center justify-center transition-all group active:scale-90 shadow-lg border-2 border-transparent ${type === 'd20'
                                                ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-indigo-100'
                                                : 'bg-white border-slate-50 text-slate-400 hover:border-indigo-100 hover:text-indigo-600 shadow-slate-100'
                                                }`}
                                        >
                                            <i className={`fa-solid ${DICE_TYPES[type].icon} ${type === 'd20' ? 'text-3xl' : 'text-xl'} mb-1`}></i>
                                            <span className={`text-[10px] font-black uppercase ${type === 'd20' ? 'text-indigo-100' : 'text-slate-300'}`}>{type}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Custom Sides */}
                        <div className="pt-4 border-t border-dashed border-slate-100 space-y-3">
                            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">自定义面数</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1 group">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-mono text-sm group-within:text-indigo-400">D</span>
                                    <input type="number" value={customSides} onChange={e => setCustomSides(parseInt(e.target.value) || 0)} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-200 pl-8 pr-4 py-2.5 rounded-2xl text-slate-700 font-bold outline-none transition-all text-sm" />
                                </div>
                                <button onClick={() => handleStandardRoll(customSides)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-2xl transition-all font-black text-xs shadow-lg shadow-indigo-100 active:scale-95">投掷</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'formula' && (
                    <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
                        <div className="bg-slate-50 rounded-3xl p-5 border-2 border-slate-100 group focus-within:border-indigo-200 transition-all">
                            <label className="block text-[8px] font-black text-slate-400 mb-3 uppercase tracking-widest group-focus-within:text-indigo-600">公式输入框 (Construction)</label>
                            <textarea
                                value={formulaText}
                                onChange={e => setFormulaText(e.target.value)}
                                rows={2}
                                className="w-full bg-transparent text-slate-800 font-mono text-xl focus:outline-none placeholder-slate-200 resize-none"
                                placeholder="2d20 + 1d6 + 5"
                            ></textarea>
                        </div>

                        {/* Keypad */}
                        <div className="grid grid-cols-4 gap-3">
                            {['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].map(d => (
                                <button key={d} onClick={() => insertText(d)} className="py-3 bg-white border-2 border-slate-50 text-slate-400 rounded-2xl text-[10px] font-black hover:border-indigo-100 hover:text-indigo-600 transition-all shadow-sm">{d.toUpperCase()}</button>
                            ))}
                            <button onClick={() => setFormulaText('')} className="py-3 bg-orange-50 text-orange-400 rounded-2xl text-[10px] font-black border-2 border-orange-50 hover:bg-orange-100 transition-all shadow-sm">清除</button>

                            <button onClick={() => insertText('+')} className="py-3 bg-slate-50 text-slate-600 rounded-2xl font-black text-lg hover:bg-slate-100 transition-all">+</button>
                            <button onClick={() => insertText('-')} className="py-3 bg-slate-50 text-slate-600 rounded-2xl font-black text-xl hover:bg-slate-100 transition-all">-</button>
                            <button onClick={handleFormulaRoll} className="col-span-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs shadow-lg shadow-indigo-100 group active:scale-95">
                                <span className="flex items-center justify-center gap-2">
                                    <i className="fa-solid fa-calculator text-[10px]"></i>
                                    计算结果
                                </span>
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'daggerheart' && (
                    <div className="animate-in slide-in-from-right-4 duration-300 flex flex-col items-center space-y-10 py-4">
                        <div className="flex gap-8 items-center">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-3xl shadow-xl shadow-orange-100 flex items-center justify-center border-2 border-white">
                                    <i className="fa-solid fa-sun text-white text-2xl"></i>
                                </div>
                                <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">希望骰</span>
                            </div>
                            <div className="text-slate-100 font-black text-xl italic select-none">VS</div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-3xl shadow-xl shadow-purple-100 flex items-center justify-center border-2 border-white">
                                    <i className="fa-solid fa-moon text-white text-2xl"></i>
                                </div>
                                <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">恐惧骰</span>
                            </div>
                        </div>

                        <div className="w-full space-y-2 px-8">
                            <label className="block text-[8px] font-black text-slate-400 text-center uppercase tracking-widest leading-none mb-1">额外修正</label>
                            <div className="flex items-center justify-center bg-slate-50 border-2 border-slate-100 rounded-2xl overflow-hidden group focus-within:border-indigo-200 h-12">
                                <button onClick={() => adjustValue(setDhMod, -1)} className="w-12 h-full hover:bg-white text-slate-400 active:text-indigo-600 transition-colors">-</button>
                                <input type="number" value={dhMod} onChange={e => setDhMod(parseInt(e.target.value) || 0)} className="w-16 bg-transparent text-center font-black text-slate-700 outline-none text-base" />
                                <button onClick={() => adjustValue(setDhMod, 1)} className="w-12 h-full hover:bg-white text-slate-400 active:text-indigo-600 transition-colors">+</button>
                            </div>
                        </div>

                        <button onClick={handleDhRoll} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-100 active:scale-95 transition-all text-xs flex items-center justify-center gap-3">
                            <i className="fa-solid fa-shield-heart text-sm"></i>
                            开始双骰判定
                        </button>
                    </div>
                )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 relative z-10 shrink-0">
                <div className="text-[9px] font-black text-center text-slate-300 tracking-[0.3em] uppercase">Secret Base Engine v2.4</div>
            </div>
        </aside>
    );
}
