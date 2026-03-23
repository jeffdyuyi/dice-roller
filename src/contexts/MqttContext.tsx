import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { mqttInstance, type PlayerNode, type RoomMessage } from '../lib/mqttService';

export type RoomCommState = 'DISCONNECTED' | 'WAITING' | 'CONNECTED';

interface MqttContextType {
    commState: RoomCommState;
    roomId: string | null;
    isHost: boolean;
    connectedPlayers: PlayerNode[];
    pendingPlayers: PlayerNode[];
    diceHistory: any[];
    latestRoll: any | null;
    myName: string;
    myId: string;
    isManagerOpen: boolean;
    setManagerOpen: (open: boolean) => void;
    createRoom: (name: string, rid: string) => void;
    joinRoom: (name: string, rid: string, charInfo?: any) => void;
    acceptPlayer: (id: string, name: string) => void;
    rejectPlayer: (id: string) => void;
    kickPlayer: (id: string) => void;
    leaveRoom: () => void;
    addLocalRoll: (payload: any) => void;
    clearHistory: () => void;
}

const MqttContext = createContext<MqttContextType | undefined>(undefined);

export function MqttProvider({ children }: { children: ReactNode }) {
    const [commState, setCommState] = useState<RoomCommState>('DISCONNECTED');
    const [roomId, setRoomId] = useState<string | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [connectedPlayers, setConnectedPlayers] = useState<PlayerNode[]>([]);
    const [pendingPlayers, setPendingPlayers] = useState<PlayerNode[]>([]);
    const [diceHistory, setDiceHistory] = useState<any[]>([]);
    const [latestRoll, setLatestRoll] = useState<any | null>(null);
    const [myName, setMyName] = useState('Player-' + Math.floor(Math.random() * 1000));
    const [isManagerOpen, setManagerOpen] = useState(false);

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
                        return [...prev, {
                            id: msg.senderId,
                            name: msg.senderName,
                            guestMode: msg.payload?.guestMode,
                            characterId: msg.payload?.characterId,
                            ruleSystem: msg.payload?.ruleSystem,
                            characterData: msg.payload?.characterData
                        }];
                    });
                }
            } else if (msg.type === 'JOIN_ACCEPTED') {
                setCommState('CONNECTED');
                setRoomId(mqttInstance.currentRoomId);
            } else if (msg.type === 'JOIN_REJECTED') {
                alert('加入拒绝！');
                disconnectLocal();
            } else if (msg.type === 'PLAYER_LIST') {
                const list = (msg.payload as any).list || msg.payload;
                if (Array.isArray(list)) {
                    setConnectedPlayers(list);
                }
            } else if (msg.type === 'PLAYER_LEFT') {
                if (mqttInstance.isHost) {
                    setConnectedPlayers(prev => {
                        const next = prev.filter(p => p.id !== msg.senderId);
                        mqttInstance.broadcast('PLAYER_LIST', { list: next });
                        return next;
                    });
                }
            } else if (msg.type === 'ROOM_CLOSED') {
                if (!mqttInstance.isHost) {
                    alert('房间已关闭或你被踢出');
                    disconnectLocal();
                    setManagerOpen(false);
                }
            } else if (msg.type === 'DICE_ROLL') {
                const rollData = { ...msg.payload, userName: msg.senderName, timestamp: msg.timestamp };
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

    const createRoom = useCallback((name: string, rid: string) => {
        setMyName(name);
        setCommState('WAITING');
        mqttInstance.init(name, rid || null, true);
    }, []);

    const joinRoom = useCallback((name: string, rid: string, charInfo?: any) => {
        if (!rid) return;
        setMyName(name);
        setCommState('WAITING');
        mqttInstance.init(name, rid, false);
        setTimeout(() => {
            mqttInstance.sendToHost('JOIN_REQUEST', charInfo);
        }, 500);
    }, []);

    const acceptPlayer = useCallback((pId: string) => {
        setPendingPlayers(prevPending => {
            const accepted = prevPending.find(p => p.id === pId);
            if (accepted) {
                setConnectedPlayers(prevConnected => {
                    const next = [...prevConnected, { ...accepted, isHost: false }];
                    mqttInstance.broadcast('PLAYER_LIST', { list: next } as any);
                    return next;
                });
            }
            return prevPending.filter(p => p.id !== pId);
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
            mqttInstance.broadcast('PLAYER_LIST', { list: next } as any);
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

    const addLocalRoll = useCallback((payload: any) => {
        const data = { ...payload, userName: mqttInstance.myName || myName, timestamp: Date.now(), isLocal: true };
        setLatestRoll(data);
        setDiceHistory(prev => [data, ...prev]);
        if (commState === 'CONNECTED') {
            mqttInstance.broadcast('DICE_ROLL', payload);
        }
    }, [myName, commState]);

    const clearHistory = useCallback(() => setDiceHistory([]), []);

    const value = {
        commState, roomId, isHost, connectedPlayers, pendingPlayers, diceHistory, latestRoll, myName, myId: mqttInstance.myId,
        isManagerOpen, setManagerOpen,
        createRoom, joinRoom, acceptPlayer, rejectPlayer, kickPlayer, leaveRoom, addLocalRoll, clearHistory
    };

    return <MqttContext.Provider value={value}>{children}</MqttContext.Provider>;
}

export function useMqttContext() {
    const context = useContext(MqttContext);
    if (context === undefined) {
        throw new Error('useMqttContext must be used within a MqttProvider');
    }
    return context;
}
