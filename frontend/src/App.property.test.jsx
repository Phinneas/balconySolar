import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import fc from 'fast-check'
import App from './App'

/**
 * Feature: balcony-solar-checker, Property 5: URL Parameter Round Trip
 * Validates: Requirements 4.1, 4.2, 4.3
 * 
 * Property: For any state code, when a user selects a state and generates a shareable URL,
 * the URL SHALL contain the correct state parameter, and copying to clipboard SHALL include
 * that parameter.
 */
describe('App - Property 5: URL Parameter Round Trip', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    window.history.replaceState = vi.fn()
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn(() => Promise.resolve())
      }
    })
  })

  // Arbitrary for generating valid state codes (2-letter lowercase)
  const stateCodeArbitrary = () =>
    fc.array(fc.integer({ min: 97, max: 122 }), { minLength: 2, maxLength: 2 })
      .map(codes => codes.map(c => String.fromCharCode(c)).join(''))

  it('shareable URL contains correct state parameter when state is selected', async () => {
    await fc.assert(
      fc.asyncProperty(stateCodeArbitrary(), async (stateCode) => {
        const mockState = {
          code: stateCode,
          name: 'Test State',
          abbreviation: 'TS',
          isLegal: true,
          maxWattage: 800,
          keyLaw: 'Test Law',
          details: {
            interconnection: { required: false, description: 'Test' },
            permit: { required: false, description: 'Test' },
            outlet: { required: false, description: 'Test' },
            special_notes: { required: false, description: 'Test' }
          },
          resources: []
        }

        global.fetch.mockImplementation((url) => {
          if (url.includes(`/api/states/${stateCode}`)) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ state: mockState })
            })
          }
          if (url.includes('/api/states')) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ states: [{ code: stateCode, name: 'Test State' }] })
            })
          }
          return Promise.reject(new Error('Unexpected URL'))
        })

        const { unmount } = render(<App />)

        // Wait for states to load
        await waitFor(() => {
          expect(screen.getByRole('option', { name: 'Test State' })).toBeInTheDocument()
        })

        // Select the state
        const select = screen.getByRole('combobox')
        await userEvent.selectOptions(select, stateCode)

        // Verify history.replaceState was called with the state parameter
        await waitFor(() => {
          expect(window.history.replaceState).toHaveBeenCalledWith(
            {},
            '',
            expect.stringContaining(`state=${stateCode}`)
          )
        })

        unmount()
      }),
      { numRuns: 20 }
    )
  })

  it('copy-to-clipboard includes correct state parameter', async () => {
    await fc.assert(
      fc.asyncProperty(stateCodeArbitrary(), async (stateCode) => {
        const mockState = {
          code: stateCode,
          name: 'Test State',
          abbreviation: 'TS',
          isLegal: true,
          maxWattage: 800,
          keyLaw: 'Test Law',
          details: {
            interconnection: { required: false, description: 'Test' },
            permit: { required: false, description: 'Test' },
            outlet: { required: false, description: 'Test' },
            special_notes: { required: false, description: 'Test' }
          },
          resources: []
        }

        global.fetch.mockImplementation((url) => {
          if (url.includes(`/api/states/${stateCode}`)) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ state: mockState })
            })
          }
          if (url.includes('/api/states')) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ states: [{ code: stateCode, name: 'Test State' }] })
            })
          }
          return Promise.reject(new Error('Unexpected URL'))
        })

        const { unmount } = render(<App />)

        // Wait for states to load
        await waitFor(() => {
          expect(screen.getByRole('option', { name: 'Test State' })).toBeInTheDocument()
        })

        // Select the state
        const select = screen.getByRole('combobox')
        await userEvent.selectOptions(select, stateCode)

        // Wait for copy button to appear
        const copyButton = await screen.findByTestId('copy-url-button')
        await userEvent.click(copyButton)

        // Give clipboard operation time to complete
        await new Promise(resolve => setTimeout(resolve, 100))

        // Verify clipboard was called with URL containing state parameter
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          expect.stringContaining(`state=${stateCode}`)
        )

        unmount()
      }),
      { numRuns: 20 }
    )
  })
})
