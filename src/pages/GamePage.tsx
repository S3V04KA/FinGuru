import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGame } from '../context/GameContext'
import Dashboard from '../components/Dashboard'
import GameBoard from '../components/GameBoard'
import MoveHistory from '../components/MoveHistory'
import DiceWidget from '../components/DiceWidget'
import { icons, roleNames } from '../data/roles'
import { getRoleFull, type RoleFullDto } from '../api/roles'
import { dreams as defaultDreams } from '../data/dreams'
import DealSelectionModal from '../components/dealSelection/DealSelectionModal'
import BigDealCard from '../components/cards/BigDealCard'
import SmallDealCard from '../components/cards/SmallDealCard'
import NegativeCard from '../components/cards/NegativeCard'
import {
  getGameState,
  rollDice,
  subscribeDiceRoll,
  subscribeGameStateUpdate,
  type GameState,
  type DiceRollResult,
  type FinGuruDealCard,
  type DealType,
  type AssetCategory,
  type AssetDetail,
  buyDeal,
  skipDeal,
  applyNegativeCard,
  saveGameData,
  loadGameData,
  type PurchasedAsset,
  type SavedGameData,
} from '../sdk'
import {
  getBigDealCards,
  getSmallDealCards,
  getRandomNegativeCard,
  type CardDto,
  type NegativeCardDto,
} from '../api/cards'
import styles from './GamePage.module.css'

const STEP_MS = 350

export interface FinancialDetail {
  name: string
  amount: number
}

function categorizeCard(type: DealType, name: string): AssetCategory {
  if (type === 'small') return 'stock'
  const lower = name.toLowerCase()
  if (lower.includes('дом') || lower.includes('квартир') || lower.includes('плекс') ||
      lower.includes('пансионат') || lower.includes('земли') || lower.includes('пассаж') ||
      lower.includes('многоквартир'))
    return 'realEstate'
  if (lower.includes('предприятие') || lower.includes('франшиза') || lower.includes('пиццери') ||
      lower.includes('автомойк') || lower.includes('прачечн') || lower.includes('телефон'))
    return 'business'
  if (lower.includes('партнер')) return 'partnership'
  return 'other'
}

