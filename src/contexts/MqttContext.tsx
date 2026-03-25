import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { mqttInstance, type PlayerNode, type RoomMessage } from '../lib/mqttService';
import { saveCharacter } from '../features/characters/api';
import type { Character } from '../features/characters/rule-engines/types';

export type RoomCommState = 'DISCONNECTED' | 'WAITING' | 'CONNECTED';

interface MqttContextType {
    commState: RoomCommState;
    roomId: string | null;
    roomName: string | null;
    ruleSystem: string | null;
    isHost: boolean;
    connectedPlayers: PlayerNode[];
    pendingPlayers: PlayerNode[];
    diceHistory: any[];
    latestRoll: any | null;
    activeCharacter: Character | null;
    connectionError: string | null;
    latestNotification: { message: string, type: 'info' | 'success' | 'error' } | null;
    myName: string;
    myId: string;
    isManagerOpen: boolean;
    setManagerOpen: (open: boolean) => void;
    createRoom: (name: string, rid: string, roomName: string, ruleSystem: string) => void;
    joinRoom: (name: string, rid: string, charInfo?: any) => void;
    acceptPlayer: (id: string, name: string) => void;
    rejectPlayer: (id: string) => void;
    kickPlayer: (id: string) => void;
    leaveRoom: () => void;
    disconnectLocal: () => void;
    addLocalRoll: (payload: any) => void;
    adjustCharacter: (playerId: string, charData: Record<string, any>) => void;
    clearHistory: () => void;
    setConnectionError: (err: string | null) => void;
    showNotification: (msg: string, type: 'info' | 'success' | 'error') => void;
}

const MqttContext = createContext<MqttContextType | undefined>(undefined);

