import { useState } from 'react'
import { formatCurrency } from '../utils/format'
import type { PurchasedAsset } from '../sdk'
import styles from './AssetsSection.module.css'

interface AssetsSectionProps {
  assets: PurchasedAsset[]
}

export default function AssetsSection({ assets }: AssetsSectionProps) {
  const [expanded, setExpanded] = useState(true)

  if (assets.length === 0) return null

  const totalPassive = assets.reduce((s, a) => s + a.cashFlow, 0)
  const totalCost = assets.reduce((s, a) => s + (typeof a.amount === 'number' ? a.amount : 0), 0)

  return (
    <div className={styles.container}>
      <button className={styles.header} onClick={() => setExpanded(!expanded)}>
        <span className={styles.title}>Активы</span>
        <svg className={`${styles.arrow} ${expanded ? styles.arrowUp : ''}`} width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div className={styles.summary}>
        <span className={styles.summaryItem}>
          Пассив. доход{' '}
          <span className={styles.blue}>{formatCurrency(totalPassive)}</span>
        </span>
        <span className={styles.summaryItem}>
          Стоимость{' '}
          <span className={styles.green}>{formatCurrency(totalCost)}</span>
        </span>
        <span className={styles.summaryItem}>
          <span className={styles.black}>{assets.length} шт</span>
        </span>
      </div>

      {expanded && (
        <div className={styles.table}>
          <div className={styles.tableHeader}>
            <span className={styles.colName}>Активы</span>
            <span className={styles.colPassive}>Пассив. доход</span>
            <span className={styles.colCost}>Стоимость</span>
            <span className={styles.colAction} />
          </div>
          {assets.map((asset, i) => (
            <div key={i} className={styles.tableRow}>
              <span className={styles.colName}>{asset.name}</span>
              <span className={styles.colPassive}>+{formatCurrency(asset.cashFlow)}</span>
              <span className={styles.colCost}>{formatCurrency(typeof asset.amount === 'number' ? asset.amount : 0)}</span>
              <span className={styles.colAction}>
                <button className={styles.sellBtn}>Продать</button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
