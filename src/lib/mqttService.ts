import mqtt, { MqttClient } from 'mqtt';

export interface PlayerNode {
    id: string;
    name: string;
    isHost?: boolean;
}

export interface RoomMessage {
    type: 'JOIN_REQUEST' | 'JOIN_ACCEPTED' | 'JOIN_REJECTED' | 'PLAYER_LIST' | 'PLAYER_LEFT' | 'ROOM_CLOSED' | 'DICE_ROLL';
    senderId: string;
    senderName: string;
    timestamp: number;
    payload?: any;
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
        this.myId = (isHost ? 'host-' : 'player-') + Math.random().toString(36).substr(2, 9);
        this.currentRoomId = roomId || Math.floor(10000 + Math.random() * 90000).toString();

        this.client = mqtt.connect('wss://broker.emqx.io:8084/mqtt');

        this.client.on('connect', () => {
            const topics = isHost ? [
                `dnd5r/room/${this.currentRoomId}/host`,
                `dnd5r/room/${this.currentRoomId}/broadcast`
            ] : [
                `dnd5r/room/${this.currentRoomId}/broadcast`,
                `dnd5r/room/${this.currentRoomId}/p/${this.myId}`
            ];

            this.client?.subscribe(topics);
            this.onConnectHandlers.forEach(cb => cb());
        });

        this.client.on('message', (topic, message) => {
            try {
                const data: RoomMessage = JSON.parse(message.toString());
                // ignore echoes
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

    public send(topicSuffix: string, type: RoomMessage['type'], payload?: any) {
        if (!this.client || !this.currentRoomId) return;
        const msg: RoomMessage = {
            type, senderId: this.myId, senderName: this.myName, timestamp: Date.now(), payload
        };
        this.client.publish(`dnd5r/room/${this.currentRoomId}/${topicSuffix}`, JSON.stringify(msg));
    }

    public broadcast(type: RoomMessage['type'], payload?: any) {
        this.send('broadcast', type, payload);
    }

    public sendToHost(type: RoomMessage['type'], payload?: any) {
        this.send('host', type, payload);
    }

    public sendToPlayer(playerId: string, type: RoomMessage['type'], payload?: any) {
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
