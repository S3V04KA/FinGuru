export interface GameMessage {
  type: string;
  data: any;
  senderId?: string;
  timestamp?: number;
}

export interface RoomInfo {
  roomId: string;
  playerId: string;
  players: PlayerInfo[];
}

export interface PlayerInfo {
  playerId: string;
  displayName: string;
}

export { TurnManager } from './TurnManager';
export type { TurnState, TurnStrategy, TurnChangedHandler, PhaseChangedHandler } from './TurnManager';

type MessageHandler = (message: GameMessage) => void;
type PlayerJoinedHandler = (player: PlayerInfo) => void;
type PlayerLeftHandler = (playerId: string) => void;

import { TurnManager } from './TurnManager';

export class AlgoGamesSDK {
  private parentOrigin: string;
  private isReady: boolean = false;
  private messageHandlers: Map<string, MessageHandler> = new Map();
  private connectionPromise: Promise<void> | null = null;
  private connectionResolve: (() => void) | null = null;
  private pendingResponses: Map<string, { resolve: Function; reject: Function; timeout: ReturnType<typeof setTimeout> }> = new Map();
  private playerId: string | null = null;
  private roomId: string | null = null;
  private _onPlayerJoined?: PlayerJoinedHandler;
  private _onPlayerLeft?: PlayerLeftHandler;
  private turnManager: TurnManager = new TurnManager();

  constructor(parentOrigin: string = '*') {
    this.parentOrigin = parentOrigin;
    this.setupMessageListener();
  }

  private setupMessageListener(): void {
    window.addEventListener('message', (event) => {
      if (this.parentOrigin !== '*' && event.origin !== this.parentOrigin) {
        return;
      }
      const { type, payload } = event.data || {};
      if (!type) return;

      if (payload?.turn) {
        this.turnManager.updateFromState(payload);
      }

      switch (type) {
        case 'ready':
          this.isReady = true;
          this.connectionResolve?.();
          break;

        case 'room.joined':
          this.roomId = payload.roomId;
          this.playerId = payload.playerId;
          this.turnManager.setMyPlayerId(payload.playerId);
          this.resolvePending('room.join', payload);
          break;

        case 'game.message':
          const handler = this.messageHandlers.get('message');
          if (handler) {
            handler({
              type: payload.type || 'message',
              data: payload.data,
              senderId: payload.senderId,
              timestamp: payload.timestamp
            });
          }
          break;

        case 'game.broadcast':
          const broadcastHandler = this.messageHandlers.get('broadcast');
          if (broadcastHandler) {
            broadcastHandler({
              type: payload.type || 'broadcast',
              data: payload.data,
              senderId: payload.senderId,
              timestamp: payload.timestamp
            });
          }
          break;

        case 'player.joined':
          this._onPlayerJoined?.(payload);
          break;

        case 'player.left':
          this._onPlayerLeft?.(payload.playerId);
          break;

        case 'room.left':
          this.resolvePending('room.leave', payload);
          break;

        case 'room.error':
          this.rejectPending('room.join', new Error(payload.message));
          this.rejectPending('room.leave', new Error(payload.message));
          break;
      }
    });
  }

  public async init(): Promise<void> {
    if (this.connectionPromise) return this.connectionPromise;

    this.connectionPromise = new Promise<void>((resolve) => {
      this.connectionResolve = resolve;
    });

    if (this.isReady) return this.connectionPromise;

    window.parent.postMessage({ type: 'sdk.ready', payload: {} }, this.parentOrigin);
    return this.connectionPromise;
  }

  public async joinRoom(roomId: string, playerId: string, displayName: string): Promise<RoomInfo> {
    window.parent.postMessage({
      type: 'room.join',
      payload: { roomId, playerId, displayName }
    }, this.parentOrigin);

    return this.waitForResponse('room.join');
  }

  public async leaveRoom(): Promise<void> {
    if (!this.roomId) return;

    window.parent.postMessage({
      type: 'room.leave',
      payload: { roomId: this.roomId }
    }, this.parentOrigin);

    return this.waitForResponse('room.leave');
  }

  public broadcastMessage(type: string, data: any): void {
    window.parent.postMessage({
      type: 'game.broadcast',
      payload: {
        type,
        data,
        senderId: this.playerId,
        timestamp: Date.now()
      }
    }, this.parentOrigin);
  }

  public sendMessageToPlayer(targetPlayerId: string, type: string, data: any): void {
    window.parent.postMessage({
      type: 'game.sendToPlayer',
      payload: {
        targetPlayerId,
        type,
        data,
        senderId: this.playerId,
        timestamp: Date.now()
      }
    }, this.parentOrigin);
  }

  public onReceiveMessage(handler: MessageHandler): void {
    this.messageHandlers.set('message', handler);
  }

  public onBroadcast(handler: MessageHandler): void {
    this.messageHandlers.set('broadcast', handler);
  }

  public onPlayerJoined(handler: PlayerJoinedHandler): void {
    this._onPlayerJoined = handler;
  }

  public onPlayerLeft(handler: PlayerLeftHandler): void {
    this._onPlayerLeft = handler;
  }

  public offMessage(): void {
    this.messageHandlers.delete('message');
    this.messageHandlers.delete('broadcast');
  }

  public sendAction(action: string, data?: Record<string, unknown>): void {
    window.parent.postMessage({
      type: 'game.action',
      payload: {
        action,
        ...data,
        senderId: this.playerId,
        timestamp: Date.now()
      }
    }, this.parentOrigin);
  }

  public validateAction(action: string, context?: Record<string, unknown>): boolean {
    return this.turnManager.validateAction(action, context);
  }

  public getTurnManager(): TurnManager {
    return this.turnManager;
  }

  public getPlayerId(): string | null {
    return this.playerId;
  }

  public getRoomId(): string | null {
    return this.roomId;
  }

  public isConnected(): boolean {
    return this.isReady && this.roomId !== null;
  }

  private waitForResponse(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingResponses.delete(key);
        reject(new Error(`Timeout waiting for ${key}`));
      }, 10000);
      this.pendingResponses.set(key, { resolve, reject, timeout });
    });
  }

  private resolvePending(key: string, data: any): void {
    const pending = this.pendingResponses.get(key);
    if (pending) {
      clearTimeout(pending.timeout);
      pending.resolve(data);
      this.pendingResponses.delete(key);
    }
  }

  private rejectPending(key: string, error: Error): void {
    const pending = this.pendingResponses.get(key);
    if (pending) {
      clearTimeout(pending.timeout);
      pending.reject(error);
      this.pendingResponses.delete(key);
    }
  }

  public disconnect(): void {
    this.pendingResponses.forEach((p) => clearTimeout(p.timeout));
    this.pendingResponses.clear();
    this.isReady = false;
    this.roomId = null;
    this.playerId = null;
    this.turnManager.reset();
    window.parent.postMessage({ type: 'bridge.disconnect', payload: {} }, this.parentOrigin);
  }
}

export default AlgoGamesSDK;
