import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import Dashboard from '../components/Dashboard'
import GameBoard from '../components/GameBoard'
import MoveHistory from '../components/MoveHistory'
import DiceWidget from '../components/DiceWidget'
import { icons, roleData, roleNames } from '../data/roles'
import { dreams as defaultDreams } from '../data/dreams'
import DealSelectionModal from '../components/dealSelection/DealSelectionModal'
import BigDealCard from '../components/cards/BigDealCard'
import SmallDealCard from '../components/cards/SmallDealCard'
import {
  getGameState,
  rollDice,
  subscribeDiceRoll,
  subscribeGameStateUpdate,
  type GameState,
  type DiceRollResult,
  type FinGuruDealCard,
  type DealType,
  buyDeal,
  skipDeal,
} from '../sdk'
import {
  getBigDealCards,
  getSmallDealCards,
  type CardDto,
} from '../api/cards'
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

  // Deal flow state
  const [showDealSelection, setShowDealSelection] = useState(false)
  const [currentDealCard, setCurrentDealCard] = useState<FinGuruDealCard | null>(null)
  const [currentDealType, setCurrentDealType] = useState<DealType>('small')
  const [showDealCard, setShowDealCard] = useState(false)
  const [dealLoading, setDealLoading] = useState(false)
  const [dealError, setDealError] = useState<string | null>(null)

  const isAnimatingRef = useRef(false)
  const pendingDealRef = useRef<DiceRollResult | null>(null)
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
            // Trigger deal flow if landed on a deal sector
            if (result.sectorType === 'deal') {
              pendingDealRef.current = result
              setShowDealSelection(true)
            }
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

  function mapDtoToCard(dto: CardDto): FinGuruDealCard {
    return {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      amount: dto.amount,
      headerLabel: dto.headerLabel || undefined,
      details: dto.details.map(d => ({
        name: d.name,
        amount: d.value ? d.value : d.amount,
        negative: d.isNegative,
      })),
    }
  }

  // ─── Deal flow handlers ────────────────────────────────────────

  const handleDealSelect = useCallback(async (type: DealType) => {
    setShowDealSelection(false)
    setCurrentDealType(type)
    setDealLoading(true)
    setDealError(null)

    try {
      let cardDto: CardDto
      if (type === 'big') {
        const cards = await getBigDealCards()
        if (cards.length === 0) throw new Error('Нет доступных крупных сделок')
        cardDto = cards[Math.floor(Math.random() * cards.length)]
      } else {
        const cards = await getSmallDealCards()
        if (cards.length === 0) throw new Error('Нет доступных мелких сделок')
        cardDto = cards[Math.floor(Math.random() * cards.length)]
      }

      setCurrentDealCard(mapDtoToCard(cardDto))
      setShowDealCard(true)
    } catch (e) {
      setDealError(e instanceof Error ? e.message : 'Ошибка загрузки карты')
    } finally {
      setDealLoading(false)
    }
  }, [])

  const handleDealAccept = useCallback(() => {
    if (!currentDealCard || !pendingDealRef.current) return

    const result = pendingDealRef.current
    const rolledPlayer = result.players.find(p => p.playerId === result.rolledBy)

    setMoveHistory(prev => [{
      playerName: rolledPlayer?.displayName ?? result.rolledBy,
      playerColor: rolledPlayer?.color ?? '#999',
      moveLabel: currentDealType === 'big' ? 'Крупная сделка' : 'Мелкая сделка',
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      transactionType: 'Покупка',
      transactionTypeColor: 'rgb(52, 199, 89)',
      action: `–${currentDealCard.amount}`,
      actionColor: 'rgb(255, 59, 48)',
      finances: [{
        label: 'Наличные',
        change: `–${currentDealCard.amount}`,
        changeColor: 'rgb(255, 59, 48)',
        result: `${(rolledPlayer?.cash ?? 0) - (typeof currentDealCard.amount === 'number' ? currentDealCard.amount : 0)}`,
        resultColor: 'rgb(0, 0, 0)',
      }],
      dealCard: {
        title: currentDealCard.name,
        description: currentDealCard.description,
        price: typeof currentDealCard.amount === 'number'
          ? `${currentDealCard.amount.toLocaleString('ru-RU')} ₽`
          : String(currentDealCard.amount),
      },
    }, ...prev])

    buyDeal(roomId, sdkPlayerId, currentDealCard.id, currentDealType)
    setShowDealCard(false)
    setCurrentDealCard(null)
    pendingDealRef.current = null
  }, [currentDealCard, currentDealType, roomId, sdkPlayerId])

  const handleDealSkip = useCallback(() => {
    skipDeal(roomId, sdkPlayerId)
    setShowDealCard(false)
    setCurrentDealCard(null)
    pendingDealRef.current = null
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

      {/* Deal selection modal */}
      <DealSelectionModal
        isOpen={showDealSelection}
        onClose={() => {
          setShowDealSelection(false)
          pendingDealRef.current = null
        }}
        onSelect={handleDealSelect}
      />

      {/* Deal loading */}
      {dealLoading && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 18,
        }}>
          Загрузка карты...
        </div>
      )}

      {/* Deal error */}
      {dealError && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)',
        }}>
          <div style={{
            background: '#fff', padding: 24, borderRadius: 16,
            textAlign: 'center', maxWidth: 320,
          }}>
            <p style={{ margin: '0 0 16px', fontSize: 16 }}>{dealError}</p>
            <button
              onClick={() => setDealError(null)}
              style={{
                padding: '8px 24px', borderRadius: 8, border: 'none',
                background: '#5E5CE6', color: '#fff', cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Deal card display */}
      {currentDealType === 'big' ? (
        <BigDealCard
          name={currentDealCard?.name ?? ''}
          description={currentDealCard?.description ?? ''}
          amount={currentDealCard?.amount ?? 0}
          headerLabel={currentDealCard?.headerLabel}
          details={(currentDealCard?.details ?? []).map(d => ({
            name: d.name,
            amount: d.amount,
            negative: d.negative,
          }))}
          rightAlign={!!currentDealCard?.headerLabel && currentDealCard.headerLabel.length <= 5}
          isOpen={showDealCard && currentDealType === 'big'}
          onClick={handleDealAccept}
          onClose={handleDealSkip}
        />
      ) : (
        <SmallDealCard
          name={currentDealCard?.name ?? ''}
          description={currentDealCard?.description ?? ''}
          amount={currentDealCard?.amount ?? 0}
          headerLabel={currentDealCard?.headerLabel}
          details={(currentDealCard?.details ?? []).map(d => ({
            name: d.name,
            amount: d.amount,
            negative: d.negative,
          }))}
          rightAlign={!!currentDealCard?.headerLabel && currentDealCard.headerLabel.length <= 5}
          isOpen={showDealCard && currentDealType === 'small'}
          onClick={handleDealAccept}
          onClose={handleDealSkip}
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
