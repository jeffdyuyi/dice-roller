import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { mqttInstance, type PlayerNode, type RoomMessage, type LobbyRoom } from '../lib/mqttService';
import { saveCharacter } from '../features/characters/api';
import type { Character } from '../features/characters/types';
import type { WhiteboardProject } from '../features/whiteboards/types';
import { saveWhiteboard, getMyWhiteboards } from '../features/whiteboards/api';
import { webrtcInstance } from '../lib/webrtcManager';

interface OfflineAction {
    id: string;
    type: 'WHITEBOARD_PATCH' | 'QUICK_EDIT_SYNC';
    payload: any;
    timestamp: number;
}

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
    updateQuickEditValue: (playerId: string, fieldName: string, value: number) => void;
}

const MqttContext = createContext<MqttContextType | undefined>(undefined);

export function MqttProvider({ children }: { children: ReactNode }) {
    const [commState, setCommState] = useState<RoomCommState>('DISCONNECTED');
    const [myId, setMyId] = useState<string>(() => {
        let savedId = localStorage.getItem('dice_roller_my_id');
        if (!savedId) {
            savedId = 'player-' + Math.random().toString(36).substring(2, 9);
            localStorage.setItem('dice_roller_my_id', savedId);
        }
        return savedId;
    });
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

    // Local-First offline actions buffering queue
    const [offlineQueue, setOfflineQueue] = useState<OfflineAction[]>(() => {
        try {
            const stored = localStorage.getItem('trpg_offline_actions');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    });

    const queueOfflineAction = useCallback((type: 'WHITEBOARD_PATCH' | 'QUICK_EDIT_SYNC', payload: any) => {
        const newAction: OfflineAction = {
            id: 'act-' + Math.random().toString(36).substring(2, 9),
            type,
            payload,
            timestamp: Date.now()
        };
        setOfflineQueue(prev => {
            const next = [...prev, newAction];
            localStorage.setItem('trpg_offline_actions', JSON.stringify(next));
            return next;
        });
    }, []);

    const showNotification = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
        setLatestNotification({ message, type });
        setTimeout(() => setLatestNotification(null), 4000);
    }, []);

    useEffect(() => {
        // Automatically connect to global lobby on app start
        mqttInstance.connectGlobal();
        setMyId(mqttInstance.myId);

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

        // The unified room message processor (reused for MQTT & WebRTC direct channel)
        const handleIncomingRoomMessage = (msg: RoomMessage) => {
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

                // WebRTC direct connection: new player initiates peer connection to GM
                const hostId = msg.senderId;
                webrtcInstance.initiateConnection(hostId, (signal) => {
                    mqttInstance.sendToHost('WEBRTC_SIGNAL', { signal });
                });
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
                    webrtcInstance.closeConnection(msg.senderId);
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
                setConnectedPlayers(prev => prev.map(p =>
                    p.id === msg.senderId
                        ? { ...p, characterData: msg.payload?.characterData }
                        : p
                ));
            } else if (msg.type === 'QUICK_EDIT_SYNC') {
                const { playerId, fieldName, value } = msg.payload || {};
                if (playerId && fieldName !== undefined && value !== undefined) {
                    setConnectedPlayers(prev => {
                        const next = prev.map(p => {
                            if (p.id === playerId) {
                                const currentValues = p.quickEditValues || {};
                                return {
                                    ...p,
                                    quickEditValues: { ...currentValues, [fieldName]: value }
                                };
                            }
                            return p;
                        });
                        if (mqttInstance.isHost) {
                            mqttInstance.broadcast('PLAYER_LIST', { list: next });
                        }
                        return next;
                    });
                }
            } else if (msg.type === 'WHITEBOARD_SYNC') {
                const { project } = msg.payload || {};
                if (project) {
                    setRoomWhiteboard(project);
                    (async () => {
                        try {
                            const localUser = myId || 'local-user';
                            const localBoards = await getMyWhiteboards(localUser);
                            const senderHostName = msg.senderName;
                            
                            const existing = localBoards.find(
                                w => w.name === project.name && w.hostName === senderHostName
                            );
                            
                            if (existing) {
                                await saveWhiteboard({
                                    ...existing,
                                    tabs: project.tabs,
                                    updatedAt: Date.now()
                                });
                            } else {
                                await saveWhiteboard({
                                    id: 'board-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5),
                                    name: project.name,
                                    hostName: senderHostName,
                                    userId: localUser,
                                    updatedAt: Date.now(),
                                    tabs: project.tabs
                                });
                            }
                        } catch (err) {
                            console.error('Error syncing received room whiteboard locally:', err);
                        }
                    })();
                }
            } else if (msg.type === 'WHITEBOARD_PATCH') {
                const { tabId, patchType, key, value } = msg.payload || {};
                if (tabId && patchType) {
                    setRoomWhiteboard(prev => {
                        if (!prev) return prev;
                        const nextTabs = prev.tabs.map(tab => {
                            if (tab.id !== tabId) return tab;
                            
                            if (patchType === 'fog_enabled') {
                                return { ...tab, fogEnabled: value };
                            }
                            if (patchType === 'cell') {
                                return {
                                    ...tab,
                                    cells: { ...(tab.cells || {}), [key]: value }
                                };
                            }
                            if (patchType === 'cell_delete') {
                                const nextCells = { ...(tab.cells || {}) };
                                delete nextCells[key];
                                return { ...tab, cells: nextCells };
                            }
                            if (patchType === 'fog') {
                                const nextFog = { ...(tab.fogOfWar || {}) };
                                if (value === false) {
                                    delete nextFog[key];
                                } else {
                                    nextFog[key] = value;
                                }
                                return { ...tab, fogOfWar: nextFog };
                            }
                            if (patchType === 'fog_all') {
                                return { ...tab, fogOfWar: value || {} };
                            }
                            if (patchType === 'token') {
                                const nextTokens = (tab.tokens || []).filter(t => t.id !== key);
                                nextTokens.push(value);
                                return { ...tab, tokens: nextTokens };
                            }
                            if (patchType === 'token_delete') {
                                return {
                                    ...tab,
                                    tokens: (tab.tokens || []).filter(t => t.id !== key)
                                };
                            }
                            if (patchType === 'wall') {
                                const nextWalls = (tab.walls || []).filter(w => w.id !== key);
                                nextWalls.push(value);
                                return { ...tab, walls: nextWalls };
                            }
                            if (patchType === 'wall_delete') {
                                return {
                                    ...tab,
                                    walls: (tab.walls || []).filter(w => w.id !== key)
                                };
                            }
                            return tab;
                        });

                        const updatedProject = { ...prev, tabs: nextTabs, updatedAt: Date.now() };

                        (async () => {
                            try {
                                const localUser = myId || 'local-user';
                                const localBoards = await getMyWhiteboards(localUser);
                                const senderHostName = msg.senderName;
                                const existing = localBoards.find(w => 
                                    isHost 
                                        ? w.name === updatedProject.name
                                        : (w.name === updatedProject.name && w.hostName === senderHostName)
                                );
                                if (existing) {
                                    await saveWhiteboard({
                                        ...existing,
                                        tabs: updatedProject.tabs,
                                        updatedAt: Date.now()
                                    });
                                }
                            } catch (err) {
                                console.error('Error saving patched whiteboard locally:', err);
                            }
                        })();

                        return updatedProject;
                    });
                }
            } else if (msg.type === 'WEBRTC_SIGNAL') {
                const { signal } = msg.payload || {};
                if (signal) {
                    webrtcInstance.handleSignal(msg.senderId, signal, (replySignal) => {
                        if (mqttInstance.isHost) {
                            mqttInstance.sendToPlayer(msg.senderId, 'WEBRTC_SIGNAL', { signal: replySignal });
                        } else {
                            mqttInstance.sendToHost('WEBRTC_SIGNAL', { signal: replySignal });
                        }
                    });
                }
            }
        };

        const unsubMsg = mqttInstance.onMessage(handleIncomingRoomMessage);
        webrtcInstance.onMessage((_, msg) => {
            handleIncomingRoomMessage(msg);
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
        webrtcInstance.closeAll();
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

    // Event Sourcing offline action queue replay on reconnection
    useEffect(() => {
        if (commState === 'CONNECTED' && offlineQueue.length > 0) {
            console.log(`[Event Sourcing] Replaying ${offlineQueue.length} offline actions...`);
            
            const sortedActions = [...offlineQueue].sort((a, b) => a.timestamp - b.timestamp);
            
            sortedActions.forEach(action => {
                const msg = {
                    type: action.type,
                    senderId: mqttInstance.myId,
                    senderName: mqttInstance.myName,
                    timestamp: action.timestamp,
                    payload: action.payload
                };
                
                const sentP2P = webrtcInstance.broadcastP2P(msg);
                if (!sentP2P) {
                    mqttInstance.broadcast(action.type, action.payload);
                }
            });

            setOfflineQueue([]);
            localStorage.removeItem('trpg_offline_actions');
            showNotification(`已自动重连！同步并回溯了 ${sortedActions.length} 条离线操作。`, 'success');
        }
    }, [commState, offlineQueue, showNotification]);

    const createRoom = useCallback((name: string, rid: string, rName: string, template: any | null, starterBoard?: WhiteboardProject | null) => {
        setMyName(name);
        localStorage.setItem('dice_roller_my_name', name);
        setRoomName(rName);
        setRoomTemplate(template);
        setHostName(name); 
        setCommState('WAITING');
        setConnectionError(null);
        
        if (starterBoard) {
            const boardWithTime = {
                ...starterBoard,
                id: 'board-room-' + (rid || 'default'),
                name: starterBoard.name,
                updatedAt: Date.now()
            };
            setRoomWhiteboard(boardWithTime);
        }
        
        mqttInstance.init(name, rid || null, true);
        setMyId(mqttInstance.myId);
        showNotification(`正在创建房间: ${rName}...`, 'info');

        setTimeout(() => {
            mqttInstance.announceRoom(rName, template?.name);
            if (starterBoard) {
                const boardWithTime = {
                    ...starterBoard,
                    id: 'board-room-' + (rid || 'default'),
                    name: starterBoard.name,
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
        setMyId(mqttInstance.myId);
        
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

                    if (latestRoll) {
                        mqttInstance.broadcast('DICE_ROLL', latestRoll);
                    }

                    return next;
                });
            }
            return prevPending.filter(p => p.id !== pId);
        });

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
        webrtcInstance.closeConnection(pId);
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
            const msgPayload = payload as Record<string, any>;
            const sentP2P = webrtcInstance.broadcastP2P({
                type: 'DICE_ROLL',
                senderId: mqttInstance.myId,
                senderName: mqttInstance.myName,
                timestamp: Date.now(),
                payload: msgPayload
            });
            if (!sentP2P) {
                mqttInstance.broadcast('DICE_ROLL', msgPayload);
            }
        }
    }, [myName, commState]);

    const sendChatMessage = useCallback((text: string) => {
        const payload = { text };
        const data = { type: 'chat', text, userName: mqttInstance.myName || myName, timestamp: Date.now(), isLocal: true };
        setDiceHistory(prev => [...prev, data]);
        
        if (commState === 'CONNECTED') {
            const sentP2P = webrtcInstance.broadcastP2P({
                type: 'CHAT_MESSAGE',
                senderId: mqttInstance.myId,
                senderName: mqttInstance.myName,
                timestamp: Date.now(),
                payload
            });
            if (!sentP2P) {
                mqttInstance.broadcast('CHAT_MESSAGE', payload);
            }
        }
    }, [myName, commState]);

    const clearHistory = useCallback(() => setDiceHistory([]), []);

    const patchCharacter = useCallback((targetId: string, textPayload: string) => {
        const data = { type: 'memo', text: textPayload, userName: mqttInstance.myName || myName, timestamp: Date.now(), isLocal: true };
        setDiceHistory(prev => [...prev, data]);

        if (commState === 'CONNECTED') {
            const payload = { textPayload };
            if (targetId === 'all') {
                const sentP2P = webrtcInstance.broadcastP2P({
                    type: 'DISTRIBUTE_MEMO',
                    senderId: mqttInstance.myId,
                    senderName: mqttInstance.myName,
                    timestamp: Date.now(),
                    payload
                });
                if (!sentP2P) {
                    mqttInstance.broadcast('DISTRIBUTE_MEMO', payload);
                }
            } else {
                const sentP2P = webrtcInstance.sendP2P(targetId, {
                    type: 'DISTRIBUTE_MEMO',
                    senderId: mqttInstance.myId,
                    senderName: mqttInstance.myName,
                    timestamp: Date.now(),
                    payload
                });
                if (!sentP2P) {
                    mqttInstance.sendToPlayer(targetId, 'DISTRIBUTE_MEMO', payload);
                }
            }
        } else {
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
        }
    }, [myName, commState]);

    const updateActiveCharacter = useCallback((char: Character) => {
        setActiveCharacter(char);
        saveCharacter(char);
    }, []);

    const updateRoomWhiteboard = useCallback((updated: WhiteboardProject) => {
        const boardWithTime = { ...updated, updatedAt: Date.now() };
        
        if (roomWhiteboard) {
            updated.tabs.forEach((newTab, tabIdx) => {
                const oldTab = roomWhiteboard.tabs[tabIdx];
                if (!oldTab) return;

                if (newTab.fogEnabled !== oldTab.fogEnabled) {
                    const patch = {
                        tabId: newTab.id,
                        patchType: 'fog_enabled',
                        value: newTab.fogEnabled
                    };
                    if (commState === 'CONNECTED') {
                        const sentP2P = webrtcInstance.broadcastP2P({
                            type: 'WHITEBOARD_PATCH',
                            senderId: mqttInstance.myId,
                            senderName: mqttInstance.myName,
                            timestamp: Date.now(),
                            payload: patch
                        });
                        if (!sentP2P) {
                            mqttInstance.broadcast('WHITEBOARD_PATCH', patch);
                        }
                    } else {
                        queueOfflineAction('WHITEBOARD_PATCH', patch);
                    }
                }

                const oldCells = oldTab.cells || {};
                const newCells = newTab.cells || {};
                Object.keys(newCells).forEach(key => {
                    if (JSON.stringify(newCells[key]) !== JSON.stringify(oldCells[key])) {
                        const patch = {
                            tabId: newTab.id,
                            patchType: 'cell',
                            key,
                            value: newCells[key]
                        };
                        if (commState === 'CONNECTED') {
                            const sentP2P = webrtcInstance.broadcastP2P({
                                type: 'WHITEBOARD_PATCH',
                                senderId: mqttInstance.myId,
                                senderName: mqttInstance.myName,
                                timestamp: Date.now(),
                                payload: patch
                            });
                            if (!sentP2P) {
                                mqttInstance.broadcast('WHITEBOARD_PATCH', patch);
                            }
                        } else {
                            queueOfflineAction('WHITEBOARD_PATCH', patch);
                        }
                    }
                });
                Object.keys(oldCells).forEach(key => {
                    if (!newCells[key]) {
                        const patch = {
                            tabId: newTab.id,
                            patchType: 'cell_delete',
                            key
                        };
                        if (commState === 'CONNECTED') {
                            const sentP2P = webrtcInstance.broadcastP2P({
                                type: 'WHITEBOARD_PATCH',
                                senderId: mqttInstance.myId,
                                senderName: mqttInstance.myName,
                                timestamp: Date.now(),
                                payload: patch
                            });
                            if (!sentP2P) {
                                mqttInstance.broadcast('WHITEBOARD_PATCH', patch);
                            }
                        } else {
                            queueOfflineAction('WHITEBOARD_PATCH', patch);
                        }
                    }
                });

                const oldFog = oldTab.fogOfWar || {};
                const newFog = newTab.fogOfWar || {};
                const oldFogKeys = Object.keys(oldFog);
                const newFogKeys = Object.keys(newFog);

                if (Math.abs(newFogKeys.length - oldFogKeys.length) > 100) {
                    const patch = {
                        tabId: newTab.id,
                        patchType: 'fog_all',
                        value: newFog
                    };
                    if (commState === 'CONNECTED') {
                        const sentP2P = webrtcInstance.broadcastP2P({
                            type: 'WHITEBOARD_PATCH',
                            senderId: mqttInstance.myId,
                            senderName: mqttInstance.myName,
                            timestamp: Date.now(),
                            payload: patch
                        });
                        if (!sentP2P) {
                            mqttInstance.broadcast('WHITEBOARD_PATCH', patch);
                        }
                    } else {
                        queueOfflineAction('WHITEBOARD_PATCH', patch);
                    }
                } else {
                    newFogKeys.forEach(key => {
                        if (newFog[key] !== oldFog[key]) {
                            const patch = {
                                tabId: newTab.id,
                                patchType: 'fog',
                                key,
                                value: newFog[key]
                            };
                            if (commState === 'CONNECTED') {
                                const sentP2P = webrtcInstance.broadcastP2P({
                                    type: 'WHITEBOARD_PATCH',
                                    senderId: mqttInstance.myId,
                                    senderName: mqttInstance.myName,
                                    timestamp: Date.now(),
                                    payload: patch
                                });
                                if (!sentP2P) {
                                    mqttInstance.broadcast('WHITEBOARD_PATCH', patch);
                                }
                            } else {
                                queueOfflineAction('WHITEBOARD_PATCH', patch);
                            }
                        }
                    });
                    oldFogKeys.forEach(key => {
                        if (newFog[key] === undefined) {
                            const patch = {
                                tabId: newTab.id,
                                patchType: 'fog',
                                key,
                                value: false
                            };
                            if (commState === 'CONNECTED') {
                                const sentP2P = webrtcInstance.broadcastP2P({
                                    type: 'WHITEBOARD_PATCH',
                                    senderId: mqttInstance.myId,
                                    senderName: mqttInstance.myName,
                                    timestamp: Date.now(),
                                    payload: patch
                                });
                                if (!sentP2P) {
                                    mqttInstance.broadcast('WHITEBOARD_PATCH', patch);
                                }
                            } else {
                                queueOfflineAction('WHITEBOARD_PATCH', patch);
                            }
                        }
                    });
                }

                const oldTokens = oldTab.tokens || [];
                const newTokens = newTab.tokens || [];
                newTokens.forEach(newToken => {
                    const oldToken = oldTokens.find(t => t.id === newToken.id);
                    if (!oldToken || JSON.stringify(oldToken) !== JSON.stringify(newToken)) {
                        const patch = {
                            tabId: newTab.id,
                            patchType: 'token',
                            key: newToken.id,
                            value: newToken
                        };
                        if (commState === 'CONNECTED') {
                            const sentP2P = webrtcInstance.broadcastP2P({
                                type: 'WHITEBOARD_PATCH',
                                senderId: mqttInstance.myId,
                                senderName: mqttInstance.myName,
                                timestamp: Date.now(),
                                payload: patch
                            });
                            if (!sentP2P) {
                                mqttInstance.broadcast('WHITEBOARD_PATCH', patch);
                            }
                        } else {
                            queueOfflineAction('WHITEBOARD_PATCH', patch);
                        }
                    }
                });
                oldTokens.forEach(oldToken => {
                    const exists = newTokens.some(t => t.id === oldToken.id);
                    if (!exists) {
                        const patch = {
                            tabId: newTab.id,
                            patchType: 'token_delete',
                            key: oldToken.id
                        };
                        if (commState === 'CONNECTED') {
                            const sentP2P = webrtcInstance.broadcastP2P({
                                type: 'WHITEBOARD_PATCH',
                                senderId: mqttInstance.myId,
                                senderName: mqttInstance.myName,
                                timestamp: Date.now(),
                                payload: patch
                            });
                            if (!sentP2P) {
                                mqttInstance.broadcast('WHITEBOARD_PATCH', patch);
                            }
                        } else {
                            queueOfflineAction('WHITEBOARD_PATCH', patch);
                        }
                    }
                });

                const oldWalls = oldTab.walls || [];
                const newWalls = newTab.walls || [];
                newWalls.forEach(newWall => {
                    const oldWall = oldWalls.find(w => w.id === newWall.id);
                    if (!oldWall || JSON.stringify(oldWall) !== JSON.stringify(newWall)) {
                        const patch = {
                            tabId: newTab.id,
                            patchType: 'wall',
                            key: newWall.id,
                            value: newWall
                        };
                        if (commState === 'CONNECTED') {
                            const sentP2P = webrtcInstance.broadcastP2P({
                                type: 'WHITEBOARD_PATCH',
                                senderId: mqttInstance.myId,
                                senderName: mqttInstance.myName,
                                timestamp: Date.now(),
                                payload: patch
                            });
                            if (!sentP2P) {
                                mqttInstance.broadcast('WHITEBOARD_PATCH', patch);
                            }
                        } else {
                            queueOfflineAction('WHITEBOARD_PATCH', patch);
                        }
                    }
                });
                oldWalls.forEach(oldWall => {
                    const exists = newWalls.some(w => w.id === oldWall.id);
                    if (!exists) {
                        const patch = {
                            tabId: newTab.id,
                            patchType: 'wall_delete',
                            key: oldWall.id
                        };
                        if (commState === 'CONNECTED') {
                            const sentP2P = webrtcInstance.broadcastP2P({
                                type: 'WHITEBOARD_PATCH',
                                senderId: mqttInstance.myId,
                                senderName: mqttInstance.myName,
                                timestamp: Date.now(),
                                payload: patch
                            });
                            if (!sentP2P) {
                                mqttInstance.broadcast('WHITEBOARD_PATCH', patch);
                            }
                        } else {
                            queueOfflineAction('WHITEBOARD_PATCH', patch);
                        }
                    }
                });
            });
        } else {
            if (commState === 'CONNECTED') {
                mqttInstance.broadcast('WHITEBOARD_SYNC', { project: boardWithTime });
            }
        }

        setRoomWhiteboard(boardWithTime);

        (async () => {
            try {
                const localUser = myId || 'local-user';
                const localBoards = await getMyWhiteboards(localUser);
                
                let existing;
                if (isHost) {
                    // Host: match purely by name, overriding original board directly
                    existing = localBoards.find(w => w.name === boardWithTime.name);
                } else {
                    // Player/Other: match by name and hostName
                    existing = localBoards.find(
                        w => w.name === boardWithTime.name && (hostName ? w.hostName === hostName : true)
                    );
                }

                if (existing) {
                    await saveWhiteboard({
                        ...existing,
                        tabs: boardWithTime.tabs,
                        updatedAt: Date.now()
                    });
                } else {
                    await saveWhiteboard({
                        id: boardWithTime.id.startsWith('board-') && !boardWithTime.id.startsWith('board-room-') 
                            ? boardWithTime.id 
                            : ('board-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5)),
                        name: boardWithTime.name,
                        hostName: hostName || undefined,
                        userId: localUser,
                        updatedAt: Date.now(),
                        tabs: boardWithTime.tabs
                    });
                }
            } catch (err) {
                console.error('Error auto-saving room whiteboard edit locally:', err);
            }
        })();
    }, [roomWhiteboard, commState, hostName, isHost, myName, queueOfflineAction]);

    const updateQuickEditValue = useCallback((playerId: string, fieldName: string, value: number) => {
        if (commState === 'CONNECTED') {
            const sentP2P = webrtcInstance.broadcastP2P({
                type: 'QUICK_EDIT_SYNC',
                senderId: mqttInstance.myId,
                senderName: mqttInstance.myName,
                timestamp: Date.now(),
                payload: { playerId, fieldName, value }
            });
            if (!sentP2P) {
                mqttInstance.broadcast('QUICK_EDIT_SYNC', { playerId, fieldName, value });
            }
        } else {
            queueOfflineAction('QUICK_EDIT_SYNC', { playerId, fieldName, value });
        }
        setConnectedPlayers(prev => prev.map(p => {
            if (p.id === playerId) {
                const currentValues = p.quickEditValues || {};
                return {
                    ...p,
                    quickEditValues: { ...currentValues, [fieldName]: value }
                };
            }
            return p;
        }));
    }, [commState, queueOfflineAction]);

    const value = {
        commState, activeLobbyRooms, roomId, roomName, roomTemplate, isHost, connectedPlayers, pendingPlayers, diceHistory, latestRoll, activeCharacter, myName, myId,
        isManagerOpen, setManagerOpen, updateActiveCharacter, connectionError, latestNotification,
        createRoom, joinRoom, acceptPlayer, rejectPlayer, kickPlayer, leaveRoom, disconnectLocal, addLocalRoll, sendChatMessage, patchCharacter, clearHistory,
        setConnectionError, showNotification, roomWhiteboard, updateRoomWhiteboard, updateQuickEditValue
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
