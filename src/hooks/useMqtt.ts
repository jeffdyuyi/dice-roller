import { useState, useEffect, useCallback } from 'react';
import { mqttInstance, PlayerNode, RoomMessage } from '../lib/mqttService';

export type RoomCommState = 'DISCONNECTED' | 'WAITING' | 'CONNECTED';

export function useMqtt() {
    const [commState, setCommState] = useState<RoomCommState>('DISCONNECTED');
    const [roomId, setRoomId] = useState<string | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [connectedPlayers, setConnectedPlayers] = useState<PlayerNode[]>([]);
    const [pendingPlayers, setPendingPlayers] = useState<PlayerNode[]>([]);
    const [diceHistory, setDiceHistory] = useState<any[]>([]);
    const [latestRoll, setLatestRoll] = useState<any | null>(null);
    const [myName, setMyName] = useState('Player-' + Math.floor(Math.random() * 1000));

    useEffect(() => {
        const unsubConnect = mqttInstance.onConnect(() => {
            if (mqttInstance.isHost) {
                setCommState('CONNECTED');
                setConnectedPlayers([{ id: mqttInstance.myId, name: mqttInstance.myName, isHost: true }]);
                setRoomId(mqttInstance.currentRoomId);
                setIsHost(true);
            }
        });

        const unsubMsg = mqttInstance.onMessage((msg: RoomMessage) => {
            if (msg.type === 'JOIN_REQUEST') {
                if (mqttInstance.isHost) {
                    setPendingPlayers(prev => {
                        if (prev.find(p => p.id === msg.senderId)) return prev;
                        return [...prev, { id: msg.senderId, name: msg.senderName }];
                    });
                }
            } else if (msg.type === 'JOIN_ACCEPTED') {
                setCommState('CONNECTED');
                setRoomId(mqttInstance.currentRoomId);
            } else if (msg.type === 'JOIN_REJECTED') {
                alert('加入拒绝！');
                disconnectLocal();
            } else if (msg.type === 'PLAYER_LIST') {
                setConnectedPlayers(msg.payload);
            } else if (msg.type === 'PLAYER_LEFT') {
                if (mqttInstance.isHost) {
                    setConnectedPlayers(prev => {
                        const next = prev.filter(p => p.id !== msg.senderId);
                        mqttInstance.broadcast('PLAYER_LIST', next);
                        return next;
                    });
                }
            } else if (msg.type === 'ROOM_CLOSED') {
                if (!mqttInstance.isHost) {
                    alert('房间已关闭或你被踢出');
                    disconnectLocal();
                }
            } else if (msg.type === 'DICE_ROLL') {
                const rollData = { ...msg.payload, senderName: msg.senderName, timestamp: msg.timestamp };
                setLatestRoll(rollData);
                setDiceHistory(prev => [rollData, ...prev]);
            }
        });

        return () => {
            unsubConnect();
            unsubMsg();
        };
    }, []);

    const disconnectLocal = useCallback(() => {
        mqttInstance.disconnect();
        setCommState('DISCONNECTED');
        setRoomId(null);
        setIsHost(false);
        setConnectedPlayers([]);
        setPendingPlayers([]);
    }, []);

    const createRoom = useCallback((name: string, customRoomId: string) => {
        setMyName(name);
        setCommState('WAITING');
        mqttInstance.init(name, customRoomId || null, true);
    }, []);

    const joinRoom = useCallback((name: string, targetRoomId: string) => {
        if (!targetRoomId) return;
        setMyName(name);
        setCommState('WAITING');
        mqttInstance.init(name, targetRoomId, false);
        setTimeout(() => {
            mqttInstance.sendToHost('JOIN_REQUEST');
        }, 500);
    }, []);

    const acceptPlayer = useCallback((pId: string, pName: string) => {
        setPendingPlayers(prev => prev.filter(p => p.id !== pId));
        setConnectedPlayers(prev => {
            const next = [...prev, { id: pId, name: pName, isHost: false }];
            mqttInstance.broadcast('PLAYER_LIST', next);
            return next;
        });
        mqttInstance.sendToPlayer(pId, 'JOIN_ACCEPTED');
    }, []);

    const rejectPlayer = useCallback((pId: string) => {
        setPendingPlayers(prev => prev.filter(p => p.id !== pId));
        mqttInstance.sendToPlayer(pId, 'JOIN_REJECTED');
    }, []);

    const kickPlayer = useCallback((pId: string) => {
        setConnectedPlayers(prev => {
            const next = prev.filter(p => p.id !== pId);
            mqttInstance.broadcast('PLAYER_LIST', next);
            return next;
        });
        mqttInstance.sendToPlayer(pId, 'ROOM_CLOSED');
    }, []);

    const leaveRoom = useCallback(() => {
        if (isHost) {
            mqttInstance.broadcast('ROOM_CLOSED');
        } else {
            mqttInstance.sendToHost('PLAYER_LEFT');
        }
        setTimeout(() => disconnectLocal(), 300);
    }, [isHost, disconnectLocal]);

    const broadcastRoll = useCallback((rollPayload: any) => {
        if (commState !== 'CONNECTED') return;
        mqttInstance.broadcast('DICE_ROLL', rollPayload);
    }, [commState]);

    const addLocalRoll = useCallback((rollPayload: any) => {
        const data = { ...rollPayload, senderName: mqttInstance.myName || myName, timestamp: Date.now(), isLocal: true };
        setLatestRoll(data);
        setDiceHistory(prev => [data, ...prev]);
        broadcastRoll(rollPayload);
    }, [broadcastRoll, myName]);

    const clearHistory = useCallback(() => setDiceHistory([]), []);

    return {
        commState, roomId, isHost, connectedPlayers, pendingPlayers, diceHistory, latestRoll, myName, myId: mqttInstance.myId,
        createRoom, joinRoom, acceptPlayer, rejectPlayer, kickPlayer, leaveRoom, addLocalRoll, clearHistory
    };
}
