import type { ReactNode } from 'react'
import styles from './BiddingPanel.module.css'

interface BiddingPanelProps {
  onCancel: () => void
}

export default function BiddingPanel({ onCancel }: BiddingPanelProps): ReactNode {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Торги карты</h2>

      <div className={styles.infoContainer}>
        <p className={styles.noOffers}>Пока предложений нет</p>
        <p className={styles.waitMessage}>Подождите пока игроки предложат сумму</p>
      </div>

      <button className={styles.cancelButton} onClick={onCancel}>
        Отменить торги
      </button>
    </div>
  )
}
