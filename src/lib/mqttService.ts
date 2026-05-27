import mqtt from 'mqtt';
import type { MqttClient } from 'mqtt';

export interface PlayerNode {
    id: string;
    name: string;
    isHost?: boolean;
    guestMode?: boolean;
    characterId?: string;
    ruleSystem?: string;
    characterData?: Record<string, any>;
    quickEditValues?: Record<string, number>;
}

export interface RoomMessage {
    type: 'JOIN_REQUEST' | 'JOIN_ACCEPTED' | 'JOIN_REJECTED' | 'PLAYER_LIST' | 'PLAYER_LEFT' | 'ROOM_CLOSED' | 'DICE_ROLL'
    | 'CHARACTER_IMPORT' | 'CHARACTER_SYNC' | 'CHARACTER_ADJUST' | 'CHARACTER_SNAPSHOT' | 'CHAT_MESSAGE' | 'CHARACTER_PATCH' | 'DISTRIBUTE_MEMO' | 'WHITEBOARD_SYNC' | 'QUICK_EDIT_SYNC';
    senderId: string;
    senderName: string;
    timestamp: number;
    payload?: Record<string, any>;
}

export interface LobbyRoom {
    id: string;
    name: string;
    hostName: string;
    playerCount: number;
    templateName?: string;
    timestamp: number;
}

class MqttService {
    private client: MqttClient | null = null;
    public myId: string = '';
    public myName: string = '';
    public currentRoomId: string | null = null;
    public isHost: boolean = false;

    private messageHandlers: Set<(msg: RoomMessage) => void> = new Set();
    private onConnectHandlers: Set<() => void> = new Set();
    private lobbyHandlers: Set<(rooms: LobbyRoom[]) => void> = new Set();
    
    private activeLobbyRooms: Map<string, LobbyRoom> = new Map();

    public connectGlobal(roomId: string | null = null, isHost: boolean = false) {
        if (this.client) return;
        
        let savedId = localStorage.getItem('dice_roller_my_id');
        if (!savedId) {
            savedId = (isHost ? 'host-' : 'player-') + Math.random().toString(36).substring(2, 9);
            localStorage.setItem('dice_roller_my_id', savedId);
        }
        this.myId = savedId;
        
        const connectOptions: any = {
            keepalive: 10 // Set short keepalive (10 seconds) for super fast crash detection
        };

        if (isHost && roomId) {
            const safeRoomId = btoa(encodeURIComponent(roomId)).replace(/=/g, '');
            connectOptions.will = {
                topic: `dnd5r/lobby/rooms/${safeRoomId}`,
                payload: '',
                qos: 0,
                retain: true
            };
        }

        this.client = mqtt.connect('wss://broker.emqx.io:8084/mqtt', connectOptions);
        
        this.client.on('connect', () => {
            this.client?.subscribe('dnd5r/lobby/rooms/+');
            this.onConnectHandlers.forEach(cb => cb());
        });

        this.client.on('error', (err) => {
            console.error("MQTT Error:", err);
        });

        this.client.on('message', (topic, message) => {
            if (topic.startsWith('dnd5r/lobby/rooms/')) {
                const roomId = topic.split('/').pop();
                if (!roomId) return;
                
                const content = message.toString();
                if (!content) {
                    this.activeLobbyRooms.delete(roomId);
                } else {
                    try {
                        const data = JSON.parse(content);
                        this.activeLobbyRooms.set(roomId, data);
                    } catch (e) { }
                }
                const roomsList = Array.from(this.activeLobbyRooms.values()).sort((a, b) => b.timestamp - a.timestamp);
                this.lobbyHandlers.forEach(cb => cb(roomsList));
                return;
            }

            try {
                const data: RoomMessage = JSON.parse(message.toString());
                if (data.senderId === this.myId) return;
                this.messageHandlers.forEach(handler => handler(data));
            } catch (e) {
                console.error("Failed to parse mqtt message", e);
            }
        });
    }

