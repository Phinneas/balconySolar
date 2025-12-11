import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import StateSelector from './StateSelector'

describe('StateSelector Component', () => {
  const mockStates = [
    { code: 'ca', name: 'California' },
    { code: 'ny', name: 'New York' },
    { code: 'tx', name: 'Texas' },
    { code: 'fl', name: 'Florida' }
  ]

  let mockOnStateSelect

  beforeEach(() => {
    mockOnStateSelect = vi.fn()
  })

  describe('Rendering', () => {
    it('renders the state selector label', () => {
      render(
        <StateSelector
          states={mockStates}
          onStateSelect={mockOnStateSelect}
        />
      )
      expect(screen.getByLabelText('Select your state:')).toBeInTheDocument()
    })

    it('renders all states as options', () => {
      render(
        <StateSelector
          states={mockStates}
          onStateSelect={mockOnStateSelect}
        />
      )
      mockStates.forEach(state => {
        expect(screen.getByRole('option', { name: state.name })).toBeInTheDocument()
      })
    })

    it('renders placeholder option', () => {
      render(
        <StateSelector
          states={mockStates}
          onStateSelect={mockOnStateSelect}
        />
      )
      expect(screen.getByRole('option', { name: '-- Choose a state --' })).toBeInTheDocument()
    })

    it('renders with empty states array', () => {
      render(
        <StateSelector
          states={[]}
          onStateSelect={mockOnStateSelect}
        />
      )
      expect(screen.getByLabelText('Select your state:')).toBeInTheDocument()
    })
  })

  describe('State Selection', () => {
    it('calls onStateSelect when a state is selected', async () => {
      render(
        <StateSelector
          states={mockStates}
          onStateSelect={mockOnStateSelect}
        />
      )
      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'ca')
      expect(mockOnStateSelect).toHaveBeenCalledWith('ca')
    })

    it('calls onStateSelect when selecting different states', async () => {
      render(
        <StateSelector
          states={mockStates}
          onStateSelect={mockOnStateSelect}
        />
      )
      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'ca')
      mockOnStateSelect.mockClear()
      await userEvent.selectOptions(select, 'ny')
      expect(mockOnStateSelect).toHaveBeenCalledWith('ny')
    })
  })

  describe('Loading State', () => {
    it('displays loading indicator when loading is true', () => {
      render(
        <StateSelector
          states={mockStates}
          onStateSelect={mockOnStateSelect}
          loading={true}
        />
      )
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('does not display loading indicator when loading is false', () => {
      render(
        <StateSelector
          states={mockStates}
          onStateSelect={mockOnStateSelect}
          loading={false}
        />
      )
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    it('disables select when loading is true', () => {
      render(
        <StateSelector
          states={mockStates}
          onStateSelect={mockOnStateSelect}
          loading={true}
        />
      )
      expect(screen.getByRole('combobox')).toBeDisabled()
    })

    it('disables select when disabled prop is true', () => {
      render(
        <StateSelector
          states={mockStates}
          onStateSelect={mockOnStateSelect}
          disabled={true}
        />
      )
      expect(screen.getByRole('combobox')).toBeDisabled()
    })

    it('enables select when loading is false and disabled is false', () => {
      render(
        <StateSelector
          states={mockStates}
          onStateSelect={mockOnStateSelect}
          loading={false}
          disabled={false}
        />
      )
      expect(screen.getByRole('combobox')).not.toBeDisabled()
    })
  })

  describe('Keyboard Navigation', () => {
    it('navigates down with arrow key', async () => {
      render(
        <StateSelector
          states={mockStates}
          onStateSelect={mockOnStateSelect}
        />
      )
      const select = screen.getByRole('combobox')
      select.focus()

      fireEvent.keyDown(select, { key: 'ArrowDown', preventDefault: () => {} })
      await waitFor(() => {
        expect(select.selectedIndex).toBe(1)
      })
    })

    it('navigates up with arrow key', async () => {
      render(
        <StateSelector
          states={mockStates}
          onStateSelect={mockOnStateSelect}
        />
      )
      const select = screen.getByRole('combobox')
      select.selectedIndex = 2
      select.focus()

      fireEvent.keyDown(select, { key: 'ArrowUp', preventDefault: () => {} })
      await waitFor(() => {
        expect(select.selectedIndex).toBe(1)
      })
    })

    it('does not go above first option with arrow up', async () => {
      render(
        <StateSelector
          states={mockStates}
          onStateSelect={mockOnStateSelect}
        />
      )
      const select = screen.getByRole('combobox')
      select.selectedIndex = 0
      select.focus()

      fireEvent.keyDown(select, { key: 'ArrowUp', preventDefault: () => {} })
      await waitFor(() => {
        expect(select.selectedIndex).toBe(0)
      })
    })

    it('does not go below last option with arrow down', async () => {
      render(
        <StateSelector
          states={mockStates}
          onStateSelect={mockOnStateSelect}
        />
      )
      const select = screen.getByRole('combobox')
      select.selectedIndex = mockStates.length
      select.focus()

      fireEvent.keyDown(select, { key: 'ArrowDown', preventDefault: () => {} })
      await waitFor(() => {
        expect(select.selectedIndex).toBe(mockStates.length)
      })
    })

    it('selects state with Enter key', async () => {
      render(
        <StateSelector
          states={mockStates}
          onStateSelect={mockOnStateSelect}
        />
      )
      const select = screen.getByRole('combobox')
      select.selectedIndex = 1
      select.focus()

      fireEvent.keyDown(select, { key: 'Enter', preventDefault: () => {} })
      await waitFor(() => {
        expect(mockOnStateSelect).toHaveBeenCalledWith('ca')
      })
    })
  })

  describe('Accessibility', () => {
    it('has proper aria-label', () => {
      render(
        <StateSelector
          states={mockStates}
          onStateSelect={mockOnStateSelect}
        />
      )
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-label', 'Select your state')
    })

    it('has aria-busy when loading', () => {
      render(
        <StateSelector
          states={mockStates}
          onStateSelect={mockOnStateSelect}
          loading={true}
        />
      )
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-busy', 'true')
    })

    it('has aria-busy false when not loading', () => {
      render(
        <StateSelector
          states={mockStates}
          onStateSelect={mockOnStateSelect}
          loading={false}
        />
      )
      expect(screen.getByRole('combobox')).toHaveAttribute('aria-busy', 'false')
    })

    it('loading indicator has aria-live polite', () => {
      render(
        <StateSelector
          states={mockStates}
          onStateSelect={mockOnStateSelect}
          loading={true}
        />
      )
      const loadingIndicator = screen.getByText('Loading...')
      expect(loadingIndicator).toHaveAttribute('aria-live', 'polite')
    })

    it('select is keyboard accessible', () => {
      render(
        <StateSelector
          states={mockStates}
          onStateSelect={mockOnStateSelect}
        />
      )
      const select = screen.getByRole('combobox')
      expect(select).toBeVisible()
      expect(select).not.toBeDisabled()
    })
  })

  describe('Edge Cases', () => {
    it('handles state list updates', () => {
      const { rerender } = render(
        <StateSelector
          states={mockStates}
          onStateSelect={mockOnStateSelect}
        />
      )
      const newStates = [...mockStates, { code: 'wa', name: 'Washington' }]
      rerender(
        <StateSelector
          states={newStates}
          onStateSelect={mockOnStateSelect}
        />
      )
      expect(screen.getByRole('option', { name: 'Washington' })).toBeInTheDocument()
    })

    it('handles empty states array', () => {
      render(
        <StateSelector
          states={[]}
          onStateSelect={mockOnStateSelect}
        />
      )
      expect(screen.getByRole('combobox')).toBeInTheDocument()
      expect(screen.queryByRole('option', { name: /California|New York/ })).not.toBeInTheDocument()
    })
  })
})
