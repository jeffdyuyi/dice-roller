import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { mqttInstance, type PlayerNode, type RoomMessage, type LobbyRoom } from '../lib/mqttService';
import { saveCharacter } from '../features/characters/api';
import type { Character } from '../features/characters/types';
import type { WhiteboardProject } from '../features/whiteboards/types';
import { saveWhiteboard, getMyWhiteboards } from '../features/whiteboards/api';


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
    createRoom: (name: string, rid: string, roomName: string, template: any | null, starterBoard?: WhiteboardProject | null) => void;
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
    const [myName, setMyName] = useState(() => {
        let savedName = localStorage.getItem('dice_roller_my_name');
        if (!savedName) {
            savedName = 'Player-' + Math.floor(Math.random() * 1000);
            localStorage.setItem('dice_roller_my_name', savedName);
        }
        return savedName;
    });
    const [isManagerOpen, setManagerOpen] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);
    const [latestNotification, setLatestNotification] = useState<{ message: string, type: 'info' | 'success' | 'error' } | null>(null);
    const [roomWhiteboard, setRoomWhiteboard] = useState<WhiteboardProject | null>(null);
    const [hostName, setHostName] = useState<string | null>(null);

    const showNotification = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
        setLatestNotification({ message, type });
        setTimeout(() => setLatestNotification(null), 4000);
    }, []);

    useEffect(() => {
        // Automatically connect to global lobby on app start
        mqttInstance.connectGlobal();

        let lastRooms: LobbyRoom[] = [];
        const updateLobby = (rooms: LobbyRoom[]) => {
            lastRooms = rooms;
            const now = Date.now();
            // Filter rooms: Only rooms updated within the last 3 minutes (180000ms)
            setActiveLobbyRooms(rooms.filter(r => now - r.timestamp < 180000));
        };

        const unsubLobby = mqttInstance.onLobbyUpdate(updateLobby);

        // Check and prune expired rooms every 15 seconds
        const pruneInterval = setInterval(() => {
            updateLobby(lastRooms);
        }, 15000);

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
                    // Push the join request to host's chat history
                    setDiceHistory(h => {
                        if (h.some(item => (item as any).type === 'join_request' && (item as any).senderId === msg.senderId && (item as any).status === 'pending')) {
                            return h;
                        }
                        return [...h, {
                            type: 'join_request',
                            senderId: msg.senderId,
                            userName: msg.senderName,
                            timestamp: msg.timestamp,
                            guestMode: msg.payload?.guestMode,
                            status: 'pending'
                        }];
                    });
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
                setHostName(msg.senderName); // Store host name
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
                
                // Save memo item to player's active character memo items list
                setActiveCharacter(prev => {
                    if (prev) {
                        const newItem = {
                            id: 'item-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5),
                            content: textPayload,
                            createdAt: Date.now(),
                            source: 'host' as const
                        };
                        const updatedItems = [...(prev.memoItems || []), newItem];
                        const next = { ...prev, memoItems: updatedItems };
                        saveCharacter(next);
                        return next;
                    }
                    return null;
                });

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
                    // Sync and save locally for players/host using matching name + host name
                    (async () => {
                        try {
                            const localUser = mqttInstance.myId || 'local-user';
                            const localBoards = await getMyWhiteboards(localUser);
                            const senderHostName = msg.senderName;
                            
                            // Check both board name AND host name match
                            const existing = localBoards.find(
                                w => w.name === project.name && w.hostName === senderHostName
                            );
                            
                            if (existing) {
                                const updatedLocal: WhiteboardProject = {
                                    ...existing,
                                    tabs: project.tabs,
                                    updatedAt: Date.now() // Timestamp updated
                                };
                                    await saveWhiteboard(updatedLocal);
                            } else {
                                const newLocal: WhiteboardProject = {
                                    id: 'board-' + Date.now().toString(36),
                                    name: project.name,
                                    hostName: senderHostName, // Save hostName
                                    userId: localUser,
                                    updatedAt: Date.now(), // Timestamp set
                                    tabs: project.tabs
                                };
                                await saveWhiteboard(newLocal);
                            }
                        } catch (err) {
                            console.error('Error syncing received room whiteboard locally:', err);
                        }
                    })();
                }
            }
        });

        return () => {
            unsubConnect();
            unsubMsg();
            unsubLobby();
            clearInterval(pruneInterval);
        };
    }, []);

    // Host Room Heartbeat Announcement
    useEffect(() => {
        if (!isHost || commState !== 'CONNECTED' || !roomName) return;

        const interval = setInterval(() => {
            mqttInstance.announceRoom(roomName, roomTemplate?.name);
        }, 60000); // Send heartbeat room list announcement every 60 seconds

        return () => clearInterval(interval);
    }, [isHost, commState, roomName, roomTemplate]);

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
                id: 'board-room-' + (roomId || 'default'),
                name: roomName || '房间白板',
                userId: mqttInstance.myId,
                updatedAt: Date.now(),
                tabs: [defaultTab]
            });
        } else if (commState === 'DISCONNECTED') {
            setRoomWhiteboard(null);
        }
    }, [commState, roomName, roomId, roomWhiteboard]);

    const disconnectLocal = useCallback(() => {
        mqttInstance.disconnect();
        setCommState('DISCONNECTED');
        setRoomId(null);
        setRoomName(null);
        setRoomTemplate(null);
        setIsHost(false);
        setHostName(null);
        setConnectedPlayers([]);
        setPendingPlayers([]);
        setDiceHistory([]);
        setLatestRoll(null);
        setRoomWhiteboard(null);
        setActiveCharacter(null);
    }, []);

    const createRoom = useCallback((name: string, rid: string, rName: string, template: any | null, starterBoard?: WhiteboardProject | null) => {
        setMyName(name);
        localStorage.setItem('dice_roller_my_name', name);
        setRoomName(rName);
        setRoomTemplate(template);
        setHostName(name); // Set hostName as room creator name
        setCommState('WAITING');
        setConnectionError(null);
        if (starterBoard) {
            setRoomWhiteboard({
                ...starterBoard,
                id: 'board-room-' + (rid || 'default'),
                name: rName || starterBoard.name
            });
        }
        mqttInstance.init(name, rid || null, true);
        showNotification(`正在创建房间: ${rName}...`, 'info');

        setTimeout(() => {
            mqttInstance.announceRoom(rName, template?.name);
            if (starterBoard) {
                const boardWithTime = {
                    ...starterBoard,
                    id: 'board-room-' + (rid || 'default'),
                    name: rName || starterBoard.name,
                    updatedAt: Date.now()
                };
                mqttInstance.broadcast('WHITEBOARD_SYNC', { project: boardWithTime });
            }
        }, 1000);
    }, [showNotification]);

    const joinRoom = useCallback((name: string, rid: string, charInfo?: unknown) => {
        if (!rid) return;
        setMyName(name);
        localStorage.setItem('dice_roller_my_name', name);
        setCommState('WAITING');
        if (charInfo) {
            setActiveCharacter(charInfo as Character);
        } else {
            setActiveCharacter(null);
        }
        mqttInstance.init(name, rid, false);
        // Request will be sent after connection is established
        setTimeout(() => {
            mqttInstance.sendToHost('JOIN_REQUEST', { 
                guestMode: charInfo === null,
                characterData: charInfo
            });
        }, 1000);
    }, []);

    const acceptPlayer = useCallback((pId: string, _pName?: string) => {
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

        // Also update the join request status in history
        setDiceHistory(prev => prev.map(item => 
            (item as any).type === 'join_request' && (item as any).senderId === pId 
                ? { ...(item as any), status: 'accepted' }
                : item
        ));

        mqttInstance.sendToPlayer(pId, 'JOIN_ACCEPTED', { roomName, roomTemplate });
        if (roomWhiteboard) {
            setTimeout(() => {
                mqttInstance.sendToPlayer(pId, 'WHITEBOARD_SYNC', { project: roomWhiteboard });
            }, 500);
        }
    }, [latestRoll, roomName, roomTemplate, roomWhiteboard]);

    const rejectPlayer = useCallback((pId: string) => {
        setPendingPlayers(prev => prev.filter(p => p.id !== pId));
        // Also update the join request status in history
        setDiceHistory(prev => prev.map(item => 
            (item as any).type === 'join_request' && (item as any).senderId === pId 
                ? { ...(item as any), status: 'rejected' }
                : item
        ));
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
        const boardWithTime = { ...updated, updatedAt: Date.now() };
        setRoomWhiteboard(boardWithTime);

        // Sync and save locally using matching name + host name
        (async () => {
            try {
                const localUser = mqttInstance.myId || 'local-user';
                const localBoards = await getMyWhiteboards(localUser);
                const currentHostName = hostName || (isHost ? myName : null);

                // Note: Only sync and overwrite if BOTH whiteboard name AND host name match!
                const existing = localBoards.find(
                    w => w.name === boardWithTime.name && (currentHostName ? w.hostName === currentHostName : true)
                );

                if (existing) {
                    const updatedLocal: WhiteboardProject = {
                        ...existing,
                        tabs: boardWithTime.tabs,
                        updatedAt: Date.now() // Timestamp updated
                    };
                    await saveWhiteboard(updatedLocal);
                } else {
                    const newLocal: WhiteboardProject = {
                        id: boardWithTime.id.startsWith('board-') ? boardWithTime.id : ('board-' + Date.now().toString(36)),
                        name: boardWithTime.name,
                        hostName: currentHostName || undefined, // Save hostName
                        userId: localUser,
                        updatedAt: Date.now(), // Timestamp set
                        tabs: boardWithTime.tabs
                    };
                    await saveWhiteboard(newLocal);
                }
            } catch (err) {
                console.error('Error auto-saving room whiteboard edit locally:', err);
            }
        })();

        if (commState === 'CONNECTED') {
            mqttInstance.broadcast('WHITEBOARD_SYNC', { project: boardWithTime });
        }
    }, [commState, hostName, isHost, myName]);

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
