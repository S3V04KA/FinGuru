import type { Meta, StoryObj } from '@storybook/react'
import PlayerCard from '../components/PlayerCard'

const meta: Meta<typeof PlayerCard> = {
  title: 'Components/PlayerCard',
  component: PlayerCard,
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj<typeof PlayerCard>

export const Default: Story = {
  args: {
    name: 'Константин',
    role: 'Учитель',
    turn: 7,
    salary: 7_200,
    cash: 4_500,
    goalAmount: 10_400,
    progressAmount: 10_400,
    passiveIncome: 500,
    cashFlow: 720,
    expenses: 3_312,
  },
}

export const PartialProgress: Story = {
  args: {
    name: 'Анна',
    role: 'Врач',
    turn: 3,
    salary: 15_700,
    cash: 2_800,
    goalAmount: 25_000,
    progressAmount: 8_400,
    passiveIncome: 1_200,
    cashFlow: 3_700,
    expenses: 12_000,
  },
}