export default function GamePage() {
  const navigate = useNavigate()
  const { roleName } = useParams<{ roleName: string }>()
  const { currentPlayerId: contextPlayerId } = useGame()

  const params = new URLSearchParams(window.location.search)
  const roomId = params.get('roomId') ?? ''
  const sdkPlayerId = params.get('playerId') ?? contextPlayerId ?? ''

  const [serverRole, setServerRole] = useState<RoleFullDto | null>(null)
  const [roleLoading, setRoleLoading] = useState(true)

  useEffect(() => {
    if (!roleName) return
    getRoleFull(roleName).then(role => {
      setServerRole(role)
      setRoleLoading(false)
    }).catch(() => setRoleLoading(false))
  }, [roleName])

  const [gameState, setGameState] = useState<GameState | null>(null)
  const [myColor, setMyColor] = useState<string>('#4CAF50')
  const [moveHistory, setMoveHistory] = useState<any[]>([])
  const [purchasedAssets, setPurchasedAssets] = useState<PurchasedAsset[]>([])
  const [activeTab, setActiveTab] = useState<'small' | 'big'>('small')
  const [passiveIncome, setPassiveIncome] = useState(0)

  const [showDice, setShowDice] = useState(false)

  const [animPos, setAnimPos] = useState<number | null>(null)

  // Deal flow state
  const [showDealSelection, setShowDealSelection] = useState(false)
  const [currentDealCard, setCurrentDealCard] = useState<FinGuruDealCard | null>(null)
  const [currentDealType, setCurrentDealType] = useState<DealType>('small')
  const [showDealCard, setShowDealCard] = useState(false)
  const [dealLoading, setDealLoading] = useState(false)
  const [dealError, setDealError] = useState<string | null>(null)

  // Negative card flow state
  const [negativeCard, setNegativeCard] = useState<NegativeCardDto | null>(null)
  const [showNegativeCard, setShowNegativeCard] = useState(false)
  const [negativeLoading, setNegativeLoading] = useState(false)
  const [negativeError, setNegativeError] = useState<string | null>(null)

  const isAnimatingRef = useRef(false)
  const pendingDealRef = useRef<DiceRollResult | null>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const gameStateRef = useRef<GameState | null>(null)
  const playerNameMapRef = useRef<Record<string, string>>({})
  const isLoadedRef = useRef(false)
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

  function getPlayerName(playerId: string): string {
    return playerNameMapRef.current[playerId] ?? playerId
  }

  const applyResult = useCallback((result: DiceRollResult) => {
    // Update player name map
    for (const p of result.players) {
      playerNameMapRef.current[p.playerId] = p.displayName
    }

    setGameState(prev => {
      if (!prev) return prev
      const mergedPlayers = result.players.map(p => {
        const localP = prev.players.find(lp => lp.playerId === p.playerId)
        return {
          ...p,
          passiveIncome: localP?.passiveIncome ?? p.passiveIncome ?? 0,
        }
      })
      return {
        ...prev,
        players: mergedPlayers,
        currentRound: result.currentRound,
        currentPlayerId: result.nextPlayerId,
      }
    })
    const rolledPlayer = result.players.find(p => p.playerId === result.rolledBy)
    setMoveHistory(prev => [{
      playerName: getPlayerName(result.rolledBy),
      playerColor: rolledPlayer?.color ?? '#999',
      moveLabel: `Ход ${result.currentRound}`,
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
        for (const p of state.players) {
          playerNameMapRef.current[p.playerId] = p.displayName
        }
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
            } else if (result.sectorType === 'negative') {
              pendingDealRef.current = result
              fetchNegativeCard()
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

  // Load saved game data on mount
  useEffect(() => {
    loadGameData().then(saved => {
      if (saved?.assets) {
        const normalized: PurchasedAsset[] = saved.assets.map(a => ({
          cardId: a.cardId,
          type: a.type,
          name: a.name,
          amount: a.amount,
          cashFlow: a.cashFlow,
          category: (a as PurchasedAsset).category ?? categorizeCard(a.type, a.name),
          details: (a as PurchasedAsset).details ?? [],
        }))
        setPurchasedAssets(normalized)

        const totalPassive = normalized.reduce((s, a) => s + a.cashFlow, 0)
        setPassiveIncome(totalPassive)
        setGameState(prev => {
          if (!prev) return prev
          return {
            ...prev,
            players: prev.players.map(p =>
              p.playerId === sdkPlayerId
                ? { ...p, passiveIncome: totalPassive }
                : p
            ),
          }
        })
      }
      if (saved?.moveHistory) setMoveHistory(saved.moveHistory)
      isLoadedRef.current = true
    })
  }, [sdkPlayerId])

  // Auto-save whenever assets or move history change
  useEffect(() => {
    if (!isLoadedRef.current) return
    saveGameData({ assets: purchasedAssets, moveHistory: moveHistory as SavedGameData['moveHistory'] })
  }, [purchasedAssets, moveHistory])

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

    // Find cash flow from deal card details
    const cashFlowDetail = currentDealCard.details.find(
      d => !d.negative && (d.name === 'Денежный поток' || d.name.includes('Доход'))
    )
    const cashFlowAmount = typeof cashFlowDetail?.amount === 'number' ? cashFlowDetail.amount : 0

    // Update passive income locally
    const newPassiveIncome = passiveIncome + cashFlowAmount
    setPassiveIncome(newPassiveIncome)
    setGameState(prev => {
      if (!prev) return prev
      return {
        ...prev,
        players: prev.players.map(p =>
          p.playerId === result.rolledBy
            ? { ...p, passiveIncome: newPassiveIncome }
            : p
        ),
      }
    })

    const dealAmount = typeof currentDealCard.amount === 'number' ? currentDealCard.amount : 0

    const entry = {
      playerName: getPlayerName(result.rolledBy),
      playerColor: rolledPlayer?.color ?? '#999',
      moveLabel: currentDealType === 'big' ? 'Крупная сделка' : 'Мелкая сделка',
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      transactionType: 'Покупка',
      transactionTypeColor: 'rgb(52, 199, 89)',
      action: `–${dealAmount}`,
      actionColor: 'rgb(255, 59, 48)',
      finances: [{
        label: 'Наличные',
        change: `–${dealAmount}`,
        changeColor: 'rgb(255, 59, 48)',
        result: `${(rolledPlayer?.cash ?? 0) - dealAmount}`,
        resultColor: 'rgb(0, 0, 0)',
      }],
      dealCard: {
        title: currentDealCard.name,
        description: currentDealCard.description,
        price: `${dealAmount.toLocaleString('ru-RU')} ₽`,
      },
    }

    setMoveHistory(prev => [entry, ...prev])
    setPurchasedAssets(prev => {
      const newAssets: PurchasedAsset[] = [...prev, {
        cardId: currentDealCard.id,
        type: currentDealType,
        name: currentDealCard.name,
        amount: dealAmount,
        cashFlow: cashFlowAmount,
        category: categorizeCard(currentDealType, currentDealCard.name),
        details: currentDealCard.details.map(d => ({
          name: d.name,
          amount: typeof d.amount === 'number' ? d.amount : 0,
          isNegative: d.negative,
        })),
      }]
      return newAssets
    })

    buyDeal(roomId, sdkPlayerId, currentDealCard.id, currentDealType)
    setShowDealCard(false)
    setCurrentDealCard(null)
    pendingDealRef.current = null
  }, [currentDealCard, currentDealType, roomId, sdkPlayerId, passiveIncome])

  const handleDealSkip = useCallback(() => {
    skipDeal(roomId, sdkPlayerId)
    setShowDealCard(false)
    setCurrentDealCard(null)
    pendingDealRef.current = null
  }, [roomId, sdkPlayerId])

  // ─── Negative card flow handlers ──────────────────────────────

  const fetchNegativeCard = useCallback(async () => {
    setNegativeLoading(true)
    setNegativeError(null)
    try {
      const card = await getRandomNegativeCard()
      if (!card) throw new Error('Ошибка загрузки карты')
      setNegativeCard(card)
      setShowNegativeCard(true)
    } catch (e) {
      setNegativeError(e instanceof Error ? e.message : 'Ошибка загрузки карты')
    } finally {
      setNegativeLoading(false)
    }
  }, [])

  const handleNegativeAccept = useCallback(() => {
    if (!negativeCard || !pendingDealRef.current) return

    const result = pendingDealRef.current
    const rolledPlayer = result.players.find(p => p.playerId === result.rolledBy)

    // Deduct cash locally
    setGameState(prev => {
      if (!prev) return prev
      return {
        ...prev,
        players: prev.players.map(p =>
          p.playerId === result.rolledBy
            ? { ...p, cash: p.cash - negativeCard.amount }
            : p
        ),
      }
    })

    // Record move in history
    setMoveHistory(prev => [{
      playerName: getPlayerName(result.rolledBy),
      playerColor: rolledPlayer?.color ?? '#999',
      moveLabel: 'Всячина',
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      transactionType: negativeCard.name,
      transactionTypeColor: 'rgb(96, 96, 96)',
      action: `–${negativeCard.amount}`,
      actionColor: 'rgb(255, 59, 48)',
      finances: [{
        label: 'Наличные',
        change: `–${negativeCard.amount}`,
        changeColor: 'rgb(255, 59, 48)',
        result: `${(rolledPlayer?.cash ?? 0) - negativeCard.amount}`,
        resultColor: 'rgb(0, 0, 0)',
      }],
      dealCard: {
        title: negativeCard.name,
        description: negativeCard.description,
        price: `${negativeCard.amount.toLocaleString('ru-RU')} ₽`,
      },
    }, ...prev])

    applyNegativeCard(roomId, sdkPlayerId, negativeCard.id, negativeCard.amount)
    setShowNegativeCard(false)
    setNegativeCard(null)
    pendingDealRef.current = null
  }, [negativeCard, roomId, sdkPlayerId])

  const isMyTurn = gameState?.currentPlayerId === sdkPlayerId
  const currentTurnPlayer = gameState?.players.find(p => p.playerId === gameState.currentPlayerId)

  if (roleLoading) return <p>Загрузка...</p>
  if (!serverRole) return <p>Роль не найдена</p>

  const me = gameState?.players.find(p => p.playerId === sdkPlayerId)
  const myDream = me?.dreamId != null ? defaultDreams.find(d => d.id === me.dreamId) : null
  const myPosition = animPos !== null ? animPos : (me?.position ?? 0)

  const dashboardPlayer = me ?? {
    playerId: sdkPlayerId,
    displayName: serverRole.displayName,
    roleId: roleName ?? '',
    color: myColor,
    dreamId: null,
    cash: 0,
    income: serverRole.income,
    expenses: serverRole.expenses,
    passiveIncome: 0,
    position: myPosition,
    skipNextTurn: false,
  }

  function reachedBigCircle(p: { passiveIncome?: number; expenses: number }): boolean {
    return (p.passiveIncome ?? 0) > p.expenses
  }

  const incomeItems: FinancialDetail[] = [
    ...(serverRole.incomeItems.map(i => ({ name: i.name, amount: i.amount })) ?? []),
    ...purchasedAssets
      .filter(a => a.category !== 'stock')
      .map(a => ({ name: a.name, amount: a.cashFlow })),
  ]

  const expenseItems: FinancialDetail[] = [
    ...(serverRole.expenseItems.map(i => ({ name: i.name, amount: i.amount })) ?? []),
  ]

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
          playerRole={serverRole.displayName}
          moveNumber={gameState?.turnCount ?? 0}
          stats={{
            cash: dashboardPlayer.cash,
            salary: dashboardPlayer.income,
            expenses: dashboardPlayer.expenses,
            passiveIncome: me?.passiveIncome ?? passiveIncome,
            cashFlow: dashboardPlayer.income - dashboardPlayer.expenses,
          }}
          goalTarget={dashboardPlayer.expenses}
          progressAmount={me?.passiveIncome ?? passiveIncome}
          statuses={[]}
          assetCategories={[]}
          assets={purchasedAssets}
          incomeItems={incomeItems}
          expenseItems={expenseItems}
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

      {!isAnimatingRef.current && (
        isMyTurn ? (
          <button className={styles.rollFab} onClick={() => setShowDice(true)}>
            Бросить кубик
          </button>
        ) : currentTurnPlayer && (
          <div className={styles.turnBanner}>
            Сейчас ходит {currentTurnPlayer.displayName}
          </div>
        )
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

      {/* Negative card loading */}
      {negativeLoading && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 18,
        }}>
          Загрузка карты...
        </div>
      )}

      {/* Negative card error */}
      {negativeError && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)',
        }}>
          <div style={{
            background: '#fff', padding: 24, borderRadius: 16,
            textAlign: 'center', maxWidth: 320,
          }}>
            <p style={{ margin: '0 0 16px', fontSize: 16 }}>{negativeError}</p>
            <button
              onClick={() => setNegativeError(null)}
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

      {/* Negative card */}
      <NegativeCard
        name={negativeCard?.name ?? ''}
        description={negativeCard?.description ?? ''}
        amount={negativeCard?.amount ?? 0}
        isOpen={showNegativeCard}
        onClick={handleNegativeAccept}
        onClose={handleNegativeAccept}
      />

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
