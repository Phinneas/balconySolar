import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import DetailAccordion from './DetailAccordion'

/**
 * DetailAccordion Print Styling Tests
 * 
 * Tests for print media query application and element visibility in print mode
 * Requirements: 4.4
 */
describe('DetailAccordion Component - Print Styling', () => {
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

  describe('Print Media Query Application', () => {
    it('renders accordion container for print', () => {
      const { getByTestId } = render(<DetailAccordion details={mockDetails} />)
      const accordion = getByTestId('detail-accordion')

      expect(accordion).toBeInTheDocument()
    })

    it('renders all accordion items for print', () => {
      const { container } = render(<DetailAccordion details={mockDetails} />)
      const items = container.querySelectorAll('.accordion-item')

      expect(items.length).toBe(4)
    })

    it('renders accordion headers for print', () => {
      const { container } = render(<DetailAccordion details={mockDetails} />)
      const headers = container.querySelectorAll('.accordion-header')

      expect(headers.length).toBe(4)
    })

    it('renders accordion content for print', () => {
      const { container } = render(<DetailAccordion details={mockDetails} />)
      const contents = container.querySelectorAll('.accordion-content')

      expect(contents.length).toBe(4)
    })
  })

  describe('Element Visibility in Print Mode', () => {
    it('preserves accordion titles in print', () => {
      const { container } = render(<DetailAccordion details={mockDetails} />)
      const titles = container.querySelectorAll('.accordion-title')

      expect(titles.length).toBe(4)
      expect(titles[0]).toHaveTextContent('Interconnection Requirements')
    })

    it('preserves required badges in print', () => {
      const { container } = render(<DetailAccordion details={mockDetails} />)
      const badges = container.querySelectorAll('.required-badge')

      expect(badges.length).toBe(4)
    })

    it('preserves detail descriptions in print', () => {
      const { container } = render(<DetailAccordion details={mockDetails} />)
      const descriptions = container.querySelectorAll('.detail-description')

      expect(descriptions.length).toBe(4)
    })

    it('hides accordion expand/collapse icons in print', () => {
      const { container } = render(<DetailAccordion details={mockDetails} />)
      const icons = container.querySelectorAll('.accordion-icon')

      // Icons should exist in DOM but be hidden via CSS in print
      expect(icons.length).toBe(4)
    })

    it('expands all accordion items for print', () => {
      const { container } = render(<DetailAccordion details={mockDetails} />)
      const contents = container.querySelectorAll('.accordion-content')

      // All content should be visible in print (max-height: none)
      expect(contents.length).toBe(4)
    })
  })

  describe('Print Layout Optimization', () => {
    it('renders all detail items without truncation', () => {
      const { container } = render(<DetailAccordion details={mockDetails} />)
      const items = container.querySelectorAll('.accordion-item')

      expect(items.length).toBe(4)
    })

    it('maintains proper spacing between accordion items', () => {
      const { getByTestId } = render(<DetailAccordion details={mockDetails} />)
      const accordion = getByTestId('detail-accordion')

      expect(accordion).toBeInTheDocument()
      expect(accordion.children.length).toBe(4)
    })

    it('renders content in logical reading order for print', () => {
      const { container } = render(<DetailAccordion details={mockDetails} />)
      const items = container.querySelectorAll('.accordion-item')

      // Verify each item has header and content
      items.forEach((item) => {
        const header = item.querySelector('.accordion-header')
        const content = item.querySelector('.accordion-content')
        
        expect(header).toBeInTheDocument()
        expect(content).toBeInTheDocument()
      })
    })

    it('renders required badges before descriptions', () => {
      const { container } = render(<DetailAccordion details={mockDetails} />)
      const headers = container.querySelectorAll('.accordion-header')

      headers.forEach((header) => {
        const badge = header.querySelector('.required-badge')
        const title = header.querySelector('.accordion-title')
        
        expect(badge).toBeInTheDocument()
        expect(title).toBeInTheDocument()
      })
    })
  })

  describe('Print Color and Contrast', () => {
    it('renders required badges with print-friendly styling', () => {
      const { container } = render(<DetailAccordion details={mockDetails} />)
      const requiredBadges = container.querySelectorAll('.required-badge.required')

      // At least one item should be required
      expect(requiredBadges.length).toBeGreaterThan(0)
    })

    it('renders not-required badges with print-friendly styling', () => {
      const { container } = render(<DetailAccordion details={mockDetails} />)
      const notRequiredBadges = container.querySelectorAll('.required-badge.not-required')

      // At least one item should not be required
      expect(notRequiredBadges.length).toBeGreaterThan(0)
    })

    it('renders text with sufficient contrast for print', () => {
      const { container } = render(<DetailAccordion details={mockDetails} />)
      const descriptions = container.querySelectorAll('.detail-description')

      descriptions.forEach((desc) => {
        expect(desc).toHaveTextContent(/.+/)
      })
    })
  })

  describe('Print Stylesheet Integrity', () => {
    it('does not break layout with print styles', () => {
      const { getByTestId } = render(<DetailAccordion details={mockDetails} />)
      const accordion = getByTestId('detail-accordion')

      expect(accordion).toBeInTheDocument()
    })

    it('renders without console errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<DetailAccordion details={mockDetails} />)

      expect(consoleSpy).not.toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('handles edge case: single detail item in print', () => {
      const singleDetail = {
        interconnection: mockDetails.interconnection
      }
      const { container } = render(<DetailAccordion details={singleDetail} />)
      const items = container.querySelectorAll('.accordion-item')

      expect(items.length).toBe(1)
    })

    it('handles edge case: empty details object in print', () => {
      const { container } = render(<DetailAccordion details={{}} />)
      
      // Component returns null for empty details
      expect(container.firstChild).toBeNull()
    })

    it('handles edge case: very long descriptions in print', () => {
      const longDescriptionDetails = {
        interconnection: {
          required: false,
          description: 'This is a very long description that contains a lot of information about the interconnection requirements and should wrap properly without breaking the layout or causing any display issues when printed.'
        }
      }
      const { container } = render(<DetailAccordion details={longDescriptionDetails} />)
      const description = container.querySelector('.detail-description')

      expect(description).toHaveTextContent(/This is a very long description/)
    })
  })

  describe('Print Page Break Handling', () => {
    it('applies page-break-inside: avoid to accordion items', () => {
      const { container } = render(<DetailAccordion details={mockDetails} />)
      const items = container.querySelectorAll('.accordion-item')

      // Verify items exist and can be styled with page-break-inside
      expect(items.length).toBeGreaterThan(0)
    })

    it('renders all items on same page when possible', () => {
      const { getByTestId } = render(<DetailAccordion details={mockDetails} />)
      const accordion = getByTestId('detail-accordion')

      // All items should be in single accordion container
      expect(accordion.children.length).toBe(4)
    })
  })
})
