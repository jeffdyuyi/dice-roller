import { useState } from 'react';
import { Sidebar } from '../components/Sidebar';
import { MainArea } from '../components/MainArea';
import { RoomModal } from '../components/RoomModal';
import { useMqttContext } from '../contexts/MqttContext';

export function Home() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { diceHistory, latestRoll, addLocalRoll, commState } = useMqttContext();

    return (
        <div className="flex flex-col md:flex-row h-full w-full bg-[#fdf8f4] overflow-hidden">
            <Sidebar onRoll={addLocalRoll} onOpenRoom={() => setIsMenuOpen(true)} commState={commState} />
            <MainArea latestRoll={latestRoll} diceHistory={diceHistory} />

            <RoomModal
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
            />
        </div>
    );
}
