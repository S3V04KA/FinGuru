import { useState, useCallback } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import Popover from '../components/Popover'
import type { PopoverRow } from '../components/Popover'

const sampleRows: PopoverRow[] = [
  { type: 'row', name: 'Зарплата', amount: 1600 },
  { type: 'operator', value: '+' },
  { type: 'row', name: 'Пассив. доход', amount: 1600, color: '#5856d6' },
  { type: 'operator', value: '=' },
  { type: 'row', name: 'Общий доход', amount: 3200 },
  { type: 'operator', value: '-' },
  { type: 'row', name: 'Общий расход', amount: 950, color: '#FF3B30' },
  { type: 'operator', value: '=' },
  { type: 'row', name: 'Месячный денежный поток', amount: 950, color: '#34C759' },
]

const meta: Meta<typeof Popover> = {
  title: 'Components/Popover',
  component: Popover,
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj<typeof Popover>

export const Default: Story = {
  args: {
    rows: sampleRows,
    isOpen: true,
  },
}

export const Animated: Story = {
  render: function Render(args) {
    const [isOpen, setIsOpen] = useState(false)

    const toggle = useCallback(() => setIsOpen(v => !v), [])

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        <button
          onClick={toggle}
          style={{
            fontFamily: 'Montserrat Alternates, sans-serif',
            fontWeight: 600,
            fontSize: 16,
            color: '#fff',
            background: '#5856d6',
            border: 'none',
            borderRadius: 26,
            padding: '8px 24px',
            cursor: 'pointer',
          }}
        >
          {isOpen ? 'Закрыть' : 'Открыть'} поповер
        </button>

        <div style={{ minHeight: 300, display: 'flex', alignItems: 'flex-start' }}>
          <Popover {...args} isOpen={isOpen} />
        </div>
      </div>
    )
  },
  args: {
    rows: sampleRows,
  },
}
