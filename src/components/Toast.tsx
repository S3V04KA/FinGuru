import { useEffect, type ReactNode } from 'react'
import styles from './Toast.module.css'

interface ToastProps {
  message: string
  visible: boolean
  onClose: () => void
  duration?: number
}

export default function Toast({ message, visible, onClose, duration = 3000 }: ToastProps): ReactNode {
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [visible, onClose, duration])

  if (!visible) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.toast}>
        <span className={styles.icon}>!</span>
        <span className={styles.message}>{message}</span>
      </div>
    </div>
  )
}
