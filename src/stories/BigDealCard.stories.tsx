import type { Meta, StoryObj } from '@storybook/react'
import BigDealCard from '../components/cards/BigDealCard'

const meta: Meta<typeof BigDealCard> = {
  title: 'Cards/BigDealCard',
  component: BigDealCard,
}

export default meta
type Story = StoryObj<typeof BigDealCard>

export const CardTab: Story = {
  args: {
    isOpen: true,
    purchased: false,
    name: 'Многоквартирные дома на продажу',
    description: 'Продаются 2 дома, общее число квартир — 24. Владелец управлял ими с помощью проживающего тут же помощника. Причина продажи — отход от дел.',
    amount: 575000,
    details: [
      { name: 'Ипотека', amount: 500000, negative: true },
      { name: 'Первый взнос', amount: 75000, negative: true },
      { name: 'Денежный поток', amount: 3400, negative: false },
    ],
    onClick: () => alert('Куплено!'),
    onClose: () => alert('Закрыто'),
    onFinishTurn: () => alert('Ход завершён'),
  },
}

export const Purchased: Story = {
  args: {
    ...CardTab.args,
    purchased: true,
  },
}

export const ActionsTab: Story = {
  args: {
    ...CardTab.args,
    playerCash: 500000,
    playerPassiveIncome: 2000,
  },
}
