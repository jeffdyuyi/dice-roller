export type SignalPayload = 
  | { type: 'offer'; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; sdp: RTCSessionDescriptionInit }
  | { type: 'candidate'; candidate: RTCIceCandidateInit };

export class WebRtcManager {
    private peerConnections: Map<string, RTCPeerConnection> = new Map();
    private dataChannels: Map<string, RTCDataChannel> = new Map();
    private onMessageCallback: ((senderId: string, msg: any) => void) | null = null;
    private onConnectionChangeCallback: ((playerId: string, state: string) => void) | null = null;

    private iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ];

    public onMessage(cb: (senderId: string, msg: any) => void) {
        this.onMessageCallback = cb;
    }

    public onConnectionChange(cb: (playerId: string, state: string) => void) {
        this.onConnectionChangeCallback = cb;
    }

    // A player calls this to initiate WebRTC with the Host
    public async initiateConnection(hostId: string, sendSignal: (signal: SignalPayload) => void) {
        console.log(`[WebRTC] Initiating P2P connection to host: ${hostId}`);
        if (this.peerConnections.has(hostId)) {
            this.closeConnection(hostId);
        }

        try {
            const pc = new RTCPeerConnection({ iceServers: this.iceServers });
            this.peerConnections.set(hostId, pc);

            // Create data channel
            const dc = pc.createDataChannel('trpg-data-channel', { negotiated: true, id: 1 });
            this.setupDataChannel(hostId, dc);

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    sendSignal({ type: 'candidate', candidate: event.candidate });
                }
            };

            pc.onconnectionstatechange = () => {
                console.log(`[WebRTC] Host connection state changed: ${pc.connectionState}`);
                this.onConnectionChangeCallback?.(hostId, pc.connectionState);
                if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                    this.closeConnection(hostId);
                }
            };

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            sendSignal({ type: 'offer', sdp: offer });
        } catch (err) {
            console.error('[WebRTC] Failed to initiate connection:', err);
        }
    }

    // Both sides call this when receiving a signaling message from MQTT
    public async handleSignal(
        senderId: string,
        signal: SignalPayload,
        sendSignal: (signal: SignalPayload) => void
    ) {
        console.log(`[WebRTC] Received signal of type ${signal.type} from ${senderId}`);
        
        let pc = this.peerConnections.get(senderId);
        if (!pc) {
            try {
                // If receiver is Host and didn't have peer connection yet, initialize it
                pc = new RTCPeerConnection({ iceServers: this.iceServers });
                this.peerConnections.set(senderId, pc);

                // Setup data channel with matching negotiated id
                const dc = pc.createDataChannel('trpg-data-channel', { negotiated: true, id: 1 });
                this.setupDataChannel(senderId, dc);

                pc.onicecandidate = (event) => {
                    if (event.candidate) {
                        sendSignal({ type: 'candidate', candidate: event.candidate });
                    }
                };

                pc.onconnectionstatechange = () => {
                    console.log(`[WebRTC] Player ${senderId} connection state: ${pc!.connectionState}`);
                    this.onConnectionChangeCallback?.(senderId, pc!.connectionState);
                    if (pc!.connectionState === 'failed' || pc!.connectionState === 'closed') {
                        this.closeConnection(senderId);
                    }
                };
            } catch (err) {
                console.error('[WebRTC] Failed to handle incoming peer connection:', err);
                return;
            }
        }

        try {
            if (signal.type === 'offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                sendSignal({ type: 'answer', sdp: answer });
            } else if (signal.type === 'answer') {
                await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
            } else if (signal.type === 'candidate') {
                await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            }
        } catch (e) {
            console.error("[WebRTC] Error processing signaling state:", e);
        }
    }

    private setupDataChannel(playerId: string, dc: RTCDataChannel) {
        this.dataChannels.set(playerId, dc);

        dc.onopen = () => {
            console.log(`[WebRTC] Data channel opened with ${playerId}`);
            this.onConnectionChangeCallback?.(playerId, 'connected');
        };

        dc.onmessage = (event) => {
            try {
                const parsed = JSON.parse(event.data);
                this.onMessageCallback?.(playerId, parsed);
            } catch (e) {
                console.error("[WebRTC] Error parsing data channel message", e);
            }
        };

        dc.onclose = () => {
            console.log(`[WebRTC] Data channel closed with ${playerId}`);
            this.dataChannels.delete(playerId);
        };

        dc.onerror = (err) => {
            console.error(`[WebRTC] Data channel error with ${playerId}:`, err);
        };
    }

    public sendP2P(targetId: string, message: any): boolean {
        const dc = this.dataChannels.get(targetId);
        if (dc && dc.readyState === 'open') {
            dc.send(JSON.stringify(message));
            return true;
        }
        return false;
    }

    public broadcastP2P(message: any): boolean {
        let sentAny = false;
        this.dataChannels.forEach((dc) => {
            if (dc.readyState === 'open') {
                dc.send(JSON.stringify(message));
                sentAny = true;
            }
        });
        return sentAny;
    }

    public closeConnection(playerId: string) {
        console.log(`[WebRTC] Closing connection with ${playerId}`);
        const dc = this.dataChannels.get(playerId);
        if (dc) {
            try { dc.close(); } catch (e) {}
            this.dataChannels.delete(playerId);
        }
        const pc = this.peerConnections.get(playerId);
        if (pc) {
            try { pc.close(); } catch (e) {}
            this.peerConnections.delete(playerId);
        }
        this.onConnectionChangeCallback?.(playerId, 'disconnected');
    }

    public closeAll() {
        Array.from(this.peerConnections.keys()).forEach(playerId => {
            this.closeConnection(playerId);
        });
    }
}

export const webrtcInstance = new WebRtcManager();
