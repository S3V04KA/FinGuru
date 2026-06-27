import type { Meta, StoryObj } from '@storybook/react'
import BiddingPanel from '../components/cards/BiddingPanel'

const meta: Meta<typeof BiddingPanel> = {
  title: 'Cards/BiddingPanel',
  component: BiddingPanel,
}

export default meta
type Story = StoryObj<typeof BiddingPanel>

export const Default: Story = {
  args: {
    onCancel: () => alert('Торги отменены'),
  },
}
