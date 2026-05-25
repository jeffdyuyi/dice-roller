import { Sidebar } from '../components/Sidebar';
import { MainArea } from '../components/MainArea';
import { useMqttContext } from '../contexts/MqttContext';
import { useOutletContext, Link } from 'react-router-dom';

export function Home() {
    const { diceHistory, addLocalRoll, commState } = useMqttContext();
    const { openRoomModal } = useOutletContext<{ openRoomModal: () => void }>();

    // If connected to a room, show the room interface
    if (commState === 'CONNECTED') {
        return (
            <div className="flex flex-col md:flex-row h-full w-full bg-x-dark overflow-hidden relative">
                <Sidebar onRoll={addLocalRoll} />
                <MainArea diceHistory={diceHistory} />
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
                    className="flex-1 group flex flex-col text-left bg-[#1d1d1f] p-8 md:p-12 hover:bg-[#272729] rounded-2xl shadow-apple transition-all duration-500 ease-out relative overflow-hidden min-h-[160px] border border-white/5"
                >
                    <div className="absolute top-8 right-8 font-sans font-bold text-white/5 text-6xl group-hover:scale-110 transition-transform duration-500 ease-out">01</div>
                    <h2 className="text-[32px] md:text-[40px] font-sans font-semibold tracking-tight text-white leading-none mb-4 z-10">联机大厅</h2>
                    <div className="mt-auto z-10">
                        <span className="inline-block px-4 py-2 text-[14px] font-sans text-apple-blue bg-apple-blue/10 rounded-full group-hover:bg-apple-blue/20 transition-colors">创建或加入房间</span>
                    </div>
                </button>

                {/* Character Library */}
                <Link 
                    to="/characters"
                    className="flex-1 group flex flex-col text-left bg-[#1d1d1f] p-8 md:p-12 hover:bg-[#272729] rounded-2xl shadow-apple transition-all duration-500 ease-out relative overflow-hidden min-h-[160px] border border-white/5"
                >
                    <div className="absolute top-8 right-8 font-sans font-bold text-white/5 text-6xl group-hover:scale-110 transition-transform duration-500 ease-out">02</div>
                    <h2 className="text-[32px] md:text-[40px] font-sans font-semibold tracking-tight text-white leading-none mb-4 z-10">角色库</h2>
                    <div className="mt-auto z-10">
                        <span className="inline-block px-4 py-2 text-[14px] font-sans text-apple-blue bg-apple-blue/10 rounded-full group-hover:bg-apple-blue/20 transition-colors">创建、管理与导出卡片</span>
                    </div>
                </Link>

                {/* Template Builder */}
                <Link 
                    to="/template-builder"
                    className="flex-1 group flex flex-col text-left bg-[#1d1d1f] p-8 md:p-12 hover:bg-[#272729] rounded-2xl shadow-apple transition-all duration-500 ease-out relative overflow-hidden min-h-[160px] border border-white/5"
                >
                    <div className="absolute top-8 right-8 font-sans font-bold text-white/5 text-6xl group-hover:scale-110 transition-transform duration-500 ease-out">03</div>
                    <h2 className="text-[32px] md:text-[40px] font-sans font-semibold tracking-tight text-white leading-none mb-4 z-10">模板开发</h2>
                    <div className="mt-auto z-10">
                        <span className="inline-block px-4 py-2 text-[14px] font-sans text-apple-blue bg-apple-blue/10 rounded-full group-hover:bg-apple-blue/20 transition-colors">自定义规则与动态表单</span>
                    </div>
                </Link>

            </div>
        </div>
    );
}
