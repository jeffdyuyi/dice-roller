import type { HostInspectorProps } from '../types';

export function Dnd2024HostInspector({ data, onChange }: HostInspectorProps) {
    const session = data.session || { hp: 0, tempHp: 0, conditions: [], customResources: [] };
    const hp = session.hp ?? data.hpMax ?? 0;
    const maxHp = data.hpMax ?? 0;
    const tempHp = session.tempHp ?? 0;

    const updateSession = (fields: Partial<typeof session>) => {
        onChange({ ...data, session: { ...session, ...fields } });
    };

    const adjustHP = (delta: number) => {
        const next = Math.min(maxHp, Math.max(0, hp + delta));
        updateSession({ hp: next });
    };

    const adjustTempHP = (val: number) => {
        updateSession({ tempHp: val });
    };

    const updateResource = (idx: number, current: number) => {
        const resources = [...(session.customResources || [])];
        if (resources[idx]) {
            resources[idx] = { ...resources[idx], current: Math.min(resources[idx].max, Math.max(0, current)) };
            updateSession({ customResources: resources });
        }
    };

    const toggleCondition = (cond: string) => {
        const conditions = [...(session.conditions || [])];
        const next = conditions.includes(cond)
            ? conditions.filter(c => c !== cond)
            : [...conditions, cond];
        updateSession({ conditions: next });
    };

    const updateStat = (name: string, val: number) => {
        const abilities = { ...(data.abilities || {}) };
        abilities[name] = val;
        onChange({ ...data, abilities });
    };

    const updateCurrency = (key: string, val: number) => {
        const currency = { ...(data.currency || {}) };
        currency[key] = val;
        onChange({ ...data, currency });
    };

    const commonConditions = ["受擒", "倒地", "失能", "力竭", "中毒", "麻痹", "石化", "恐慌", "魅惑", "隐形"];

    return (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500 pb-12">
            {/* HP Management */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <i className="fa-solid fa-heart-pulse text-red-500"></i>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">生命值与生存状态</h4>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-black/40 p-5 rounded-2xl border border-white/5">
                    <div className="space-y-3">
                        <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase">当前生命值</div>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-black text-white font-mono">{hp}</span>
                            <div className="flex gap-1">
                                <button onClick={() => adjustHP(-1)} className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-[10px] font-black transition-all">-1</button>
                                <button onClick={() => adjustHP(1)} className="w-8 h-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white text-[10px] font-black transition-all">+1</button>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-3 pl-4 border-l border-white/10">
                        <div className="flex justify-between text-[8px] font-black text-slate-500 uppercase tracking-widest text-indigo-400">临时生命值</div>
                        <input
                            type="number"
                            value={tempHp}
                            onChange={(e) => adjustTempHP(parseInt(e.target.value) || 0)}
                            className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-white font-black text-lg font-mono outline-none focus:border-indigo-500/50"
                        />
                    </div>
                </div>
            </section>

            {/* Custom Resources / Spell Slots */}
            {session.customResources && session.customResources.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center gap-3">
                        <i className="fa-solid fa-wand-sparkles text-indigo-400"></i>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">职业特性与法术资源</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {session.customResources.map((res: any, idx: number) => (
                            <div key={idx} className="bg-white/5 border border-white/5 p-4 rounded-xl group/res hover:border-indigo-500/30 transition-all">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-[9px] font-black text-indigo-300 uppercase truncate pr-2">{res.name}</span>
                                    <span className="text-xs font-black text-white font-mono">{res.current} / {res.max}</span>
                                </div>
                                <div className="flex gap-1.5">
                                    {Array.from({ length: res.max }).map((_, slotIdx) => (
                                        <button
                                            key={slotIdx}
                                            onClick={() => updateResource(idx, slotIdx < res.current ? slotIdx : slotIdx + 1)}
                                            className={`h-2.5 rounded-sm flex-1 transition-all ${slotIdx < res.current ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.3)]' : 'bg-slate-800'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Conditions */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <i className="fa-solid fa-biohazard text-amber-500"></i>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">异常状态面板</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                    {commonConditions.map(cond => {
                        const active = session.conditions?.includes(cond);
                        return (
                            <button
                                key={cond}
                                onClick={() => toggleCondition(cond)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${active
                                        ? 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/20'
                                        : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20'
                                    }`}
                            >
                                {cond}
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Core Stats & Currency */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/5">
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <i className="fa-solid fa-sliders text-slate-400 text-[10px]"></i>
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">属性微调</h4>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {Object.entries({ '力量': 'STR', '敏捷': 'DEX', '体质': 'CON', '智力': 'INT', '感知': 'WIS', '魅力': 'CHA' }).map(([name, code]) => (
                            <div key={code} className="bg-white/5 p-2 rounded-lg border border-white/5">
                                <span className="text-[7px] font-black text-slate-600 block text-center mb-1">{name}</span>
                                <input
                                    type="number"
                                    value={data.abilities?.[name] || 10}
                                    onChange={(e) => updateStat(name, parseInt(e.target.value) || 0)}
                                    className="w-full bg-transparent text-center text-xs font-black text-white outline-none"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <i className="fa-solid fa-coins text-amber-600 text-[10px]"></i>
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">财富管理</h4>
                    </div>
                    <div className="space-y-3 bg-amber-900/10 p-4 rounded-2xl border border-amber-900/20">
                        {['gp', 'sp', 'cp'].map(key => (
                            <div key={key} className="flex items-center justify-between gap-4">
                                <span className="text-[10px] font-black text-amber-700 uppercase tracking-[0.2em]">{key}</span>
                                <input
                                    type="number"
                                    value={data.currency?.[key] || 0}
                                    onChange={(e) => updateCurrency(key, parseInt(e.target.value) || 0)}
                                    className="bg-transparent border-b border-amber-900/30 w-16 text-right font-black text-amber-200 outline-none focus:border-amber-500"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Inventory Status (Read Only Summary) */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <i className="fa-solid fa-backpack text-slate-400 text-[10px]"></i>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">随身负载清单</h4>
                </div>
                <div className="bg-white/5 rounded-2xl border border-white/5 p-4 space-y-2">
                    {data.inventory?.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-[10px] font-bold py-1 border-b border-white/5 last:border-0">
                            <span className="text-slate-300">
                                {item.name}
                                {item.equipped && <span className="ml-2 text-[8px] bg-emerald-500/20 text-emerald-500 px-1.5 py-0.5 rounded uppercase tracking-widest">已装备</span>}
                            </span>
                            <span className="text-slate-500 font-mono">x{item.quantity}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
