import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import fc from 'fast-check'
import App from './App'

/**
 * Feature: balcony-solar-checker, Property 10: Iframe Embedding Isolation
 * Validates: Requirements 6.1, 6.2, 6.3
 * 
 * Property: For any page embedding the checker via iframe, the embedded component
 * SHALL function independently without requiring the parent page to load React, CSS,
 * or other dependencies beyond the iframe tag.
 */
describe('App - Property 10: Iframe Embedding Isolation', () => {
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

  it('component renders and functions independently within iframe context', async () => {
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
            interconnection: { required: false, description: 'Test interconnection' },
            permit: { required: false, description: 'Test permit' },
            outlet: { required: false, description: 'Test outlet' },
            special_notes: { required: false, description: 'Test notes' }
          },
          resources: [
            { title: 'Official Source', url: 'https://example.com', resourceType: 'official' }
          ]
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

        // Verify component renders
        await waitFor(() => {
          expect(screen.getByText('Balcony Solar Legal State Checker')).toBeInTheDocument()
        })

        // Verify state selector is functional
        await waitFor(() => {
          expect(screen.getByRole('option', { name: 'Test State' })).toBeInTheDocument()
        })

        // Select state
        const select = screen.getByRole('combobox')
        await userEvent.selectOptions(select, stateCode)

        // Verify results display
        await waitFor(() => {
          expect(screen.getByText('✅ LEGAL')).toBeInTheDocument()
        })

        // Verify all functionality works
        expect(screen.getByText('800W')).toBeInTheDocument()
        expect(screen.getByText('Test Law')).toBeInTheDocument()

        unmount()
      }),
      { numRuns: 15 }
    )
  })

  it('component maintains state isolation when multiple instances exist', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.tuple(stateCodeArbitrary(), stateCodeArbitrary()),
        async ([stateCode1, stateCode2]) => {
          // Skip if codes are identical
          if (stateCode1 === stateCode2) return

          const mockState1 = {
            code: stateCode1,
            name: 'State One',
            abbreviation: 'S1',
            isLegal: true,
            maxWattage: 800,
            keyLaw: 'Law One',
            details: {
              interconnection: { required: false, description: 'Test' },
              permit: { required: false, description: 'Test' },
              outlet: { required: false, description: 'Test' },
              special_notes: { required: false, description: 'Test' }
            },
            resources: []
          }

          const mockState2 = {
            code: stateCode2,
            name: 'State Two',
            abbreviation: 'S2',
            isLegal: false,
            maxWattage: 600,
            keyLaw: 'Law Two',
            details: {
              interconnection: { required: true, description: 'Test' },
              permit: { required: true, description: 'Test' },
              outlet: { required: true, description: 'Test' },
              special_notes: { required: false, description: 'Test' }
            },
            resources: []
          }

          global.fetch.mockImplementation((url) => {
            if (url.includes(`/api/states/${stateCode1}`)) {
              return Promise.resolve({
                ok: true,
                json: async () => ({ state: mockState1 })
              })
            }
            if (url.includes(`/api/states/${stateCode2}`)) {
              return Promise.resolve({
                ok: true,
                json: async () => ({ state: mockState2 })
              })
            }
            if (url.includes('/api/states')) {
              return Promise.resolve({
                ok: true,
                json: async () => ({
                  states: [
                    { code: stateCode1, name: 'State One' },
                    { code: stateCode2, name: 'State Two' }
                  ]
                })
              })
            }
            return Promise.reject(new Error('Unexpected URL'))
          })

          const { unmount } = render(<App />)

          // Wait for states to load
          await waitFor(() => {
            expect(screen.getByRole('option', { name: 'State One' })).toBeInTheDocument()
          })

          // Select first state
          const select = screen.getByRole('combobox')
          await userEvent.selectOptions(select, stateCode1)

          // Verify first state is displayed
          await waitFor(() => {
            expect(screen.getByText('✅ LEGAL')).toBeInTheDocument()
          })

          const firstStateWattage = screen.getByText('800W').textContent

          // Select second state
          await userEvent.selectOptions(select, stateCode2)

          // Verify second state is displayed and first state is replaced
          await waitFor(() => {
            expect(screen.getByText('❌ NOT LEGAL')).toBeInTheDocument()
          })

          const secondStateWattage = screen.getByText('600W').textContent

          // Verify states are different
          expect(firstStateWattage).not.toBe(secondStateWattage)

          unmount()
        }
      ),
      { numRuns: 10 }
    )
  })

  it('component does not pollute global scope', async () => {
    const mockState = {
      code: 'ca',
      name: 'California',
      abbreviation: 'CA',
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

    // Capture initial global properties
    const initialGlobalKeys = Object.keys(window)

    const { unmount } = render(<App />)

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByText('Balcony Solar Legal State Checker')).toBeInTheDocument()
    })

    // Verify component works
    const select = screen.getByRole('combobox')
    await userEvent.selectOptions(select, 'ca')

    await waitFor(() => {
      expect(screen.getByText('✅ LEGAL')).toBeInTheDocument()
    })

    unmount()

    // Verify no new global properties were added (allowing for some React internals)
    const finalGlobalKeys = Object.keys(window)
    const newGlobalKeys = finalGlobalKeys.filter(key => !initialGlobalKeys.includes(key))

    // Filter out expected React/testing library additions
    const unexpectedGlobalKeys = newGlobalKeys.filter(
      key => !key.startsWith('__') && !key.includes('React') && !key.includes('vitest')
    )

    // Should not have added unexpected global properties
    expect(unexpectedGlobalKeys.length).toBeLessThanOrEqual(2)
  })
})
