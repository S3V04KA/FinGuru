import type { Meta, StoryObj } from '@storybook/react'
import ProgressBar from '../components/ProgressBar'

const meta: Meta<typeof ProgressBar> = {
  title: 'Components/ProgressBar',
  component: ProgressBar,
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj<typeof ProgressBar>

export const Full: Story = {
  args: {
    goalAmount: 10_400,
    progressAmount: 10_400,
  },
}

export const Partial: Story = {
  args: {
    goalAmount: 25_000,
    progressAmount: 8_400,
  },
}

export const Empty: Story = {
  args: {
    goalAmount: 10_400,
    progressAmount: 0,
  },
}
