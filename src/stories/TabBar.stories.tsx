import type { Meta, StoryObj } from '@storybook/react'
import TabBar from '../components/TabBar'

const meta: Meta<typeof TabBar> = {
  title: 'Components/TabBar',
  component: TabBar,
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj<typeof TabBar>

export const Default: Story = {
  args: {
  },
}
