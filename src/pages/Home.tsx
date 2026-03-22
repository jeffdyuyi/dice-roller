import { useState, useCallback } from 'react';
import { Sidebar } from '../components/Sidebar';
import { MainArea } from '../components/MainArea';
import { RoomModal } from '../components/RoomModal';
import { useMqtt } from '../hooks/useMqtt';

export function Home() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const {
        commState,
        roomId,
        myName,
        isHost,
        connectedPlayers,
        pendingPlayers,
        myId,
        diceHistory,
        latestRoll,
        createRoom,
        joinRoom,
        acceptPlayer,
        rejectPlayer,
        kickPlayer,
        leaveRoom,
        addLocalRoll
    } = useMqtt();

    const handleRoll = useCallback((rollData: any) => {
        addLocalRoll(rollData);
    }, [addLocalRoll]);

    return (
        <div className="flex flex-col md:flex-row h-full w-full bg-[#fdf8f4] overflow-hidden">
            <Sidebar onRoll={handleRoll} onOpenRoom={() => setIsMenuOpen(true)} commState={commState} />
            <MainArea latestRoll={latestRoll} diceHistory={diceHistory} />

            <RoomModal
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                commState={commState}
                roomId={roomId}
                myName={myName}
                isHost={isHost}
                connectedPlayers={connectedPlayers}
                pendingPlayers={pendingPlayers}
                myId={myId}
                onCreateRoom={createRoom}
                onJoinRoom={joinRoom}
                onAcceptPlayer={acceptPlayer}
                onRejectPlayer={rejectPlayer}
                onKickPlayer={kickPlayer}
                onLeaveRoom={leaveRoom}
            />
        </div>
    );
}
