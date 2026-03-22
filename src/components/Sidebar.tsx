import React, { useState } from 'react';
import { rollStandardDice, parseAndRollFormula, rollDaggerheart } from '../lib/diceCore';

interface SidebarProps {
    onRoll: (rollData: any) => void;
    onToggleRoom: () => void;
    roomStatusText: string;
}

export function Sidebar({ onRoll, onToggleRoom, roomStatusText }: SidebarProps) {
    const [activeTab, setActiveTab] = useState('standard');
    const [diceCount, setDiceCount] = useState(1);
    const [diceMod, setDiceMod] = useState(0);
    const [customSides, setCustomSides] = useState('');
    const [formula, setFormula] = useState('');
    const [dhMod, setDhMod] = useState(0);
    const [isRollingDh, setIsRollingDh] = useState(false);

    const adjustVal = (val: number, delta: number, min?: number) => {
        let n = val + delta;
        if (min !== undefined && n < min) n = min;
        return n;
    };

    const handleStandardRoll = (sides: number) => {
        const res = rollStandardDice(diceCount, sides, diceMod);
        if (res) onRoll(res);
    };

    const handleCustomRoll = () => {
        const s = parseInt(customSides);
        if (!s || s < 2) return alert("无效面数");
        const res = rollStandardDice(diceCount, s, diceMod);
        if (res) onRoll(res);
    };

    const insertFormula = (txt: string) => {
        setFormula(prev => prev + (txt === '+' || txt === '-' ? ` ${txt} ` : txt));
    };

    const handleFormulaRoll = () => {
        try {
            const res = parseAndRollFormula(formula);
            onRoll(res);
        } catch (e: any) {
            alert(e.message);
        }
    };

    const handleDhRoll = () => {
        if (isRollingDh) return;
        setIsRollingDh(true);
        setTimeout(() => {
            const res = rollDaggerheart(dhMod);
            onRoll(res);
            setIsRollingDh(false);
        }, 600);
    };

    return (
        <div className="w-full md:w-[400px] flex flex-col bg-slate-800 border-b md:border-b-0 md:border-r border-slate-700 z-20 shadow-2xl shrink-0 h-[55%] md:h-full">
            {/* Header */}
            <div className="bg-slate-900 p-4 border-b border-slate-700 shrink-0 flex items-center justify-between">
                <h1 className="text-lg font-bold flex items-center gap-2 text-indigo-400 cursor-pointer hover:text-indigo-300 transition-colors select-none">
                    <i className="fa-solid fa-dice-d20"></i> 秘密基地骰子工具
                </h1>
                <div className="flex items-center gap-3">
                    <button onClick={onToggleRoom} className="text-xs font-bold flex items-center gap-2 text-indigo-400 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 hover:bg-slate-700 hover:text-white transition-colors">
                        <i className="fa-solid fa-network-wired"></i> <span>{roomStatusText}</span>
                    </button>
                    <div className="text-xs text-slate-500 font-mono">v2.4 React</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-800 border-b border-slate-700 shrink-0">
                <button onClick={() => setActiveTab('standard')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition ${activeTab === 'standard' ? 'bg-slate-700 text-white border-b-2 border-indigo-400' : 'text-slate-400'}`}>标准</button>
                <button onClick={() => setActiveTab('formula')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition ${activeTab === 'formula' ? 'bg-slate-700 text-white border-b-2 border-indigo-400' : 'text-slate-400'}`}>公式</button>
                <button onClick={() => setActiveTab('daggerheart')} className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition ${activeTab === 'daggerheart' ? 'bg-slate-700 text-white border-b-2 border-indigo-400' : 'text-slate-400'}`}>匕首心</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {activeTab === 'standard' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">数量 (N)</label>
                                <div className="relative flex items-center">
                                    <button onClick={() => setDiceCount(c => adjustVal(c, -1, 1))} className="w-8 h-10 bg-slate-700 hover:bg-slate-600 rounded-l text-slate-300">-</button>
                                    <input type="number" value={diceCount} onChange={e => setDiceCount(parseInt(e.target.value) || 1)} className="flex-1 h-10 bg-slate-900 border-y border-slate-700 text-center text-white font-mono focus:outline-none" />
                                    <button onClick={() => setDiceCount(c => adjustVal(c, 1))} className="w-8 h-10 bg-slate-700 hover:bg-slate-600 rounded-r text-slate-300">+</button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase tracking-wider">修正 (+/-)</label>
                                <div className="relative flex items-center">
                                    <button onClick={() => setDiceMod(c => adjustVal(c, -1))} className="w-8 h-10 bg-slate-700 hover:bg-slate-600 rounded-l text-slate-300">-</button>
                                    <input type="number" value={diceMod} onChange={e => setDiceMod(parseInt(e.target.value) || 0)} className="flex-1 h-10 bg-slate-900 border-y border-slate-700 text-center text-white font-mono focus:outline-none" />
                                    <button onClick={() => setDiceMod(c => adjustVal(c, 1))} className="w-8 h-10 bg-slate-700 hover:bg-slate-600 rounded-r text-slate-300">+</button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            {[4, 6, 8, 10, 12, 100].map(d => (
                                <button key={d} onClick={() => handleStandardRoll(d)} className="dice-btn bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded shadow-lg flex flex-col items-center justify-center gap-1 group">
                                    <span className="text-[10px] opacity-70">D{d}</span>
                                    <span className="font-mono font-bold text-lg leading-none">{d === 100 ? '%' : d}</span>
                                </button>
                            ))}
                            <button onClick={() => handleStandardRoll(20)} className="dice-btn col-span-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 text-white font-bold py-4 rounded shadow-lg flex items-center justify-center gap-3 mt-2">
                                <i className="fa-solid fa-dice-d20 text-2xl group-hover:rotate-180 transition-transform duration-500"></i>
                                <span className="text-xl tracking-widest">投掷 D20</span>
                            </button>
                        </div>

                        <div className="pt-4 border-t border-slate-700/50">
                            <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">自定义面数</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">D</span>
                                    <input type="number" value={customSides} onChange={e => setCustomSides(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCustomRoll()} placeholder="50" className="w-full bg-slate-900 border border-slate-700 pl-8 pr-3 py-2 rounded text-white h-10" />
                                </div>
                                <button onClick={handleCustomRoll} className="bg-slate-700 hover:bg-slate-600 text-white px-4 rounded text-sm h-10">投掷</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'formula' && (
                    <div className="space-y-4">
                        <div className="bg-slate-900/50 p-3 rounded border border-slate-700/50">
                            <textarea value={formula} onChange={e => setFormula(e.target.value)} rows={2} className="w-full bg-transparent text-white focus:outline-none font-mono text-lg resize-none" placeholder="2d6 + 1d8..."></textarea>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].map(b => (
                                <button key={b} onClick={() => insertFormula(b)} className="bg-slate-700 hover:bg-slate-600 py-3 rounded text-slate-300 font-mono">{b}</button>
                            ))}
                            <button onClick={() => setFormula('')} className="bg-red-900/30 text-red-400 py-3 rounded"><i className="fa-solid fa-trash"></i></button>
                            <button onClick={() => insertFormula('+')} className="bg-slate-600 text-white py-3 rounded">+</button>
                            <button onClick={() => insertFormula('-')} className="bg-slate-600 text-white py-3 rounded">-</button>
                            <button onClick={handleFormulaRoll} className="col-span-2 bg-indigo-600 text-white py-3 rounded"><i className="fa-solid fa-calculator"></i> 计算</button>
                        </div>
                    </div>
                )}

                {activeTab === 'daggerheart' && (
                    <div className="flex flex-col items-center pt-4">
                        <div className="w-full mb-6 px-4">
                            <label className="block text-[10px] font-bold text-slate-500 mb-1 text-center">额外修正</label>
                            <div className="relative flex items-center justify-center">
                                <button onClick={() => setDhMod(c => c - 1)} className="w-10 h-10 bg-slate-700">-</button>
                                <input type="number" value={dhMod} onChange={e => setDhMod(parseInt(e.target.value) || 0)} className="w-20 h-10 bg-slate-900 text-center text-white" />
                                <button onClick={() => setDhMod(c => c + 1)} className="w-10 h-10 bg-slate-700">+</button>
                            </div>
                        </div>
                        <button onClick={handleDhRoll} disabled={isRollingDh} className={`w-full bg-gradient-to-r ${isRollingDh ? 'opacity-50' : ''} from-yellow-700 via-slate-700 to-purple-800 text-white py-4 rounded-lg shadow-lg`}>进行判定</button>
                    </div>
                )}
            </div>
        </div>
    );
}
