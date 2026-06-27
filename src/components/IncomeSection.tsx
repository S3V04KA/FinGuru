import { useState } from 'react'
import { formatCurrency } from '../utils/format'
import styles from './IncomeSection.module.css'

interface FinancialDetail {
  name: string
  amount: number
}

interface IncomeSectionProps {
  incomeItems: FinancialDetail[]
  passiveIncome: number
  cashFlow: number
}

export default function IncomeSection({ incomeItems, passiveIncome, cashFlow }: IncomeSectionProps) {
  const [expanded, setExpanded] = useState(true)

  const totalIncome = incomeItems.reduce((s, i) => s + i.amount, 0)

  return (
    <div className={styles.container}>
      <button className={styles.header} onClick={() => setExpanded(!expanded)}>
        <span className={styles.title}>Доходы</span>
        <svg className={`${styles.arrow} ${expanded ? styles.arrowUp : ''}`} width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Общий доход</span>
          <span className={styles.summaryValueGreen}>{formatCurrency(totalIncome)}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Пассив. доход</span>
          <span className={styles.summaryValueIndigo}>{formatCurrency(passiveIncome)}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Денеж. поток</span>
          <span className={styles.summaryValueGreen}>{formatCurrency(cashFlow)}</span>
        </div>
      </div>

      {expanded && (
        <div className={styles.list}>
          {incomeItems.map((item, i) => (
            <div key={i} className={styles.listRow}>
              <span className={styles.listLabel}>{item.name}</span>
              <span className={styles.listValue}>{formatCurrency(item.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}