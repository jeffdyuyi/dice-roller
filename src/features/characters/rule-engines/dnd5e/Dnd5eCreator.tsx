import type { CreatorProps } from '../types';

export function Dnd5eCreator({ data, onChange }: CreatorProps) {
    const updateField = (field: string, val: any) => {
        onChange({ ...data, [field]: val });
    };

    const updateAbility = (ab: string, val: number) => {
        const abilities = { ...(data.abilities || {}) };
        abilities[ab] = val;
        onChange({ ...data, abilities });
    };

    const hp = (data.hp as any) || { current: 10, max: 10 };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest group-within:text-indigo-500 transition-colors">冒险职业</label>
                    <input type="text" value={data.class || ''} onChange={e => updateField('class', e.target.value)} className="w-full bg-white border-2 border-slate-100 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-800 font-bold transition-all outline-none" placeholder="例如：战士 / 游侠" />
                </div>
                <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest group-within:text-indigo-500 transition-colors">出生种族</label>
                    <input type="text" value={data.race || ''} onChange={e => updateField('race', e.target.value)} className="w-full bg-white border-2 border-slate-100 focus:border-indigo-500 rounded-xl px-4 py-3 text-slate-800 font-bold transition-all outline-none" placeholder="例如：人类 / 精灵" />
                </div>
            </div>

            <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">六大基础属性</label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {Object.entries({ str: '力量', dex: '敏捷', con: '体质', int: '智力', wis: '感知', cha: '魅力' }).map(([key, label]) => (
                        <div key={key} className="flex flex-col gap-2 p-3 bg-white border-2 border-slate-100 hover:border-indigo-200 rounded-2xl transition-all">
                            <span className="text-[10px] font-black text-slate-400 uppercase text-center">{label}</span>
                            <input type="number" value={data.abilities?.[key] || 10} onChange={e => updateAbility(key, parseInt(e.target.value) || 0)} className="w-full bg-slate-50 rounded-xl py-2 text-slate-800 font-black text-center outline-none ring-indigo-500 focus:ring-2" />
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest group-within:text-red-500 transition-colors">最大生命值</label>
                    <div className="relative">
                        <input type="number" value={hp.max} onChange={e => updateField('hp', { max: parseInt(e.target.value) || 10, current: parseInt(e.target.value) || 10 })} className="w-full bg-white border-2 border-slate-100 focus:border-red-500 rounded-xl px-4 py-3 text-slate-800 font-black transition-all outline-none" />
                        <i className="fa-solid fa-heart-pulse absolute right-4 top-1/2 -translate-y-1/2 text-red-100 group-hover:text-red-500 transition-colors"></i>
                    </div>
                </div>
                <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest group-within:text-orange-500 transition-colors">初始等级</label>
                    <input type="number" value={data.level || 1} onChange={e => updateField('level', parseInt(e.target.value) || 1)} className="w-full bg-white border-2 border-slate-100 focus:border-orange-500 rounded-xl px-4 py-3 text-slate-800 font-black transition-all outline-none" />
                </div>
            </div>
        </div>
    );
}
