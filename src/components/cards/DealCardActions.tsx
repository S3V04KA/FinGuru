import type { ReactNode } from 'react'
import styles from './DealCardActions.module.css'

interface DealCardActionDetail {
  name: string
  amount: number | string
  negative: boolean
}

interface DealCardActionsProps {
  dealType: 'big' | 'small'
  amount: number | string
  details: DealCardActionDetail[]
  playerCash: number
  playerPassiveIncome: number
  onBuy: () => void
  onSkip: () => void
}

function formatCurrency(value: number | string): string {
  if (typeof value === 'string') return value
  return `${value.toLocaleString('ru-RU')} ₽`
}

function findCashFlow(details: DealCardActionDetail[]): number {
  const cf = details.find(
    d => !d.negative && (d.name === 'Денежный поток' || d.name.includes('Доход'))
  )
  return cf && typeof cf.amount === 'number' ? cf.amount : 0
}

export default function DealCardActions({ dealType, amount, details, playerCash, playerPassiveIncome, onBuy, onSkip }: DealCardActionsProps): ReactNode {
  const price = typeof amount === 'number' ? amount : 0
  const cashFlow = findCashFlow(details)
  const newCash = playerCash - price
  const newPassiveIncome = playerPassiveIncome + cashFlow
  const title = dealType === 'big' ? 'Крупная сделка' : 'Мелкая сделка'

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{title}</h2>

      <div className={styles.section}>
        <div className={styles.sectionGroup}>
          <p className={styles.sectionTitle}>После покупки</p>

          <div className={styles.row}>
            <span className={styles.rowLabel}>Баланс</span>
            <span className={styles.rowValue}>
              {formatCurrency(playerCash)} → {formatCurrency(newCash)}
            </span>
          </div>

          <div className={styles.row}>
            <span className={styles.rowLabel}>Денежный поток</span>
            <span className={styles.rowValue}>
              {formatCurrency(playerPassiveIncome)} → {formatCurrency(newPassiveIncome)}
            </span>
          </div>
        </div>

        <button className={styles.buyButton} onClick={onBuy}>
          Купить за {formatCurrency(price)}
        </button>
      </div>

      <div className={styles.divider} />

      <div className={styles.section}>
        <div className={styles.buyersHeader}>
          <span className={styles.buyersLabel}>Желающие эту карту</span>
          <span className={styles.buyersLabel}>Наличные</span>
        </div>
        <p className={styles.emptyBuyers}>Пока нет желающих</p>
      </div>

      <div className={styles.actionRow}>
        <button className={styles.outlineButton}>Выставить цену</button>
        <button className={styles.outlineButton}>Сделать торги</button>
      </div>

      <button className={styles.skipButton} onClick={onSkip}>
        Пропустить
      </button>
    </div>
  )
}
