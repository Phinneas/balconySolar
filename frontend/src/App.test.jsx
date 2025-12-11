import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App Component', () => {
  beforeEach(() => {
    // Mock fetch for API calls
    global.fetch = vi.fn()
    // Mock window.history.replaceState
    window.history.replaceState = vi.fn()
    // Mock navigator.clipboard
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn(() => Promise.resolve())
      }
    })
  })

  it('renders the app header', () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ states: [] })
    })

    render(<App />)
    expect(screen.getByText('Balcony Solar Legal State Checker')).toBeInTheDocument()
  })

  it('renders state selector', () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ states: [] })
    })

    render(<App />)
    expect(screen.getByLabelText('Select your state:')).toBeInTheDocument()
  })

  it('fetches states on mount', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        states: [
          { code: 'ca', name: 'California' },
          { code: 'ny', name: 'New York' }
        ] 
      })
    })

    render(<App />)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/states'),
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      )
    })
  })
})

describe('App Component - URL Parameter Handling', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    window.history.replaceState = vi.fn()
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn(() => Promise.resolve())
      }
    })
  })

  describe('Shareable URL Generation', () => {
    it('generates shareable URL with state parameter when state is selected', async () => {
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

      // Select Texas
      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'tx')

      // Verify history.replaceState was called with state parameter
      await waitFor(() => {
        expect(window.history.replaceState).toHaveBeenCalledWith(
          {},
          '',
          expect.stringContaining('state=tx')
        )
      })
    })
  })

  describe('Copy-to-Clipboard Functionality', () => {
    it('copies shareable URL to clipboard when button is clicked', async () => {
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

      let callCount = 0
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

      // Select Florida from dropdown
      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'fl')

      // Wait for the state results to appear
      const copyButton = await screen.findByTestId('copy-url-button')
      await userEvent.click(copyButton)

      // Give the async clipboard operation time to complete
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('state=fl')
      )
    })

    it('displays success message after copying URL', async () => {
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

      // Mock alert
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

      render(<App />)

      // Wait for states to load
      await waitFor(() => {
        expect(screen.getByRole('option', { name: 'Washington' })).toBeInTheDocument()
      })

      // Select Washington from dropdown
      const select = screen.getByRole('combobox')
      await userEvent.selectOptions(select, 'wa')

      // Wait for the state results to appear
      const copyButton = await screen.findByTestId('copy-url-button')
      await userEvent.click(copyButton)

      // Give the async clipboard operation time to complete
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(alertSpy).toHaveBeenCalledWith('URL copied to clipboard!')

      alertSpy.mockRestore()
    })
  })
})
