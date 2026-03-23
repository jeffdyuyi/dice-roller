import { Sidebar } from '../components/Sidebar';
import { MainArea } from '../components/MainArea';
import { useMqttContext } from '../contexts/MqttContext';

export function Home() {
    const { diceHistory, latestRoll, addLocalRoll } = useMqttContext();

    return (
        <div className="flex flex-col md:flex-row h-full w-full bg-[#fffdfa] overflow-hidden">
            <Sidebar onRoll={addLocalRoll} />
            <MainArea latestRoll={latestRoll} diceHistory={diceHistory} />
        </div>
    );
}
