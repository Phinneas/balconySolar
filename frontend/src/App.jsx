import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [states, setStates] = useState([])
  const [selectedState, setSelectedState] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [cachedData, setCachedData] = useState({})
  const [lastUpdated, setLastUpdated] = useState({})
  const [retryCount, setRetryCount] = useState(0)
  const [dataIncomplete, setDataIncomplete] = useState(false)

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8787'
  const MAX_RETRIES = 3
  const RETRY_DELAY = 1000 // 1 second

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    fetchStates()
  }, [])

  // Parse URL parameters and auto-load state if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const stateParam = params.get('state')
    
    if (stateParam && states.length > 0) {
      // Validate that the state code exists in our states list
      const stateExists = states.some(s => s.code === stateParam)
      if (stateExists) {
        handleStateSelect(stateParam)
      } else {
        setError(`State code "${stateParam}" not found`)
      }
    }
  }, [states])

  // Validate state data completeness
  const isStateDataComplete = (state) => {
    if (!state) return false
    const requiredFields = ['code', 'name', 'abbreviation', 'isLegal', 'maxWattage', 'keyLaw', 'details', 'resources', 'lastUpdated']
    return requiredFields.every(field => state.hasOwnProperty(field) && state[field] !== undefined && state[field] !== null)
  }

  const fetchWithRetry = async (url, retries = 0) => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      const response = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch`)
      }
      return response
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Request timeout (>5 seconds)')
      }
      
      // Retry logic
      if (retries < MAX_RETRIES && !isOffline) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retries + 1)))
        return fetchWithRetry(url, retries + 1)
      }
      throw err
    }
  }

  const fetchStates = async () => {
    try {
      setLoading(true)
      setError(null)
      setRetryCount(0)

      const response = await fetchWithRetry(`${apiUrl}/api/states`)
      const data = await response.json()
      
      const statesData = data.states || []
      setStates(statesData)
      setCachedData(prev => ({ ...prev, 'all-states': statesData }))
      setLastUpdated(prev => ({ ...prev, 'all-states': new Date().toISOString() }))
    } catch (err) {
      // Try to use cached data
      if (cachedData['all-states']) {
        setStates(cachedData['all-states'])
        const hoursAgo = Math.floor((Date.now() - new Date(lastUpdated['all-states']).getTime()) / (1000 * 60 * 60))
        setError(`Using cached data (last updated ${hoursAgo} hours ago). ${err.message}`)
      } else {
        setError(isOffline ? 'You are offline. No cached data available.' : err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleStateSelect = async (stateCode) => {
    try {
      setLoading(true)
      setError(null)
      setDataIncomplete(false)
      setRetryCount(0)

      const response = await fetchWithRetry(`${apiUrl}/api/states/${stateCode}`)
      const data = await response.json()
      
      if (!data.state) {
        throw new Error('State not found')
      }

      // Check if data is complete
      if (!isStateDataComplete(data.state)) {
        setDataIncomplete(true)
        setError(`Data pending for ${data.state.name}. Some information may be incomplete.`)
      }

      setSelectedState(data.state)
      setCachedData(prev => ({ ...prev, [`state-${stateCode}`]: data.state }))
      setLastUpdated(prev => ({ ...prev, [`state-${stateCode}`]: new Date().toISOString() }))
      
      // Update URL with state parameter
      updateUrlParameter('state', stateCode)
    } catch (err) {
      // Try to use cached data
      const cacheKey = `state-${stateCode}`
      if (cachedData[cacheKey]) {
        setSelectedState(cachedData[cacheKey])
        const hoursAgo = Math.floor((Date.now() - new Date(lastUpdated[cacheKey]).getTime()) / (1000 * 60 * 60))
        setError(`Using cached data (last updated ${hoursAgo} hours ago). ${err.message}`)
      } else {
        setError(isOffline ? 'You are offline. No cached data available.' : err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const updateUrlParameter = (key, value) => {
    const params = new URLSearchParams(window.location.search)
    params.set(key, value)
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`)
  }

  const generateShareableUrl = () => {
    if (!selectedState) return ''
    const params = new URLSearchParams(window.location.search)
    params.set('state', selectedState.code)
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`
  }

  const copyToClipboard = async () => {
    const url = generateShareableUrl()
    try {
      await navigator.clipboard.writeText(url)
      // Show feedback (could be enhanced with a toast notification)
      alert('URL copied to clipboard!')
    } catch (err) {
      setError('Failed to copy URL to clipboard')
    }
  }

  return (
    <div className="app">
      <header>
        <h1>Balcony Solar Legal State Checker</h1>
        <p className="tagline">Find out if balcony solar is legal in your state</p>
        {isOffline && (
          <div className="offline-indicator" data-testid="offline-indicator">
            📡 You are offline - using cached data
          </div>
        )}
      </header>
      
      <main>
        {error && <div className="error" data-testid="error-message">{error}</div>}
        {dataIncomplete && <div className="warning" data-testid="data-pending-message">⚠️ Data pending for this state. Some information may be incomplete.</div>}
        
        <div className="state-selector">
          <label htmlFor="state-select">Select your state:</label>
          <select 
            id="state-select"
            onChange={(e) => handleStateSelect(e.target.value)}
            disabled={loading}
            data-testid="state-select"
          >
            <option value="">-- Choose a state --</option>
            {states.map(state => (
              <option key={state.code} value={state.code}>
                {state.name}
              </option>
            ))}
          </select>
        </div>

        {loading && <div className="loading" data-testid="loading-indicator">Loading...</div>}

        {selectedState && (
          <div className="state-results">
            <h2>{selectedState.name}</h2>
            <div className="legal-status">
              {selectedState.isLegal ? (
                <span className="legal">✅ LEGAL</span>
              ) : (
                <span className="illegal">❌ NOT LEGAL</span>
              )}
            </div>
            <div className="state-info">
              {selectedState.maxWattage && <p><strong>Max Wattage:</strong> {selectedState.maxWattage}W</p>}
              {selectedState.keyLaw && <p><strong>Key Law:</strong> {selectedState.keyLaw}</p>}
              {!selectedState.maxWattage && <p className="missing-data">Wattage information unavailable</p>}
            </div>

            {selectedState.resources && selectedState.resources.length > 0 && (
              <div className="resources-section" data-testid="resources-section">
                <h3>Official Resources</h3>
                <ul className="resources-list">
                  {selectedState.resources.map((resource, index) => (
                    <li key={index}>
                      <a 
                        href={resource.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        data-testid={`resource-link-${index}`}
                      >
                        {resource.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="share-section">
              <button 
                onClick={copyToClipboard}
                data-testid="copy-url-button"
                className="share-button"
              >
                📋 Copy Shareable Link
              </button>
            </div>

            <div className="newsletter-cta" data-testid="newsletter-cta">
              <h3>Stay Updated on Solar Regulations</h3>
              <p>Get the latest balcony solar news and regulatory updates delivered to your inbox.</p>
              <a 
                href="https://www.solarcurrents.com/newsletter" 
                target="_blank" 
                rel="noopener noreferrer"
                className="newsletter-button"
                data-testid="newsletter-link"
              >
                Subscribe to SolarCurrents Newsletter
              </a>
            </div>

            <div className="related-content" data-testid="related-content">
              <h3>Related SolarCurrents Content</h3>
              <ul className="related-links">
                <li>
                  <a 
                    href="https://www.solarcurrents.com/balcony-solar-guide" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    data-testid="related-guide-link"
                  >
                    Complete Balcony Solar Installation Guide
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.solarcurrents.com/solar-comparison" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    data-testid="related-comparison-link"
                  >
                    Solar System Comparison Tool
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.solarcurrents.com/solar-companies" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    data-testid="related-companies-link"
                  >
                    Find Solar Companies Near You
                  </a>
                </li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
