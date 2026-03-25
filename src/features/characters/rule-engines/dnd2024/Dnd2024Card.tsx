import type { CardProps } from '../types';

export function Dnd2024Card({ data }: CardProps) {
    const session = data.session || {};
    const abilities = data.abilities || {};

    const hp = session.hp ?? data.hpMax ?? 0;
    const maxHp = data.hpMax ?? 0;
    const tempHp = session.tempHp ?? 0;
    const hpPercent = maxHp > 0 ? Math.min(100, (hp / maxHp) * 100) : 0;

    return (
        <div className="w-full bg-[#1c1c28] border-2 border-[#bf953f]/30 rounded-3xl overflow-hidden shadow-2xl group transition-all duration-500 hover:shadow-[#bf953f]/10">
            {/* Header: Class & Level */}
            <div className="p-5 bg-gradient-to-r from-[#bf953f]/20 via-[#1c1c28] to-[#141420] border-b border-[#bf953f]/20 relative">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-black text-[#f0ead8] tracking-tight">{data.name || '未知领域者'}</h3>
                        <p className="text-[10px] font-bold text-[#bf953f] uppercase tracking-widest mt-1">
                            {data.species} · {data.className} ({data.subclass})
                        </p>
                    </div>
                    <div className="bg-[#bf953f] text-[#0c0c10] px-3 py-1 rounded-lg font-black text-sm shadow-lg">
                        LV.{data.level}
                    </div>
                </div>
            </div>

            {/* Health Bar Section */}
            <div className="px-6 py-4 bg-black/20">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">生命状态</span>
                    <div className="text-right">
                        {tempHp > 0 && <span className="text-[10px] font-black text-indigo-400 mr-2">+{tempHp} 临时</span>}
                        <span className="text-sm font-black text-[#f0ead8] font-mono">{hp} / {maxHp}</span>
                    </div>
                </div>
                <div className="h-2.5 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5 relative">
                    <div
                        className="h-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-700 shadow-[0_0_10px_rgba(239,68,68,0.3)]"
                        style={{ width: `${hpPercent}%` }}
                    />
                    {tempHp > 0 && (
                        <div
                            className="absolute top-0 h-full bg-indigo-500/50 transition-all duration-700"
                            style={{
                                left: `${hpPercent}%`,
                                width: `${Math.min(100 - hpPercent, (tempHp / maxHp) * 100)}%`
                            }}
                        />
                    )}
                </div>
            </div>

            {/* Core Stats Grid */}
            <div className="p-6 grid grid-cols-3 gap-3">
                {Object.entries({ '力量': 'STR', '敏捷': 'DEX', '体质': 'CON', '智力': 'INT', '感知': 'WIS', '魅力': 'CHA' }).map(([name, code]) => {
                    const val = abilities[name] || 10;
                    const mod = Math.floor((val - 10) / 2);
                    return (
                        <div key={code} className="bg-white/5 border border-white/5 py-3 rounded-2xl flex flex-col items-center group/stat hover:bg-[#bf953f]/5 hover:border-[#bf953f]/20 transition-all">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{name}</span>
                            <span className="text-lg font-black text-[#f0ead8] font-mono">{val}</span>
                            <span className="text-[10px] font-bold text-[#bf953f] opacity-60">
                                {mod >= 0 ? `+${mod}` : mod}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Resources / Spell Slots Summary */}
            <div className="px-6 pb-6 space-y-3">
                <div className="flex flex-wrap gap-2">
                    {session.customResources?.map((res: any, idx: number) => (
                        <div key={idx} className="bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
                            <span className="text-[9px] font-black text-indigo-300 uppercase tracking-wider">{res.name}</span>
                            <span className="text-xs font-black text-[#f0ead8] font-mono">{res.current}/{res.max}</span>
                        </div>
                    ))}
                    {session.conditions?.map((cond: string, idx: number) => (
                        <div key={idx} className="bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
                            <i className="fa-solid fa-skull-crossbones text-[10px] text-red-400"></i>
                            <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">{cond}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer: Gold */}
            <div className="px-6 py-4 bg-black/40 border-t border-white/5 flex justify-between items-center mt-auto">
                <div className="flex items-center gap-2">
                    <i className="fa-solid fa-coins text-[#bf953f] text-xs"></i>
                    <span className="text-[10px] font-black text-[#fcf6ba] tracking-widest uppercase">
                        {data.currency?.gp || 0} GP
                    </span>
                </div>
                <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">D&D 2024 VERSION</span>
            </div>
        </div>
    );
}
