import type { HostInspectorProps } from '../types';

export function Dnd5eHostInspector({ data, onChange }: HostInspectorProps) {
    const hp = data.hp || { current: 10, max: 10 };
    const level = data.level || 1;

    const adjustHP = (delta: number) => {
        const next = Math.min(hp.max, Math.max(0, hp.current + delta));
        onChange({ ...data, hp: { ...hp, current: next } });
    };

    const setMaxHP = (val: number) => {
        onChange({ ...data, hp: { ...hp, max: val, current: Math.min(hp.current, val) } });
    };

    const setLevel = (val: number) => {
        onChange({ ...data, level: val });
    };

    return (
        <div className="space-y-6">
            {/* Status Section */}
            <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">生命值控制</span>
                    <span className={`text-xs font-black ${hp.current < hp.max * 0.3 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {hp.current} / {hp.max}
                    </span>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => adjustHP(-1)}
                        className="flex-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 py-2 rounded-lg font-black text-xs transition-all"
                    >
                        -1
                    </button>
                    <button
                        onClick={() => adjustHP(-5)}
                        className="flex-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 py-2 rounded-lg font-black text-xs transition-all text-red-500/60"
                    >
                        -5
                    </button>
                    <button
                        onClick={() => adjustHP(5)}
                        className="flex-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20 py-2 rounded-lg font-black text-xs transition-all"
                    >
                        +5
                    </button>
                    <button
                        onClick={() => adjustHP(1)}
                        className="flex-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20 py-2 rounded-lg font-black text-xs transition-all text-emerald-500/60"
                    >
                        +1
                    </button>
                </div>
            </div>

            {/* Level Section */}
            <div className="grid grid-cols-2 gap-4">
                <div className="group">
                    <label className="block text-[9px] font-black text-slate-500 mb-1.5 uppercase tracking-widest ml-1">修改等级</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={level}
                            onChange={(e) => setLevel(parseInt(e.target.value) || 1)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-black text-sm outline-none focus:border-amber-500/50 transition-all"
                        />
                    </div>
                </div>
                <div className="group">
                    <label className="block text-[9px] font-black text-slate-500 mb-1.5 uppercase tracking-widest ml-1">最大生命</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={hp.max}
                            onChange={(e) => setMaxHP(parseInt(e.target.value) || 1)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white font-black text-sm outline-none focus:border-red-500/50 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t border-white/5">
                <button
                    onClick={() => adjustHP(hp.max)}
                    className="w-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all"
                >
                    快长休 (满血)
                </button>
            </div>
        </div>
    );
}
