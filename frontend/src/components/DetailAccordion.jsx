import { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'
import '../styles/DetailAccordion.css'

/**
 * DetailAccordion Component
 * 
 * Renders expandable sections for regulatory detail categories.
 * Supports smooth expand/collapse animations and keyboard navigation.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
function DetailAccordion({ details = {} }) {
  const [expandedItems, setExpandedItems] = useState({})
  const contentRefs = useRef({})

  // Detail categories in display order
  const detailCategories = [
    { key: 'interconnection', label: 'Interconnection Requirements' },
    { key: 'permit', label: 'Permit Requirements' },
    { key: 'outlet', label: 'Connection Type' },
    { key: 'special_notes', label: 'Special Notes' }
  ]

  // Get available details
  const availableDetails = detailCategories.filter(({ key }) => details[key])

  // Initialize expanded items state
  useEffect(() => {
    const initialState = {}
    availableDetails.forEach(({ key }) => {
      initialState[key] = false
    })
    setExpandedItems(initialState)
  }, [availableDetails.length])

  // Toggle expand/collapse for an item
  const toggleItem = (key) => {
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  // Handle keyboard navigation
  const handleKeyDown = (e, key) => {
    const keys = availableDetails.map(d => d.key)
    const currentIndex = keys.indexOf(key)

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        toggleItem(key)
        break
      case 'ArrowDown':
        e.preventDefault()
        if (currentIndex < keys.length - 1) {
          const nextKey = keys[currentIndex + 1]
          document.querySelector(`[data-accordion-key="${nextKey}"]`)?.focus()
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (currentIndex > 0) {
          const prevKey = keys[currentIndex - 1]
          document.querySelector(`[data-accordion-key="${prevKey}"]`)?.focus()
        }
        break
      case 'Home':
        e.preventDefault()
        document.querySelector(`[data-accordion-key="${keys[0]}"]`)?.focus()
        break
      case 'End':
        e.preventDefault()
        document.querySelector(`[data-accordion-key="${keys[keys.length - 1]}"]`)?.focus()
        break
      default:
        break
    }
  }

  // Update content height for smooth animation
  useEffect(() => {
    Object.entries(contentRefs.current).forEach(([key, element]) => {
      if (element) {
        if (expandedItems[key]) {
          // Use requestAnimationFrame to ensure the DOM is ready
          requestAnimationFrame(() => {
            element.style.maxHeight = `${element.scrollHeight}px`
          })
        } else {
          element.style.maxHeight = '0px'
        }
      }
    })
  }, [expandedItems])

  if (availableDetails.length === 0) {
    return null
  }

  return (
    <div className="detail-accordion" data-testid="detail-accordion">
      {availableDetails.map(({ key, label }) => {
        const detail = details[key]
        const isExpanded = expandedItems[key]

        return (
          <div
            key={key}
            className="accordion-item"
            data-testid={`accordion-item-${key}`}
          >
            <button
              className={`accordion-header ${isExpanded ? 'expanded' : ''}`}
              onClick={() => toggleItem(key)}
              onKeyDown={(e) => handleKeyDown(e, key)}
              aria-expanded={isExpanded}
              aria-controls={`accordion-content-${key}`}
              data-accordion-key={key}
              data-testid={`accordion-header-${key}`}
            >
              <span className="accordion-title">{label}</span>
              <span className={`required-badge ${detail.required ? 'required' : 'not-required'}`}>
                {detail.required ? 'Required' : 'Not Required'}
              </span>
              <span className="accordion-icon" aria-hidden="true">
                {isExpanded ? '▼' : '▶'}
              </span>
            </button>
            <div
              id={`accordion-content-${key}`}
              className="accordion-content"
              ref={(el) => {
                if (el) {
                  contentRefs.current[key] = el
                  // Initialize max-height
                  if (!el.style.maxHeight) {
                    el.style.maxHeight = '0px'
                  }
                }
              }}
              data-testid={`accordion-content-${key}`}
              role="region"
              aria-labelledby={`accordion-header-${key}`}
            >
              <div className="accordion-body">
                <p className="detail-description">{detail.description}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

DetailAccordion.propTypes = {
  details: PropTypes.shape({
    interconnection: PropTypes.shape({
      required: PropTypes.bool,
      description: PropTypes.string
    }),
    permit: PropTypes.shape({
      required: PropTypes.bool,
      description: PropTypes.string
    }),
    outlet: PropTypes.shape({
      required: PropTypes.bool,
      description: PropTypes.string
    }),
    special_notes: PropTypes.shape({
      required: PropTypes.bool,
      description: PropTypes.string
    })
  })
}

export default DetailAccordion
