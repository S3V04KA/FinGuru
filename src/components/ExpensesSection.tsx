import { useState } from 'react'
import { formatCurrency } from '../utils/format'
import styles from './ExpensesSection.module.css'

interface FinancialDetail {
  name: string
  amount: number
}

interface ExpensesSectionProps {
  expenseItems: FinancialDetail[]
  totalExpenses: number
}

export default function ExpensesSection({ expenseItems, totalExpenses }: ExpensesSectionProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className={styles.container}>
      <button className={styles.header} onClick={() => setExpanded(!expanded)}>
        <span className={styles.title}>Расходы и пассивы</span>
        <svg className={`${styles.arrow} ${expanded ? styles.arrowUp : ''}`} width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>Общие расходы</span>
          <span className={styles.summaryValue}>{formatCurrency(totalExpenses)}</span>
        </div>
      </div>

      {expanded && (
        <div className={styles.list}>
          {expenseItems.map((item, i) => (
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