export function MqttProvider({ children }: { children: ReactNode }) {
    const [commState, setCommState] = useState<RoomCommState>('DISCONNECTED');
    const [roomId, setRoomId] = useState<string | null>(null);
    const [roomName, setRoomName] = useState<string | null>(null);
    const [ruleSystem, setRuleSystem] = useState<string | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [connectedPlayers, setConnectedPlayers] = useState<PlayerNode[]>([]);
    const [pendingPlayers, setPendingPlayers] = useState<PlayerNode[]>([]);
    const [diceHistory, setDiceHistory] = useState<any[]>([]);
    const [latestRoll, setLatestRoll] = useState<any | null>(null);
    const [activeCharacter, setActiveCharacter] = useState<Character | null>(null);
    const [myName, setMyName] = useState('Player-' + Math.floor(Math.random() * 1000));
    const [isManagerOpen, setManagerOpen] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [latestNotification, setLatestNotification] = useState<{ message: string, type: 'info' | 'success' | 'error' } | null>(null);

    const showNotification = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
        setLatestNotification({ message, type });
        setTimeout(() => setLatestNotification(null), 4000);
    }, []);

    useEffect(() => {
        const unsubConnect = mqttInstance.onConnect(() => {
            if (mqttInstance.isHost) {
                setCommState('CONNECTED');
                setConnectedPlayers([{ id: mqttInstance.myId, name: mqttInstance.myName, isHost: true }]);
                setRoomId(mqttInstance.currentRoomId);
                // roomName and ruleSystem are already set in createRoom
                setIsHost(true);
            }
        });

        const unsubMsg = mqttInstance.onMessage((msg: RoomMessage) => {
            if (msg.type === 'JOIN_REQUEST') {
                if (mqttInstance.isHost) {
                    setPendingPlayers(prev => {
                        if (prev.find(p => p.id === msg.senderId)) return prev;
                        showNotification(`收到来自 ${msg.senderName} 的加入请求`, 'info');
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
                setRoomName(msg.payload?.roomName || null);
                setRuleSystem(msg.payload?.ruleSystem || null);
                setConnectionError(null);
                showNotification(`成功加入 [${msg.payload?.roomName || '联机房间'}]`, 'success');
            } else if (msg.type === 'JOIN_REJECTED') {
                setConnectionError('被房主拒绝加入');
                showNotification('被房主拒绝加入', 'error');
                disconnectLocal();
            } else if (msg.type === 'PLAYER_LIST') {
                const list = (msg.payload as any).list || msg.payload;
                if (Array.isArray(list)) setConnectedPlayers(list);
            } else if (msg.type === 'PLAYER_LEFT') {
                if (mqttInstance.isHost) {
                    setConnectedPlayers(prev => {
                        const next = prev.filter(p => p.id !== msg.senderId);
                        mqttInstance.broadcast('PLAYER_LIST', { list: next });
                        return next;
                    });
                    showNotification(`${msg.senderName} 离开了房间`, 'info');
                }
            } else if (msg.type === 'ROOM_CLOSED') {
                if (!mqttInstance.isHost) {
                    showNotification('房间已关闭或你被移出', 'error');
                    disconnectLocal();
                    setManagerOpen(false);
                }
            } else if (msg.type === 'DICE_ROLL') {
                const rollData = { ...msg.payload, userName: msg.senderName, timestamp: msg.timestamp };
                setLatestRoll(rollData);
                setDiceHistory(prev => [...prev, rollData]);
            } else if (msg.type === 'CHARACTER_ADJUST') {
                // Host modified MY character (if I'm a player)
                if (!mqttInstance.isHost) {
                    const adjustedData = msg.payload?.characterData;
                    setActiveCharacter(prev => {
                        if (!prev) return null;
                        const next = { ...prev, characterData: adjustedData };
                        // Persist immediately
                        saveCharacter(next);
                        // Broadcast back to room so others see the update
                        mqttInstance.broadcast('CHARACTER_SYNC', { characterData: adjustedData });
                        return next;
                    });
                    showNotification('主持人优化了您的角色卡属性', 'success');
                }
            } else if (msg.type === 'CHARACTER_SYNC') {
                // Update specific player in the list
                setConnectedPlayers(prev => prev.map(p =>
                    p.id === msg.senderId
                        ? { ...p, characterData: msg.payload?.characterData }
                        : p
                ));
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
        setRoomName(null);
        setRuleSystem(null);
        setIsHost(false);
        setConnectedPlayers([]);
        setPendingPlayers([]);
    }, []);

    const createRoom = useCallback((name: string, rid: string, rName: string, rSystem: string) => {
        setMyName(name);
        setRoomName(rName);
        setRuleSystem(rSystem);
        setCommState('WAITING');
        setConnectionError(null);
        mqttInstance.init(name, rid || null, true);
        showNotification(`正在创建房间: ${rName}...`, 'info');
    }, [showNotification]);

    const joinRoom = useCallback((name: string, rid: string, charInfo?: any) => {
        if (!rid) return;
        setMyName(name);
        setCommState('WAITING');
        setConnectionError(null);
        mqttInstance.init(name, rid, false);

        // JOIN_REQUEST Timeout logic
        const timeoutId = setTimeout(() => {
            setCommState(prev => {
                if (prev === 'WAITING') {
                    setConnectionError('加入超时：未检测到目标房间或房主繁忙');
                    showNotification('加入超时，请确认房间 ID 是否正确', 'error');
                    disconnectLocal();
                    return 'DISCONNECTED';
                }
                return prev;
            });
        }, 10000);

        setTimeout(() => {
            mqttInstance.sendToHost('JOIN_REQUEST', charInfo);
            if (charInfo?.fullCharacter) {
                setActiveCharacter(charInfo.fullCharacter);
            }
        }, 800);

        return () => clearTimeout(timeoutId);
    }, [disconnectLocal, showNotification]);

    const acceptPlayer = useCallback((pId: string) => {
        setPendingPlayers(prevPending => {
            const accepted = prevPending.find(p => p.id === pId);
            if (accepted) {
                setConnectedPlayers(prevConnected => {
                    const next = [...prevConnected, { ...accepted, isHost: false }];
                    mqttInstance.broadcast('PLAYER_LIST', {
                        list: next,
                        roomName: roomName,
                        ruleSystem: ruleSystem
                    } as any);

                    // Sync latest roll if it exists
                    if (latestRoll) {
                        mqttInstance.broadcast('DICE_ROLL', latestRoll);
                    }

                    return next;
                });
            }
            return prevPending.filter(p => p.id !== pId);
        });
        mqttInstance.sendToPlayer(pId, 'JOIN_ACCEPTED', { roomName, ruleSystem });
    }, [latestRoll, roomName, ruleSystem]);

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
        setDiceHistory(prev => [...prev, data]);
        if (commState === 'CONNECTED') {
            mqttInstance.broadcast('DICE_ROLL', payload);
        }
    }, [myName, commState]);

    const clearHistory = useCallback(() => setDiceHistory([]), []);

    const adjustCharacter = useCallback((pId: string, charData: Record<string, any>) => {
        if (!isHost) return;
        mqttInstance.sendToPlayer(pId, 'CHARACTER_ADJUST', { characterData: charData });

        // Optimistically update host's local player list view
        setConnectedPlayers(prev => prev.map(p =>
            p.id === pId ? { ...p, characterData: charData } : p
        ));
    }, [isHost]);

    const value = {
        commState, roomId, roomName, ruleSystem, isHost, connectedPlayers, pendingPlayers, diceHistory, latestRoll, activeCharacter, myName, myId: mqttInstance.myId,
        isManagerOpen, setManagerOpen, connectionError, latestNotification,
        createRoom, joinRoom, acceptPlayer, rejectPlayer, kickPlayer, leaveRoom, disconnectLocal, addLocalRoll, adjustCharacter, clearHistory,
        setConnectionError, showNotification
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
