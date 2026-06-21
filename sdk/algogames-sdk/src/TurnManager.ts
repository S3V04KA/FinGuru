export interface TurnState {
  playerOrder: string[];
  currentPlayerId: string;
  currentPlayerIndex: number;
  direction: 1 | -1;
  phase: string;
  timeRemaining?: number;
  turnCount: number;
  maxActionsPerTurn: number;
  actionsThisTurn: number;
}

export interface TurnStrategy {
  gameType: string;
  getPhases(): string[];
  canAct(state: TurnState, playerId: string, action: string): boolean;
  getNextPlayerIndex(state: TurnState, action: string, context?: Record<string, unknown>): number;
  onTurnStart(state: TurnState): void;
  onTurnEnd(state: TurnState): void;
}

export type TurnChangedHandler = (turn: TurnState) => void;
export type PhaseChangedHandler = (phase: string) => void;

export class TurnManager {
  private state: TurnState | null = null;
  private myPlayerId: string = '';
  private strategy: TurnStrategy | null = null;
  private turnChangedHandlers: TurnChangedHandler[] = [];
  private phaseChangedHandlers: PhaseChangedHandler[] = [];

  public setMyPlayerId(playerId: string): void {
    this.myPlayerId = playerId;
  }

  public setStrategy(strategy: TurnStrategy): void {
    this.strategy = strategy;
  }

  public getStrategy(): TurnStrategy | null {
    return this.strategy;
  }

  public updateFromState(rawState: any): void {
    const turnData = rawState?.turn;
    if (!turnData) return;

    const newTurn: TurnState = {
      playerOrder: turnData.playerOrder ?? [],
      currentPlayerId: turnData.currentPlayerId ?? '',
      currentPlayerIndex: turnData.currentPlayerIndex ?? 0,
      direction: (turnData.direction ?? 1) as 1 | -1,
      phase: turnData.phase ?? 'default',
      timeRemaining: turnData.timeRemaining,
      turnCount: turnData.turnCount ?? 0,
      maxActionsPerTurn: turnData.maxActionsPerTurn ?? 1,
      actionsThisTurn: turnData.actionsThisTurn ?? 0,
    };

    const prevPhase = this.state?.phase;
    const changed = this.state?.currentPlayerId !== newTurn.currentPlayerId;

    this.state = newTurn;

    if (changed) {
      for (const handler of this.turnChangedHandlers) {
        handler(newTurn);
      }
    }

    if (prevPhase !== newTurn.phase) {
      for (const handler of this.phaseChangedHandlers) {
        handler(newTurn.phase);
      }
    }
  }

  public getCurrentPlayer(): { id: string; index: number } | null {
    if (!this.state) return null;
    return {
      id: this.state.currentPlayerId,
      index: this.state.currentPlayerIndex,
    };
  }

  public isMyTurn(): boolean {
    return this.state?.currentPlayerId === this.myPlayerId;
  }

  public getPhase(): string {
    return this.state?.phase ?? '';
  }

  public getTimeRemaining(): number {
    return this.state?.timeRemaining ?? 0;
  }

  public getDirection(): 1 | -1 {
    return this.state?.direction ?? 1;
  }

  public getTurnCount(): number {
    return this.state?.turnCount ?? 0;
  }

  public getPlayerOrder(): string[] {
    return this.state?.playerOrder ?? [];
  }

  public getState(): TurnState | null {
    return this.state;
  }

  public validateAction(action: string, context?: Record<string, unknown>): boolean {
    if (!this.state || !this.strategy) return true;
    return this.strategy.canAct(this.state, this.myPlayerId, action);
  }

  public onTurnChanged(handler: TurnChangedHandler): void {
    this.turnChangedHandlers.push(handler);
  }

  public onPhaseChanged(handler: PhaseChangedHandler): void {
    this.phaseChangedHandlers.push(handler);
  }

  public removeTurnChangedHandler(handler: TurnChangedHandler): void {
    this.turnChangedHandlers = this.turnChangedHandlers.filter(h => h !== handler);
  }

  public removePhaseChangedHandler(handler: PhaseChangedHandler): void {
    this.phaseChangedHandlers = this.phaseChangedHandlers.filter(h => h !== handler);
  }

  public reset(): void {
    this.state = null;
    this.myPlayerId = '';
    this.turnChangedHandlers = [];
    this.phaseChangedHandlers = [];
  }
}
