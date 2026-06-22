import { useState, useRef, useEffect, useCallback } from 'react'
import styles from './DiceWidget.module.css'

const DOT_POSITIONS: Record<number, { cx: number; cy: number }[]> = {
  1: [{ cx: 50, cy: 50 }],
  2: [{ cx: 28, cy: 28 }, { cx: 72, cy: 72 }],
  3: [{ cx: 28, cy: 28 }, { cx: 50, cy: 50 }, { cx: 72, cy: 72 }],
  4: [{ cx: 28, cy: 28 }, { cx: 28, cy: 72 }, { cx: 72, cy: 28 }, { cx: 72, cy: 72 }],
  5: [{ cx: 28, cy: 28 }, { cx: 28, cy: 72 }, { cx: 50, cy: 50 }, { cx: 72, cy: 28 }, { cx: 72, cy: 72 }],
  6: [{ cx: 28, cy: 20 }, { cx: 28, cy: 50 }, { cx: 28, cy: 80 }, { cx: 72, cy: 20 }, { cx: 72, cy: 50 }, { cx: 72, cy: 80 }],
}

function Die({ value, size }: { value: number; size: number }) {
  const dots = DOT_POSITIONS[value] ?? DOT_POSITIONS[1]
  const r = Math.max(size * 0.09, 3)
  const radius = size * 0.16
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={styles.die}>
      <rect x="2" y="2" width="96" height="96" rx={radius} fill="#5856D6" />
      {dots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r={r} fill="white" />
      ))}
    </svg>
  )
}

interface DiceWidgetProps {
  rolling: boolean
  result: { dice1: number; dice2: number } | null
  onRoll: (count: number) => void
  onClose: () => void
}

export default function DiceWidget({ rolling, result, onRoll, onClose }: DiceWidgetProps) {
  const [diceCount, setDiceCount] = useState(2)
  const [phase, setPhase] = useState<'select' | 'rolling' | 'result'>('select')
  const [values, setValues] = useState<number[]>([])
  const countRef = useRef(diceCount)
  const rollingRef = useRef(false)
  const settledRef = useRef(false)
  countRef.current = diceCount

  // Start cycling when rolling is true
  useEffect(() => {
    if (!rolling || phase !== 'rolling') return
    const interval = setInterval(() => {
      setValues(Array.from({ length: countRef.current }, () => Math.floor(Math.random() * 6) + 1))
    }, 80)
    return () => clearInterval(interval)
  }, [rolling, phase])

  // User clicked roll
  const handleRoll = useCallback(() => {
    if (rollingRef.current) return
    rollingRef.current = true
    settledRef.current = false
    setPhase('rolling')
    onRoll(countRef.current)
  }, [onRoll])

  // Backend result arrived — settle
  useEffect(() => {
    if (!result || settledRef.current) return
    settledRef.current = true
    const arr = [result.dice1, result.dice2]
    if (diceCount === 1) arr.length = 1
    setValues(arr)
    setPhase('result')
  }, [result, diceCount])

  // After settling, wait and close
  useEffect(() => {
    if (phase !== 'result') return
    const timer = setTimeout(() => {
      rollingRef.current = false
      onClose()
    }, 1500)
    return () => clearTimeout(timer)
  }, [phase, onClose])

  const sum = values.reduce((a, b) => a + b, 0)

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.popover} onClick={e => e.stopPropagation()}>
        {phase === 'select' && (
          <div className={styles.inner}>
            <p className={styles.title}>Выберите количество кубиков</p>
            <div className={styles.options}>
              {[1, 2, 3].map(n => (
                <button
                  key={n}
                  className={`${styles.option} ${diceCount === n ? styles.optionActive : ''}`}
                  onClick={() => setDiceCount(n)}
                >
                  <div className={styles.diceRow}>
                    {Array.from({ length: n }, (_, i) => (
                      <Die key={i} value={5} size={n === 3 ? 22 : 24} />
                    ))}
                  </div>
                  <span className={styles.optionLabel}>
                    {n} куб{n === 1 ? 'а' : 'а'}
                  </span>
                </button>
              ))}
            </div>
            <button className={styles.rollButton} onClick={handleRoll}>
              Бросить кубик
            </button>
          </div>
        )}

        {phase !== 'select' && (
          <div className={styles.inner}>
            <div className={styles.diceDisplay}>
              {values.map((v, i) => (
                <Die key={i} value={v} size={64} />
              ))}
            </div>
            <div className={styles.sumRow}>
              <span className={styles.sumLabel}>Сумма</span>
              <span className={styles.sumValue}>{sum}</span>
            </div>
            {phase === 'rolling' && (
              <p className={styles.hint}>Бросаем...</p>
            )}
            {phase === 'result' && (
              <p className={styles.hint}>✓</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
