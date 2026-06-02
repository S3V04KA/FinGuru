import { useState, useEffect, useRef } from 'react'
import styles from './Popover.module.css'

export type PopoverRow =
  | { type: 'row'; name: string; amount: number; color?: string }
  | { type: 'operator'; value: string }

interface PopoverProps {
  rows: PopoverRow[]
  isOpen?: boolean
}

function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ru-RU')} ₽`
}

const gapAfter: Record<number, number> = {
  0: 1,
  1: 1,
  2: 2,
  3: 2,
  4: 6,
  5: 6,
  6: 12,
  7: 12,
  8: 0,
}

export default function Popover({ rows, isOpen = true }: PopoverProps) {
  const [visible, setVisible] = useState(isOpen)
  const [animating, setAnimating] = useState<'enter' | 'exit' | null>(null)
  const prevOpen = useRef(isOpen)

  useEffect(() => {
    if (isOpen && !prevOpen.current) {
      setVisible(true)
      setAnimating('enter')
      const timer = setTimeout(() => setAnimating(null), 300)
      prevOpen.current = true
      return () => clearTimeout(timer)
    }
    if (!isOpen && prevOpen.current) {
      setAnimating('exit')
      const timer = setTimeout(() => {
        setVisible(false)
        setAnimating(null)
      }, 250)
      prevOpen.current = false
      return () => clearTimeout(timer)
    }
    prevOpen.current = isOpen
  }, [isOpen])

  if (!visible) return null

  let className = styles.popover
  if (animating === 'enter') className += ` ${styles.enter}`
  else if (animating === 'exit') className += ` ${styles.exit}`
  else className += ` ${styles.open}`

  return (
    <div className={className}>
      <div className={styles.arrow} />

      <div className={styles.body}>
        {rows.map((row, i) =>
          row.type === 'row' ? (
            <div
              key={i}
              className={styles.row}
              style={{ marginBottom: gapAfter[i] ?? 0 }}
            >
              <span className={styles.name}>{row.name}</span>
              <span className={styles.amount} style={{ color: row.color ?? '#000' }}>
                {formatCurrency(row.amount)}
              </span>
            </div>
          ) : (
            <div
              key={i}
              className={styles.operatorRow}
              style={{ marginBottom: gapAfter[i] ?? 0 }}
            >
              <span className={styles.operator}>{row.value}</span>
            </div>
          )
        )}
      </div>
    </div>
  )
}
