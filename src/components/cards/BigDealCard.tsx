import { useState, type ReactNode } from 'react'
import styles from './BigDealCard.module.css'
import DealCardActions from './DealCardActions'

interface Detail {
  name: string
  amount: number | string
  negative: boolean
}

interface BigDealCardProps {
  name: string
  description: string
  amount: number | string
  details: Detail[]
  onClick: () => void
  onClose: () => void
  onFinishTurn: () => void
  isOpen: boolean
  purchased: boolean
  headerLabel?: string
  rightAlign?: boolean
  playerCash?: number
  playerPassiveIncome?: number
}

function formatAmount(value: number | string): string {
  if (typeof value === 'string') return value
  return `${value.toLocaleString('ru-RU')} ₽`
}

function formatDetail(value: number | string, negative: boolean): string {
  const prefix = negative ? '– ' : '+ '
  if (typeof value === 'string') return `${prefix}${value}`
  return `${prefix}${value.toLocaleString('ru-RU')} ₽`
}

type Tab = 'card' | 'actions'

export default function BigDealCard({ name, description, amount, details, onClick, onClose, onFinishTurn, isOpen, purchased, headerLabel = 'Цена', rightAlign = false, playerCash = 0, playerPassiveIncome = 0 }: BigDealCardProps): ReactNode {
  const [tab, setTab] = useState<Tab>('card')

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={purchased ? onFinishTurn : onClose}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        {purchased ? (
          <div className={styles.purchasedOverlay}>
            <p className={styles.purchasedLabel}>Вы купили</p>
            <p className={styles.purchasedName}>{name}</p>
            <p className={styles.purchasedPrice}>за {formatAmount(amount)}</p>
            <button className={styles.finishButton} onClick={onFinishTurn}>
              Завершить ход
            </button>
          </div>
        ) : (
          <>
            {tab === 'card' ? (
              <>
                <div className={styles.content}>
                  <h2 className={styles.title}>{name}</h2>
                  <p className={styles.description}>{description}</p>
                </div>

                <div className={styles.details}>
                  <div className={`${styles.header}${rightAlign ? ` ${styles.headerRight}` : ''}`}>
                    {!rightAlign && <span className={styles.headerLabel}>{headerLabel}</span>}
                    <span className={styles.headerAmount}>{formatAmount(amount)}</span>
                  </div>
                  {details.map((detail, i) => (
                    <div className={styles.detailRow} key={i}>
                      <span className={styles.detailLabel}>{detail.name}</span>
                      <span className={styles.detailValue}>{formatDetail(detail.amount, detail.negative)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className={styles.actionsContent}>
                <DealCardActions
                  dealType="big"
                  amount={amount}
                  details={details}
                  playerCash={playerCash}
                  playerPassiveIncome={playerPassiveIncome}
                  onBuy={onClick}
                  onSkip={onClose}
                />
              </div>
            )}

            <div className={styles.tabBar}>
              <button
                className={`${styles.tab} ${tab === 'card' ? styles.tabActive : ''}`}
                onClick={() => setTab('card')}
              >
                Карточка
              </button>
              <button
                className={`${styles.tab} ${tab === 'actions' ? styles.tabActive : ''}`}
                onClick={() => setTab('actions')}
              >
                Действия
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
