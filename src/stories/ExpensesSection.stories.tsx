import type { Meta, StoryObj } from '@storybook/react'
import ExpensesSection from '../components/ExpensesSection'

const meta: Meta<typeof ExpensesSection> = {
  title: 'Components/ExpensesSection',
  component: ExpensesSection,
}

export default meta
type Story = StoryObj<typeof ExpensesSection>

export const Default: Story = {
  args: {
    totalExpenses: 10500,
    expenseItems: [
      { name: 'Налоги', amount: 1800 },
      { name: 'Выплата по ипотеке', amount: 4500 },
      { name: 'Выплаты по автокредиту', amount: 2000 },
      { name: 'Выплаты по кредитным карточкам', amount: 1200 },
      { name: 'Расходы на детей', amount: 1000 },
    ],
  },
}
