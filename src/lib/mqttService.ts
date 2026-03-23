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
}

export interface RoomMessage {
    type: 'JOIN_REQUEST' | 'JOIN_ACCEPTED' | 'JOIN_REJECTED' | 'PLAYER_LIST' | 'PLAYER_LEFT' | 'ROOM_CLOSED' | 'DICE_ROLL'
    | 'CHARACTER_IMPORT' | 'CHARACTER_SYNC' | 'CHARACTER_ADJUST' | 'CHARACTER_SNAPSHOT';
    senderId: string;
    senderName: string;
    timestamp: number;
    payload?: Record<string, any>;
}

class MqttService {
    private client: MqttClient | null = null;
    public myId: string = '';
    public myName: string = '';
    public currentRoomId: string | null = null;
    public isHost: boolean = false;

    private messageHandlers: Set<(msg: RoomMessage) => void> = new Set();
    private onConnectHandlers: Set<() => void> = new Set();

    public init(playerName: string, roomId: string | null = null, isHost: boolean = false) {
        this.disconnect();

        this.myName = playerName;
        this.isHost = isHost;
        this.myId = (isHost ? 'host-' : 'player-') + Math.random().toString(36).substring(2, 9);
        const rawRoomId = roomId || Math.floor(10000 + Math.random() * 90000).toString();
        this.currentRoomId = rawRoomId;

        // Sanitize Room ID for MQTT topics (UTF-8/Chinese support safely)
        const safeRoomId = btoa(encodeURIComponent(rawRoomId)).replace(/=/g, '');
        const topicPrefix = `dnd5r/room/${safeRoomId}`;

        this.client = mqtt.connect('wss://broker.emqx.io:8084/mqtt');

        this.client.on('connect', () => {
            const topics = isHost ? [
                `${topicPrefix}/host`,
                `${topicPrefix}/broadcast`
            ] : [
                `${topicPrefix}/broadcast`,
                `${topicPrefix}/p/${this.myId}`
            ];

            this.client?.subscribe(topics);
            this.onConnectHandlers.forEach(cb => cb());
        });

        this.client.on('error', (err) => {
            console.error("MQTT Error:", err);
        });

        this.client.on('offline', () => {
            console.warn("MQTT Offline");
        });

        this.client.on('message', (_topic, message) => {
            try {
                const data: RoomMessage = JSON.parse(message.toString());
                if (data.senderId === this.myId) return;
                this.messageHandlers.forEach(handler => handler(data));
            } catch (e) {
                console.error("Failed to parse mqtt message", e);
            }
        });
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
        if (this.client) {
            this.client.end(true);
            this.client = null;
        }
        this.currentRoomId = null;
    }
}

export const mqttInstance = new MqttService();
