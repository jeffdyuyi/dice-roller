import { useMqttContext } from '../contexts/MqttContext';
import { useOutletContext, Link } from 'react-router-dom';

export function Home() {
    const { commState, activeCharacter } = useMqttContext();
    const { openRoomModal } = useOutletContext<{ openRoomModal: () => void }>();

    // If connected to a room, we might just show a placeholder or let Layout handle it.
    // For now, if connected, just show the dashboard so the user can navigate.
    if (commState === 'CONNECTED') {
        const char = activeCharacter;
        return (
            <div className="flex-1 w-full h-full flex flex-col p-6 md:p-8 bg-x-dark">
                <div className="mb-6 flex items-end justify-between border-b border-x-border pb-4">
                    <div>
                        <h2 className="text-[24px] font-sans font-semibold text-x-white tracking-tight">{char?.name || '公共笔记'}</h2>
                        <p className="text-[12px] font-mono uppercase tracking-xai text-x-muted mt-1">{char?.summary || '当前在房间中的共享区域或私人备忘录'}</p>
                    </div>
                </div>
                <div className="flex-1 bg-x-surface border border-x-border p-6 overflow-y-auto custom-scrollbar">
                    {char?.memoContent ? (
                        <div className="prose prose-invert prose-p:font-sans prose-headings:font-sans max-w-none text-[14px]">
                            {/* We just show raw text or markdown here. For simplicity, pre-wrap text if no markdown parser is handy. */}
                            <pre className="whitespace-pre-wrap font-sans text-x-white font-normal bg-transparent p-0 m-0 border-none">{char.memoContent}</pre>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-x-muted">
                            <p className="text-[12px] font-mono uppercase tracking-xai">暂无记录内容，或您是以访客身份加入。</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Dashboard View for disconnected state
    return (
        <div className="flex-1 h-full w-full bg-x-dark p-6 md:p-12 overflow-y-auto custom-scrollbar flex flex-col items-center justify-center">
            <div className="w-full max-w-7xl h-full md:h-[60vh] flex flex-col md:flex-row gap-6 md:gap-8 items-stretch">
                
                {/* Room Connection */}
                <button 
                    onClick={openRoomModal}
                    className="flex-1 group flex flex-col text-left bg-transparent p-8 md:p-12 hover:bg-x-surface rounded-none transition-all duration-500 ease-out relative overflow-hidden min-h-[160px] border border-x-border"
                >
                    <div className="absolute top-8 right-8 font-mono font-bold text-x-muted/20 text-6xl group-hover:scale-110 transition-transform duration-500 ease-out">01</div>
                    <h2 className="text-[32px] md:text-[40px] font-sans font-semibold tracking-tight text-x-white leading-none mb-4 z-10">联机大厅</h2>
                    <div className="mt-auto z-10">
                        <span className="inline-block px-4 py-2 text-[12px] font-mono uppercase tracking-xai text-x-dark bg-x-white rounded-none transition-colors">创建或加入房间</span>
                    </div>
                </button>

                {/* Character Library */}
                <Link 
                    to="/characters"
                    className="flex-1 group flex flex-col text-left bg-transparent p-8 md:p-12 hover:bg-x-surface rounded-none transition-all duration-500 ease-out relative overflow-hidden min-h-[160px] border border-x-border"
                >
                    <div className="absolute top-8 right-8 font-mono font-bold text-x-muted/20 text-6xl group-hover:scale-110 transition-transform duration-500 ease-out">02</div>
                    <h2 className="text-[32px] md:text-[40px] font-sans font-semibold tracking-tight text-x-white leading-none mb-4 z-10">备忘库存</h2>
                    <div className="mt-auto z-10">
                        <span className="inline-block px-4 py-2 text-[12px] font-mono uppercase tracking-xai text-x-dark bg-x-white rounded-none transition-colors">创建、管理与导出备忘</span>
                    </div>
                </Link>

            </div>
        </div>
    );
}
