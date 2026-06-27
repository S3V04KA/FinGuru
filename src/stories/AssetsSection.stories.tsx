import type { Meta, StoryObj } from '@storybook/react'
import AssetsSection from '../components/AssetsSection'
import type { PurchasedAsset } from '../sdk'

const meta: Meta<typeof AssetsSection> = {
  title: 'Components/AssetsSection',
  component: AssetsSection,
}

export default meta
type Story = StoryObj<typeof AssetsSection>

const sampleAssets: PurchasedAsset[] = [
  { cardId: 3, type: 'small', name: 'Акции — компания OK4U Drug', amount: 50000, cashFlow: 300, category: 'stock', details: [{ name: 'OK4U', amount: 50, isNegative: false }] },
  { cardId: 4, type: 'small', name: 'Квартира на продажу — 2 спальни / 1 ванная', amount: 40000, cashFlow: 220, category: 'stock', details: [{ name: 'Акция', amount: 40, isNegative: false }] },
  { cardId: 7, type: 'small', name: 'Взаимный фонд — фонд GRO4US', amount: 3000, cashFlow: 0, category: 'stock', details: [{ name: 'GRO4US', amount: 10, isNegative: false }] },
  { cardId: 8, type: 'small', name: 'Создайте компанию без отрыва от работы', amount: 5000, cashFlow: 0, category: 'stock', details: [{ name: 'MYT4U', amount: 20, isNegative: false }] },
]

export const Default: Story = {
  args: {
    assets: sampleAssets,
  },
}

export const Empty: Story = {
  args: {
    assets: [],
  },
}

export const SingleAsset: Story = {
  args: {
    assets: [sampleAssets[0]],
  },
}
