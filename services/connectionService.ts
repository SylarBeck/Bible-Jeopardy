import Peer, { DataConnection } from 'peerjs';
import { NetworkMessage, Avatar } from '../types';

const PEER_ID_PREFIX = 'bible-jeopardy-';

export class ConnectionService {
  private peer: Peer | null = null;
  private connections: DataConnection[] = [];
  private hostConnection: DataConnection | null = null;
  
  // Host Methods
  async initializeHost(
    onJoin: (teamName: string, connId: string, avatar: Avatar) => void,
    onData: (data: NetworkMessage, connId: string) => void
  ): Promise<string> {
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    const peerId = `${PEER_ID_PREFIX}${code}`;

    return new Promise((resolve, reject) => {
      // @ts-ignore
      this.peer = new Peer(peerId);

      this.peer.on('open', (id) => {
        console.log('Host initialized:', id);
        resolve(code);
      });

      this.peer.on('connection', (conn) => {
        this.connections.push(conn);
        
        conn.on('data', (data: any) => {
          const msg = data as NetworkMessage;
          if (msg.type === 'JOIN' && msg.teamName && msg.avatar) {
            onJoin(msg.teamName, conn.peer, msg.avatar);
          }
          onData(msg, conn.peer);
        });

        conn.on('close', () => {
          this.connections = this.connections.filter(c => c.peer !== conn.peer);
        });
      });

      this.peer.on('error', (err) => {
        console.error('Peer error:', err);
        reject(err);
      });
    });
  }

  // Client Methods
  async initializeClient(
    code: string, 
    teamName: string,
    avatar: Avatar,
    onConnect: () => void,
    onData: (data: NetworkMessage) => void,
    onStatusUpdate?: (status: string) => void
  ): Promise<void> {
    const peerId = `${PEER_ID_PREFIX}${code}`;
    if (onStatusUpdate) onStatusUpdate('Connecting to host...');
    
    return new Promise((resolve, reject) => {
      // @ts-ignore
      this.peer = new Peer(); // Client gets random ID

      this.peer.on('open', () => {
        if (!this.peer) return;
        if (onStatusUpdate) onStatusUpdate('Authenticating...');
        
        const conn = this.peer.connect(peerId);
        
        conn.on('open', () => {
          if (onStatusUpdate) onStatusUpdate(`Connected to host ${code}`);
          this.hostConnection = conn;
          // Send join message immediately with avatar
          this.sendMessage({ type: 'JOIN', teamName, teamId: this.peer?.id, avatar });
          onConnect();
          resolve();
        });

        conn.on('data', (data: any) => {
          onData(data as NetworkMessage);
        });

        conn.on('error', (err) => {
          console.error('Connection error:', err);
          reject(err);
        });
      });

      this.peer.on('error', (err) => {
        reject(err);
      });
    });
  }

  sendMessage(msg: NetworkMessage) {
    if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send(msg);
    } else if (this.connections.length > 0) {
      // Host broadcasting to all
      this.connections.forEach(conn => {
        if (conn.open) conn.send(msg);
      });
    }
  }

  disconnect() {
    this.connections.forEach(c => c.close());
    if (this.hostConnection) this.hostConnection.close();
    if (this.peer) this.peer.destroy();
    this.connections = [];
    this.hostConnection = null;
    this.peer = null;
  }
}

export const connectionService = new ConnectionService();