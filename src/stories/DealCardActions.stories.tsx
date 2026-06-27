import type { Meta, StoryObj } from '@storybook/react'
import DealCardActions from '../components/cards/DealCardActions'

const meta: Meta<typeof DealCardActions> = {
  title: 'Cards/DealCardActions',
  component: DealCardActions,
}

export default meta
type Story = StoryObj<typeof DealCardActions>

export const SmallDeal: Story = {
  args: {
    dealType: 'small',
    amount: 50000,
    details: [
      { name: 'Ипотека', amount: 45000, negative: true },
      { name: 'Первый взнос', amount: 5000, negative: true },
      { name: 'Денежный поток', amount: 100, negative: false },
    ],
    playerCash: 200000,
    playerPassiveIncome: 1000,
    onBuy: () => alert('Куплено!'),
    onSkip: () => alert('Пропущено'),
    onStartBidding: () => alert('Торги начаты'),
  },
}

export const BigDeal: Story = {
  args: {
    dealType: 'big',
    amount: 575000,
    details: [
      { name: 'Ипотека', amount: 500000, negative: true },
      { name: 'Первый взнос', amount: 75000, negative: true },
      { name: 'Денежный поток', amount: 3400, negative: false },
    ],
    playerCash: 500000,
    playerPassiveIncome: 2000,
    onBuy: () => alert('Куплено!'),
    onSkip: () => alert('Пропущено'),
    onStartBidding: () => alert('Торги начаты'),
  },
}

export const NotEnoughCash: Story = {
  args: {
    dealType: 'small',
    amount: 50000,
    details: [
      { name: 'Ипотека', amount: 45000, negative: true },
      { name: 'Первый взнос', amount: 5000, negative: true },
      { name: 'Денежный поток', amount: 100, negative: false },
    ],
    playerCash: 30000,
    playerPassiveIncome: 1000,
    onBuy: () => alert('Куплено!'),
    onSkip: () => alert('Пропущено'),
    onStartBidding: () => alert('Торги начаты'),
  },
}
