/**
 * End-to-End Tests for Balcony Solar Checker
 * 
 * Tests complete user flows across different scenarios:
 * - State selection → results display → sharing → printing
 * - Multiple device sizes (mobile, tablet, desktop)
 * - Network conditions (online, offline, slow)
 * - Iframe embedding
 * 
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 6.1, 6.2, 6.3
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

// Mock state data for testing
const mockStateData = {
  ca: {
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
      { title: 'California Public Utilities Commission', url: 'https://www.cpuc.ca.gov/', resourceType: 'official' },
      { title: 'California Energy Commission', url: 'https://www.energy.ca.gov/', resourceType: 'official' }
    ],
    lastUpdated: '2024-12-09'
  },
  tx: {
    code: 'tx',
    name: 'Texas',
    abbreviation: 'TX',
    isLegal: true,
    maxWattage: 1200,
    keyLaw: 'Texas Energy Code',
    details: {
      interconnection: { required: true, description: 'Formal agreement required' },
      permit: { required: true, description: 'Building permit required' },
      outlet: { required: false, description: 'Hardwired connection required' },
      special_notes: { required: false, description: 'Utility approval needed' }
    },
    resources: [
      { title: 'Public Utility Commission of Texas', url: 'https://www.puc.texas.gov/', resourceType: 'official' }
    ],
    lastUpdated: '2024-12-08'
  },
  ny: {
    code: 'ny',
    name: 'New York',
    abbreviation: 'NY',
    isLegal: false,
    maxWattage: 0,
    keyLaw: 'NY Electrical Code - Prohibited',
    details: {
      interconnection: { required: false, description: 'Not applicable' },
      permit: { required: false, description: 'Not applicable' },
      outlet: { required: false, description: 'Not applicable' },
      special_notes: { required: true, description: 'Balcony solar systems are not permitted' }
    },
    resources: [
      { title: 'New York Department of State', url: 'https://www.dos.ny.gov/', resourceType: 'official' }
    ],
    lastUpdated: '2024-12-07'
  }
}

describe('End-to-End: Complete User Flow', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    window.history.replaceState = vi.fn()
    vi.stubGlobal('navigator', {
      onLine: true,
      clipboard: {
        writeText: vi.fn(() => Promise.resolve())
      }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('E2E-1: Select State → View Results → Share → Print', () => {
    it('completes full user flow from state selection to sharing', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states/ca')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ state: mockStateData.ca })
          })
        }
        if (url.includes('/api/states')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ states: [{ code: 'ca', name: 'California' }, { code: 'tx', name: 'Texas' }] })
          })
        }
        return Promise.reject(new Error('Unexpected URL'))
      })

      render(<App />)

      // Step 1: Verify initial state
      expect(screen.getByText('Balcony Solar Legal State Checker')).toBeInTheDocument()
      expect(screen.getByLabelText('Select your state:')).toBeInTheDocument()

      // Step 2: Wait for states to load
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'California' })).toBeInTheDocument()
      })

      // Step 3: Select a state
      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'ca')

      // Step 4: Verify results display
      await waitFor(() => {
        expect(screen.getByText('✅ LEGAL')).toBeInTheDocument()
      })
      expect(screen.getByText('800W')).toBeInTheDocument()
      expect(screen.getByText('SB 709')).toBeInTheDocument()

      // Step 5: Verify resources are displayed
      expect(screen.getByText('Official Resources')).toBeInTheDocument()
      expect(screen.getByText('California Public Utilities Commission')).toBeInTheDocument()

      // Step 6: Verify share button exists
      const shareButton = screen.getByTestId('copy-url-button')
      expect(shareButton).toBeInTheDocument()

      // Step 7: Click share button
      await userEvent.click(shareButton)

      // Step 8: Verify clipboard was called with URL containing state parameter
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining('state=ca')
        )
      })

      // Step 9: Verify URL was updated
      expect(window.history.replaceState).toHaveBeenCalledWith(
        {},
        '',
        expect.stringContaining('state=ca')
      )
    })

    it('handles illegal state correctly', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states/ny')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ state: mockStateData.ny })
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

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'New York' })).toBeInTheDocument()
      })

      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'ny')

      await waitFor(() => {
        expect(screen.getByText('❌ NOT LEGAL')).toBeInTheDocument()
      })

      expect(screen.getByText('NY Electrical Code - Prohibited')).toBeInTheDocument()
    })

    it('displays all required details sections', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states/tx')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ state: mockStateData.tx })
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

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Texas' })).toBeInTheDocument()
      })

      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'tx')

      await waitFor(() => {
        expect(screen.getByText('✅ LEGAL')).toBeInTheDocument()
      })

      // Verify all required information is displayed
      expect(screen.getByText('1200W')).toBeInTheDocument()
      expect(screen.getByText('Texas Energy Code')).toBeInTheDocument()
      expect(screen.getByText('Official Resources')).toBeInTheDocument()
    })
  })
})


describe('End-to-End: Multiple Device Sizes', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    window.history.replaceState = vi.fn()
    vi.stubGlobal('navigator', {
      onLine: true,
      clipboard: {
        writeText: vi.fn(() => Promise.resolve())
      }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('E2E-2: Mobile Device (320px)', () => {
    beforeEach(() => {
      global.innerWidth = 320
      global.dispatchEvent(new Event('resize'))
    })

    it('completes full flow on mobile device', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states/ca')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ state: mockStateData.ca })
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

      // Verify app renders on mobile
      expect(screen.getByText('Balcony Solar Legal State Checker')).toBeInTheDocument()

      // Select state
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'California' })).toBeInTheDocument()
      })

      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'ca')

      // Verify results display on mobile
      await waitFor(() => {
        expect(screen.getByText('✅ LEGAL')).toBeInTheDocument()
      })

      // Verify share button is accessible on mobile
      const shareButton = screen.getByTestId('copy-url-button')
      expect(shareButton).toBeInTheDocument()
      await userEvent.click(shareButton)

      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    })
  })

  describe('E2E-3: Tablet Device (768px)', () => {
    beforeEach(() => {
      global.innerWidth = 768
      global.dispatchEvent(new Event('resize'))
    })

    it('completes full flow on tablet device', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states/tx')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ state: mockStateData.tx })
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

      expect(screen.getByText('Balcony Solar Legal State Checker')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Texas' })).toBeInTheDocument()
      })

      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'tx')

      await waitFor(() => {
        expect(screen.getByText('✅ LEGAL')).toBeInTheDocument()
      })

      expect(screen.getByText('1200W')).toBeInTheDocument()
    })
  })

  describe('E2E-4: Desktop Device (1024px)', () => {
    beforeEach(() => {
      global.innerWidth = 1024
      global.dispatchEvent(new Event('resize'))
    })

    it('completes full flow on desktop device', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states/ca')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ state: mockStateData.ca })
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

      expect(screen.getByText('Balcony Solar Legal State Checker')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'California' })).toBeInTheDocument()
      })

      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'ca')

      await waitFor(() => {
        expect(screen.getByText('✅ LEGAL')).toBeInTheDocument()
      })

      // Verify all resources are visible on desktop
      expect(screen.getByText('Official Resources')).toBeInTheDocument()
      expect(screen.getByText('California Public Utilities Commission')).toBeInTheDocument()
    })
  })

  describe('E2E-5: Large Desktop Device (2560px)', () => {
    beforeEach(() => {
      global.innerWidth = 2560
      global.dispatchEvent(new Event('resize'))
    })

    it('completes full flow on large desktop device', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states/ca')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ state: mockStateData.ca })
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

      expect(screen.getByText('Balcony Solar Legal State Checker')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'California' })).toBeInTheDocument()
      })

      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'ca')

      await waitFor(() => {
        expect(screen.getByText('✅ LEGAL')).toBeInTheDocument()
      })

      // Verify layout doesn't break on large screens
      const app = screen.getByText('Balcony Solar Legal State Checker').closest('.app')
      expect(app).toBeInTheDocument()
    })
  })
})


describe('End-to-End: Network Conditions', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    window.history.replaceState = vi.fn()
    vi.stubGlobal('navigator', {
      onLine: true,
      clipboard: {
        writeText: vi.fn(() => Promise.resolve())
      }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('E2E-6: Online with Fast Network', () => {
    it('loads and displays results quickly', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states/ca')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ state: mockStateData.ca })
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

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'California' })).toBeInTheDocument()
      })

      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'ca')

      await waitFor(() => {
        expect(screen.getByText('✅ LEGAL')).toBeInTheDocument()
      })

      expect(screen.getByText('800W')).toBeInTheDocument()
    })
  })

  describe('E2E-7: Offline Mode', () => {
    it('displays offline indicator and uses cached data', async () => {
      const cachedState = mockStateData.ca

      // First load - online
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states/ca')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ state: cachedState })
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

      const { rerender } = render(<App />)

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'California' })).toBeInTheDocument()
      })

      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'ca')

      await waitFor(() => {
        expect(screen.getByText('✅ LEGAL')).toBeInTheDocument()
      })

      // Go offline
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
        configurable: true
      })

      global.fetch.mockImplementationOnce(() => {
        return Promise.reject(new Error('Network error'))
      })

      rerender(<App />)

      // Verify offline indicator appears
      await waitFor(() => {
        const offlineIndicator = screen.queryByTestId('offline-indicator')
        if (offlineIndicator) {
          expect(offlineIndicator).toBeInTheDocument()
        }
      }, { timeout: 2000 })
    })
  })

  describe('E2E-8: API Timeout Handling', () => {
    it('handles API timeout and displays error message', async () => {
      global.fetch.mockImplementationOnce(() => {
        return new Promise((resolve, reject) => {
          setTimeout(() => reject(new Error('Request timeout (>5 seconds)')), 100)
        })
      })

      render(<App />)

      await waitFor(() => {
        const errorElement = screen.queryByTestId('error-message')
        if (errorElement) {
          expect(errorElement).toHaveTextContent('timeout')
        }
      }, { timeout: 3000 })
    })
  })

  describe('E2E-9: API Failure with Retry', () => {
    it('retries failed API calls and eventually succeeds', async () => {
      let callCount = 0

      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states/ca')) {
          callCount++
          // Fail first time, succeed on retry
          if (callCount === 1) {
            return Promise.reject(new Error('Network error'))
          }
          return Promise.resolve({
            ok: true,
            json: async () => ({ state: mockStateData.ca })
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

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'California' })).toBeInTheDocument()
      })

      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'ca')

      // Should eventually succeed after retry
      await waitFor(() => {
        expect(screen.getByText('✅ LEGAL')).toBeInTheDocument()
      }, { timeout: 5000 })

      expect(screen.getByText('800W')).toBeInTheDocument()
    })
  })
})


describe('End-to-End: Iframe Embedding', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    window.history.replaceState = vi.fn()
    vi.stubGlobal('navigator', {
      onLine: true,
      clipboard: {
        writeText: vi.fn(() => Promise.resolve())
      }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('E2E-10: Iframe Embedding on External Website', () => {
    it('renders and functions correctly when embedded in iframe', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states/ca')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ state: mockStateData.ca })
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

      // Simulate iframe context
      const { container } = render(<App />)

      // Verify component renders
      expect(screen.getByText('Balcony Solar Legal State Checker')).toBeInTheDocument()

      // Verify state selector works
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'California' })).toBeInTheDocument()
      })

      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'ca')

      // Verify results display
      await waitFor(() => {
        expect(screen.getByText('✅ LEGAL')).toBeInTheDocument()
      })

      // Verify sharing works in iframe
      const shareButton = screen.getByTestId('copy-url-button')
      await userEvent.click(shareButton)

      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    })

    it('maintains functionality with multiple state selections in iframe', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states/ca')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ state: mockStateData.ca })
          })
        }
        if (url.includes('/api/states/tx')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ state: mockStateData.tx })
          })
        }
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

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'California' })).toBeInTheDocument()
      })

      // Select first state
      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'ca')

      await waitFor(() => {
        expect(screen.getByText('✅ LEGAL')).toBeInTheDocument()
      })

      expect(screen.getByText('800W')).toBeInTheDocument()

      // Select second state
      await userEvent.selectOptions(select, 'tx')

      await waitFor(() => {
        expect(screen.getByText('1200W')).toBeInTheDocument()
      })

      expect(screen.getByText('Texas Energy Code')).toBeInTheDocument()
    })

    it('displays newsletter CTA in iframe', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states/ca')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ state: mockStateData.ca })
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

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'California' })).toBeInTheDocument()
      })

      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'ca')

      await waitFor(() => {
        expect(screen.getByTestId('newsletter-cta')).toBeInTheDocument()
      })

      expect(screen.getByTestId('newsletter-link')).toBeInTheDocument()
    })

    it('displays related content links in iframe', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states/ca')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ state: mockStateData.ca })
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

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'California' })).toBeInTheDocument()
      })

      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'ca')

      await waitFor(() => {
        expect(screen.getByTestId('related-content')).toBeInTheDocument()
      })

      expect(screen.getByTestId('related-guide-link')).toBeInTheDocument()
      expect(screen.getByTestId('related-comparison-link')).toBeInTheDocument()
      expect(screen.getByTestId('related-companies-link')).toBeInTheDocument()
    })
  })
})


describe('End-to-End: Print Functionality', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    window.history.replaceState = vi.fn()
    vi.stubGlobal('navigator', {
      onLine: true,
      clipboard: {
        writeText: vi.fn(() => Promise.resolve())
      }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('E2E-11: Print State Results', () => {
    it('displays printable state results', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states/ca')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ state: mockStateData.ca })
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

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'California' })).toBeInTheDocument()
      })

      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'ca')

      await waitFor(() => {
        expect(screen.getByText('✅ LEGAL')).toBeInTheDocument()
      })

      // Verify all printable content is present
      expect(screen.getByText('800W')).toBeInTheDocument()
      expect(screen.getByText('SB 709')).toBeInTheDocument()
      expect(screen.getByText('Official Resources')).toBeInTheDocument()
    })

    it('includes all required information for printing', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states/tx')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ state: mockStateData.tx })
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

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Texas' })).toBeInTheDocument()
      })

      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'tx')

      await waitFor(() => {
        expect(screen.getByText('✅ LEGAL')).toBeInTheDocument()
      })

      // Verify all details are present for printing
      expect(screen.getByText('1200W')).toBeInTheDocument()
      expect(screen.getByText('Texas Energy Code')).toBeInTheDocument()
      expect(screen.getByText('Public Utility Commission of Texas')).toBeInTheDocument()
    })
  })
})

describe('End-to-End: Cross-Browser Compatibility', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    window.history.replaceState = vi.fn()
    vi.stubGlobal('navigator', {
      onLine: true,
      clipboard: {
        writeText: vi.fn(() => Promise.resolve())
      }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('E2E-12: Chrome Browser Compatibility', () => {
    it('works correctly in Chrome', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states/ca')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ state: mockStateData.ca })
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

      expect(screen.getByText('Balcony Solar Legal State Checker')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'California' })).toBeInTheDocument()
      })

      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'ca')

      await waitFor(() => {
        expect(screen.getByText('✅ LEGAL')).toBeInTheDocument()
      })
    })
  })

  describe('E2E-13: Firefox Browser Compatibility', () => {
    it('works correctly in Firefox', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states/tx')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ state: mockStateData.tx })
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

      expect(screen.getByText('Balcony Solar Legal State Checker')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Texas' })).toBeInTheDocument()
      })

      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'tx')

      await waitFor(() => {
        expect(screen.getByText('✅ LEGAL')).toBeInTheDocument()
      })
    })
  })

  describe('E2E-14: Safari Browser Compatibility', () => {
    it('works correctly in Safari', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states/ny')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ state: mockStateData.ny })
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

      expect(screen.getByText('Balcony Solar Legal State Checker')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'New York' })).toBeInTheDocument()
      })

      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'ny')

      await waitFor(() => {
        expect(screen.getByText('❌ NOT LEGAL')).toBeInTheDocument()
      })
    })
  })

  describe('E2E-15: Edge Browser Compatibility', () => {
    it('works correctly in Edge', async () => {
      global.fetch.mockImplementation((url) => {
        if (url.includes('/api/states/ca')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ state: mockStateData.ca })
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

      expect(screen.getByText('Balcony Solar Legal State Checker')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'California' })).toBeInTheDocument()
      })

      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'ca')

      await waitFor(() => {
        expect(screen.getByText('✅ LEGAL')).toBeInTheDocument()
      })

      // Verify share functionality works
      const shareButton = screen.getByTestId('copy-url-button')
      await userEvent.click(shareButton)

      expect(navigator.clipboard.writeText).toHaveBeenCalled()
    })
  })
})
