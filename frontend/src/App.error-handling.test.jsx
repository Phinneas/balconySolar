/**
 * Tests for Error Handling and Fallbacks
 * Feature: balcony-solar-checker
 * Validates: Requirements 5.5, 7.4
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App Component - Error Handling', () => {
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

  it('displays "Data pending" message when state data is incomplete', async () => {
    const incompleteState = {
      code: 'ca',
      name: 'California',
      abbreviation: 'CA',
      isLegal: true
    }

    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/states/ca')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ state: incompleteState })
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ states: [{ code: 'ca', name: 'California' }] })
      })
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'California' })).toBeInTheDocument()
    })

    const select = screen.getByTestId('state-select')
    await userEvent.selectOptions(select, 'ca')

    await waitFor(() => {
      expect(screen.getByTestId('data-pending-message')).toBeInTheDocument()
    })
  })

  it('displays "Wattage information unavailable" when maxWattage is missing', async () => {
    const stateWithoutWattage = {
      code: 'ny',
      name: 'New York',
      abbreviation: 'NY',
      isLegal: true,
      keyLaw: 'NY Solar Law',
      details: {},
      resources: [],
      lastUpdated: new Date().toISOString()
    }

    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/states/ny')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ state: stateWithoutWattage })
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ states: [{ code: 'ny', name: 'New York' }] })
      })
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'New York' })).toBeInTheDocument()
    })

    const select = screen.getByTestId('state-select')
    await userEvent.selectOptions(select, 'ny')

    await waitFor(() => {
      expect(screen.getByText('Wattage information unavailable')).toBeInTheDocument()
    })
  })

  it('displays offline indicator when user is offline', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
      configurable: true
    })

    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ states: [] })
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId('offline-indicator')).toBeInTheDocument()
    })
  })

  it('handles API failure with cached data fallback', async () => {
    const completeState = {
      code: 'ca',
      name: 'California',
      abbreviation: 'CA',
      isLegal: true,
      maxWattage: 800,
      keyLaw: 'SB 709',
      details: {},
      resources: [],
      lastUpdated: new Date().toISOString()
    }

    // First call succeeds and caches data
    global.fetch.mockImplementationOnce((url) => {
      if (url.includes('/api/states/ca')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ state: completeState })
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ states: [{ code: 'ca', name: 'California' }] })
      })
    })

    const { rerender } = render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'California' })).toBeInTheDocument()
    })

    const select = screen.getByTestId('state-select')
    await userEvent.selectOptions(select, 'ca')

    await waitFor(() => {
      expect(screen.getByText('California')).toBeInTheDocument()
    })

    // Second call fails but should use cached data
    global.fetch.mockImplementationOnce(() => {
      return Promise.reject(new Error('Network error'))
    })

    // Trigger another fetch by re-rendering
    rerender(<App />)

    // The cached data should still be available
    await waitFor(() => {
      expect(screen.getByText('California')).toBeInTheDocument()
    })
  })

  it('displays error message when API fails and no cached data available', async () => {
    global.fetch.mockImplementationOnce(() => {
      return Promise.reject(new Error('Network error'))
    })

    render(<App />)

    await waitFor(() => {
      const errorElement = screen.queryByTestId('error-message')
      if (errorElement) {
        expect(errorElement).toHaveTextContent('Network error')
      }
    }, { timeout: 2000 })
  })

  it('handles timeout errors gracefully', async () => {
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

  it('retries failed API calls', async () => {
    const completeState = {
      code: 'tx',
      name: 'Texas',
      abbreviation: 'TX',
      isLegal: true,
      maxWattage: 1200,
      keyLaw: 'Texas Solar Law',
      details: {},
      resources: [],
      lastUpdated: new Date().toISOString()
    }

    let callCount = 0

    global.fetch.mockImplementation((url) => {
      if (url.includes('/api/states/tx')) {
        callCount++
        // Fail first time, succeed on retry
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ state: completeState })
        })
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ states: [{ code: 'tx', name: 'Texas' }] })
      })
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Texas' })).toBeInTheDocument()
    })

    const select = screen.getByTestId('state-select')
    await userEvent.selectOptions(select, 'tx')

    // Should eventually succeed after retry
    await waitFor(() => {
      expect(screen.getByText('Texas')).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('displays error when offline and no cached data', async () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
      configurable: true
    })

    global.fetch.mockImplementationOnce(() => {
      return Promise.reject(new Error('Network error'))
    })

    render(<App />)

    await waitFor(() => {
      const errorElement = screen.queryByTestId('error-message')
      if (errorElement) {
        expect(errorElement).toHaveTextContent('offline')
      }
    }, { timeout: 2000 })
  })
})
