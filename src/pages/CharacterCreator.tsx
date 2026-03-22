import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/useAuth';
import { ruleRegistry } from '../features/characters/rule-engines/registry';
import { saveCharacter } from '../features/characters/api';
import type { Character } from '../features/characters/rule-engines/types';

export function CharacterCreator() {
    const { user, isLoggedIn } = useAuth();
    const navigate = useNavigate();

    const [ruleSystem, setRuleSystem] = useState('dnd5e');
    const [charName, setCharName] = useState('');
    const [charData, setCharData] = useState<Record<string, any>>({});

    if (!isLoggedIn || !user) {
        return (
            <div className="flex justify-center items-center h-full text-slate-500 bg-[#fdf8f4]">
                <h2>未登录，无法进行档案录入。</h2>
            </div>
        );
    }

    const engine = ruleRegistry[ruleSystem];
    const CreatorComp = engine?.CreatorComponent;
    const CardComp = engine?.CardComponent;

    const handleSave = () => {
        if (!charName) return alert('角色名不能为空！');
        if (engine && !engine.validateData(charData)) {
            return alert('规则要求的核心属性未填完整！');
        }

        const newChar: Character = {
            id: 'char-' + Date.now().toString(36),
            userId: user.id,
            ruleSystem,
            name: charName,
            level: charData.level || 1,
            summary: `${charData.race || ''} ${charData.class || ''}`,
            characterData: charData,
            inventory: [],
            experience: 0,
            currency: { gold: 0, silver: 0, copper: 0 },
            createdAt: Date.now()
        };

        saveCharacter(newChar);
        alert('角色卡已成功归档至秘密基地！');
        navigate('/characters');
    };

    return (
        <div className="flex flex-col lg:flex-row w-full h-full bg-[#fdf8f4]">
            {/* Form Section */}
            <div className="w-full lg:w-3/5 p-6 md:p-10 bg-white shadow-2xl z-10 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <i className="fa-solid fa-wand-magic-sparkles text-xl"></i>
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800">档案录入</h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Archive Record Entry</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-tight">TRPG 核心规则</label>
                            <div className="relative group">
                                <select value={ruleSystem} onChange={e => { setRuleSystem(e.target.value); setCharData({}); }} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl px-5 py-3 text-slate-800 font-bold transition-all outline-none appearance-none">
                                    {Object.values(ruleRegistry).map(r => (
                                        <option key={r.id} value={r.id}>{r.displayName}</option>
                                    ))}
                                </select>
                                <i className="fa-solid fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors"></i>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-tight">角色姓名</label>
                            <input type="text" value={charName} onChange={e => setCharName(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 focus:border-indigo-500 rounded-2xl px-5 py-3 text-slate-800 font-black text-lg transition-all outline-none" placeholder="输入您的冒险者代号..." />
                        </div>
                    </div>

                    <div className="pt-10 border-t border-slate-50">
                        <div className="flex items-center gap-2 mb-8">
                            <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                            <h2 className="text-sm font-black text-slate-700 uppercase tracking-widest">{engine?.displayName} 模组专用字段</h2>
                        </div>
                        <div className="bg-slate-50/50 p-6 rounded-[2rem] border-2 border-slate-100">
                            {CreatorComp ? (
                                <CreatorComp data={charData} onChange={setCharData} />
                            ) : (
                                <div className="text-slate-500 italic p-10 text-center text-xs">此处为空，该规则尚未定义车卡子组件。</div>
                            )}
                        </div>
                    </div>

                    <div className="pt-8 flex justify-end">
                        <button onClick={handleSave} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black py-4 px-12 rounded-[2rem] shadow-2xl shadow-indigo-200 transition-all active:scale-95 flex items-center gap-3">
                            <i className="fa-solid fa-cloud-arrow-up"></i>
                            确认并提交云端
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            <div className="w-full lg:w-2/5 p-10 flex flex-col items-center justify-center relative overflow-hidden">
                {/* Background Decoration */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white opacity-40 rounded-full blur-3xl"></div>

                <div className="relative z-10 w-full max-w-sm flex flex-col">
                    <div className="flex items-center gap-2 mb-6 self-start">
                        <i className="fa-solid fa-eye text-orange-500 text-xs shadow-glow-orange"></i>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">档案实时预览</span>
                    </div>

                    <div className="transform hover:rotate-1 transition-transform duration-500">
                        {CardComp && <CardComp data={{ ...charData, name: charName }} />}
                        {!charName && <div className="text-center mt-4 p-12 bg-white/50 backdrop-blur-sm border-2 border-dashed border-slate-200 rounded-[2rem] text-[11px] text-slate-400 font-bold italic leading-relaxed">
                            <i className="fa-solid fa-signature text-3xl block mb-3 opacity-30"></i>
                            请先输入姓名以在此处<br />查看档案实时回写预览
                        </div>}
                    </div>
                </div>
            </div>
        </div>
    );
}
