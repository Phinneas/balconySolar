import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StateResults from './StateResults'

describe('StateResults Component', () => {
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

  const mockStateIllegal = {
    code: 'ny',
    name: 'New York',
    abbreviation: 'NY',
    isLegal: false,
    maxWattage: 0,
    keyLaw: 'Not permitted',
    details: {
      interconnection: {
        required: true,
        description: 'Balcony solar not permitted'
      },
      permit: {
        required: true,
        description: 'Balcony solar not permitted'
      },
      outlet: {
        required: true,
        description: 'Balcony solar not permitted'
      },
      special_notes: {
        required: true,
        description: 'Balcony solar systems are not permitted in New York'
      }
    },
    resources: []
  }

  describe('Rendering', () => {
    it('renders null when state is not provided', () => {
      const { container } = render(<StateResults state={null} />)
      expect(container.firstChild).toBeNull()
    })

    it('renders state name and abbreviation', () => {
      render(<StateResults state={mockState} />)
      expect(screen.getByText('California (CA)')).toBeInTheDocument()
    })

    it('renders the state results container', () => {
      render(<StateResults state={mockState} />)
      expect(screen.getByTestId('state-results')).toBeInTheDocument()
    })
  })

  describe('Legal Status Display', () => {
    it('displays legal status with checkmark for legal states', () => {
      render(<StateResults state={mockState} />)
      expect(screen.getByTestId('legal-indicator')).toBeInTheDocument()
      expect(screen.getByTestId('legal-indicator')).toHaveTextContent('✅ LEGAL')
    })

    it('displays legal status with X for illegal states', () => {
      render(<StateResults state={mockStateIllegal} />)
      expect(screen.getByTestId('illegal-indicator')).toBeInTheDocument()
      expect(screen.getByTestId('illegal-indicator')).toHaveTextContent('❌ NOT LEGAL')
    })

    it('applies correct CSS class for legal status', () => {
      render(<StateResults state={mockState} />)
      expect(screen.getByTestId('legal-indicator')).toHaveClass('legal')
    })

    it('applies correct CSS class for illegal status', () => {
      render(<StateResults state={mockStateIllegal} />)
      expect(screen.getByTestId('illegal-indicator')).toHaveClass('illegal')
    })
  })

  describe('Wattage and Law Display', () => {
    it('displays max wattage', () => {
      render(<StateResults state={mockState} />)
      expect(screen.getByTestId('max-wattage')).toHaveTextContent('800W')
    })

    it('displays key law', () => {
      render(<StateResults state={mockState} />)
      expect(screen.getByTestId('key-law')).toHaveTextContent('SB 709 (2024)')
    })

    it('displays last updated date', () => {
      render(<StateResults state={mockState} />)
      expect(screen.getByTestId('last-updated')).toHaveTextContent('2024-12-09')
    })

    it('handles different wattage values', () => {
      const stateWithDifferentWattage = { ...mockState, maxWattage: 1200 }
      render(<StateResults state={stateWithDifferentWattage} />)
      expect(screen.getByTestId('max-wattage')).toHaveTextContent('1200W')
    })

    it('handles zero wattage for illegal states', () => {
      render(<StateResults state={mockStateIllegal} />)
      expect(screen.getByTestId('max-wattage')).toHaveTextContent('0W')
    })
  })

  describe('Details Rendering', () => {
    it('renders all detail categories', () => {
      render(<StateResults state={mockState} />)
      expect(screen.getByTestId('detail-interconnection')).toBeInTheDocument()
      expect(screen.getByTestId('detail-permit')).toBeInTheDocument()
      expect(screen.getByTestId('detail-outlet')).toBeInTheDocument()
      expect(screen.getByTestId('detail-special_notes')).toBeInTheDocument()
    })

    it('displays detail descriptions', () => {
      render(<StateResults state={mockState} />)
      expect(screen.getByText('Notification to utility required but no formal agreement needed')).toBeInTheDocument()
      expect(screen.getByText('No building permit required for residential systems under 800W')).toBeInTheDocument()
    })

    it('displays required badge for required details', () => {
      render(<StateResults state={mockState} />)
      const outletDetail = screen.getByTestId('detail-outlet')
      expect(outletDetail).toHaveTextContent('Required')
    })

    it('displays not required badge for optional details', () => {
      render(<StateResults state={mockState} />)
      const interconnectionDetail = screen.getByTestId('detail-interconnection')
      expect(interconnectionDetail).toHaveTextContent('Not Required')
    })

    it('handles missing detail categories gracefully', () => {
      const stateWithMissingDetails = {
        ...mockState,
        details: {
          interconnection: {
            required: false,
            description: 'Test'
          }
        }
      }
      render(<StateResults state={stateWithMissingDetails} />)
      expect(screen.getByTestId('detail-interconnection')).toBeInTheDocument()
      expect(screen.queryByTestId('detail-permit')).not.toBeInTheDocument()
    })

    it('handles empty details object', () => {
      const stateWithEmptyDetails = { ...mockState, details: {} }
      render(<StateResults state={stateWithEmptyDetails} />)
      expect(screen.getByText('Regulatory Details')).toBeInTheDocument()
    })
  })

  describe('Resource Link Rendering', () => {
    it('renders resources section when resources exist', () => {
      render(<StateResults state={mockState} />)
      expect(screen.getByText('Official Resources')).toBeInTheDocument()
    })

    it('renders all resource links', () => {
      render(<StateResults state={mockState} />)
      expect(screen.getByTestId('resource-0')).toBeInTheDocument()
      expect(screen.getByTestId('resource-1')).toBeInTheDocument()
    })

    it('renders resource links with correct href', () => {
      render(<StateResults state={mockState} />)
      const link1 = screen.getByTestId('resource-link-0')
      const link2 = screen.getByTestId('resource-link-1')
      expect(link1).toHaveAttribute('href', 'https://www.cpuc.ca.gov/')
      expect(link2).toHaveAttribute('href', 'https://www.csi.ca.gov/')
    })

    it('renders resource links with target="_blank"', () => {
      render(<StateResults state={mockState} />)
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toHaveAttribute('target', '_blank')
      })
    })

    it('renders resource links with rel="noopener noreferrer"', () => {
      render(<StateResults state={mockState} />)
      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      })
    })

    it('renders resource titles as link text', () => {
      render(<StateResults state={mockState} />)
      expect(screen.getByText('California Public Utilities Commission')).toBeInTheDocument()
      expect(screen.getByText('California Solar Initiative')).toBeInTheDocument()
    })

    it('renders resource type badges', () => {
      render(<StateResults state={mockState} />)
      expect(screen.getByText('(official)')).toBeInTheDocument()
      expect(screen.getByText('(guide)')).toBeInTheDocument()
    })

    it('does not render resources section when resources array is empty', () => {
      render(<StateResults state={mockStateIllegal} />)
      expect(screen.queryByText('Official Resources')).not.toBeInTheDocument()
    })

    it('handles resources without resourceType', () => {
      const stateWithoutResourceType = {
        ...mockState,
        resources: [
          {
            title: 'Test Resource',
            url: 'https://example.com/'
          }
        ]
      }
      render(<StateResults state={stateWithoutResourceType} />)
      expect(screen.getByText('Test Resource')).toBeInTheDocument()
    })

    it('handles single resource', () => {
      const stateWithSingleResource = {
        ...mockState,
        resources: [
          {
            title: 'Single Resource',
            url: 'https://example.com/',
            resourceType: 'official'
          }
        ]
      }
      render(<StateResults state={stateWithSingleResource} />)
      expect(screen.getByText('Single Resource')).toBeInTheDocument()
      expect(screen.getByTestId('resources-list')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles state with minimal required fields', () => {
      const minimalState = {
        name: 'Test State',
        abbreviation: 'TS',
        isLegal: true,
        maxWattage: 500,
        keyLaw: 'Test Law'
      }
      render(<StateResults state={minimalState} />)
      expect(screen.getByText('Test State (TS)')).toBeInTheDocument()
    })

    it('handles very long state names', () => {
      const longNameState = {
        ...mockState,
        name: 'This is a very long state name that should still render properly'
      }
      render(<StateResults state={longNameState} />)
      expect(screen.getByText(/This is a very long state name/)).toBeInTheDocument()
    })

    it('handles very long descriptions', () => {
      const longDescriptionState = {
        ...mockState,
        details: {
          interconnection: {
            required: false,
            description: 'This is a very long description that contains a lot of information about the interconnection requirements and should wrap properly without breaking the layout or causing any display issues.'
          }
        }
      }
      render(<StateResults state={longDescriptionState} />)
      expect(screen.getByText(/This is a very long description/)).toBeInTheDocument()
    })

    it('handles special characters in text', () => {
      const specialCharState = {
        ...mockState,
        keyLaw: 'SB 709 & HB 340 (2024) - "Special" Requirements'
      }
      render(<StateResults state={specialCharState} />)
      expect(screen.getByText(/SB 709 & HB 340/)).toBeInTheDocument()
    })
  })
})
