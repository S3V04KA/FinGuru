import styles from './DiceOverlay.module.css'

const DOT_POSITIONS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[25, 25], [75, 75]],
  3: [[25, 25], [50, 50], [75, 75]],
  4: [[25, 25], [25, 75], [75, 25], [75, 75]],
  5: [[25, 25], [25, 75], [50, 50], [75, 25], [75, 75]],
  6: [[25, 20], [25, 50], [25, 80], [75, 20], [75, 50], [75, 80]],
}

function Die({ value }: { value: number }) {
  const dots = DOT_POSITIONS[value] ?? DOT_POSITIONS[1]
  return (
    <svg viewBox="0 0 100 100" className={styles.die}>
      <rect x="2" y="2" width="96" height="96" rx="16" fill="white" />
      {dots.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="9" fill="#1a1a2e" />
      ))}
    </svg>
  )
}

interface DiceOverlayProps {
  value1: number
  value2: number
}

export default function DiceOverlay({ value1, value2 }: DiceOverlayProps) {
  return (
    <div className={styles.overlay}>
      <div className={styles.diceRow}>
        <Die value={value1} />
        <span className={styles.plus}>+</span>
        <Die value={value2} />
        <span className={styles.equals}>=</span>
        <span className={styles.total}>{value1 + value2}</span>
      </div>
    </div>
  )
}
