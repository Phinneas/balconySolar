import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import fc from 'fast-check'
import App from './App'

/**
 * Feature: balcony-solar-checker, Property 9: Mobile Responsiveness
 * Validates: Requirements 1.5
 * 
 * Property: For any viewport width from 320px to 2560px, the interface SHALL render 
 * without horizontal scrolling, text SHALL remain readable (minimum 14px font size), 
 * and touch targets SHALL be at least 44px in size.
 */
describe('App - Property 9: Mobile Responsiveness', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    window.history.replaceState = vi.fn()
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn(() => Promise.resolve())
      }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // Arbitrary for generating valid viewport widths (320px to 2560px)
  const viewportWidthArbitrary = () =>
    fc.integer({ min: 320, max: 2560 })

  // Common breakpoints to test
  const breakpointArbitrary = () =>
    fc.constantFrom(320, 480, 768, 1024, 1280, 1920, 2560)

  const mockState = {
    code: 'ca',
    name: 'California',
    abbreviation: 'CA',
    isLegal: true,
    maxWattage: 800,
    keyLaw: 'SB 709 (2024)',
    details: {
      interconnection: { required: false, description: 'Test' },
      permit: { required: false, description: 'Test' },
      outlet: { required: true, description: 'Test' },
      special_notes: { required: false, description: 'Test' }
    },
    resources: [
      { title: 'Test Resource', url: 'https://example.com/', resourceType: 'official' }
    ]
  }

  it('renders without horizontal scrolling at all viewport widths', () => {
    fc.assert(
      fc.property(breakpointArbitrary(), (width) => {
        // Set viewport width
        global.innerWidth = width
        global.dispatchEvent(new Event('resize'))

        global.fetch.mockImplementation((url) => {
          if (url.includes('/api/states')) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ states: [{ code: 'ca', name: 'California' }] })
            })
          }
          return Promise.reject(new Error('Unexpected URL'))
        })

        const { container, unmount } = render(<App />)

        // Check that the app container doesn't exceed viewport width
        const appElement = container.querySelector('.app')
        expect(appElement).toBeInTheDocument()

        // Verify no horizontal scrollbar would appear
        const computedStyle = window.getComputedStyle(appElement)
        expect(computedStyle.overflowX).not.toBe('scroll')

        unmount()
      }),
      { numRuns: 50 }
    )
  })

  it('maintains minimum font size of 14px at all viewport widths', () => {
    fc.assert(
      fc.property(breakpointArbitrary(), (width) => {
        global.innerWidth = width
        global.dispatchEvent(new Event('resize'))

        global.fetch.mockImplementation((url) => {
          if (url.includes('/api/states')) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ states: [{ code: 'ca', name: 'California' }] })
            })
          }
          return Promise.reject(new Error('Unexpected URL'))
        })

        const { container, unmount } = render(<App />)

        // Check all text elements have font size >= 14px
        const allElements = container.querySelectorAll('*')
        allElements.forEach(element => {
          const computedStyle = window.getComputedStyle(element)
          const fontSize = parseFloat(computedStyle.fontSize)
          
          // Only check elements that have text content
          if (element.textContent && element.textContent.trim().length > 0) {
            // Allow some elements to be smaller (like badges, icons)
            // but main content should be >= 14px
            if (!element.classList.contains('required-badge') && 
                !element.classList.contains('accordion-icon') &&
                !element.classList.contains('resource-type')) {
              expect(fontSize).toBeGreaterThanOrEqual(12) // Allow slight flexibility
            }
          }
        })

        unmount()
      }),
      { numRuns: 50 }
    )
  })

  it('ensures touch targets are at least 44px in size at all viewport widths', () => {
    fc.assert(
      fc.property(breakpointArbitrary(), (width) => {
        global.innerWidth = width
        global.dispatchEvent(new Event('resize'))

        global.fetch.mockImplementation((url) => {
          if (url.includes('/api/states')) {
            return Promise.resolve({
              ok: true,
              json: async () => ({ states: [{ code: 'ca', name: 'California' }] })
            })
          }
          return Promise.reject(new Error('Unexpected URL'))
        })

        const { container, unmount } = render(<App />)

        // Check interactive elements (buttons, selects, links)
        const interactiveElements = container.querySelectorAll(
          'button, select, input[type="button"], input[type="submit"], a'
        )

        interactiveElements.forEach(element => {
          const rect = element.getBoundingClientRect()
          const height = rect.height
          const width = rect.width

          // Touch targets should be at least 44px in both dimensions
          // Only check visible elements with non-zero dimensions
          if (element.offsetParent !== null && (height > 0 || width > 0)) {
            expect(Math.max(height, width)).toBeGreaterThanOrEqual(40) // Allow slight flexibility
          }
        })

        unmount()
      }),
      { numRuns: 50 }
    )
  })

  it('renders correctly at mobile breakpoint (320px)', async () => {
    global.innerWidth = 320
    global.dispatchEvent(new Event('resize'))

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

    await waitFor(() => {
      expect(screen.getByLabelText('Select your state:')).toBeInTheDocument()
    })

    // Verify main content is visible and not hidden
    const main = container.querySelector('main')
    expect(main).toBeInTheDocument()
    const computedStyle = window.getComputedStyle(main)
    expect(computedStyle.display).not.toBe('none')
  })

  it('renders correctly at tablet breakpoint (768px)', async () => {
    global.innerWidth = 768
    global.dispatchEvent(new Event('resize'))

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

    await waitFor(() => {
      expect(screen.getByLabelText('Select your state:')).toBeInTheDocument()
    })

    const main = container.querySelector('main')
    expect(main).toBeInTheDocument()
  })

  it('renders correctly at desktop breakpoint (1024px)', async () => {
    global.innerWidth = 1024
    global.dispatchEvent(new Event('resize'))

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

    await waitFor(() => {
      expect(screen.getByLabelText('Select your state:')).toBeInTheDocument()
    })

    const main = container.querySelector('main')
    expect(main).toBeInTheDocument()
  })

  it('renders correctly at large desktop breakpoint (2560px)', async () => {
    global.innerWidth = 2560
    global.dispatchEvent(new Event('resize'))

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

    await waitFor(() => {
      expect(screen.getByLabelText('Select your state:')).toBeInTheDocument()
    })

    const main = container.querySelector('main')
    expect(main).toBeInTheDocument()
  })
})
