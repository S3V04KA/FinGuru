export interface SectorConfig {
  label: string
  color: string
}

export const SECTOR_COLORS = {
  other: '#FF355C',
  shop: '#077CFF',
  salary: '#FF9705',
  deal: '#34C759',
  event: '#FF36C8',
  negative: '#606060'
} as const

export const OUTER_SECTOR_COLORS = {
  green: 'green',
  orange: 'orange',
  red: 'red',
  purple: 'purple',
} as const

export const sectors: SectorConfig[] = [
  {label: 'Всячина', color: SECTOR_COLORS.other},
  {label: 'Крупная/Мелкая Сделка', color: SECTOR_COLORS.deal},
  {label: 'Ребёнок', color: SECTOR_COLORS.event},
  {label: 'Крупная/Мелкая Сделка', color: SECTOR_COLORS.deal},
  {label: 'Зарплата', color: SECTOR_COLORS.salary},
  {label: 'Крупная/Мелкая Сделка', color: SECTOR_COLORS.deal},
  {label: 'Рынок', color: SECTOR_COLORS.shop},
  {label: 'Крупная/Мелкая Сделка', color: SECTOR_COLORS.deal},
  {label: 'Всячина', color: SECTOR_COLORS.other},
  {label: 'Крупная/Мелкая Сделка', color: SECTOR_COLORS.deal},
  {label: 'Увольнение', color: SECTOR_COLORS.negative},
  {label: 'Крупная/Мелкая Сделка', color: SECTOR_COLORS.deal},
  {label: 'Зарплата', color: SECTOR_COLORS.salary},
  {label: 'Крупная/Мелкая Сделка', color: SECTOR_COLORS.deal},
  {label: 'Рынок', color: SECTOR_COLORS.shop},
  {label: 'Крупная/Мелкая Сделка', color: SECTOR_COLORS.deal},
  {label: 'Всячина', color: SECTOR_COLORS.other},
  {label: 'Крупная/Мелкая Сделка', color: SECTOR_COLORS.deal},
  {label: 'Благотворительность', color: SECTOR_COLORS.other},
  {label: 'Крупная/Мелкая Сделка', color: SECTOR_COLORS.deal},
  {label: 'Зарплата', color: SECTOR_COLORS.salary},
  {label: 'Крупная/Мелкая Сделка', color: SECTOR_COLORS.deal},
  {label: 'Рынок', color: SECTOR_COLORS.shop},
  {label: 'Крупная/Мелкая Сделка', color: SECTOR_COLORS.deal},
  // {label: 'Дивиденды', color: SECTOR_COLORS.salary},
]

export const bigSectors: SectorConfig[] = [
  {label: 'Штраф', color: OUTER_SECTOR_COLORS.green},
  {label: 'Гос. Заказ', color: OUTER_SECTOR_COLORS.orange},
  {label: 'Свадьба', color: OUTER_SECTOR_COLORS.red},
  {label: 'Гос. Заказ', color: OUTER_SECTOR_COLORS.purple},
  {label: 'Повышение', color: OUTER_SECTOR_COLORS.green},
  {label: 'Гос. Заказ', color: OUTER_SECTOR_COLORS.purple},
  {label: 'Производство', color: OUTER_SECTOR_COLORS.orange},
  {label: 'Гос. Заказ', color: OUTER_SECTOR_COLORS.purple},
  {label: 'Авария', color: OUTER_SECTOR_COLORS.red},
  {label: 'Гос. Заказ', color: OUTER_SECTOR_COLORS.purple},
  {label: 'Банкротство', color: OUTER_SECTOR_COLORS.red},
  {label: 'Гос. Заказ', color: OUTER_SECTOR_COLORS.purple},
  {label: 'Инвестиции', color: OUTER_SECTOR_COLORS.green},
  {label: 'Гос. Заказ', color: OUTER_SECTOR_COLORS.purple},
  {label: 'Производство', color: OUTER_SECTOR_COLORS.orange},
  {label: 'Гос. Заказ', color: OUTER_SECTOR_COLORS.purple},
  {label: 'Налог', color: OUTER_SECTOR_COLORS.red},
  {label: 'Гос. Заказ', color: OUTER_SECTOR_COLORS.purple},
  {label: 'Благотв. Фонд', color: OUTER_SECTOR_COLORS.red},
  {label: 'Гос. Заказ', color: OUTER_SECTOR_COLORS.purple},
  {label: 'Премия', color: OUTER_SECTOR_COLORS.green},
  {label: 'Гос. Заказ', color: OUTER_SECTOR_COLORS.purple},
  {label: 'Сырьё', color: OUTER_SECTOR_COLORS.orange},
  {label: 'Гос. Заказ', color: OUTER_SECTOR_COLORS.purple},
]

export const SECTOR_COUNT = 24

export const sectorColorMap: Record<string, string> = Object.fromEntries(
  sectors.map(s => [s.label, s.color])
)

export function getSectorByLabel(label: string): SectorConfig | undefined {
  return sectors.find(s => s.label === label)
}
