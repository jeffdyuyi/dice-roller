import { useMqttContext } from '../contexts/MqttContext';
import { ruleRegistry } from '../features/characters/rule-engines/registry';

interface CharacterInspectorProps {
    playerId: string;
    onClose: () => void;
}

export function CharacterInspector({ playerId, onClose }: CharacterInspectorProps) {
    const { connectedPlayers, isHost, adjustCharacter } = useMqttContext();

    const player = connectedPlayers.find(p => p.id === playerId);
    if (!player) return null;

    const engine = player.ruleSystem ? ruleRegistry[player.ruleSystem] : null;
    const CardComp = engine?.CardComponent;
    const InspectorComp = isHost ? engine?.HostInspectorComponent : null;

    const handleAdjust = (newData: Record<string, any>) => {
        adjustCharacter(playerId, newData);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>

            <div className="relative w-full max-w-4xl bg-[#141420] border border-[#bf953f]/30 rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col lg:flex-row animate-in zoom-in-95 duration-300 h-full max-h-[85vh]">

                {/* Left: Card Preview */}
                <div className="w-full lg:w-1/2 p-6 lg:p-10 bg-black/20 flex flex-col border-b lg:border-b-0 lg:border-r border-[#bf953f]/10 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-[#bf953f]/10 rounded-xl flex items-center justify-center text-[#bf953f] border border-[#bf953f]/20">
                            <i className="fa-solid fa-address-card"></i>
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-[#f0ead8] uppercase tracking-widest">角色预览</h3>
                            <p className="text-[9px] font-bold text-[#6b6250] uppercase tracking-widest mt-0.5">{player.name} 的人物卡</p>
                        </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center">
                        {CardComp ? (
                            <div className="w-full max-w-sm transform hover:scale-[1.02] transition-transform duration-500">
                                <CardComp data={player.characterData || {}} />
                            </div>
                        ) : (
                            <div className="text-slate-600 italic text-xs font-black uppercase tracking-widest opacity-40">解析引擎未挂载</div>
                        )}
                    </div>
                </div>

                {/* Right: Host Controls */}
                <div className="w-full lg:w-1/2 p-6 lg:p-10 flex flex-col overflow-y-auto custom-scrollbar">
                    <div className="flex justify-between items-start mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                <i className="fa-solid fa-sliders"></i>
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-[#f0ead8] uppercase tracking-widest">{isHost ? '主持人管理' : '实时状态'}</h3>
                                <p className="text-[9px] font-bold text-[#6b6250] uppercase tracking-widest mt-0.5">{engine?.displayName || '未知规则'}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 rounded-xl hover:bg-white/5 text-slate-500 transition-colors flex items-center justify-center">
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <div className="flex-1">
                        {isHost ? (
                            InspectorComp ? (
                                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                                    <div className="p-4 bg-[#bf953f]/5 border border-[#bf953f]/10 rounded-xl mb-6">
                                        <p className="text-[10px] text-[#bf953f] font-black leading-relaxed">
                                            <i className="fa-solid fa-circle-info mr-2"></i>
                                            作为主持人，您的物理修改将实时同步至玩家本地存档。
                                        </p>
                                    </div>
                                    <InspectorComp data={player.characterData || {}} onChange={handleAdjust} />
                                </div>
                            ) : (
                                <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
                                    <i className="fa-solid fa-ban text-4xl text-slate-800 mb-4 block"></i>
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest leading-relaxed">该规则系统暂未开放<br />主持人远程修改接口</p>
                                </div>
                            )
                        ) : (
                            <div className="p-12 text-center">
                                <i className="fa-solid fa-lock text-4xl text-slate-800 mb-4 block"></i>
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest leading-relaxed">仅支持房主进行<br />角色属性微调</p>
                            </div>
                        )}
                    </div>

                    {isHost && (
                        <div className="mt-8 pt-6 border-t border-white/5">
                            <button className="w-full bg-[#bf953f]/10 hover:bg-[#bf953f]/20 text-[#bf953f] py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.3em] transition-all">
                                查看详细履历日志
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
