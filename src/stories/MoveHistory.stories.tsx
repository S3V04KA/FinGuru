import type { Meta, StoryObj } from '@storybook/react'
import MoveHistory from '../components/MoveHistory'

const meta: Meta<typeof MoveHistory> = {
  title: 'MoveHistory',
  component: MoveHistory,
}

export default meta
type Story = StoryObj<typeof MoveHistory>

export const Default: Story = {
  args: {
    title: '6 ход',
    entries: [
      {
        playerName: 'Константин',
        playerColor: 'rgb(88, 86, 214)',
        moveLabel: '5 ход',
        time: '19:07',
        transactionType: 'Мелкая сделка',
        transactionTypeColor: 'rgb(92, 155, 25)',
        action: 'Купил',
        actionColor: 'rgb(52, 199, 89)',
        finances: [
          { label: 'Наличные', change: '– 4 500 ₽', changeColor: 'rgb(255, 59, 48)', result: '5 000 ₽', resultColor: 'rgb(0, 0, 0)' },
          { label: 'Расходы', change: '– 100 ₽', changeColor: 'rgb(52, 199, 89)', result: '6 000 ₽', resultColor: 'rgb(255, 59, 48)' },
          { label: 'Денеж.поток', change: '+ 1 000 ₽', changeColor: 'rgb(52, 199, 89)', result: '5 000 ₽', resultColor: 'rgb(88, 86, 214)' },
        ],
        dealCard: {
          title: 'Квартира на продажу — 2 спальни / 1 ванная',
          description: 'Квартиру 2/1 в хорошем состоянии продает владелец, собирающийся жениться. Требует ремонта. Не самый лучший район. Купите сами или продайте это право другому игроку. 24% ROI, можно продать за 45 000 ₽ – 65 000 ₽.',
          price: '50 000 ₽',
        },
      },
      {
        playerName: 'Константин',
        playerColor: 'rgb(0, 122, 255)',
        moveLabel: 'Ход 5',
        time: '19:07',
        transactionType: 'Кредит',
        transactionTypeColor: 'rgb(255, 149, 0)',
        action: 'Взял',
        actionColor: 'rgb(255, 149, 0)',
        finances: [
          { label: 'Наличные', change: '+ 10 000 ₽', changeColor: 'rgb(255, 59, 48)', result: '15 000 ₽', resultColor: 'rgb(0, 0, 0)' },
          { label: 'Расходы', change: '+ 1 000 ₽', changeColor: 'rgb(255, 59, 48)', result: '6 000 ₽', resultColor: 'rgb(255, 59, 48)' },
          { label: 'Денеж.поток', change: '– 1 000 ₽', changeColor: 'rgb(255, 59, 48)', result: '5 000 ₽', resultColor: 'rgb(88, 86, 214)' },
        ],
      },
    ],
  },
}

export const SingleEntry: Story = {
  args: {
    title: '3 ход',
    entries: [
      {
        playerName: 'Анна',
        playerColor: 'rgb(88, 86, 214)',
        moveLabel: '2 ход',
        time: '15:42',
        transactionType: 'Мелкая сделка',
        transactionTypeColor: 'rgb(92, 155, 25)',
        action: 'Продал',
        actionColor: 'rgb(255, 59, 48)',
        finances: [
          { label: 'Наличные', change: '+ 12 000 ₽', changeColor: 'rgb(52, 199, 89)', result: '25 000 ₽', resultColor: 'rgb(0, 0, 0)' },
          { label: 'Расходы', change: '– 500 ₽', changeColor: 'rgb(255, 59, 48)', result: '5 500 ₽', resultColor: 'rgb(255, 59, 48)' },
          { label: 'Денеж.поток', change: '+ 11 500 ₽', changeColor: 'rgb(52, 199, 89)', result: '19 500 ₽', resultColor: 'rgb(88, 86, 214)' },
        ],
        dealCard: {
          title: 'Акции Apple — 10 шт',
          description: 'Технологическая компания. Продажа пакета акций по текущей рыночной цене.',
          price: '25 000 ₽',
        },
      },
    ],
  },
}

