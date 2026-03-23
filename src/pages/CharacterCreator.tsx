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
            <div className="flex justify-center items-center h-full text-[#6b6250] bg-[#0c0c10]">
                <h2 className="text-xl font-black uppercase tracking-widest opacity-50">未登录，无法进行档案录入。</h2>
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
        <div className="flex flex-col lg:flex-row w-full h-full bg-[#0c0c10] text-[#f0ead8] relative">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-amber-900/5 rounded-full blur-[140px] -mr-[30vw] -mt-[30vw] pointer-events-none"></div>

            {/* Form Section */}
            <div className="w-full lg:w-3/5 p-6 md:p-12 bg-[#18182a]/95 border-r border-[#bf953f]/10 shadow-[20px_0_100px_rgba(0,0,0,0.6)] z-10 overflow-y-auto custom-scrollbar relative">
                {/* Noise Texture */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

                <div className="flex justify-between items-center mb-16 relative z-10">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-gradient-to-br from-[#bf953f] to-[#aa771c] text-[#0c0c10] rounded-xl flex items-center justify-center shadow-xl shadow-black/40">
                            <i className="fa-solid fa-wand-magic-sparkles text-2xl"></i>
                        </div>
                        <div>
                            <h1 className="text-3xl font-black golden-text tracking-widest uppercase">档案塑造 Grimoire Entry</h1>
                            <p className="text-[11px] font-black text-[#6b6250] uppercase tracking-[0.4em] mt-1">灵魂与属性的炼金记录</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-12 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div>
                            <label className="block text-[10px] font-black text-[#6b6250] mb-3 uppercase tracking-[0.3em]">领域核心规则 Core Rules</label>
                            <div className="relative group">
                                <select value={ruleSystem} onChange={e => { setRuleSystem(e.target.value); setCharData({}); }} className="w-full bg-[#1e1e30] border border-[#bf953f]/10 focus:border-[#bf953f]/60 rounded-xl px-6 py-4 text-[#f0ead8] font-black transition-all outline-none appearance-none hover:bg-[#25253a] shadow-inner">
                                    {Object.values(ruleRegistry).map(r => (
                                        <option key={r.id} value={r.id} className="bg-[#18182a]">{r.displayName}</option>
                                    ))}
                                </select>
                                <i className="fa-solid fa-chevron-down absolute right-6 top-1/2 -translate-y-1/2 text-[#6b6250] pointer-events-none group-hover:text-[#bf953f] transition-colors"></i>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-[#6b6250] mb-3 uppercase tracking-[0.3em]">领域代号 Character Name</label>
                            <input type="text" value={charName} onChange={e => setCharName(e.target.value)} className="w-full bg-[#1e1e30] border border-[#bf953f]/10 focus:border-[#bf953f]/60 rounded-xl px-6 py-4 text-[#bf953f] font-black text-xl transition-all outline-none placeholder-[#6b6250]/40 shadow-inner hover:bg-[#25253a]" placeholder="输入您的冒险者代号..." />
                        </div>
                    </div>

                    <div className="pt-12 border-t border-[#bf953f]/10">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-2.5 h-8 bg-[#bf953f] rounded-full shadow-[0_0_15px_rgba(191,149,63,0.6)]"></div>
                            <h2 className="text-sm font-black text-[#f0ead8] uppercase tracking-[0.5em]">{engine?.displayName} 模组子档案</h2>
                        </div>
                        <div className="bg-[#141420]/60 p-10 rounded-xl border border-[#bf953f]/10 shadow-2xl">
                            {CreatorComp ? (
                                <CreatorComp data={charData} onChange={setCharData} />
                            ) : (
                                <div className="text-[#6b6250] italic p-16 text-center text-[11px] font-black uppercase tracking-widest opacity-40">此处之扉尚未刻印，该规则缺失塑造界面。</div>
                            )}
                        </div>
                    </div>

                    <div className="pt-12 flex justify-end">
                        <button onClick={handleSave} className="bg-gradient-to-r from-[#bf953f] to-[#aa771c] hover:from-[#fcf6ba] hover:to-[#bf953f] text-[#0c0c10] font-black py-5 px-16 rounded-xl shadow-2xl shadow-black/80 transition-all active:scale-95 flex items-center gap-4 uppercase tracking-[0.2em] text-sm">
                            <i className="fa-solid fa-scroll text-lg opacity-60"></i>
                            刻印并同步至云端
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview Section */}
            <div className="w-full lg:w-2/5 p-12 flex flex-col items-center justify-center relative overflow-hidden bg-[#0c0c10]">
                {/* Background Decoration */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-900/5 rounded-full blur-[160px] pointer-events-none"></div>

                <div className="relative z-10 w-full max-w-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-8 self-start bg-[#1e1e30] border border-[#bf953f]/20 px-4 py-2 rounded-lg shadow-xl shadow-black/40">
                        <i className="fa-solid fa-eye text-[#bf953f] text-xs animate-pulse"></i>
                        <span className="text-[11px] font-black text-[#bf953f] uppercase tracking-[0.4em]">档案实时观测 Preview</span>
                    </div>

                    <div className="transform hover:rotate-2 transition-all duration-700">
                        {CardComp && <CardComp data={{ ...charData, name: charName }} />}
                        {!charName && <div className="text-center mt-6 p-16 bg-[#141420]/80 backdrop-blur-3xl border-2 border-dashed border-[#bf953f]/20 rounded-xl text-[12px] text-[#6b6250] font-black uppercase tracking-widest leading-relaxed shadow-2xl">
                            <i className="fa-solid fa-fingerprint text-5xl block mb-6 opacity-20 text-[#bf953f] animate-pulse"></i>
                            请先刻印姓名<br />以便显现档案预览
                        </div>}
                    </div>
                </div>
            </div>
        </div>
    );
}
