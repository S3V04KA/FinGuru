import type { Meta, StoryObj } from '@storybook/react'
import Dashboard from '../components/Dashboard'
import type { PurchasedAsset } from '../sdk'

const meta: Meta<typeof Dashboard> = {
  title: 'Dashboard',
  component: Dashboard,
}

export default meta
type Story = StoryObj<typeof Dashboard>

const sampleAssets: PurchasedAsset[] = [
  { cardId: 1, type: 'big', name: 'Многоквартирные дома на продажу', amount: 575000, cashFlow: 3400, category: 'realEstate', details: [{ name: 'Ипотека', amount: 500000, isNegative: true }, { name: 'Первый взнос', amount: 75000, isNegative: true }, { name: 'Денежный поток', amount: 3400, isNegative: false }] },
  { cardId: 2, type: 'big', name: 'Предприятие на продажу', amount: 100000, cashFlow: 1600, category: 'business', details: [{ name: 'Пассив', amount: 80000, isNegative: true }, { name: 'Первый взнос', amount: 20000, isNegative: true }, { name: 'Денежный поток', amount: 1600, isNegative: false }] },
  { cardId: 3, type: 'small', name: 'Акции — компания OK4U Drug', amount: 50000, cashFlow: 300, category: 'stock', details: [{ name: 'OK4U', amount: 50, isNegative: false }] },
  { cardId: 4, type: 'small', name: 'Квартира на продажу — 2 спальни / 1 ванная', amount: 40000, cashFlow: 220, category: 'stock', details: [{ name: 'Акция', amount: 40, isNegative: false }] },
]

const teacherIncomeItems = [
  { name: 'Зарплата', amount: 4200 },
  { name: 'Репетиторство', amount: 800 },
]

const teacherExpenseItems = [
  { name: 'Налоги', amount: 180 },
  { name: 'Аренда жилья', amount: 350 },
  { name: 'Выплата по кредиту на образование', amount: 120 },
  { name: 'Выплаты по кредитным карточкам', amount: 80 },
  { name: 'Прочие расходы', amount: 200 },
]

const engineerExpenseItems = [
  { name: 'Налоги', amount: 500 },
  { name: 'Выплата по ипотеке', amount: 320 },
  { name: 'Выплаты по автокредиту', amount: 200 },
  { name: 'Выплаты по кредитным карточкам', amount: 100 },
  { name: 'Прочие расходы', amount: 300 },
  { name: 'Расходы на детей', amount: 200 },
]

export const Teacher: Story = {
  args: {
    playerName: 'Константин',
    playerRole: 'Учитель',
    moveNumber: 1,
    stats: {
      cash: 1330,
      salary: 7500,
      expenses: 10500,
      passiveIncome: 500,
      cashFlow: 720,
    },
    goalTarget: 10400,
    progressAmount: 3000,
    statuses: [
      { label: 'Увольнение', description: '3 хода пропускаешь', bgColor: 'rgb(74, 74, 74)' },
      { label: 'Ребенок x1', description: '720 ₽/мес', bgColor: 'rgb(234, 66, 189)' },
      { label: 'Выбор кубика', description: '3 хода', bgColor: 'rgb(50, 173, 230)' },
    ],
    assetCategories: [],
    assets: sampleAssets,
    incomeItems: teacherIncomeItems,
    expenseItems: teacherExpenseItems,
  },
}

export const Engineer: Story = {
  args: {
    playerName: 'Дмитрий',
    playerRole: 'Инженер',
    moveNumber: 3,
    stats: {
      cash: 4200,
      salary: 9500,
      expenses: 8200,
      passiveIncome: 1200,
      cashFlow: 2500,
    },
    goalTarget: 15000,
    progressAmount: 3000,
    statuses: [
      { label: 'Увольнение', description: '2 хода пропускаешь', bgColor: 'rgb(74, 74, 74)' },
      { label: 'Выбор кубика', description: '1 ход', bgColor: 'rgb(50, 173, 230)' },
    ],
    assetCategories: [],
    assets: sampleAssets.slice(0, 2),
    incomeItems: [{ name: 'Зарплата', amount: 8500 }],
    expenseItems: engineerExpenseItems,
  },
}

export const NoAssets: Story = {
  args: {
    playerName: 'Анна',
    playerRole: 'Врач',
    moveNumber: 0,
    stats: {
      cash: 5000,
      salary: 12000,
      expenses: 8800,
      passiveIncome: 0,
      cashFlow: 3200,
    },
    goalTarget: 8800,
    progressAmount: 0,
    statuses: [],
    assetCategories: [],
    assets: [],
    incomeItems: [{ name: 'Зарплата', amount: 12000 }],
    expenseItems: [
      { name: 'Налоги', amount: 1800 },
      { name: 'Выплата по ипотеке', amount: 450 },
      { name: 'Выплаты по автокредиту', amount: 350 },
      { name: 'Выплаты по кредитным карточкам', amount: 200 },
      { name: 'Страховка', amount: 300 },
      { name: 'Прочие расходы', amount: 500 },
    ],
  },
}
