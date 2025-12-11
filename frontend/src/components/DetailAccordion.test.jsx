import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DetailAccordion from './DetailAccordion'

describe('DetailAccordion Component', () => {
  const mockDetails = {
    interconnection: {
      required: false,
      description: 'Notification to utility required but no formal agreement needed'
    },
    permit: {
      required: false,
      description: 'No building permit required for residential systems under 800W'
    },
    outlet: {
      required: true,
      description: 'Standard Schuko wall outlet allowed as of May 2024'
    },
    special_notes: {
      required: false,
      description: 'Register in Enedis system if system acts as generator. Can use standard outlets.'
    }
  }

  describe('Rendering', () => {
    it('renders the accordion container', () => {
      render(<DetailAccordion details={mockDetails} />)
      expect(screen.getByTestId('detail-accordion')).toBeInTheDocument()
    })

    it('renders all detail categories as accordion items', () => {
      render(<DetailAccordion details={mockDetails} />)
      expect(screen.getByTestId('accordion-item-interconnection')).toBeInTheDocument()
      expect(screen.getByTestId('accordion-item-permit')).toBeInTheDocument()
      expect(screen.getByTestId('accordion-item-outlet')).toBeInTheDocument()
      expect(screen.getByTestId('accordion-item-special_notes')).toBeInTheDocument()
    })

    it('renders accordion headers with correct labels', () => {
      render(<DetailAccordion details={mockDetails} />)
      expect(screen.getByText('Interconnection Requirements')).toBeInTheDocument()
      expect(screen.getByText('Permit Requirements')).toBeInTheDocument()
      expect(screen.getByText('Connection Type')).toBeInTheDocument()
      expect(screen.getByText('Special Notes')).toBeInTheDocument()
    })

    it('renders required badges with correct status', () => {
      render(<DetailAccordion details={mockDetails} />)
      const outletHeader = screen.getByTestId('accordion-header-outlet')
      expect(outletHeader).toHaveTextContent('Required')
      
      const interconnectionHeader = screen.getByTestId('accordion-header-interconnection')
      expect(interconnectionHeader).toHaveTextContent('Not Required')
    })

    it('renders null when no details provided', () => {
      const { container } = render(<DetailAccordion details={{}} />)
      expect(container.firstChild).toBeNull()
    })

    it('renders null when details is undefined', () => {
      const { container } = render(<DetailAccordion />)
      expect(container.firstChild).toBeNull()
    })

    it('renders only available detail categories', () => {
      const partialDetails = {
        interconnection: {
          required: false,
          description: 'Test'
        },
        permit: {
          required: true,
          description: 'Test'
        }
      }
      render(<DetailAccordion details={partialDetails} />)
      expect(screen.getByTestId('accordion-item-interconnection')).toBeInTheDocument()
      expect(screen.getByTestId('accordion-item-permit')).toBeInTheDocument()
      expect(screen.queryByTestId('accordion-item-outlet')).not.toBeInTheDocument()
      expect(screen.queryByTestId('accordion-item-special_notes')).not.toBeInTheDocument()
    })
  })

  describe('Expand/Collapse Functionality', () => {
    it('starts with all items collapsed', () => {
      render(<DetailAccordion details={mockDetails} />)
      const contents = screen.getAllByTestId(/accordion-content-/)
      contents.forEach(content => {
        expect(content.style.maxHeight).toBe('0px')
      })
    })

    it('expands item when header is clicked', async () => {
      render(<DetailAccordion details={mockDetails} />)
      const header = screen.getByTestId('accordion-header-interconnection')
      
      fireEvent.click(header)
      
      // Check that the header has the expanded class
      expect(header).toHaveClass('expanded')
      
      // Check that the description is visible
      expect(screen.getByText('Notification to utility required but no formal agreement needed')).toBeInTheDocument()
    })

    it('collapses item when expanded header is clicked', async () => {
      render(<DetailAccordion details={mockDetails} />)
      const header = screen.getByTestId('accordion-header-interconnection')
      
      fireEvent.click(header)
      await new Promise(resolve => setTimeout(resolve, 10))
      fireEvent.click(header)
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const content = screen.getByTestId('accordion-content-interconnection')
      expect(content.style.maxHeight).toBe('0px')
    })

    it('displays description when item is expanded', async () => {
      render(<DetailAccordion details={mockDetails} />)
      const header = screen.getByTestId('accordion-header-interconnection')
      
      fireEvent.click(header)
      await new Promise(resolve => setTimeout(resolve, 10))
      
      expect(screen.getByText('Notification to utility required but no formal agreement needed')).toBeInTheDocument()
    })

    it('hides description when item is collapsed', async () => {
      render(<DetailAccordion details={mockDetails} />)
      const header = screen.getByTestId('accordion-header-interconnection')
      
      fireEvent.click(header)
      await new Promise(resolve => setTimeout(resolve, 10))
      fireEvent.click(header)
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const content = screen.getByTestId('accordion-content-interconnection')
      expect(content.style.maxHeight).toBe('0px')
    })

    it('allows multiple items to be expanded simultaneously', async () => {
      render(<DetailAccordion details={mockDetails} />)
      const header1 = screen.getByTestId('accordion-header-interconnection')
      const header2 = screen.getByTestId('accordion-header-permit')
      
      fireEvent.click(header1)
      fireEvent.click(header2)
      
      expect(header1).toHaveClass('expanded')
      expect(header2).toHaveClass('expanded')
      
      // Both descriptions should be visible
      expect(screen.getByText('Notification to utility required but no formal agreement needed')).toBeInTheDocument()
      expect(screen.getByText('No building permit required for residential systems under 800W')).toBeInTheDocument()
    })

    it('applies expanded class to header when expanded', async () => {
      render(<DetailAccordion details={mockDetails} />)
      const header = screen.getByTestId('accordion-header-interconnection')
      
      expect(header).not.toHaveClass('expanded')
      fireEvent.click(header)
      await new Promise(resolve => setTimeout(resolve, 10))
      expect(header).toHaveClass('expanded')
    })

    it('removes expanded class from header when collapsed', async () => {
      render(<DetailAccordion details={mockDetails} />)
      const header = screen.getByTestId('accordion-header-interconnection')
      
      fireEvent.click(header)
      await new Promise(resolve => setTimeout(resolve, 10))
      expect(header).toHaveClass('expanded')
      fireEvent.click(header)
      await new Promise(resolve => setTimeout(resolve, 10))
      expect(header).not.toHaveClass('expanded')
    })
  })

  describe('Keyboard Navigation', () => {
    it('expands item with Enter key', async () => {
      render(<DetailAccordion details={mockDetails} />)
      const header = screen.getByTestId('accordion-header-interconnection')
      
      header.focus()
      fireEvent.keyDown(header, { key: 'Enter' })
      
      expect(header).toHaveClass('expanded')
      expect(screen.getByText('Notification to utility required but no formal agreement needed')).toBeInTheDocument()
    })

    it('expands item with Space key', async () => {
      render(<DetailAccordion details={mockDetails} />)
      const header = screen.getByTestId('accordion-header-interconnection')
      
      header.focus()
      fireEvent.keyDown(header, { key: ' ' })
      
      expect(header).toHaveClass('expanded')
      expect(screen.getByText('Notification to utility required but no formal agreement needed')).toBeInTheDocument()
    })

    it('navigates to next item with ArrowDown', () => {
      render(<DetailAccordion details={mockDetails} />)
      const header1 = screen.getByTestId('accordion-header-interconnection')
      const header2 = screen.getByTestId('accordion-header-permit')
      
      header1.focus()
      fireEvent.keyDown(header1, { key: 'ArrowDown' })
      
      expect(document.activeElement).toBe(header2)
    })

    it('navigates to previous item with ArrowUp', () => {
      render(<DetailAccordion details={mockDetails} />)
      const header1 = screen.getByTestId('accordion-header-interconnection')
      const header2 = screen.getByTestId('accordion-header-permit')
      
      header2.focus()
      fireEvent.keyDown(header2, { key: 'ArrowUp' })
      
      expect(document.activeElement).toBe(header1)
    })

    it('navigates to first item with Home key', () => {
      render(<DetailAccordion details={mockDetails} />)
      const header1 = screen.getByTestId('accordion-header-interconnection')
      const header4 = screen.getByTestId('accordion-header-special_notes')
      
      header4.focus()
      fireEvent.keyDown(header4, { key: 'Home' })
      
      expect(document.activeElement).toBe(header1)
    })

    it('navigates to last item with End key', () => {
      render(<DetailAccordion details={mockDetails} />)
      const header1 = screen.getByTestId('accordion-header-interconnection')
      const header4 = screen.getByTestId('accordion-header-special_notes')
      
      header1.focus()
      fireEvent.keyDown(header1, { key: 'End' })
      
      expect(document.activeElement).toBe(header4)
    })

    it('does not navigate beyond first item with ArrowUp', () => {
      render(<DetailAccordion details={mockDetails} />)
      const header1 = screen.getByTestId('accordion-header-interconnection')
      
      header1.focus()
      fireEvent.keyDown(header1, { key: 'ArrowUp' })
      
      expect(document.activeElement).toBe(header1)
    })

    it('does not navigate beyond last item with ArrowDown', () => {
      render(<DetailAccordion details={mockDetails} />)
      const header4 = screen.getByTestId('accordion-header-special_notes')
      
      header4.focus()
      fireEvent.keyDown(header4, { key: 'ArrowDown' })
      
      expect(document.activeElement).toBe(header4)
    })
  })

  describe('Content Rendering', () => {
    it('renders all detail descriptions', () => {
      render(<DetailAccordion details={mockDetails} />)
      
      const header1 = screen.getByTestId('accordion-header-interconnection')
      fireEvent.click(header1)
      
      expect(screen.getByText('Notification to utility required but no formal agreement needed')).toBeInTheDocument()
    })

    it('renders descriptions with correct formatting', () => {
      render(<DetailAccordion details={mockDetails} />)
      
      const header = screen.getByTestId('accordion-header-outlet')
      fireEvent.click(header)
      
      const description = screen.getByText('Standard Schuko wall outlet allowed as of May 2024')
      expect(description).toHaveClass('detail-description')
    })

    it('handles long descriptions without breaking layout', () => {
      const longDetails = {
        interconnection: {
          required: false,
          description: 'This is a very long description that contains a lot of information about interconnection requirements and should wrap properly without breaking the layout or causing any display issues. It includes multiple sentences and technical details.'
        }
      }
      render(<DetailAccordion details={longDetails} />)
      
      const header = screen.getByTestId('accordion-header-interconnection')
      fireEvent.click(header)
      
      expect(screen.getByText(/This is a very long description/)).toBeInTheDocument()
    })

    it('handles special characters in descriptions', () => {
      const specialDetails = {
        interconnection: {
          required: false,
          description: 'Requirements: & "quotes" <brackets> - dashes'
        }
      }
      render(<DetailAccordion details={specialDetails} />)
      
      const header = screen.getByTestId('accordion-header-interconnection')
      fireEvent.click(header)
      
      expect(screen.getByText(/Requirements: & "quotes"/)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('sets aria-expanded attribute correctly', async () => {
      render(<DetailAccordion details={mockDetails} />)
      const header = screen.getByTestId('accordion-header-interconnection')
      
      expect(header).toHaveAttribute('aria-expanded', 'false')
      fireEvent.click(header)
      await new Promise(resolve => setTimeout(resolve, 10))
      expect(header).toHaveAttribute('aria-expanded', 'true')
    })

    it('sets aria-controls attribute on header', () => {
      render(<DetailAccordion details={mockDetails} />)
      const header = screen.getByTestId('accordion-header-interconnection')
      
      expect(header).toHaveAttribute('aria-controls', 'accordion-content-interconnection')
    })

    it('sets role="region" on content', () => {
      render(<DetailAccordion details={mockDetails} />)
      const content = screen.getByTestId('accordion-content-interconnection')
      
      expect(content).toHaveAttribute('role', 'region')
    })

    it('sets aria-labelledby on content', () => {
      render(<DetailAccordion details={mockDetails} />)
      const content = screen.getByTestId('accordion-content-interconnection')
      
      expect(content).toHaveAttribute('aria-labelledby', 'accordion-header-interconnection')
    })

    it('headers are keyboard focusable', () => {
      render(<DetailAccordion details={mockDetails} />)
      const header = screen.getByTestId('accordion-header-interconnection')
      
      header.focus()
      expect(document.activeElement).toBe(header)
    })

    it('headers have proper button role', () => {
      render(<DetailAccordion details={mockDetails} />)
      const header = screen.getByTestId('accordion-header-interconnection')
      
      expect(header.tagName).toBe('BUTTON')
    })
  })

  describe('Edge Cases', () => {
    it('handles single detail category', () => {
      const singleDetail = {
        interconnection: {
          required: false,
          description: 'Test'
        }
      }
      render(<DetailAccordion details={singleDetail} />)
      
      expect(screen.getByTestId('accordion-item-interconnection')).toBeInTheDocument()
      expect(screen.queryByTestId('accordion-item-permit')).not.toBeInTheDocument()
    })

    it('handles empty description', () => {
      const emptyDescriptionDetails = {
        interconnection: {
          required: false,
          description: ''
        }
      }
      render(<DetailAccordion details={emptyDescriptionDetails} />)
      
      const header = screen.getByTestId('accordion-header-interconnection')
      fireEvent.click(header)
      
      const content = screen.getByTestId('accordion-content-interconnection')
      expect(content).toBeInTheDocument()
    })

    it('handles missing description field', () => {
      const missingDescriptionDetails = {
        interconnection: {
          required: false
        }
      }
      render(<DetailAccordion details={missingDescriptionDetails} />)
      
      const header = screen.getByTestId('accordion-header-interconnection')
      fireEvent.click(header)
      
      const content = screen.getByTestId('accordion-content-interconnection')
      expect(content).toBeInTheDocument()
    })

    it('handles missing required field', () => {
      const missingRequiredDetails = {
        interconnection: {
          description: 'Test'
        }
      }
      render(<DetailAccordion details={missingRequiredDetails} />)
      
      expect(screen.getByTestId('accordion-item-interconnection')).toBeInTheDocument()
    })

    it('maintains state when re-rendering', () => {
      const { rerender } = render(<DetailAccordion details={mockDetails} />)
      const header = screen.getByTestId('accordion-header-interconnection')
      
      fireEvent.click(header)
      expect(header).toHaveClass('expanded')
      
      rerender(<DetailAccordion details={mockDetails} />)
      
      const newHeader = screen.getByTestId('accordion-header-interconnection')
      expect(newHeader).toHaveClass('expanded')
    })
  })

  describe('Animation and Styling', () => {
    it('applies correct CSS classes to accordion items', () => {
      render(<DetailAccordion details={mockDetails} />)
      const item = screen.getByTestId('accordion-item-interconnection')
      
      expect(item).toHaveClass('accordion-item')
    })

    it('applies correct CSS classes to headers', () => {
      render(<DetailAccordion details={mockDetails} />)
      const header = screen.getByTestId('accordion-header-interconnection')
      
      expect(header).toHaveClass('accordion-header')
    })

    it('applies correct CSS classes to content', () => {
      render(<DetailAccordion details={mockDetails} />)
      const content = screen.getByTestId('accordion-content-interconnection')
      
      expect(content).toHaveClass('accordion-content')
    })

    it('displays expand/collapse icon', () => {
      render(<DetailAccordion details={mockDetails} />)
      const header = screen.getByTestId('accordion-header-interconnection')
      
      expect(header).toHaveTextContent('▶')
      fireEvent.click(header)
      expect(header).toHaveTextContent('▼')
    })

    it('icon has aria-hidden attribute', () => {
      render(<DetailAccordion details={mockDetails} />)
      const icons = screen.getAllByText(/▶|▼/)
      
      icons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true')
      })
    })
  })
})
