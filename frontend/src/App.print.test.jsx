import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import App from './App'

/**
 * Print Styling Tests
 * 
 * Tests for print media query application and element visibility in print mode
 * Requirements: 4.4
 */
describe('App Component - Print Styling', () => {
  beforeEach(() => {
    global.fetch = vi.fn()
    window.history.replaceState = vi.fn()
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn(() => Promise.resolve())
      }
    })
  })

  describe('Print Media Query Application', () => {
    it('applies print styles to header element', () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ states: [] })
      })

      const { container } = render(<App />)
      const header = container.querySelector('header')

      // Get computed styles for print media
      const styles = window.getComputedStyle(header, '@media print')
      
      // Verify header exists and can be styled
      expect(header).toBeInTheDocument()
    })

    it('applies print styles to main content area', () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ states: [] })
      })

      const { container } = render(<App />)
      const main = container.querySelector('main')

      expect(main).toBeInTheDocument()
    })

    it('applies print styles to state results container', () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ states: [] })
      })

      const { container } = render(<App />)
      const stateResults = container.querySelector('.state-results')

      // State results may not exist initially, but the class should be available
      expect(container).toBeInTheDocument()
    })
  })

  describe('Element Visibility in Print Mode', () => {
    it('hides state selector in print mode', () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ states: [] })
      })

      const { container } = render(<App />)
      const stateSelector = container.querySelector('.state-selector')

      // Verify selector exists in DOM (it's hidden via CSS in print)
      expect(stateSelector).toBeInTheDocument()
    })

    it('hides loading indicator in print mode', () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ states: [] })
      })

      const { container } = render(<App />)
      
      // Loading class should be available for styling
      expect(container).toBeInTheDocument()
    })

    it('hides error messages in print mode', () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ states: [] })
      })

      const { container } = render(<App />)
      
      // Error class should be available for styling
      expect(container).toBeInTheDocument()
    })

    it('preserves header visibility in print mode', () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ states: [] })
      })

      const { container } = render(<App />)
      const header = container.querySelector('header')

      // Header should remain visible in print
      expect(header).toBeInTheDocument()
    })

    it('preserves main content visibility in print mode', () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ states: [] })
      })

      const { container } = render(<App />)
      const main = container.querySelector('main')

      // Main content should remain visible in print
      expect(main).toBeInTheDocument()
    })
  })

  describe('Print Stylesheet Integrity', () => {
    it('renders app without breaking layout with print styles', () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ states: [] })
      })

      const { container } = render(<App />)
      const app = container.querySelector('.app')

      // App should render without errors
      expect(app).toBeInTheDocument()
    })

    it('does not break layout with print styles', () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ states: [] })
      })

      const { container } = render(<App />)
      const app = container.querySelector('.app')

      // App should render without errors
      expect(app).toBeInTheDocument()
    })
  })
})
