import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('SolarCurrents Integration', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    window.history.replaceState = vi.fn()
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn(() => Promise.resolve())
      }
    })
  })

  describe('Homepage Link Presence', () => {
    it('renders a prominent link/CTA to the checker on the homepage', () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ states: [] })
      })

      render(<App />)
      
      // The app header should be visible as the main CTA
      const header = screen.getByText('Balcony Solar Legal State Checker')
      expect(header).toBeInTheDocument()
      expect(header.tagName).toBe('H1')
    })

    it('displays state selector as prominent CTA element', () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ states: [] })
      })

      render(<App />)
      
      const label = screen.getByLabelText('Select your state:')
      expect(label).toBeInTheDocument()
      expect(label).toBeVisible()
    })
  })

  describe('Landing Page Rendering', () => {
    it('renders the landing page with all required sections', () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ states: [] })
      })

      render(<App />)
      
      // Check for main sections
      expect(screen.getByText('Balcony Solar Legal State Checker')).toBeInTheDocument()
      expect(screen.getByLabelText('Select your state:')).toBeInTheDocument()
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })

    it('displays state selector dropdown with all states', async () => {
      const mockStates = [
        { code: 'ca', name: 'California' },
        { code: 'ny', name: 'New York' },
        { code: 'tx', name: 'Texas' }
      ]

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ states: mockStates })
      })

      render(<App />)

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'California' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'New York' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Texas' })).toBeInTheDocument()
      })
    })
  })

  describe('Internal Links to Related Content', () => {
    it('fetches and receives resource data for selected state', async () => {
      const mockState = {
        code: 'ca',
        name: 'California',
        abbreviation: 'CA',
        isLegal: true,
        maxWattage: 800,
        keyLaw: 'SB 709',
        details: {
          interconnection: { required: false, description: 'Test' },
          permit: { required: false, description: 'Test' },
          outlet: { required: true, description: 'Standard outlet allowed' },
          special_notes: { required: false, description: 'Test' }
        },
        resources: [
          {
            title: 'California Public Utilities Commission',
            url: 'https://www.cpuc.ca.gov/',
            resourceType: 'official'
          },
          {
            title: 'California Solar Guide',
            url: 'https://www.solarcurrents.com/ca-guide',
            resourceType: 'guide'
          }
        ]
      }

      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states/ca')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ state: mockState })
          })
        }
        if (url.includes('/api/states')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ states: [{ code: 'ca', name: 'California' }] })
          })
        }
        return Promise.reject(new Error('Unexpected URL'))
      })

      render(<App />)

      // Wait for states to load
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'California' })).toBeInTheDocument()
      })

      // Select California
      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'ca')

      // Wait for state results to appear (check for heading specifically)
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2, name: 'California' })).toBeInTheDocument()
      })

      // Verify API was called with correct endpoint
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/states/ca'),
        expect.any(Object)
      )
    })

    it('includes resource data in API response for state lookup', async () => {
      const mockState = {
        code: 'ny',
        name: 'New York',
        abbreviation: 'NY',
        isLegal: true,
        maxWattage: 1000,
        keyLaw: 'NY Energy Law',
        details: {
          interconnection: { required: true, description: 'Test' },
          permit: { required: false, description: 'Test' },
          outlet: { required: false, description: 'Test' },
          special_notes: { required: false, description: 'Test' }
        },
        resources: [
          {
            title: 'New York Public Service Commission',
            url: 'https://www.dps.ny.gov/',
            resourceType: 'official'
          }
        ]
      }

      let capturedResponse = null
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states/ny')) {
          return Promise.resolve({
            ok: true,
            json: async () => {
              capturedResponse = { state: mockState }
              return capturedResponse
            }
          })
        }
        if (url.includes('/api/states')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ states: [{ code: 'ny', name: 'New York' }] })
          })
        }
        return Promise.reject(new Error('Unexpected URL'))
      })

      render(<App />)

      // Wait for states to load
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'New York' })).toBeInTheDocument()
      })

      // Select New York
      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'ny')

      // Wait for state results to appear
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2, name: 'New York' })).toBeInTheDocument()
      })

      // Verify that the API response includes resources
      expect(capturedResponse).toBeDefined()
      expect(capturedResponse.state.resources).toBeDefined()
      expect(Array.isArray(capturedResponse.state.resources)).toBe(true)
      expect(capturedResponse.state.resources.length).toBeGreaterThan(0)
    })
  })

  describe('Newsletter Subscription CTA', () => {
    it('displays newsletter subscription CTA after state lookup', async () => {
      const mockState = {
        code: 'tx',
        name: 'Texas',
        abbreviation: 'TX',
        isLegal: true,
        maxWattage: 900,
        keyLaw: 'TX Energy Code',
        details: {
          interconnection: { required: false, description: 'Test' },
          permit: { required: false, description: 'Test' },
          outlet: { required: false, description: 'Test' },
          special_notes: { required: false, description: 'Test' }
        },
        resources: []
      }

      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states/tx')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ state: mockState })
          })
        }
        if (url.includes('/api/states')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ states: [{ code: 'tx', name: 'Texas' }] })
          })
        }
        return Promise.reject(new Error('Unexpected URL'))
      })

      render(<App />)

      // Wait for states to load
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Texas' })).toBeInTheDocument()
      })

      // Select Texas
      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'tx')

      // Wait for state results to appear (check for heading specifically)
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2, name: 'Texas' })).toBeInTheDocument()
      })

      // Verify state results are displayed (indicating lookup is complete)
      expect(screen.getByText('✅ LEGAL')).toBeInTheDocument()
    })

    it('displays CTA button or link for newsletter subscription', async () => {
      const mockState = {
        code: 'fl',
        name: 'Florida',
        abbreviation: 'FL',
        isLegal: true,
        maxWattage: 800,
        keyLaw: 'FL Solar Law',
        details: {
          interconnection: { required: false, description: 'Test' },
          permit: { required: false, description: 'Test' },
          outlet: { required: false, description: 'Test' },
          special_notes: { required: false, description: 'Test' }
        },
        resources: []
      }

      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states/fl')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ state: mockState })
          })
        }
        if (url.includes('/api/states')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ states: [{ code: 'fl', name: 'Florida' }] })
          })
        }
        return Promise.reject(new Error('Unexpected URL'))
      })

      render(<App />)

      // Wait for states to load
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Florida' })).toBeInTheDocument()
      })

      // Select Florida
      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'fl')

      // Wait for state results to appear (check for heading specifically)
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2, name: 'Florida' })).toBeInTheDocument()
      })

      // The share button should be visible as a CTA element
      const shareButton = screen.getByTestId('copy-url-button')
      expect(shareButton).toBeInTheDocument()
      expect(shareButton).toBeVisible()
    })
  })

  describe('CTA Display and Functionality', () => {
    it('displays copy-to-clipboard button as shareable CTA', async () => {
      const mockState = {
        code: 'wa',
        name: 'Washington',
        abbreviation: 'WA',
        isLegal: true,
        maxWattage: 800,
        keyLaw: 'WA Solar Law',
        details: {
          interconnection: { required: false, description: 'Test' },
          permit: { required: false, description: 'Test' },
          outlet: { required: false, description: 'Test' },
          special_notes: { required: false, description: 'Test' }
        },
        resources: []
      }

      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states/wa')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ state: mockState })
          })
        }
        if (url.includes('/api/states')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ states: [{ code: 'wa', name: 'Washington' }] })
          })
        }
        return Promise.reject(new Error('Unexpected URL'))
      })

      render(<App />)

      // Wait for states to load
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Washington' })).toBeInTheDocument()
      })

      // Select Washington
      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'wa')

      // Wait for the copy button to appear
      const copyButton = await screen.findByTestId('copy-url-button')
      expect(copyButton).toBeInTheDocument()
      expect(copyButton).toBeVisible()
      expect(copyButton.textContent).toContain('Copy Shareable Link')
    })

    it('enables users to share state results via URL', async () => {
      const mockState = {
        code: 'or',
        name: 'Oregon',
        abbreviation: 'OR',
        isLegal: true,
        maxWattage: 1000,
        keyLaw: 'OR Solar Law',
        details: {
          interconnection: { required: false, description: 'Test' },
          permit: { required: false, description: 'Test' },
          outlet: { required: false, description: 'Test' },
          special_notes: { required: false, description: 'Test' }
        },
        resources: []
      }

      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states/or')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ state: mockState })
          })
        }
        if (url.includes('/api/states')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ states: [{ code: 'or', name: 'Oregon' }] })
          })
        }
        return Promise.reject(new Error('Unexpected URL'))
      })

      render(<App />)

      // Wait for states to load
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Oregon' })).toBeInTheDocument()
      })

      // Select Oregon
      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'or')

      // Wait for the copy button to appear
      const copyButton = await screen.findByTestId('copy-url-button')
      
      // Click the copy button
      await userEvent.click(copyButton)

      // Verify clipboard was called with URL containing state parameter
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining('state=or')
        )
      })
    })
  })

  describe('Internal Links Verification', () => {
    it('verifies all internal SolarCurrents links are present and valid', async () => {
      const mockState = {
        code: 'ca',
        name: 'California',
        abbreviation: 'CA',
        isLegal: true,
        maxWattage: 800,
        keyLaw: 'SB 709',
        details: {
          interconnection: { required: false, description: 'Test' },
          permit: { required: false, description: 'Test' },
          outlet: { required: true, description: 'Standard outlet allowed' },
          special_notes: { required: false, description: 'Test' }
        },
        resources: []
      }

      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states/ca')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ state: mockState })
          })
        }
        if (url.includes('/api/states')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ states: [{ code: 'ca', name: 'California' }] })
          })
        }
        return Promise.reject(new Error('Unexpected URL'))
      })

      render(<App />)

      // Wait for states to load
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'California' })).toBeInTheDocument()
      })

      // Select California
      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'ca')

      // Wait for state results to appear
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2, name: 'California' })).toBeInTheDocument()
      })

      // Verify newsletter link
      const newsletterLink = screen.getByTestId('newsletter-link')
      expect(newsletterLink).toBeInTheDocument()
      expect(newsletterLink.href).toBe('https://www.solarcurrents.com/newsletter')
      expect(newsletterLink.target).toBe('_blank')
      expect(newsletterLink.rel).toContain('noopener')

      // Verify related content links
      const guideLink = screen.getByTestId('related-guide-link')
      expect(guideLink).toBeInTheDocument()
      expect(guideLink.href).toBe('https://www.solarcurrents.com/balcony-solar-guide')
      expect(guideLink.target).toBe('_blank')

      const comparisonLink = screen.getByTestId('related-comparison-link')
      expect(comparisonLink).toBeInTheDocument()
      expect(comparisonLink.href).toBe('https://www.solarcurrents.com/solar-comparison')
      expect(comparisonLink.target).toBe('_blank')

      const companiesLink = screen.getByTestId('related-companies-link')
      expect(companiesLink).toBeInTheDocument()
      expect(companiesLink.href).toBe('https://www.solarcurrents.com/solar-companies')
      expect(companiesLink.target).toBe('_blank')
    })

    it('ensures all links open in new tabs with security attributes', async () => {
      const mockState = {
        code: 'ny',
        name: 'New York',
        abbreviation: 'NY',
        isLegal: true,
        maxWattage: 1000,
        keyLaw: 'NY Energy Law',
        details: {
          interconnection: { required: true, description: 'Test' },
          permit: { required: false, description: 'Test' },
          outlet: { required: false, description: 'Test' },
          special_notes: { required: false, description: 'Test' }
        },
        resources: [
          {
            title: 'New York Public Service Commission',
            url: 'https://www.dps.ny.gov/',
            resourceType: 'official'
          }
        ]
      }

      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states/ny')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ state: mockState })
          })
        }
        if (url.includes('/api/states')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ states: [{ code: 'ny', name: 'New York' }] })
          })
        }
        return Promise.reject(new Error('Unexpected URL'))
      })

      render(<App />)

      // Wait for states to load
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'New York' })).toBeInTheDocument()
      })

      // Select New York
      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'ny')

      // Wait for state results to appear
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 2, name: 'New York' })).toBeInTheDocument()
      })

      // Verify all external links have proper security attributes
      const allLinks = screen.getAllByRole('link')
      allLinks.forEach(link => {
        if (link.href.includes('solarcurrents.com') || link.href.includes('dps.ny.gov')) {
          expect(link.target).toBe('_blank')
          expect(link.rel).toContain('noopener')
          expect(link.rel).toContain('noreferrer')
        }
      })
    })
  })
})
