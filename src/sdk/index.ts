import { AlgoGamesSDK } from 'algogames-sdk'

export { AlgoGamesSDK }
export type { TurnStrategy, TurnState } from 'algogames-sdk'

let sdk: AlgoGamesSDK | null = null
let parentOrigin = '*'

function getParentOrigin(): string {
  if (typeof window === 'undefined') return '*'
  try {
    if (window.parent !== window) return window.parent.location.origin
  } catch { /* ignore */ }
  return '*'
}

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

// ─── Multi-handler message dispatch ──────────────────────────────

type FinguruHandler = (msg: { type: string; data: any }) => void
const typeHandlers = new Map<string, Set<FinguruHandler>>()
let globalListenerInstalled = false

function installGlobalListener(): void {
  if (globalListenerInstalled) return
  globalListenerInstalled = true
  window.addEventListener('message', (event) => {
    const { type, payload } = event.data || {}
    if (type !== 'game.message' && type !== 'game.broadcast') return
    const innerType: string | undefined = payload?.type
    const innerData: any = payload?.data
    if (!innerType) return
    const set = typeHandlers.get(innerType)
    if (set) set.forEach(h => h({ type: innerType, data: innerData }))
  })
}

function on(type: string, handler: FinguruHandler): () => void {
  installGlobalListener()
  if (!typeHandlers.has(type)) typeHandlers.set(type, new Set())
  typeHandlers.get(type)!.add(handler)
  return () => { typeHandlers.get(type)?.delete(handler) }
}

function once(type: string): Promise<any> {
  return new Promise((resolve) => {
    const unsub = on(type, (msg) => { unsub(); resolve(msg.data) })
    setTimeout(() => { unsub(); resolve(null) }, 5000)
  })
}

// ─── FinGuru protocol functions ─────────────────────────────────

export async function initFinGuruGame(roomId: string, playerId: string): Promise<{ roleId: string; color: string } | null> {
  const promise = once('finguru.roleAssigned')
  postToParent('finguru.initialize', { roomId })
  const data = await promise
  if (data?.roomId === roomId && data?.roleId) {
    return { roleId: data.roleId, color: data.color }
  }
  return null
}

export function getGameState(roomId: string): Promise<GameState | null> {
  const promise = once('finguru.gameState')
  postToParent('finguru.getGameState', { roomId })
  return promise.then(data => data && data.roomId === roomId ? data as GameState : null)
}

export function selectDream(roomId: string, playerId: string, dreamId: number): void {
  postToParent('finguru.selectDream', { roomId, playerId, dreamId })
}

export function rollDice(roomId: string, playerId: string): void {
  postToParent('finguru.rollDice', { roomId, playerId })
}

// ─── Subscriptions ──────────────────────────────────────────────

export interface DreamSelectionUpdate {
  dreamId: number
  selectedBy: string
  dreams: { id: number; chosenByPlayerId: string | null }[]
  playerColors: Record<string, string>
  playerNames: Record<string, string>
}

export function subscribeDreamSelection(
  roomId: string,
  cb: (update: DreamSelectionUpdate) => void
): () => void {
  return on('finguru.dreamSelected', (msg) => {
    if (msg.data?.roomId === roomId) {
      cb({
        dreamId: msg.data.dreamId,
        selectedBy: msg.data.selectedBy,
        dreams: msg.data.dreams ?? [],
        playerColors: msg.data.playerColors ?? {},
        playerNames: msg.data.playerNames ?? {},
      })
    }
  })
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

export function subscribeDiceRoll(
  roomId: string,
  cb: (result: DiceRollResult) => void
): () => void {
  return on('finguru.diceRolled', (msg) => {
    if (msg.data?.roomId === roomId) cb(msg.data as DiceRollResult)
  })
}

export function subscribeGameStateUpdate(
  roomId: string,
  cb: (state: GameState) => void
): () => void {
  return on('finguru.gameState', (msg) => {
    if (msg.data?.roomId === roomId) cb(msg.data as GameState)
  })
}