    public onLobbyUpdate(handler: (rooms: LobbyRoom[]) => void) {
        this.lobbyHandlers.add(handler);
        handler(Array.from(this.activeLobbyRooms.values()).sort((a, b) => b.timestamp - a.timestamp));
        return () => this.lobbyHandlers.delete(handler);
    }

    public announceRoom(roomName: string, templateName?: string) {
        if (!this.client || !this.currentRoomId || !this.isHost) return;
        const safeRoomId = btoa(encodeURIComponent(this.currentRoomId)).replace(/=/g, '');
        const data: LobbyRoom = {
            id: this.currentRoomId,
            name: roomName,
            hostName: this.myName,
            playerCount: 1, // Start with 1 (Host)
            templateName,
            timestamp: Date.now()
        };
        this.client.publish(`dnd5r/lobby/rooms/${safeRoomId}`, JSON.stringify(data), { retain: true });
    }

    public unannounceRoom() {
        if (!this.client || !this.currentRoomId || !this.isHost) return;
        const safeRoomId = btoa(encodeURIComponent(this.currentRoomId)).replace(/=/g, '');
        this.client.publish(`dnd5r/lobby/rooms/${safeRoomId}`, '', { retain: true });
    }

    public init(playerName: string, roomId: string | null = null, isHost: boolean = false) {
        this.myName = playerName;
        this.isHost = isHost;
        const rawRoomId = roomId || Math.floor(10000 + Math.random() * 90000).toString();
        this.currentRoomId = rawRoomId;

        const safeRoomId = btoa(encodeURIComponent(rawRoomId)).replace(/=/g, '');
        const topicPrefix = `dnd5r/room/${safeRoomId}`;

        // Host always disconnects and reconnects to register Last Will on the broker
        if (isHost && this.client) {
            this.client.end(true);
            this.client = null;
        }

        if (!this.client) {
            this.connectGlobal(rawRoomId, isHost);
        }

        const topics = isHost ? [
            `${topicPrefix}/host`,
            `${topicPrefix}/broadcast`
        ] : [
            `${topicPrefix}/broadcast`,
            `${topicPrefix}/p/${this.myId}`
        ];
        this.client!.subscribe(topics);
        
        setTimeout(() => {
            this.onConnectHandlers.forEach(cb => cb());
        }, 100);
    }

    public onMessage(handler: (msg: RoomMessage) => void) {
        this.messageHandlers.add(handler);
        return () => this.messageHandlers.delete(handler);
    }

    public onConnect(handler: () => void) {
        this.onConnectHandlers.add(handler);
        return () => this.onConnectHandlers.delete(handler);
    }

    public send(topicSuffix: string, type: RoomMessage['type'], payload?: Record<string, any>) {
        if (!this.client || !this.currentRoomId) return;
        const msg: RoomMessage = {
            type, senderId: this.myId, senderName: this.myName, timestamp: Date.now(), payload
        };
        const safeRoomId = btoa(encodeURIComponent(this.currentRoomId)).replace(/=/g, '');
        this.client.publish(`dnd5r/room/${safeRoomId}/${topicSuffix}`, JSON.stringify(msg));
    }

    public broadcast(type: RoomMessage['type'], payload?: Record<string, any>) {
        this.send('broadcast', type, payload);
    }

    public sendToHost(type: RoomMessage['type'], payload?: Record<string, any>) {
        this.send('host', type, payload);
    }

    public sendToPlayer(playerId: string, type: RoomMessage['type'], payload?: Record<string, any>) {
        this.send(`p/${playerId}`, type, payload);
    }

    public disconnect() {
        const clientToClose = this.client;
        const wasHost = this.isHost;
        const roomIdToClear = this.currentRoomId;

        if (clientToClose && roomIdToClear && wasHost) {
            const safeRoomId = btoa(encodeURIComponent(roomIdToClear)).replace(/=/g, '');
            clientToClose.publish(`dnd5r/lobby/rooms/${safeRoomId}`, '', { retain: true }, () => {
                clientToClose.end(false);
            });
        } else if (clientToClose) {
            clientToClose.end(false);
        }

        this.client = null;
        this.currentRoomId = null;
    }
}

export const mqttInstance = new MqttService();
