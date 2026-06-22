import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import Dashboard from '../components/Dashboard'
import GameBoard from '../components/GameBoard'
import MoveHistory from '../components/MoveHistory'
import DiceOverlay from '../components/DiceOverlay'
import { icons, roleData, roleNames } from '../data/roles'
import { dreams as defaultDreams } from '../data/dreams'
import {
  getGameState,
  rollDice,
  subscribeDiceRoll,
  subscribeGameStateUpdate,
  type GameState,
  type DiceRollResult,
  type PlayerGameState,
} from '../sdk'
import styles from './GamePage.module.css'

const STEP_INTERVAL = 350
const ROLLING_DURATION = 1200
const SETTLED_DURATION = 500

export default function GamePage() {
  const navigate = useNavigate()
  const { roleName } = useParams<{ roleName: string }>()
  const data = roleName ? roleData[roleName] : undefined
  const { players: contextPlayers, currentPlayerId: contextPlayerId } = useGame()

  const params = new URLSearchParams(window.location.search)
  const roomId = params.get('roomId') ?? ''
  const sdkPlayerId = params.get('playerId') ?? contextPlayerId ?? ''

  const [gameState, setGameState] = useState<GameState | null>(null)
  const [myColor, setMyColor] = useState<string>('#4CAF50')
  const [moveHistory, setMoveHistory] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'small' | 'big'>('small')
  const [isRolling, setIsRolling] = useState(false)

  // Dice animation state
  const [diceDisplay, setDiceDisplay] = useState<{ v1: number; v2: number } | null>(null)
  const [dicePhase, setDicePhase] = useState<'hidden' | 'rolling' | 'settled'>('hidden')
  const [animatingPosition, setAnimatingPosition] = useState<number | null>(null)

  const pendingResultRef = useRef<DiceRollResult | null>(null)
  const oldPositionRef = useRef<number>(0)
  const gameStateRef = useRef<GameState | null>(null)
  gameStateRef.current = gameState

  const applyResult = useCallback((result: DiceRollResult) => {
    setGameState(prev => {
      if (!prev) return prev
      return {
        ...prev,
        players: result.players,
        currentRound: result.currentRound,
        currentPlayerId: result.nextPlayerId,
      }
    })
    const rolledPlayer = result.players.find(p => p.playerId === result.rolledBy)
    setMoveHistory(prev => [
      {
        playerName: rolledPlayer?.displayName ?? result.rolledBy,
        playerColor: rolledPlayer?.color ?? '#999',
        moveLabel: `Ход ${result.total}`,
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        transactionType: result.sectorLabel,
        transactionTypeColor: getSectorColor(result.sectorType),
        action: result.cashChange >= 0 ? `+${result.cashChange}` : `${result.cashChange}`,
        actionColor: result.cashChange >= 0 ? 'rgb(52, 199, 89)' : 'rgb(255, 59, 48)',
        finances: [
          {
            label: 'Наличные',
            change: result.cashChange >= 0 ? `+${result.cashChange}` : `${result.cashChange}`,
            changeColor: result.cashChange >= 0 ? 'rgb(52, 199, 89)' : 'rgb(255, 59, 48)',
            result: `${result.newCash}`,
            resultColor: 'rgb(0, 0, 0)',
          },
        ],
      },
      ...prev,
    ])
  }, [])

  useEffect(() => {
    if (!roomId) return
    getGameState(roomId).then(state => {
      if (state) {
        setGameState(state)
        const me = state.players.find(p => p.playerId === sdkPlayerId)
        if (me) setMyColor(me.color)
      }
    })
  }, [roomId, sdkPlayerId])

  // Rolling phase — cycle random values
  useEffect(() => {
    if (dicePhase !== 'rolling') return
    const interval = setInterval(() => {
      setDiceDisplay({
        v1: Math.floor(Math.random() * 6) + 1,
        v2: Math.floor(Math.random() * 6) + 1,
      })
    }, 100)
    return () => clearInterval(interval)
  }, [dicePhase])

  // Settled phase — show actual values → start movement
  useEffect(() => {
    if (dicePhase !== 'settled') return
    const result = pendingResultRef.current
    if (!result) return
    setDiceDisplay({ v1: result.dice1, v2: result.dice2 })

    const timer = setTimeout(() => {
      const oldPos = oldPositionRef.current
      const total = result.total
      let step = 0

      const moveInterval = setInterval(() => {
        step++
        const pos = (oldPos + step) % 24
        setAnimatingPosition(pos)

        if (step >= total) {
          clearInterval(moveInterval)
          applyResult(result)
          setAnimatingPosition(null)
          setDiceDisplay(null)
          setDicePhase('hidden')
          setIsRolling(false)
        }
      }, STEP_INTERVAL)
    }, SETTLED_DURATION)

    return () => clearTimeout(timer)
  }, [dicePhase, applyResult])

  useEffect(() => {
    if (!roomId) return
    const unsub = subscribeDiceRoll(roomId, (result: DiceRollResult) => {
      const me = gameStateRef.current?.players.find(p => p.playerId === sdkPlayerId)
      if (me) setMyColor(me.color)

      if (result.rolledBy === sdkPlayerId) {
        pendingResultRef.current = result
        oldPositionRef.current = me?.position ?? 0
        setDiceDisplay({ v1: result.dice1, v2: result.dice2 })
        setDicePhase('rolling')
      } else {
        applyResult(result)
      }
    })
    return unsub
  }, [roomId, sdkPlayerId, applyResult])

  useEffect(() => {
    if (!roomId) return
    const unsub = subscribeGameStateUpdate(roomId, (state) => {
      if (dicePhase === 'hidden') setGameState(state)
    })
    return unsub
  }, [roomId, dicePhase])

  const handleRollDice = useCallback(() => {
    if (isRolling) return
    setIsRolling(true)
    rollDice(roomId, sdkPlayerId)
  }, [roomId, sdkPlayerId, isRolling])

  if (!data) return <p>Роль не найдена</p>

  const me = gameState?.players.find(p => p.playerId === sdkPlayerId)
  const myDream = me?.dreamId != null ? defaultDreams.find(d => d.id === me.dreamId) : null
  const myPosition = animatingPosition !== null ? animatingPosition : (me?.position ?? 0)

  const dashboardPlayer = me ?? {
    playerId: sdkPlayerId,
    displayName: data.name,
    roleId: roleName ?? '',
    color: myColor,
    dreamId: null,
    cash: 0,
    income: data.financialData.income.total,
    expenses: data.financialData.expenses.total,
    position: myPosition,
    skipNextTurn: false,
  }

  function reachedBigCircle(p: { dreamId: number | null; cash: number }): boolean {
    if (p.dreamId == null) return false
    const dream = defaultDreams.find(d => d.id === p.dreamId)
    return dream ? p.cash >= dream.price : false
  }

  const smallCirclePlayers = (gameState?.players ?? [])
    .filter(p => !reachedBigCircle(p))
    .map(p => ({
      id: p.playerId,
      color: p.color,
      letter: p.displayName.charAt(0).toUpperCase(),
      cellIndex: animatingPosition !== null && p.playerId === sdkPlayerId ? animatingPosition : p.position,
      name: p.displayName,
    }))

  const bigSectorPlayers = (gameState?.players ?? [])
    .filter(p => reachedBigCircle(p))
    .map(p => ({
      id: p.playerId,
      color: p.color,
      letter: p.displayName.charAt(0).toUpperCase(),
      cellIndex: (p.position * 2) % 48,
      name: p.displayName,
    }))

  const bigSectorDreams = (gameState?.players ?? [])
    .filter(p => p.dreamId != null)
    .map(p => {
      const dreamIndex = (p.dreamId! - 1) % 7
      const cellIndex = (dreamIndex * 7) % 48
      return { cellIndex, playerName: p.displayName, color: p.color }
    })

  const isMyTurn = gameState?.currentPlayerId === sdkPlayerId

  return (
    <div className={styles.gamePage}>
      <div className={styles.dashboardColumn}>
        <Dashboard
          playerName={dashboardPlayer.displayName}
          playerRole={data.name}
          moveNumber={gameState?.turnCount ?? 0}
          stats={{
            cash: dashboardPlayer.cash,
            salary: dashboardPlayer.income,
            expenses: dashboardPlayer.expenses,
            passiveIncome: 0,
            cashFlow: dashboardPlayer.income - dashboardPlayer.expenses,
          }}
          goalTarget={myDream?.price ?? 0}
          progressAmount={dashboardPlayer.cash}
          statuses={[]}
          assetCategories={[]}
          icon={icons[`/src/assets/roles/${roleName}.svg`]}
        />
      </div>

      <div className={styles.boardColumn}>
        <GameBoard
          players={smallCirclePlayers}
          bigSectorPlayers={bigSectorPlayers}
          bigSectorDreams={bigSectorDreams}
          currentPlayerId={isMyTurn ? sdkPlayerId : undefined}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onRollDice={isMyTurn ? handleRollDice : undefined}
        />
      </div>

      <div className={styles.historyColumn}>
        <MoveHistory
          title="История ходов"
          entries={moveHistory}
        />
      </div>

      {diceDisplay && dicePhase !== 'hidden' && (
        <DiceOverlay value1={diceDisplay.v1} value2={diceDisplay.v2} />
      )}
    </div>
  )
}

function getSectorColor(type: string): string {
  switch (type) {
    case 'salary': return 'rgb(255, 151, 5)'
    case 'deal': return 'rgb(52, 199, 89)'
    case 'shop': return 'rgb(7, 124, 255)'
    case 'negative': return 'rgb(96, 96, 96)'
    case 'child': return 'rgb(255, 54, 200)'
    case 'charity': return 'rgb(255, 53, 92)'
    case 'other': return 'rgb(255, 53, 92)'
    default: return 'rgb(60, 60, 67)'
  }
}
