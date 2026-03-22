import type { CardProps } from '../types';

export function Dnd5eCard({ data, compact }: CardProps) {
    if (!data) return <div className="text-slate-400 text-xs italic">数据丢失</div>;

    const hp = (data.hp as any) || { current: 10, max: 10 };
    const abilities = (data.abilities as Record<string, number>) || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };

    return (
        <div className={`bg-white border-2 border-red-800/20 shadow-2xl rounded-[1.5rem] relative overflow-hidden flex flex-col ${compact ? 'p-3' : 'p-6'}`}>
            {/* Corner Decorative Elements */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 rotate-45 translate-x-12 -translate-y-12"></div>

            <div className="relative flex justify-between items-center mb-4 border-b-2 border-slate-100 pb-4">
                <div className="flex flex-col">
                    <span className={`${compact ? 'text-sm' : 'text-2xl'} font-black text-slate-800 uppercase tracking-tight`}>
                        {data.name || '未命名角色'}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                            {data.class || '未知职业'}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                            {data.race || '未知种族'}
                        </span>
                    </div>
                </div>

                {/* HP Diamond */}
                <div className="relative flex items-center justify-center">
                    <div className={`${compact ? 'w-10 h-10' : 'w-16 h-16'} bg-red-600 rotate-45 rounded-lg shadow-lg shadow-red-200 flex items-center justify-center overflow-hidden`}>
                        <div className="-rotate-45 flex flex-col items-center">
                            <span className={`${compact ? 'text-xs' : 'text-lg'} font-black text-white leading-none`}>{hp.current}</span>
                            {!compact && <span className="text-[8px] font-bold text-red-200 uppercase mt-0.5">HP</span>}
                        </div>
                    </div>
                </div>
            </div>

            {!compact && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                    {['str', 'dex', 'con', 'int', 'wis', 'cha'].map(ab => (
                        <div key={ab} className="bg-slate-50 border border-slate-100 rounded-2xl p-2 text-center group hover:bg-indigo-50 hover:border-indigo-100 transition-colors">
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter group-hover:text-indigo-400 transition-colors">{ab}</div>
                            <div className="text-sm font-black text-slate-800 font-mono">{abilities[ab]}</div>
                            <div className="text-[10px] font-bold text-slate-500">
                                {Math.floor((abilities[ab] - 10) / 2) >= 0 ? '+' : ''}
                                {Math.floor((abilities[ab] - 10) / 2)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {compact && (
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 px-1 pt-1 border-t border-slate-50">
                    <div className="flex gap-3">
                        <span>STR {abilities.str}</span>
                        <span>DEX {abilities.dex}</span>
                    </div>
                    <span className="text-red-500 font-black">HP {hp.current}/{hp.max}</span>
                </div>
            )}
        </div>
    );
}
