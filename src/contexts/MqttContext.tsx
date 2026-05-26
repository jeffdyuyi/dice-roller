import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { mqttInstance, type PlayerNode, type RoomMessage, type LobbyRoom } from '../lib/mqttService';
import { saveCharacter } from '../features/characters/api';
import type { Character } from '../features/characters/types';
import type { WhiteboardProject } from '../features/whiteboards/types';


export type RoomCommState = 'DISCONNECTED' | 'WAITING' | 'CONNECTED';

interface MqttContextType {
    commState: RoomCommState;
    activeLobbyRooms: LobbyRoom[];
    roomId: string | null;
    roomName: string | null;
    roomTemplate: any | null;
    isHost: boolean;
    connectedPlayers: PlayerNode[];
    pendingPlayers: PlayerNode[];
    diceHistory: unknown[];
    latestRoll: unknown | null;
    activeCharacter: Character | null;
    connectionError: string | null;
    latestNotification: { message: string, type: 'info' | 'success' | 'error' } | null;
    myName: string;
    myId: string;
    isManagerOpen: boolean;
    setManagerOpen: (open: boolean) => void;
    updateActiveCharacter: (char: Character) => void;
    createRoom: (name: string, rid: string, roomName: string, template: any | null) => void;
    joinRoom: (name: string, rid: string, charInfo?: unknown) => void;
    acceptPlayer: (id: string, name: string) => void;
    rejectPlayer: (id: string) => void;
    kickPlayer: (id: string) => void;
    leaveRoom: () => void;
    disconnectLocal: () => void;
    addLocalRoll: (payload: unknown) => void;
    sendChatMessage: (text: string) => void;
    patchCharacter: (playerId: string, textPayload: string) => void;
    clearHistory: () => void;
    setConnectionError: (err: string | null) => void;
    showNotification: (msg: string, type: 'info' | 'success' | 'error') => void;
    roomWhiteboard: WhiteboardProject | null;
    updateRoomWhiteboard: (project: WhiteboardProject) => void;
}

const MqttContext = createContext<MqttContextType | undefined>(undefined);

