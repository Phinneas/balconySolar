import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SolarCompanyFinder from './SolarCompanyFinder'

describe('SolarCompanyFinder Component', () => {
  const defaultProps = {
    stateCode: 'CA',
    stateName: 'California',
    apiUrl: 'http://localhost:8787',
  }

  let mockFetch

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch = vi.fn()
    global.fetch = mockFetch
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('renders the component with default props', () => {
      render(<SolarCompanyFinder {...defaultProps} />)
      
      expect(screen.getByTestId('solar-company-finder')).toBeInTheDocument()
      expect(screen.getByText('Find Solar Companies Near You')).toBeInTheDocument()
      expect(screen.getByText(/Get quotes from local solar installers in California/)).toBeInTheDocument()
    })

    it('renders zip input and search button', () => {
      render(<SolarCompanyFinder {...defaultProps} />)
      
      expect(screen.getByLabelText('Zip code')).toBeInTheDocument()
      expect(screen.getByLabelText('Zip code')).toHaveAttribute('type', 'text')
      expect(screen.getByLabelText('Zip code')).toHaveAttribute('inputMode', 'numeric')
      expect(screen.getByTestId('search-button')).toBeInTheDocument()
      expect(screen.getByText('Find Companies')).toBeInTheDocument()
    })

    it('renders placeholder in zip input', () => {
      render(<SolarCompanyFinder {...defaultProps} />)
      
      const zipInput = screen.getByLabelText('Zip code')
      expect(zipInput).toHaveAttribute('placeholder', '12345')
    })
  })

  describe('Zip Code Input', () => {
    it('allows entering valid zip code', async () => {
      const user = userEvent.setup()
      render(<SolarCompanyFinder {...defaultProps} />)
      
      const zipInput = screen.getByLabelText('Zip code')
      await user.type(zipInput, '90210')
      
      expect(zipInput).toHaveValue('90210')
    })

    it('limits zip code to 5 digits', async () => {
      const user = userEvent.setup()
      render(<SolarCompanyFinder {...defaultProps} />)
      
      const zipInput = screen.getByLabelText('Zip code')
      await user.type(zipInput, '9021012345')
      
      expect(zipInput).toHaveValue('90210') // Should be truncated to 5 digits
    })

    it('rejects non-numeric characters', async () => {
      const user = userEvent.setup()
      render(<SolarCompanyFinder {...defaultProps} />)
      
      const zipInput = screen.getByLabelText('Zip code')
      await user.type(zipInput, 'abcde')
      
      expect(zipInput).toHaveValue('') // Should reject letters
    })

    it('clears error when user starts typing', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Some error' }),
      })
      
      render(<SolarCompanyFinder {...defaultProps} />)
      
      const zipInput = screen.getByLabelText('Zip code')
      const searchButton = screen.getByTestId('search-button')
      
      await user.type(zipInput, '90210')
      await user.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
      })
      
      // Clear and type again
      await user.clear(zipInput)
      await user.type(zipInput, '12345')
      
      // Verify error is cleared after typing starts
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument()
      expect(screen.getByLabelText('Zip code')).toHaveAttribute('aria-invalid', 'false')
    })
  })

  describe('Form Validation', () => {
    it('shows error when submitting empty zip code', async () => {
      const user = userEvent.setup()
      render(<SolarCompanyFinder {...defaultProps} />)
      
      const searchButton = screen.getByTestId('search-button')
      await user.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
      })
      
      expect(screen.getByTestId('error-message')).toHaveTextContent('Please enter a zip code')
    })

    it('shows error when submitting invalid zip code (less than 5 digits)', async () => {
      const user = userEvent.setup()
      render(<SolarCompanyFinder {...defaultProps} />)
      
      const zipInput = screen.getByLabelText('Zip code')
      const searchButton = screen.getByTestId('search-button')
      
      await user.type(zipInput, '123')
      
      await act(async () => {
        await user.click(searchButton)
      })
      
      expect(screen.getByTestId('error-message')).toBeInTheDocument()
      expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid zip code')
    })

    it('allows submitting valid 5-digit zip code', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ companies: [], resultCount: 0, searchedZip: '90210' }),
      })
      
      render(<SolarCompanyFinder {...defaultProps} />)
      
      const zipInput = screen.getByLabelText('Zip code')
      const searchButton = screen.getByTestId('search-button')
      
      await user.type(zipInput, '90210')
      await user.click(searchButton)
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:8787/api/solar-companies?zip=90210&state=CA',
          expect.any(Object)
        )
      })
    })
  })

  describe('API Calls', () => {
    it('calls API with correct parameters on valid search', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ companies: [], resultCount: 0, searchedZip: '90210' }),
      })
      
      render(<SolarCompanyFinder {...defaultProps} />)
      
      const zipInput = screen.getByLabelText('Zip code')
      const searchButton = screen.getByTestId('search-button')
      
      await user.type(zipInput, '90210')
      await user.click(searchButton)
      
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:8787/api/solar-companies?zip=90210&state=CA',
          expect.objectContaining({
            signal: expect.any(AbortSignal),
          })
        )
      })
    })

    it('displays loading state during API call', async () => {
      const user = userEvent.setup()
      let resolveFetch
      mockFetch.mockImplementationOnce(() => new Promise((resolve) => {
        resolveFetch = resolve
      }))
      
      render(<SolarCompanyFinder {...defaultProps} />)
      
      const zipInput = screen.getByLabelText('Zip code')
      const searchButton = screen.getByTestId('search-button')
      
      await user.type(zipInput, '90210')
      await user.click(searchButton)
      
      expect(screen.getByTestId('loading')).toBeInTheDocument()
      expect(screen.getByText('Searching for solar companies...')).toBeInTheDocument()
      expect(screen.getByTestId('search-button')).toBeDisabled()
      
      resolveFetch({ ok: true, json: async () => ({ companies: [], resultCount: 0, searchedZip: '90210' }) })
    })

    it('displays company cards when API returns results', async () => {
      const user = userEvent.setup()
      const mockCompanies = [
        {
          name: 'SunPower Solar',
          address: '123 Main St, Los Angeles, CA 90210',
          rating: 4.5,
          reviewCount: 127,
          businessStatus: 'OPERATIONAL',
          placeId: 'ChIJ12345',
          phone: '+1-555-123-4567',
          website: 'https://example.com',
        },
      ]
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ companies: mockCompanies, resultCount: 1, searchedZip: '90210' }),
      })
      
      render(<SolarCompanyFinder {...defaultProps} />)
      
      const zipInput = screen.getByLabelText('Zip code')
      const searchButton = screen.getByTestId('search-button')
      
      await user.type(zipInput, '90210')
      await user.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('companies-grid')).toBeInTheDocument()
        expect(screen.getByText('SunPower Solar')).toBeInTheDocument()
        expect(screen.getByText('123 Main St, Los Angeles, CA 90210')).toBeInTheDocument()
      })
    })

    it('displays no results message when API returns empty array', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ companies: [], resultCount: 0, searchedZip: '90210' }),
      })
      
      render(<SolarCompanyFinder {...defaultProps} />)
      
      const zipInput = screen.getByLabelText('Zip code')
      const searchButton = screen.getByTestId('search-button')
      
      await user.type(zipInput, '90210')
      await user.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('no-results')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles 400 bad request errors', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid request' }),
      })
      
      render(<SolarCompanyFinder {...defaultProps} />)
      
      const zipInput = screen.getByLabelText('Zip code')
      const searchButton = screen.getByTestId('search-button')
      
      await user.type(zipInput, '90210')
      await user.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
        expect(screen.getByTestId('error-message')).toHaveTextContent(/Invalid request/i)
      })
    })

    it('handles 429 rate limit errors', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Rate limit exceeded' }),
      })
      
      render(<SolarCompanyFinder {...defaultProps} />)
      
      const zipInput = screen.getByLabelText('Zip code')
      const searchButton = screen.getByTestId('search-button')
      
      await user.type(zipInput, '90210')
      await user.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
        expect(screen.getByTestId('error-message')).toHaveTextContent(/daily search limit/i)
      })
    })

    it('handles 502 and 504 service errors', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: async () => ({ error: 'Service unavailable' }),
      })
      
      render(<SolarCompanyFinder {...defaultProps} />)
      
      const zipInput = screen.getByLabelText('Zip code')
      const searchButton = screen.getByTestId('search-button')
      
      await user.type(zipInput, '90210')
      await user.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
        expect(screen.getByTestId('error-message')).toHaveTextContent(/Service temporarily unavailable/i)
      })
    })

    it('handles network timeouts', async () => {
      const user = userEvent.setup()
      const abortError = new Error('Request timeout')
      abortError.name = 'AbortError'
      mockFetch.mockRejectedValueOnce(abortError)
      
      render(<SolarCompanyFinder {...defaultProps} />)
      
      const zipInput = screen.getByLabelText('Zip code')
      const searchButton = screen.getByTestId('search-button')
      
      await user.type(zipInput, '90210')
      await user.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
        expect(screen.getByTestId('error-message')).toHaveTextContent(/Request timeout/i)
      })
    })
  })

  describe('Company Cards', () => {
    it('displays company name and address', async () => {
      const user = userEvent.setup()
      const mockCompanies = [
        {
          name: 'SolarTech Inc.',
          address: '456 Solar Ave, San Francisco, CA 94102',
          rating: 5.0,
          reviewCount: 256,
          businessStatus: 'OPERATIONAL',
          placeId: 'ChIJ67890',
          phone: null,
          website: null,
        },
      ]
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ companies: mockCompanies, resultCount: 1, searchedZip: '94102' }),
      })
      
      render(<SolarCompanyFinder {...defaultProps} />)
      
      await user.type(screen.getByLabelText('Zip code'), '94102')
      await user.click(screen.getByTestId('search-button'))
      
      await waitFor(() => {
        expect(screen.getByText('SolarTech Inc.')).toBeInTheDocument()
        expect(screen.getByText('456 Solar Ave, San Francisco, CA 94102')).toBeInTheDocument()
      })
    })

    it('displays star ratings', async () => {
      const user = userEvent.setup()
      const mockCompanies = [
        {
          name: 'SolarTech Inc.',
          address: '456 Solar Ave, San Francisco, CA 94102',
          rating: 4.5,
          reviewCount: 256,
          businessStatus: 'OPERATIONAL',
          placeId: 'ChIJ67890',
        },
      ]
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ companies: mockCompanies, resultCount: 1, searchedZip: '94102' }),
      })
      
      render(<SolarCompanyFinder {...defaultProps} />)
      
      await user.type(screen.getByLabelText('Zip code'), '94102')
      await user.click(screen.getByTestId('search-button'))
      
      await waitFor(() => {
        expect(screen.getAllByText('★').length).toBeGreaterThan(0)
      })
    })

    it('displays phone button when phone is available', async () => {
      const user = userEvent.setup()
      const mockCompanies = [
        {
          name: 'SolarTech Inc.',
          address: '456 Solar Ave, San Francisco, CA 94102',
          rating: 5.0,
          reviewCount: 256,
          businessStatus: 'OPERATIONAL',
          placeId: 'ChIJ67890',
          phone: '+1-555-123-4567',
          website: 'https://example.com',
        },
      ]
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ companies: mockCompanies, resultCount: 1, searchedZip: '94102' }),
      })
      
      render(<SolarCompanyFinder {...defaultProps} />)
      
      await user.type(screen.getByLabelText('Zip code'), '94102')
      await user.click(screen.getByTestId('search-button'))
      
      await waitFor(() => {
        expect(screen.getByText('+1-555-123-4567')).toBeInTheDocument()
        expect(screen.queryByLabelText(/Call SolarTech Inc/)).toBeInTheDocument()
      })
    })

    it('displays website button when website is available', async () => {
      const user = userEvent.setup()
      const mockCompanies = [
        {
          name: 'SolarTech Inc.',
          address: '456 Solar Ave, San Francisco, CA 94102',
          rating: 5.0,
          reviewCount: 256,
          businessStatus: 'OPERATIONAL',
          placeId: 'ChIJ67890',
          phone: '+1-555-123-4567',
          website: 'https://example.com',
        },
      ]
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ companies: mockCompanies, resultCount: 1, searchedZip: '94102' }),
      })
      
      render(<SolarCompanyFinder {...defaultProps} />)
      
      await user.type(screen.getByLabelText('Zip code'), '94102')
      await user.click(screen.getByTestId('search-button'))
      
      await waitFor(() => {
        expect(screen.getByText('Visit Website')).toBeInTheDocument()
        const websiteButton = screen.getByText('Visit Website')
        expect(websiteButton).toHaveAttribute('href', 'https://example.com')
      })
    })

    it('displays View on Google Maps button', async () => {
      const user = userEvent.setup()
      const mockCompanies = [
        {
          name: 'SolarTech Inc.',
          address: '456 Solar Ave, San Francisco, CA 94102',
          rating: 5.0,
          reviewCount: 256,
          businessStatus: 'OPERATIONAL',
          placeId: 'ChIJ67890',
        },
      ]
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ companies: mockCompanies, resultCount: 1, searchedZip: '94102' }),
      })
      
      render(<SolarCompanyFinder {...defaultProps} />)
      
      await user.type(screen.getByLabelText('Zip code'), '94102')
      await user.click(screen.getByTestId('search-button'))
      
      await waitFor(() => {
        expect(screen.getByText('View on Google Maps')).toBeInTheDocument()
      })
    })
  })

  describe('State Change Reset', () => {
    it('resets state when stateCode prop changes', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ companies: [], resultCount: 0, searchedZip: '90210' }),
      })
      
      const { rerender } = render(<SolarCompanyFinder {...defaultProps} />)
      
      const zipInput = screen.getByLabelText('Zip code')
      const searchButton = screen.getByTestId('search-button')
      
      await user.type(zipInput, '90210')
      await user.click(searchButton)
      
      await waitFor(() => {
        expect(screen.queryByTestId('no-results')).toBeInTheDocument()
      })
      
      // Change stateCode prop
      rerender(<SolarCompanyFinder {...defaultProps} stateCode="NY" stateName="New York" />)
      
      expect(zipInput).toHaveValue('')
      expect(screen.queryByTestId('no-results')).not.toBeInTheDocument()
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper aria-labels', () => {
      render(<SolarCompanyFinder {...defaultProps} />)
      
      expect(screen.getByLabelText('Zip code')).toBeInTheDocument()
    })

    it('sets aria-invalid on zip input when error exists', async () => {
      const user = userEvent.setup()
      render(<SolarCompanyFinder {...defaultProps} />)
      
      const searchButton = screen.getByTestId('search-button')
      await user.click(searchButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument()
      })
      
      expect(screen.getByLabelText('Zip code')).toHaveAttribute('aria-invalid', 'true')
    })

    it('disables search button during loading', async () => {
      const user = userEvent.setup()
      let resolveFetch
      mockFetch.mockImplementationOnce(() => new Promise((resolve) => {
        resolveFetch = resolve
      }))
      
      render(<SolarCompanyFinder {...defaultProps} />)
      
      const zipInput = screen.getByLabelText('Zip code')
      const searchButton = screen.getByTestId('search-button')
      
      await user.type(zipInput, '90210')
      await user.click(searchButton)
      
      expect(searchButton).toBeDisabled()
      expect(searchButton).toHaveAttribute('aria-disabled', 'true')
      
      resolveFetch({ ok: true, json: async () => ({ companies: [], resultCount: 0, searchedZip: '90210' }) })
    })

    it('disables zip input during loading', async () => {
      const user = userEvent.setup()
      let resolveFetch
      mockFetch.mockImplementationOnce(() => new Promise((resolve) => {
        resolveFetch = resolve
      }))
      
      render(<SolarCompanyFinder {...defaultProps} />)
      
      const zipInput = screen.getByLabelText('Zip code')
      const searchButton = screen.getByTestId('search-button')
      
      await user.type(zipInput, '90210')
      await user.click(searchButton)
      
      await waitFor(() => {
        expect(zipInput).toBeDisabled()
      })
      
      resolveFetch({ ok: true, json: async () => ({ companies: [], resultCount: 0, searchedZip: '90210' }) })
    })
  })

  describe('Empty State', () => {
    it('does not show error message initially', () => {
      render(<SolarCompanyFinder {...defaultProps} />)
      
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument()
    })

    it('does not show loading initially', () => {
      render(<SolarCompanyFinder {...defaultProps} />)
      
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument()
    })

    it('does not show results initially', () => {
      render(<SolarCompanyFinder {...defaultProps} />)
      
      expect(screen.queryByTestId('companies-grid')).not.toBeInTheDocument()
      expect(screen.queryByTestId('no-results')).not.toBeInTheDocument()
    })
  })

  describe('Results Info', () => {
    it('displays results count when companies found', async () => {
      const user = userEvent.setup()
      const mockCompanies = [
        { name: 'Company A', address: 'Address A', placeId: 'A' },
        { name: 'Company B', address: 'Address B', placeId: 'B' },
      ]
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ companies: mockCompanies, resultCount: 2, searchedZip: '90210' }),
      })
      
      render(<SolarCompanyFinder {...defaultProps} />)
      
      await user.type(screen.getByLabelText('Zip code'), '90210')
      await user.click(screen.getByTestId('search-button'))
      
      await waitFor(() => {
        expect(screen.getByTestId('results-info')).toHaveTextContent(/Found 2 solar companies/)
      })
    })
  })
})
