import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { MainArea } from './components/MainArea';
import { RoomModal } from './components/RoomModal';
import { useMqtt } from './hooks/useMqtt';

function App() {
  const {
    commState, roomId, isHost, connectedPlayers, pendingPlayers, diceHistory, latestRoll, myName, myId,
    createRoom, joinRoom, acceptPlayer, rejectPlayer, kickPlayer, leaveRoom, addLocalRoll, clearHistory
  } = useMqtt();

  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);

  const roomStatusText = commState === 'CONNECTED' ? `${myName}${isHost ? ' (房主)' : ''}` : commState === 'WAITING' ? '连接中...' : '离线';

  return (
    <div className="flex flex-col md:flex-row w-full h-full">
      <Sidebar
        onRoll={addLocalRoll}
        onToggleRoom={() => setIsRoomModalOpen(!isRoomModalOpen)}
        roomStatusText={roomStatusText}
      />

      <MainArea
        latestRoll={latestRoll}
        diceHistory={diceHistory}
        onClearHistory={clearHistory}
      />

      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
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

export default App;