export function MqttProvider({ children }: { children: ReactNode }) {
    const [commState, setCommState] = useState<RoomCommState>('DISCONNECTED');
    const [activeLobbyRooms, setActiveLobbyRooms] = useState<LobbyRoom[]>([]);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [roomName, setRoomName] = useState<string | null>(null);
    const [roomTemplate, setRoomTemplate] = useState<any | null>(null);
    const [isHost, setIsHost] = useState(false);
    const [connectedPlayers, setConnectedPlayers] = useState<PlayerNode[]>([]);
    const [pendingPlayers, setPendingPlayers] = useState<PlayerNode[]>([]);
    const [diceHistory, setDiceHistory] = useState<unknown[]>([]);
    const [latestRoll, setLatestRoll] = useState<unknown | null>(null);
    const [activeCharacter, setActiveCharacter] = useState<Character | null>(null);
    const [myName, setMyName] = useState('Player-' + Math.floor(Math.random() * 1000));
    const [isManagerOpen, setManagerOpen] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [latestNotification, setLatestNotification] = useState<{ message: string, type: 'info' | 'success' | 'error' } | null>(null);
    const [roomWhiteboard, setRoomWhiteboard] = useState<WhiteboardProject | null>(null);

    const showNotification = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
        setLatestNotification({ message, type });
        setTimeout(() => setLatestNotification(null), 4000);
    }, []);

    useEffect(() => {
        // Automatically connect to global lobby on app start
        mqttInstance.connectGlobal();

        const unsubLobby = mqttInstance.onLobbyUpdate((rooms) => {
            setActiveLobbyRooms(rooms);
        });

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
                            templateId: msg.payload?.templateId,
                            characterData: msg.payload?.characterData
                        }];
                    });
                }
            } else if (msg.type === 'JOIN_ACCEPTED') {
                setCommState('CONNECTED');
                setRoomId(mqttInstance.currentRoomId);
                setRoomName(msg.payload?.roomName || null);
                setRoomTemplate(msg.payload?.roomTemplate || null);
                setConnectionError(null);
                showNotification(`成功加入 [${msg.payload?.roomName || '联机房间'}]`, 'success');
            } else if (msg.type === 'JOIN_REJECTED') {
                setConnectionError('被房主拒绝加入');
                showNotification('被房主拒绝加入', 'error');
                disconnectLocal();
            } else if (msg.type === 'PLAYER_LIST') {
                const list = msg.payload && typeof msg.payload === 'object' && 'list' in msg.payload 
                    ? (msg.payload as any).list 
                    : msg.payload;
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
                if (msg.payload?.isHidden && !mqttInstance.isHost) return;
                const rollData = { ...msg.payload, userName: msg.senderName, timestamp: msg.timestamp };
                setLatestRoll(rollData);
                setDiceHistory(prev => [...prev, rollData]);
            } else if (msg.type === 'CHAT_MESSAGE') {
                const chatData = { type: 'chat', text: msg.payload?.text, userName: msg.senderName, timestamp: msg.timestamp };
                setDiceHistory(prev => [...prev, chatData]);
            } else if (msg.type === 'CHARACTER_ADJUST') {
                // Backward compatibility if needed, though deprecated
                if (!mqttInstance.isHost) {
                    const adjustedData = msg.payload?.characterData;
                    setActiveCharacter(prev => {
                        if (!prev) return null;
                        const next = { ...prev, characterData: adjustedData };
                        saveCharacter(next);
                        mqttInstance.broadcast('CHARACTER_SYNC', { characterData: adjustedData });
                        return next;
                    });
                    showNotification('您的角色卡已更新', 'success');
                }
            } else if (msg.type === 'DISTRIBUTE_MEMO') {
                const { textPayload } = msg.payload || {};
                if (!textPayload) return;
                
                const chatData = { 
                    type: 'memo', 
                    text: textPayload, 
                    userName: msg.senderName, 
                    timestamp: msg.timestamp 
                };
                setDiceHistory(prev => [...prev, chatData]);
                showNotification(`收到来自 ${msg.senderName} 的新笔记`, 'info');
            } else if (msg.type === 'CHARACTER_SYNC') {
                // Update specific player in the list
                setConnectedPlayers(prev => prev.map(p =>
                    p.id === msg.senderId
                        ? { ...p, characterData: msg.payload?.characterData }
                        : p
                ));
            } else if (msg.type === 'WHITEBOARD_SYNC') {
                const { project } = msg.payload || {};
                if (project) {
                    setRoomWhiteboard(project);
                }
            }
        });

        return () => {
            unsubConnect();
            unsubMsg();
            unsubLobby();
        };
    }, []);

    // Sync room whiteboard creation and destruction
    useEffect(() => {
        if (commState === 'CONNECTED' && !roomWhiteboard) {
            const defaultTab = {
                id: 'tab-room-default',
                name: '公共网格',
                gridType: 'hex' as const,
                cells: {}
            };
            setRoomWhiteboard({
                id: 'room-whiteboard',
                name: roomName || '房间白板',
                userId: mqttInstance.myId,
                updatedAt: Date.now(),
                tabs: [defaultTab]
            });
        } else if (commState === 'DISCONNECTED') {
            setRoomWhiteboard(null);
        }
    }, [commState, roomName]);

    const disconnectLocal = useCallback(() => {
        mqttInstance.disconnect();
        setCommState('DISCONNECTED');
        setRoomId(null);
        setRoomName(null);
        setRoomTemplate(null);
        setIsHost(false);
        setConnectedPlayers([]);
        setPendingPlayers([]);
    }, []);

    const createRoom = useCallback((name: string, rid: string, rName: string, template: any | null) => {
        setMyName(name);
        setRoomName(rName);
        setRoomTemplate(template);
        setCommState('WAITING');
        setConnectionError(null);
        mqttInstance.init(name, rid || null, true);
        showNotification(`正在创建房间: ${rName}...`, 'info');

        setTimeout(() => {
            mqttInstance.announceRoom(rName, template?.name);
        }, 1000);
    }, [showNotification]);

    const joinRoom = useCallback((name: string, rid: string, charInfo?: unknown) => {
        if (!rid) return;
        setMyName(name);
        setCommState('WAITING');
        mqttInstance.init(name, rid, false);
        // Request will be sent after connection is established
        setTimeout(() => {
            mqttInstance.sendToHost('JOIN_REQUEST', { 
                guestMode: charInfo === null,
                characterData: charInfo
            });
        }, 1000);
    }, []);

    const acceptPlayer = useCallback((pId: string) => {
        setPendingPlayers(prevPending => {
            const accepted = prevPending.find(p => p.id === pId);
            if (accepted) {
                setConnectedPlayers(prevConnected => {
                    const next = [...prevConnected, { ...accepted, isHost: false }];
                    mqttInstance.broadcast('PLAYER_LIST', {
                        list: next,
                        roomName: roomName,
                        roomTemplate: roomTemplate
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
        mqttInstance.sendToPlayer(pId, 'JOIN_ACCEPTED', { roomName, roomTemplate });
        if (roomWhiteboard) {
            setTimeout(() => {
                mqttInstance.sendToPlayer(pId, 'WHITEBOARD_SYNC', { project: roomWhiteboard });
            }, 500);
        }
    }, [latestRoll, roomName, roomTemplate, roomWhiteboard]);

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

    const addLocalRoll = useCallback((payload: unknown) => {
        const data = { ...(payload as any), userName: mqttInstance.myName || myName, timestamp: Date.now(), isLocal: true };
        setLatestRoll(data);
        setDiceHistory(prev => [...prev, data]);
        if (commState === 'CONNECTED') {
            if ((payload as any).isHidden && isHost) {
                // Host sending a hidden roll? Usually players send hidden rolls to host. 
                // We broadcast it anyway, non-hosts will ignore it.
                mqttInstance.broadcast('DICE_ROLL', payload as Record<string, any>);
            } else {
                mqttInstance.broadcast('DICE_ROLL', payload as Record<string, any>);
            }
        }
    }, [myName, commState, isHost]);

    const sendChatMessage = useCallback((text: string) => {
        const payload = { text };
        const data = { type: 'chat', text, userName: mqttInstance.myName || myName, timestamp: Date.now(), isLocal: true };
        setDiceHistory(prev => [...prev, data]);
        if (commState === 'CONNECTED') {
            mqttInstance.broadcast('CHAT_MESSAGE', payload);
        }
    }, [myName, commState]);

    const clearHistory = useCallback(() => setDiceHistory([]), []);

    const patchCharacter = useCallback((targetId: string, textPayload: string) => {
        const data = { type: 'memo', text: textPayload, userName: mqttInstance.myName || myName, timestamp: Date.now(), isLocal: true };
        setDiceHistory(prev => [...prev, data]);

        if (commState === 'CONNECTED') {
            if (targetId === 'all') {
                mqttInstance.broadcast('DISTRIBUTE_MEMO', { textPayload });
            } else {
                mqttInstance.sendToPlayer(targetId, 'DISTRIBUTE_MEMO', { textPayload });
            }
        }
    }, [myName, commState]);

    const updateActiveCharacter = useCallback((char: Character) => {
        setActiveCharacter(char);
        saveCharacter(char);
    }, []);

    const updateRoomWhiteboard = useCallback((updated: WhiteboardProject) => {
        setRoomWhiteboard(updated);
        if (commState === 'CONNECTED') {
            mqttInstance.broadcast('WHITEBOARD_SYNC', { project: updated });
        }
    }, [commState]);

    const value = {
        commState, activeLobbyRooms, roomId, roomName, roomTemplate, isHost, connectedPlayers, pendingPlayers, diceHistory, latestRoll, activeCharacter, myName, myId: mqttInstance.myId,
        isManagerOpen, setManagerOpen, updateActiveCharacter, connectionError, latestNotification,
        createRoom, joinRoom, acceptPlayer, rejectPlayer, kickPlayer, leaveRoom, disconnectLocal, addLocalRoll, sendChatMessage, patchCharacter, clearHistory,
        setConnectionError, showNotification, roomWhiteboard, updateRoomWhiteboard
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
