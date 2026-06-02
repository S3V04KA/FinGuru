import { useState, useCallback } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import DreamPage from '../pages/DreamPage'
import { icons, roleData } from '../data/roles'
import type { DreamItem } from '../pages/DreamPage'

const initialDreams: DreamItem[] = [
  {
    id: 1,
    title: 'Ложа на стадионе Профессиональной команды',
    number: '№1',
    description: 'Абонемент в частную ложу на 12 персон с едой и напитками на стадионе вашей любимой команды.',
    price: 200_000,
    playerName: 'Роман',
  },
  {
    id: 2,
    title: 'Путешествие на Мальдивы',
    number: '№2',
    description: 'Недельный отдых в люкс-номере на берегу океана с включенными перелётом и питанием.',
    price: 350_000,
  },
  {
    id: 3,
    title: 'Новый электромобиль Tesla',
    number: '№3',
    description: 'Tesla Model 3 в максимальной комплектации с автопилотом и расширенной гарантией.',
    price: 5_500_000,
  },
  {
    id: 4,
    title: 'Ремонт в квартире',
    number: '№4',
    description: 'Полный дизайнерский ремонт трёхкомнатной квартиры с мебелью и техникой премиум-класса.',
    price: 1_200_000,
  },
  {
    id: 5,
    title: 'Собственный небольшой бизнес',
    number: '№5',
    description: 'Открытие кофейни в центре города с полным оснащением и оборотным капиталом на первый год.',
    price: 3_000_000,
  },
  {
    id: 6,
    title: 'Обучение в Гарварде',
    number: '№6',
    description: 'Полный курс MBA в Гарвардской школе бизнеса с проживанием в кампусе и учебными материалами.',
    price: 8_000_000,
  },
  {
    id: 7,
    title: 'Дом на побережье',
    number: '№7',
    description: 'Двухэтажный дом с бассейном и садом на побережье Чёрного моря с панорамным видом.',
    price: 12_000_000,
  },
]

const meta: Meta<typeof DreamPage> = {
  title: 'Pages/DreamPage',
  component: DreamPage,
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj<typeof DreamPage>

export const PoliceOfficer: Story = {
  render: function Render(args) {
    const [dreams, setDreams] = useState(initialDreams)

    const handleDreamSelect = useCallback((id: number) => {
      setDreams(prev =>
        prev.map(d => {
          if (d.id !== id) return d
          return { ...d, status: d.status === 'selected' ? 'default' : 'selected' }
        })
      )
    }, [])

    return (
      <DreamPage
        {...args}
        dreams={dreams}
        onDreamSelect={handleDreamSelect}
      />
    )
  },
  args: {
    icon: icons['/src/assets/roles/policeOfficer.svg'] as unknown as string | undefined,
    roleName: roleData.policeOfficer.name,
    monthlyCashFlow: roleData.policeOfficer.financialData.monthlyCashFlow,
    onStartGame: () => alert('Игра началась!'),
  },
}
