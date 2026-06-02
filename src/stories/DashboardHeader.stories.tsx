import type { Meta, StoryObj } from '@storybook/react'
import DashboardHeader from '../components/DashboardHeader'

const meta: Meta<typeof DashboardHeader> = {
  title: 'Components/DashboardHeader',
  component: DashboardHeader,
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj<typeof DashboardHeader>

export const Default: Story = {
  args: {
    playerName: 'Константин',
    playerRole: 'Учитель',
    moveNumber: 1,
  },
}
