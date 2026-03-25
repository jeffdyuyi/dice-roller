import type { CreatorProps } from '../types';

export function Dnd2024Creator({ data, onChange }: CreatorProps) {
    const updateField = (field: string, val: any) => {
        onChange({ ...data, [field]: val });
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-2xl mx-auto">
            <div className="p-6 bg-[#bf953f]/5 border border-[#bf953f]/20 rounded-3xl mb-8">
                <p className="text-sm text-[#bf953f] font-black leading-relaxed">
                    <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>
                    检测到 D&D 2024 规则核心。该版本支持更加细致的 Session 状态追踪。
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest group-within:text-[#bf953f] transition-colors">角色姓名</label>
                    <input type="text" value={data.name || ''} onChange={e => updateField('name', e.target.value)} className="w-full bg-white/5 border-2 border-white/5 focus:border-[#bf953f]/50 rounded-2xl px-5 py-3.5 text-white font-black transition-all outline-none" placeholder="输入您的英雄名..." />
                </div>
                <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest group-within:text-[#bf953f] transition-colors">当前等级</label>
                    <input type="number" value={data.level || 1} onChange={e => updateField('level', parseInt(e.target.value) || 1)} className="w-full bg-white/5 border-2 border-white/5 focus:border-[#bf953f]/50 rounded-2xl px-5 py-3.5 text-white font-black transition-all outline-none" />
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-8">
                {['species', 'className', 'subclass', 'background'].map(key => (
                    <div key={key} className="group">
                        <label className="block text-[9px] font-black text-slate-500 mb-2 uppercase tracking-widest">{key === 'species' ? '物种' : key === 'className' ? '职业' : key === 'subclass' ? '子类' : '背景'}</label>
                        <input type="text" value={data[key] || ''} onChange={e => updateField(key, e.target.value)} className="w-full bg-white/5 border border-white/10 focus:border-[#bf953f]/30 rounded-xl px-4 py-2.5 text-slate-200 font-bold text-xs outline-none" />
                    </div>
                ))}
            </div>

            <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-3xl bg-black/20">
                <i className="fa-solid fa-code-merge text-4xl text-slate-800 mb-4 block"></i>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] leading-relaxed">进阶属性与法术列表<br />请在导出 JSON 中进行详细维护<br />工具将自动解析并进行实时同步</p>
            </div>
        </div>
    );
}
