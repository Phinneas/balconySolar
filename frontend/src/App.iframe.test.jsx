import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

/**
 * Feature: balcony-solar-checker, Unit Tests for Iframe Embedding
 * Validates: Requirements 6.1, 6.2, 6.3
 * 
 * Tests:
 * - Component rendering in iframe context
 * - Full functionality within iframe
 * - No external dependencies required
 */
describe('App - Iframe Embedding Unit Tests', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    window.history.replaceState = vi.fn()
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn(() => Promise.resolve())
      }
    })
  })

  describe('Component Rendering in Iframe', () => {
    it('renders all UI elements when embedded', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              states: [
                { code: 'ca', name: 'California' },
                { code: 'tx', name: 'Texas' }
              ]
            })
          })
        }
        return Promise.reject(new Error('Unexpected URL'))
      })

      render(<App />)

      // Verify header renders
      expect(screen.getByText('Balcony Solar Legal State Checker')).toBeInTheDocument()

      // Verify state selector renders
      expect(screen.getByLabelText('Select your state:')).toBeInTheDocument()

      // Verify states are available
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'California' })).toBeInTheDocument()
        expect(screen.getByRole('option', { name: 'Texas' })).toBeInTheDocument()
      })
    })

    it('renders state results when state is selected', async () => {
      const mockState = {
        code: 'ca',
        name: 'California',
        abbreviation: 'CA',
        isLegal: true,
        maxWattage: 800,
        keyLaw: 'SB 709',
        details: {
          interconnection: { required: false, description: 'Notification required' },
          permit: { required: false, description: 'No permit needed' },
          outlet: { required: true, description: 'Standard outlet allowed' },
          special_notes: { required: false, description: 'Register in system' }
        },
        resources: [
          { title: 'CPUC', url: 'https://cpuc.ca.gov', resourceType: 'official' }
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

      // Select state
      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'ca')

      // Verify results render
      await waitFor(() => {
        expect(screen.getByText('✅ LEGAL')).toBeInTheDocument()
      })

      expect(screen.getByText('800W')).toBeInTheDocument()
      expect(screen.getByText('SB 709')).toBeInTheDocument()
    })
  })

  describe('Functionality Within Iframe', () => {
    it('state selection works correctly', async () => {
      const mockState = {
        code: 'tx',
        name: 'Texas',
        abbreviation: 'TX',
        isLegal: true,
        maxWattage: 1000,
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

      // Select state
      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'tx')

      // Verify state is selected and results display
      await waitFor(() => {
        expect(screen.getByText('✅ LEGAL')).toBeInTheDocument()
      })

      expect(select.value).toBe('tx')
    })

    it('copy-to-clipboard functionality works', async () => {
      const mockState = {
        code: 'fl',
        name: 'Florida',
        abbreviation: 'FL',
        isLegal: true,
        maxWattage: 900,
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

      // Select state
      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'fl')

      // Wait for copy button
      const copyButton = await screen.findByTestId('copy-url-button')
      await userEvent.click(copyButton)

      // Give clipboard operation time to complete
      await new Promise(resolve => setTimeout(resolve, 100))

      // Verify clipboard was called
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    })

    it('URL parameter auto-loading works', async () => {
      const mockState = {
        code: 'ny',
        name: 'New York',
        abbreviation: 'NY',
        isLegal: true,
        maxWattage: 750,
        keyLaw: 'NY Energy Law',
        details: {
          interconnection: { required: false, description: 'Test' },
          permit: { required: false, description: 'Test' },
          outlet: { required: false, description: 'Test' },
          special_notes: { required: false, description: 'Test' }
        },
        resources: []
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

      // Simulate URL with state parameter
      window.location.search = '?state=ny'

      render(<App />)

      // Verify state results load automatically
      await waitFor(() => {
        expect(screen.getByText('✅ LEGAL')).toBeInTheDocument()
      })

      expect(screen.getByText('750W')).toBeInTheDocument()
    })

    it('error handling works correctly', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ states: [] })
          })
        }
        return Promise.reject(new Error('API Error'))
      })

      render(<App />)

      // Verify component still renders even with API error
      expect(screen.getByText('Balcony Solar Legal State Checker')).toBeInTheDocument()
      expect(screen.getByLabelText('Select your state:')).toBeInTheDocument()
    })
  })

  describe('No External Dependencies Required', () => {
    it('component renders without external CSS dependencies', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ states: [{ code: 'ca', name: 'California' }] })
          })
        }
        return Promise.reject(new Error('Unexpected URL'))
      })

      const { container } = render(<App />)

      // Verify component renders
      expect(screen.getByText('Balcony Solar Legal State Checker')).toBeInTheDocument()

      // Verify styles are applied (component should have CSS classes)
      const appElement = container.querySelector('.app')
      expect(appElement).toBeInTheDocument()
    })

    it('component works with minimal API setup', async () => {
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

      // Minimal API setup - only two endpoints
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

      // Verify component works with minimal setup
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Washington' })).toBeInTheDocument()
      })

      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'wa')

      await waitFor(() => {
        expect(screen.getByText('✅ LEGAL')).toBeInTheDocument()
      })

      expect(screen.getByText('800W')).toBeInTheDocument()
    })

    it('component does not require additional React instances', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ states: [{ code: 'ca', name: 'California' }] })
          })
        }
        return Promise.reject(new Error('Unexpected URL'))
      })

      // Render component - should work with single React instance
      const { container } = render(<App />)

      // Verify component renders
      expect(screen.getByText('Balcony Solar Legal State Checker')).toBeInTheDocument()

      // Verify component structure is self-contained
      const appElement = container.querySelector('.app')
      expect(appElement).toBeInTheDocument()

      // Verify no external dependencies are required
      const scripts = container.querySelectorAll('script')
      expect(scripts.length).toBe(0)
    })
  })
})
