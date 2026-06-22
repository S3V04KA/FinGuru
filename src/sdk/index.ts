import { AlgoGamesSDK } from 'algogames-sdk';

export { AlgoGamesSDK };
export type { TurnStrategy, TurnState } from 'algogames-sdk';

let sdk: AlgoGamesSDK | null = null;

function getParentOrigin(): string {
  if (typeof window === 'undefined') return '*'
  try {
    if (window.parent !== window) {
      return window.parent.location.origin
    }
  } catch {
    return '*'
  }
  return '*'
}

let parentOrigin = '*'

export function getSdk(): AlgoGamesSDK {
  if (!sdk) {
    parentOrigin = getParentOrigin()
    sdk = new AlgoGamesSDK(parentOrigin)
  }
  return sdk
}

function postToParent(type: string, payload: Record<string, unknown>): void {
  window.parent.postMessage({ type, payload }, parentOrigin)
}

export async function initSdk(): Promise<AlgoGamesSDK> {
  const s = getSdk()
  await s.init()
  return s
}

export async function initFinGuruGame(sdk: AlgoGamesSDK, roomId: string): Promise<void> {
  postToParent('finguru.initialize', { roomId })
}

export async function loadGameState(sdk: AlgoGamesSDK, roomId: string, maxRetries = 5): Promise<GameState | null> {
  for (let i = 0; i < maxRetries; i++) {
    const state = await getGameState(sdk, roomId)
    if (state) return state
    if (i < maxRetries - 1) {
      await new Promise(r => setTimeout(r, 1000 * (i + 1)))
    }
  }
  return null
}

export async function getPlayerRole(sdk: AlgoGamesSDK, roomId: string, playerId: string): Promise<string | null> {
  return new Promise((resolve) => {
    const handler = (msg: { type: string; data: any }) => {
      if (msg.type === 'finguru.roleAssigned' && msg.data?.roomId === roomId) {
        sdk.onReceiveMessage(() => {})
        resolve(msg.data.roleId)
      }
    }
    sdk.onReceiveMessage(handler)
    postToParent('finguru.getRole', { roomId, playerId })
  })
}

export async function getPlayerInfo(sdk: AlgoGamesSDK, roomId: string, playerId: string): Promise<{ roleId: string | null; color: string | null }> {
  return new Promise((resolve) => {
    const handler = (msg: { type: string; data: any }) => {
      if (msg.type === 'finguru.roleAssigned' && msg.data?.roomId === roomId) {
        sdk.onReceiveMessage(() => {})
        resolve({ roleId: msg.data.roleId ?? null, color: msg.data.color ?? null })
      }
    }
    sdk.onReceiveMessage(handler)
    postToParent('finguru.getRole', { roomId, playerId })
  })
}

export interface DreamServerState {
  id: number
  chosenByPlayerId: string | null
}

export interface DreamSelectionUpdate {
  dreamId: number
  selectedBy: string
  dreams: DreamServerState[]
  playerColors: Record<string, string>
  playerNames: Record<string, string>
}

export function subscribeDreamSelection(
  sdk: AlgoGamesSDK,
  roomId: string,
  _playerId: string,
  onUpdate: (update: DreamSelectionUpdate) => void
): () => void {
  const handler = (msg: { type: string; data: any }) => {
    if (msg.type === 'finguru.dreamSelected' && msg.data?.roomId === roomId) {
      onUpdate({
        dreamId: msg.data.dreamId,
        selectedBy: msg.data.selectedBy,
        dreams: msg.data.dreams,
        playerColors: msg.data.playerColors ?? {},
        playerNames: msg.data.playerNames ?? {},
      })
    }
  }
  sdk.onReceiveMessage(handler)
  return () => sdk.onReceiveMessage(() => {})
}

export interface PlayerGameState {
  playerId: string
  displayName: string
  roleId: string
  color: string
  dreamId: number | null
  cash: number
  income: number
  expenses: number
  position: number
  skipNextTurn: boolean
}

export interface DreamState {
  id: number
  title: string
  number: string
  description: string
  price: number
  chosenByPlayerId: string | null
}

export interface GameState {
  roomId: string
  phase: string
  currentRound: number
  winner: string | null
  players: PlayerGameState[]
  dreams: DreamState[]
  currentPlayerId: string
  turnCount: number
}

export function getGameState(sdk: AlgoGamesSDK, roomId: string): Promise<GameState | null> {
  return new Promise((resolve) => {
    const handler = (msg: { type: string; data: any }) => {
      if (msg.type === 'finguru.gameState') {
        sdk.onReceiveMessage(() => {})
        resolve(msg.data as GameState | null)
      }
    }
    sdk.onReceiveMessage(handler)
    postToParent('finguru.getGameState', { roomId })
    setTimeout(() => {
      sdk.onReceiveMessage(() => {})
      resolve(null)
    }, 3000)
  })
}

export interface DiceRollResult {
  rolledBy: string
  dice1: number
  dice2: number
  total: number
  newPosition: number
  sectorType: string
  sectorLabel: string
  cashChange: number
  newCash: number
  nextPlayerId: string
  isRoundPassed: boolean
  currentRound: number
  players: PlayerGameState[]
}

export function rollDice(sdk: AlgoGamesSDK, roomId: string, playerId: string): void {
  postToParent('finguru.rollDice', { roomId, playerId })
}

export function selectDream(sdk: AlgoGamesSDK, roomId: string, playerId: string, dreamId: number): void {
  postToParent('finguru.selectDream', { roomId, playerId, dreamId })
}

export function subscribeDiceRoll(
  sdk: AlgoGamesSDK,
  roomId: string,
  onUpdate: (result: DiceRollResult) => void
): () => void {
  const handler = (msg: { type: string; data: any }) => {
    if (msg.type === 'finguru.diceRolled' && msg.data?.roomId === roomId) {
      onUpdate(msg.data as DiceRollResult)
    }
  }
  sdk.onReceiveMessage(handler)
  return () => sdk.onReceiveMessage(() => {})
}

export function subscribeGameStateUpdate(
  sdk: AlgoGamesSDK,
  roomId: string,
  onUpdate: (state: GameState) => void
): () => void {
  const handler = (msg: { type: string; data: any }) => {
    if (msg.type === 'finguru.gameState' && msg.data?.roomId === roomId) {
      onUpdate(msg.data as GameState)
    }
  }
  sdk.onReceiveMessage(handler)
  return () => sdk.onReceiveMessage(() => {})
}
