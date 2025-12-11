import PropTypes from 'prop-types'
import '../styles/StateResults.css'

/**
 * StateResults Component
 * 
 * Displays comprehensive state regulation information including:
 * - Legal status with visual indicator (✅/❌)
 * - Max wattage and key law
 * - Expandable details sections (interconnection, permit, outlet, special notes)
 * - Resource links with target="_blank"
 * 
 * Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2
 */
function StateResults({ state }) {
  if (!state) {
    return null
  }

  const {
    name,
    abbreviation,
    isLegal,
    maxWattage,
    keyLaw,
    details = {},
    resources = [],
    lastUpdated
  } = state

  // Detail categories in display order
  const detailCategories = [
    { key: 'interconnection', label: 'Interconnection Requirements' },
    { key: 'permit', label: 'Permit Requirements' },
    { key: 'outlet', label: 'Connection Type' },
    { key: 'special_notes', label: 'Special Notes' }
  ]

  return (
    <div className="state-results" data-testid="state-results">
      <div className="results-header">
        <h2>{name} ({abbreviation})</h2>
        <div className="legal-status" data-testid="legal-status">
          {isLegal ? (
            <span className="legal" data-testid="legal-indicator">✅ LEGAL</span>
          ) : (
            <span className="illegal" data-testid="illegal-indicator">❌ NOT LEGAL</span>
          )}
        </div>
      </div>

      <div className="state-info">
        <div className="info-item">
          <label>Max Wattage:</label>
          <span data-testid="max-wattage">{maxWattage}W</span>
        </div>
        <div className="info-item">
          <label>Key Law:</label>
          <span data-testid="key-law">{keyLaw}</span>
        </div>
        {lastUpdated && (
          <div className="info-item">
            <label>Last Updated:</label>
            <span data-testid="last-updated">{lastUpdated}</span>
          </div>
        )}
      </div>

      <div className="details-section">
        <h3>Regulatory Details</h3>
        <div className="details-grid">
          {detailCategories.map(({ key, label }) => {
            const detail = details[key]
            if (!detail) return null

            return (
              <div key={key} className="detail-item" data-testid={`detail-${key}`}>
                <div className="detail-header">
                  <h4>{label}</h4>
                  <span className={`required-badge ${detail.required ? 'required' : 'not-required'}`}>
                    {detail.required ? 'Required' : 'Not Required'}
                  </span>
                </div>
                <p className="detail-description">{detail.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {resources && resources.length > 0 && (
        <div className="resources-section">
          <h3>Official Resources</h3>
          <ul className="resources-list" data-testid="resources-list">
            {resources.map((resource, index) => (
              <li key={index} data-testid={`resource-${index}`}>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`resource-link-${index}`}
                >
                  {resource.title}
                </a>
                {resource.resourceType && (
                  <span className="resource-type">({resource.resourceType})</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

StateResults.propTypes = {
  state: PropTypes.shape({
    code: PropTypes.string,
    name: PropTypes.string.isRequired,
    abbreviation: PropTypes.string.isRequired,
    isLegal: PropTypes.bool.isRequired,
    maxWattage: PropTypes.number.isRequired,
    keyLaw: PropTypes.string.isRequired,
    lastUpdated: PropTypes.string,
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
    }),
    resources: PropTypes.arrayOf(
      PropTypes.shape({
        title: PropTypes.string.isRequired,
        url: PropTypes.string.isRequired,
        resourceType: PropTypes.string
      })
    )
  })
}

export default StateResults
