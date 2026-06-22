import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import Dashboard from '../components/Dashboard'
import GameBoard from '../components/GameBoard'
import MoveHistory from '../components/MoveHistory'
import DiceWidget from '../components/DiceWidget'
import { icons, roleData, roleNames } from '../data/roles'
import { dreams as defaultDreams } from '../data/dreams'
import {
  getGameState,
  rollDice,
  subscribeDiceRoll,
  subscribeGameStateUpdate,
  type GameState,
  type DiceRollResult,
} from '../sdk'
import styles from './GamePage.module.css'

const STEP_MS = 350

export default function GamePage() {
  const navigate = useNavigate()
  const { roleName } = useParams<{ roleName: string }>()
  const data = roleName ? roleData[roleName] : undefined
  const { currentPlayerId: contextPlayerId } = useGame()

  const params = new URLSearchParams(window.location.search)
  const roomId = params.get('roomId') ?? ''
  const sdkPlayerId = params.get('playerId') ?? contextPlayerId ?? ''

  const [gameState, setGameState] = useState<GameState | null>(null)
  const [myColor, setMyColor] = useState<string>('#4CAF50')
  const [moveHistory, setMoveHistory] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'small' | 'big'>('small')

  const [showDice, setShowDice] = useState(false)

  const [animPos, setAnimPos] = useState<number | null>(null)

  const isAnimatingRef = useRef(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const gameStateRef = useRef<GameState | null>(null)
  gameStateRef.current = gameState

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout)
      timersRef.current = []
    }
  }, [])

  function clearTimers() {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

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
    setMoveHistory(prev => [{
      playerName: rolledPlayer?.displayName ?? result.rolledBy,
      playerColor: rolledPlayer?.color ?? '#999',
      moveLabel: `Ход ${result.total}`,
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      transactionType: result.sectorLabel,
      transactionTypeColor: getSectorColor(result.sectorType),
      action: result.cashChange >= 0 ? `+${result.cashChange}` : `${result.cashChange}`,
      actionColor: result.cashChange >= 0 ? 'rgb(52, 199, 89)' : 'rgb(255, 59, 48)',
      finances: [{
        label: 'Наличные',
        change: result.cashChange >= 0 ? `+${result.cashChange}` : `${result.cashChange}`,
        changeColor: result.cashChange >= 0 ? 'rgb(52, 199, 89)' : 'rgb(255, 59, 48)',
        result: `${result.newCash}`,
        resultColor: 'rgb(0, 0, 0)',
      }],
    }, ...prev])
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

  useEffect(() => {
    if (!roomId) return
    const unsub = subscribeDiceRoll(roomId, (result: DiceRollResult) => {
      const me = gameStateRef.current?.players.find(p => p.playerId === sdkPlayerId)
      if (me) setMyColor(me.color)

      applyResult(result)

      if (result.rolledBy === sdkPlayerId && !isAnimatingRef.current) {
        isAnimatingRef.current = true
        clearTimers()

        const oldPos = me?.position ?? 0
        const total = result.total
        let step = 0

        const doStep = () => {
          step++
          setAnimPos((oldPos + step) % 24)
          if (step >= total) {
            setAnimPos(null)
            isAnimatingRef.current = false
          } else {
            const t = setTimeout(doStep, STEP_MS)
            timersRef.current.push(t)
          }
        }

        const t = setTimeout(doStep, 350)
        timersRef.current.push(t)
      }
    })
    return unsub
  }, [roomId, sdkPlayerId, applyResult])

  useEffect(() => {
    if (!roomId) return
    const unsub = subscribeGameStateUpdate(roomId, (state) => {
      if (!isAnimatingRef.current) setGameState(state)
    })
    return unsub
  }, [roomId])

  const handleRollRequest = useCallback((_count: number) => {
    rollDice(roomId, sdkPlayerId)
  }, [roomId, sdkPlayerId])

  const isMyTurn = gameState?.currentPlayerId === sdkPlayerId

  if (!data) return <p>Роль не найдена</p>

  const me = gameState?.players.find(p => p.playerId === sdkPlayerId)
  const myDream = me?.dreamId != null ? defaultDreams.find(d => d.id === me.dreamId) : null
  const myPosition = animPos !== null ? animPos : (me?.position ?? 0)

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
      cellIndex: animPos !== null && p.playerId === sdkPlayerId ? animPos : p.position,
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
        />
      </div>

      <div className={styles.historyColumn}>
        <MoveHistory title="История ходов" entries={moveHistory} />
      </div>

      {isMyTurn && !isAnimatingRef.current && (
        <button className={styles.rollFab} onClick={() => setShowDice(true)}>
          Бросить кубик
        </button>
      )}

      {showDice && (
        <DiceWidget
          onRoll={handleRollRequest}
          onClose={() => setShowDice(false)}
        />
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
