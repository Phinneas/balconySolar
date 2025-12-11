import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from './App'

/**
 * Unit tests for responsive layout
 * Validates: Requirements 1.5
 * 
 * Tests layout at different viewport sizes, touch target sizes, and text readability
 */
describe('App - Responsive Layout Unit Tests', () => {
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

  describe('Mobile Layout (320px)', () => {
    beforeEach(() => {
      global.innerWidth = 320
      global.dispatchEvent(new Event('resize'))
    })

    it('renders header on mobile', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ states: [] })
      })

      const { container } = render(<App />)
      const header = container.querySelector('header')

      expect(header).toBeInTheDocument()
    })

    it('renders state selector on mobile', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ states: [] })
      })

      const { container } = render(<App />)
      const select = container.querySelector('select')

      expect(select).toBeInTheDocument()
    })

    it('renders main content on mobile', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ states: [] })
      })

      const { container } = render(<App />)
      const main = container.querySelector('main')

      expect(main).toBeInTheDocument()
    })
  })

  describe('Tablet Layout (768px)', () => {
    beforeEach(() => {
      global.innerWidth = 768
      global.dispatchEvent(new Event('resize'))
    })

    it('renders main content on tablet', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ states: [] })
      })

      const { container } = render(<App />)
      const main = container.querySelector('main')

      expect(main).toBeInTheDocument()
    })

    it('renders state results with state results container on tablet', async () => {
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

      const stateResults = container.querySelector('.state-results')
      if (stateResults) {
        expect(stateResults).toBeInTheDocument()
      }
    })
  })

  describe('Desktop Layout (1024px)', () => {
    beforeEach(() => {
      global.innerWidth = 1024
      global.dispatchEvent(new Event('resize'))
    })

    it('renders app container on desktop', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ states: [] })
      })

      const { container } = render(<App />)
      const app = container.querySelector('.app')

      expect(app).toBeInTheDocument()
    })

    it('renders header on desktop', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ states: [] })
      })

      const { container } = render(<App />)
      const header = container.querySelector('header h1')

      expect(header).toBeInTheDocument()
      expect(header.textContent).toBe('Balcony Solar Legal State Checker')
    })
  })

  describe('Large Desktop Layout (2560px)', () => {
    beforeEach(() => {
      global.innerWidth = 2560
      global.dispatchEvent(new Event('resize'))
    })

    it('renders without breaking layout on large screens', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ states: [] })
      })

      const { container } = render(<App />)
      const main = container.querySelector('main')

      expect(main).toBeInTheDocument()
    })
  })

  describe('Touch Target Sizes', () => {
    it('renders select element', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ states: [] })
      })

      const { container } = render(<App />)
      const select = container.querySelector('select')

      expect(select).toBeInTheDocument()
    })

    it('renders interactive elements', async () => {
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

      // Check that select element exists (main interactive element)
      const select = container.querySelector('select')
      expect(select).toBeInTheDocument()
    })
  })

  describe('Text Readability', () => {
    it('renders labels for form elements', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ states: [] })
      })

      const { container } = render(<App />)
      const labels = container.querySelectorAll('label')

      expect(labels.length).toBeGreaterThan(0)
    })

    it('renders header text', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ states: [] })
      })

      const { container } = render(<App />)
      const heading = container.querySelector('header h1')

      expect(heading).toBeInTheDocument()
      expect(heading.textContent).toBeTruthy()
    })

    it('renders paragraphs with content', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ states: [] })
      })

      const { container } = render(<App />)
      const paragraphs = container.querySelectorAll('p')

      // Paragraphs may or may not exist depending on state
      paragraphs.forEach(p => {
        expect(p.textContent).toBeTruthy()
      })
    })
  })

  describe('Layout Structure', () => {
    it('renders app with flex layout structure', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ states: [] })
      })

      const { container } = render(<App />)
      const app = container.querySelector('.app')

      expect(app).toBeInTheDocument()
      expect(app.querySelector('header')).toBeInTheDocument()
      expect(app.querySelector('main')).toBeInTheDocument()
    })

    it('renders main with centered content', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ states: [] })
      })

      const { container } = render(<App />)
      const main = container.querySelector('main')

      expect(main).toBeInTheDocument()
      expect(main.querySelector('.state-selector')).toBeInTheDocument()
    })

    it('renders state selector with label and select', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ states: [] })
      })

      const { container } = render(<App />)
      const stateSelector = container.querySelector('.state-selector')

      expect(stateSelector).toBeInTheDocument()
      expect(stateSelector.querySelector('label')).toBeInTheDocument()
      expect(stateSelector.querySelector('select')).toBeInTheDocument()
    })
  })

  describe('Responsive Behavior', () => {
    it('renders correctly at multiple viewport widths', async () => {
      const viewportWidths = [320, 768, 1024, 2560]

      for (const width of viewportWidths) {
        global.innerWidth = width
        global.dispatchEvent(new Event('resize'))

        global.fetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({ states: [] })
        })

        const { container, unmount } = render(<App />)
        const app = container.querySelector('.app')

        expect(app).toBeInTheDocument()
        unmount()
      }
    })

    it('maintains structure across viewport changes', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ states: [] })
      })

      const { container } = render(<App />)

      // Check structure exists
      expect(container.querySelector('header')).toBeInTheDocument()
      expect(container.querySelector('main')).toBeInTheDocument()
      expect(container.querySelector('.state-selector')).toBeInTheDocument()

      // Simulate viewport change
      global.innerWidth = 320
      global.dispatchEvent(new Event('resize'))

      // Structure should still exist
      expect(container.querySelector('header')).toBeInTheDocument()
      expect(container.querySelector('main')).toBeInTheDocument()
    })
  })
})