export const MultipleEntries: Story = {
  args: {
    title: 'История ходов',
    entries: [
      {
        playerName: 'Иван',
        playerColor: 'rgb(88, 86, 214)',
        moveLabel: '1 ход',
        time: '10:00',
        transactionType: 'Зарплата',
        transactionTypeColor: 'rgb(52, 199, 89)',
        action: 'Получил',
        actionColor: 'rgb(52, 199, 89)',
        finances: [
          { label: 'Наличные', change: '+ 8 000 ₽', changeColor: 'rgb(52, 199, 89)', result: '8 000 ₽', resultColor: 'rgb(0, 0, 0)' },
          { label: 'Расходы', change: '– 3 000 ₽', changeColor: 'rgb(255, 59, 48)', result: '3 000 ₽', resultColor: 'rgb(255, 59, 48)' },
          { label: 'Денеж.поток', change: '+ 5 000 ₽', changeColor: 'rgb(52, 199, 89)', result: '5 000 ₽', resultColor: 'rgb(88, 86, 214)' },
        ],
      },
      {
        playerName: 'Мария',
        playerColor: 'rgb(0, 122, 255)',
        moveLabel: '2 ход',
        time: '14:30',
        transactionType: 'Крупная сделка',
        transactionTypeColor: 'rgb(255, 149, 0)',
        action: 'Купила',
        actionColor: 'rgb(52, 199, 89)',
        finances: [
          { label: 'Наличные', change: '– 30 000 ₽', changeColor: 'rgb(255, 59, 48)', result: '5 000 ₽', resultColor: 'rgb(0, 0, 0)' },
          { label: 'Расходы', change: '+ 2 000 ₽', changeColor: 'rgb(255, 59, 48)', result: '5 000 ₽', resultColor: 'rgb(255, 59, 48)' },
          { label: 'Денеж.поток', change: '– 32 000 ₽', changeColor: 'rgb(255, 59, 48)', result: '0 ₽', resultColor: 'rgb(255, 59, 48)' },
        ],
        dealCard: {
          title: 'Небольшой магазин — 40 м²',
          description: 'Продуктовый магазин в спальном районе. Стабильный поток покупателей. Требуется косметический ремонт.',
          price: '65 000 ₽',
        },
      },
      {
        playerName: 'Петр',
        playerColor: 'rgb(88, 86, 214)',
        moveLabel: '3 ход',
        time: '16:15',
        transactionType: 'Реальность',
        transactionTypeColor: 'rgb(255, 59, 48)',
        action: 'Штраф',
        actionColor: 'rgb(255, 59, 48)',
        finances: [
          { label: 'Наличные', change: '– 2 000 ₽', changeColor: 'rgb(255, 59, 48)', result: '3 000 ₽', resultColor: 'rgb(0, 0, 0)' },
          { label: 'Расходы', change: '– 0 ₽', changeColor: 'rgb(52, 199, 89)', result: '5 000 ₽', resultColor: 'rgb(255, 59, 48)' },
          { label: 'Денеж.поток', change: '– 2 000 ₽', changeColor: 'rgb(255, 59, 48)', result: '– 2 000 ₽', resultColor: 'rgb(88, 86, 214)' },
        ],
      },
      {
        playerName: 'Елена',
        playerColor: 'rgb(0, 122, 255)',
        moveLabel: '4 ход',
        time: '18:00',
        transactionType: 'Кредит',
        transactionTypeColor: 'rgb(255, 149, 0)',
        action: 'Погасила',
        actionColor: 'rgb(255, 59, 48)',
        finances: [
          { label: 'Наличные', change: '– 5 000 ₽', changeColor: 'rgb(255, 59, 48)', result: '10 000 ₽', resultColor: 'rgb(0, 0, 0)' },
          { label: 'Расходы', change: '– 500 ₽', changeColor: 'rgb(52, 199, 89)', result: '4 500 ₽', resultColor: 'rgb(52, 199, 89)' },
          { label: 'Денеж.поток', change: '+ 500 ₽', changeColor: 'rgb(52, 199, 89)', result: '5 500 ₽', resultColor: 'rgb(88, 86, 214)' },
        ],
      },
    ],
  },
}
