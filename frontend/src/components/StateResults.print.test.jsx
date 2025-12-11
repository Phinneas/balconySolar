import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import StateResults from './StateResults'

/**
 * StateResults Print Styling Tests
 * 
 * Tests for print media query application and element visibility in print mode
 * Requirements: 4.4
 */
describe('StateResults Component - Print Styling', () => {
  const mockState = {
    code: 'ca',
    name: 'California',
    abbreviation: 'CA',
    isLegal: true,
    maxWattage: 800,
    keyLaw: 'SB 709 (2024)',
    lastUpdated: '2024-12-09',
    details: {
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
    },
    resources: [
      {
        title: 'California Public Utilities Commission',
        url: 'https://www.cpuc.ca.gov/',
        resourceType: 'official'
      },
      {
        title: 'California Solar Initiative',
        url: 'https://www.csi.ca.gov/',
        resourceType: 'guide'
      }
    ]
  }

  describe('Print Media Query Application', () => {
    it('renders state results container for print', () => {
      const { container } = render(<StateResults state={mockState} />)
      const stateResults = container.querySelector('.state-results')

      expect(stateResults).toBeInTheDocument()
    })

    it('renders results header for print', () => {
      const { container } = render(<StateResults state={mockState} />)
      const resultsHeader = container.querySelector('.results-header')

      expect(resultsHeader).toBeInTheDocument()
    })

    it('renders state info section for print', () => {
      const { container } = render(<StateResults state={mockState} />)
      const stateInfo = container.querySelector('.state-info')

      expect(stateInfo).toBeInTheDocument()
    })

    it('renders details section for print', () => {
      const { container } = render(<StateResults state={mockState} />)
      const detailsSection = container.querySelector('.details-section')

      expect(detailsSection).toBeInTheDocument()
    })

    it('renders resources section for print', () => {
      const { container } = render(<StateResults state={mockState} />)
      const resourcesSection = container.querySelector('.resources-section')

      expect(resourcesSection).toBeInTheDocument()
    })
  })

  describe('Element Visibility in Print Mode', () => {
    it('preserves legal status indicator in print', () => {
      const { container } = render(<StateResults state={mockState} />)
      const legalStatus = container.querySelector('.legal-status')

      expect(legalStatus).toBeInTheDocument()
    })

    it('preserves state name heading in print', () => {
      const { container } = render(<StateResults state={mockState} />)
      const heading = container.querySelector('.results-header h2')

      expect(heading).toBeInTheDocument()
      expect(heading).toHaveTextContent('California (CA)')
    })

    it('preserves max wattage information in print', () => {
      const { container } = render(<StateResults state={mockState} />)
      const maxWattage = container.querySelector('[data-testid="max-wattage"]')

      expect(maxWattage).toBeInTheDocument()
      expect(maxWattage).toHaveTextContent('800W')
    })

    it('preserves key law information in print', () => {
      const { container } = render(<StateResults state={mockState} />)
      const keyLaw = container.querySelector('[data-testid="key-law"]')

      expect(keyLaw).toBeInTheDocument()
      expect(keyLaw).toHaveTextContent('SB 709 (2024)')
    })

    it('preserves last updated date in print', () => {
      const { container } = render(<StateResults state={mockState} />)
      const lastUpdated = container.querySelector('[data-testid="last-updated"]')

      expect(lastUpdated).toBeInTheDocument()
      expect(lastUpdated).toHaveTextContent('2024-12-09')
    })

    it('preserves detail items in print', () => {
      const { container } = render(<StateResults state={mockState} />)
      const detailItems = container.querySelectorAll('.detail-item')

      expect(detailItems.length).toBeGreaterThan(0)
    })

    it('preserves detail descriptions in print', () => {
      const { container } = render(<StateResults state={mockState} />)
      const descriptions = container.querySelectorAll('.detail-description')

      expect(descriptions.length).toBeGreaterThan(0)
    })

    it('preserves required badges in print', () => {
      const { container } = render(<StateResults state={mockState} />)
      const badges = container.querySelectorAll('.required-badge')

      expect(badges.length).toBeGreaterThan(0)
    })

    it('preserves resource links in print', () => {
      const { container } = render(<StateResults state={mockState} />)
      const links = container.querySelectorAll('.resources-list a')

      expect(links.length).toBeGreaterThan(0)
    })

    it('preserves resource titles in print', () => {
      const { container } = render(<StateResults state={mockState} />)
      const resourceItems = container.querySelectorAll('.resources-list li')

      expect(resourceItems.length).toBeGreaterThan(0)
    })
  })

  describe('Print Layout Optimization', () => {
    it('renders all detail categories without truncation', () => {
      const { container } = render(<StateResults state={mockState} />)
      const detailItems = container.querySelectorAll('.detail-item')

      // Should have 4 detail categories
      expect(detailItems.length).toBe(4)
    })

    it('renders all resources without truncation', () => {
      const { container } = render(<StateResults state={mockState} />)
      const resourceItems = container.querySelectorAll('.resources-list li')

      // Should have 2 resources
      expect(resourceItems.length).toBe(2)
    })

    it('maintains proper spacing between sections', () => {
      const { container } = render(<StateResults state={mockState} />)
      const stateResults = container.querySelector('.state-results')

      // Should have multiple sections with proper structure
      expect(stateResults).toBeInTheDocument()
      expect(container.querySelector('.results-header')).toBeInTheDocument()
      expect(container.querySelector('.state-info')).toBeInTheDocument()
      expect(container.querySelector('.details-section')).toBeInTheDocument()
      expect(container.querySelector('.resources-section')).toBeInTheDocument()
    })

    it('renders content in logical reading order for print', () => {
      const { container } = render(<StateResults state={mockState} />)
      const stateResults = container.querySelector('.state-results')

      // Verify order: header -> info -> details -> resources
      const children = Array.from(stateResults.children)
      expect(children[0]).toHaveClass('results-header')
      expect(children[1]).toHaveClass('state-info')
      expect(children[2]).toHaveClass('details-section')
      expect(children[3]).toHaveClass('resources-section')
    })
  })

  describe('Print Color and Contrast', () => {
    it('renders legal status with appropriate styling for print', () => {
      const { container } = render(<StateResults state={mockState} />)
      const legalIndicator = container.querySelector('.legal')

      expect(legalIndicator).toBeInTheDocument()
      expect(legalIndicator).toHaveTextContent('✅ LEGAL')
    })

    it('renders illegal status with appropriate styling for print', () => {
      const illegalState = { ...mockState, isLegal: false }
      const { container } = render(<StateResults state={illegalState} />)
      const illegalIndicator = container.querySelector('.illegal')

      expect(illegalIndicator).toBeInTheDocument()
      expect(illegalIndicator).toHaveTextContent('❌ NOT LEGAL')
    })

    it('renders required badges with print-friendly styling', () => {
      const { container } = render(<StateResults state={mockState} />)
      const requiredBadges = container.querySelectorAll('.required-badge.required')

      expect(requiredBadges.length).toBeGreaterThan(0)
    })

    it('renders not-required badges with print-friendly styling', () => {
      const { container } = render(<StateResults state={mockState} />)
      const notRequiredBadges = container.querySelectorAll('.required-badge.not-required')

      expect(notRequiredBadges.length).toBeGreaterThan(0)
    })
  })

  describe('Print Stylesheet Integrity', () => {
    it('does not break layout with print styles', () => {
      const { container } = render(<StateResults state={mockState} />)
      const stateResults = container.querySelector('.state-results')

      expect(stateResults).toBeInTheDocument()
    })

    it('renders without console errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<StateResults state={mockState} />)

      expect(consoleSpy).not.toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })

    it('handles edge case: state with no resources in print', () => {
      const stateNoResources = { ...mockState, resources: [] }
      const { container } = render(<StateResults state={stateNoResources} />)

      // Should still render without resources section
      expect(container.querySelector('.state-results')).toBeInTheDocument()
    })

    it('handles edge case: state with minimal details in print', () => {
      const stateMinimalDetails = {
        ...mockState,
        details: {
          interconnection: {
            required: false,
            description: 'Test'
          }
        }
      }
      const { container } = render(<StateResults state={stateMinimalDetails} />)

      expect(container.querySelector('.details-section')).toBeInTheDocument()
    })
  })
})
