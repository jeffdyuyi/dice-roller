import { useMemo } from 'react';
import { DICE_TYPES, type DiceType } from '../lib/diceCore';

interface SidebarProps {
    onRoll: (rollData: any) => void;
    onOpenRoom: () => void;
    commState: string;
}

export function Sidebar({ onRoll, onOpenRoom, commState }: SidebarProps) {
    const diceGroups = useMemo(() => {
        const groups: Record<string, DiceType[]> = {
            '常用': ['d20', 'd6', 'd100'],
            '进阶': ['d4', 'd8', 'd10', 'd12']
        };
        return groups;
    }, []);

    return (
        <aside className="w-full md:w-[320px] bg-white border-r border-slate-100 flex flex-col h-[300px] md:h-full shrink-0 shadow-lg z-20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -mr-16 -mt-16"></div>

            <div className="p-6 border-b border-slate-50 relative z-10">
                <button
                    onClick={onOpenRoom}
                    className={`w-full py-4 rounded-2xl flex flex-col items-center justify-center transition-all shadow-xl group ${commState === 'CONNECTED'
                            ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-indigo-100'
                            : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-indigo-600 hover:text-indigo-600'
                        }`}
                >
                    <div className="flex items-center gap-3">
                        <i className={`fa-solid ${commState === 'CONNECTED' ? 'fa-tower-broadcast' : 'fa-network-wired'} text-xl group-hover:scale-110 transition-transform`}></i>
                        <span className="text-sm font-black uppercase tracking-widest">{commState === 'CONNECTED' ? '联机接入中' : '点击建立时空联接'}</span>
                    </div>
                    {commState === 'CONNECTED' && <span className="text-[10px] opacity-70 mt-1 font-bold">Signal Synchronized</span>}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:custom-scrollbar relative z-10 space-y-8">
                {Object.entries(diceGroups).map(([groupName, dices]) => (
                    <div key={groupName}>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-1.5 h-4 bg-orange-400 rounded-full"></div>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{groupName} 骰池</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {dices.map(type => (
                                <button
                                    key={type}
                                    onClick={() => onRoll({ type, count: 1, bonus: 0 })}
                                    className="aspect-square bg-slate-50 border-2 border-transparent hover:border-indigo-500 hover:bg-white rounded-2xl flex flex-col items-center justify-center transition-all group active:scale-90 shadow-sm"
                                >
                                    <div className="dice-btn relative">
                                        <i className={`fa-solid ${DICE_TYPES[type].icon} text-2xl text-slate-800 opacity-60 group-hover:opacity-100 group-hover:text-indigo-600 transition-all`}></i>
                                    </div>
                                    <span className="text-[10px] font-black text-slate-400 mt-1.5 uppercase group-hover:text-indigo-600">{type}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 bg-slate-50/50 border-t border-slate-100 relative z-10">
                <div className="text-[9px] font-bold text-center text-slate-300 tracking-widest uppercase">Secret Base Engine v2.0</div>
            </div>
        </aside>
    );
}
