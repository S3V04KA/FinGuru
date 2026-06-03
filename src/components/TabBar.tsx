import { useState } from 'react'
import styles from './TabBar.module.css'

const TABS: {label: string, icon: string}[] = [
  {label: 'Профиль', icon: '􀉩'},
  {label: 'Бол. круг', icon: '􀕩'},
  {label: 'Мал. круг', icon: '􀍷'},
  {label: 'Игроки', icon: '􀝊'},
  {label: 'История', icon: '􀚃'},
]

interface TabBarProps {
}

function Tab({label, icon, onClick, active} : {label: string, icon: string, onClick: () => void, active: boolean}) {
  return (
    <div className={styles.tab} onClick={onClick} style={{color: (active ? '#5856D6' : '')}}>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.label} >{label}</div>
    </div>
  )
}

export default function TabBar({ }: TabBarProps) {
  const [activeTab, setActiveTab] = useState(2);

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        {TABS.map((v, i) => (
          <Tab label={v.label} icon={v.icon} active={activeTab === i} onClick={() => setActiveTab(i)} />
        ))}
        <span style={{left: `${activeTab*85+8}px`}}></span>
      </div>
    </div>
  )
}
