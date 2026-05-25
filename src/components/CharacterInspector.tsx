import { useMqttContext } from '../contexts/MqttContext';
import { DynamicSheetRenderer } from './DynamicSheetRenderer';

interface CharacterInspectorProps {
    playerId: string;
    onClose: () => void;
}

export function CharacterInspector({ playerId, onClose }: CharacterInspectorProps) {
    const { connectedPlayers, isHost, roomTemplate, patchCharacter } = useMqttContext();

    const player = connectedPlayers.find(p => p.id === playerId);
    if (!player) return null;

    const handleAdjust = (moduleId: string, value: unknown) => {
        if (!player.characterData) return;
        patchCharacter(playerId, moduleId, value);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>

            <div className="relative w-full max-w-4xl bg-x-dark border border-x-border overflow-hidden flex flex-col lg:flex-row animate-in zoom-in-95 duration-300 h-full max-h-[85vh] font-sans">

                {/* Left: Card Preview */}
                <div className="w-full lg:w-1/2 p-6 lg:p-10 bg-x-surface flex flex-col border-b lg:border-b-0 lg:border-r border-x-border overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 border border-x-border flex items-center justify-center text-x-white font-mono text-[16px]">
                            {player.name?.[0]}
                        </div>
                        <div>
                            <h3 className="text-[14px] font-sans text-x-white uppercase leading-none mb-1">角色预览</h3>
                            <p className="text-[10px] font-mono text-x-muted uppercase tracking-xai">{player.name} 的数据</p>
                        </div>
                    </div>

                    <div className="flex-1">
                        {roomTemplate ? (
                            <DynamicSheetRenderer template={roomTemplate} data={player.characterData || {}} readonly />
                        ) : (
                            <div className="text-x-muted italic text-[12px] font-mono uppercase tracking-xai border border-dashed border-x-border p-8 text-center">模板未找到</div>
                        )}
                    </div>
                </div>

                {/* Right: Host Controls */}
                <div className="w-full lg:w-1/2 p-6 lg:p-10 flex flex-col overflow-y-auto custom-scrollbar bg-x-dark">
                    <div className="flex justify-between items-start mb-8 pb-4 border-b border-x-border">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 border border-x-border flex items-center justify-center text-x-white bg-x-surface">
                                <span className="font-mono text-[16px]">C</span>
                            </div>
                            <div>
                                <h3 className="text-[14px] font-sans text-x-white uppercase leading-none mb-1">{isHost ? '主持人管理' : '实时状态'}</h3>
                                <p className="text-[10px] font-mono text-x-muted uppercase tracking-xai">{roomTemplate?.name || '未知规则'}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 border border-x-border hover:bg-x-surface text-x-muted transition-colors flex items-center justify-center font-mono">
                            X
                        </button>
                    </div>

                    <div className="flex-1">
                        {isHost ? (
                            roomTemplate ? (
                                <div className="space-y-6">
                                    <div className="p-4 bg-x-surface border border-x-border mb-6">
                                        <p className="text-[10px] text-x-muted font-mono leading-relaxed uppercase tracking-xai">
                                            &gt; 作为主持人，您可以直接修改玩家的模块数据，将实时覆盖玩家的本地存档。
                                        </p>
                                    </div>
                                    <DynamicSheetRenderer template={roomTemplate} data={player.characterData || {}} onChange={handleAdjust} />
                                </div>
                            ) : (
                                <div className="p-12 text-center border border-dashed border-x-border">
                                    <p className="text-[12px] font-mono text-x-muted uppercase tracking-xai leading-relaxed">房间未使用模板<br />无法进行编辑</p>
                                </div>
                            )
                        ) : (
                            <div className="p-12 text-center">
                                <p className="text-[12px] font-mono text-x-muted uppercase tracking-xai leading-relaxed border border-x-border p-4 bg-x-surface">仅支持房主进行角色属性微调</p>
                            </div>
                        )}
                    </div>

                    {isHost && (
                        <div className="mt-8 pt-6 border-t border-x-border">
                            <button className="w-full bg-transparent hover:bg-x-white text-x-muted hover:text-x-dark border border-x-border py-4 font-mono text-[12px] uppercase tracking-xai transition-all">
                                [日志系统开发中]
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
