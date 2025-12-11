import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import '../styles/StateSelector.css'

/**
 * StateSelector Component
 * 
 * Renders a state selection interface with dropdown or button grid.
 * Handles state change events, loading states, and keyboard navigation.
 * 
 * Requirements: 1.1, 1.5
 */
function StateSelector({ states, onStateSelect, loading = false, disabled = false }) {
  const selectRef = useRef(null)

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectRef.current) return

      // Arrow keys for navigation
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        const options = selectRef.current.options
        let currentIndex = selectRef.current.selectedIndex

        if (e.key === 'ArrowDown') {
          currentIndex = Math.min(currentIndex + 1, options.length - 1)
        } else {
          currentIndex = Math.max(currentIndex - 1, 0)
        }

        selectRef.current.selectedIndex = currentIndex
        if (currentIndex > 0) {
          onStateSelect(options[currentIndex].value)
        }
      }

      // Enter key to select
      if (e.key === 'Enter' && selectRef.current.selectedIndex > 0) {
        e.preventDefault()
        onStateSelect(selectRef.current.value)
      }
    }

    const element = selectRef.current
    if (element) {
      element.addEventListener('keydown', handleKeyDown)
      return () => element.removeEventListener('keydown', handleKeyDown)
    }
  }, [onStateSelect])

  const handleChange = (e) => {
    if (e.target.value) {
      onStateSelect(e.target.value)
    }
  }

  return (
    <div className="state-selector">
      <label htmlFor="state-select">Select your state:</label>
      <select
        ref={selectRef}
        id="state-select"
        onChange={handleChange}
        disabled={loading || disabled}
        aria-label="Select your state"
        aria-busy={loading}
      >
        <option value="">-- Choose a state --</option>
        {states.map(state => (
          <option key={state.code} value={state.code}>
            {state.name}
          </option>
        ))}
      </select>
      {loading && <div className="loading-indicator" aria-live="polite">Loading...</div>}
    </div>
  )
}

StateSelector.propTypes = {
  states: PropTypes.arrayOf(
    PropTypes.shape({
      code: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  onStateSelect: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  disabled: PropTypes.bool
}

export default StateSelector
