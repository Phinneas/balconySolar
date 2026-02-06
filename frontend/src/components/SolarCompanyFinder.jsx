import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import '../styles/SolarCompanyFinder.css';

/**
 * SolarCompanyFinder Component
 * 
 * Allows users to find solar installation companies near their location
 * using Google Places API via backend proxy.
 * 
 * Props:
 * - stateCode: 2-letter state abbreviation (e.g., 'CA')
 * - stateName: Full state name (e.g., 'California')
 * - apiUrl: Base URL for API requests
 */
function SolarCompanyFinder({ stateCode, stateName, apiUrl }) {
  const [zipCode, setZipCode] = useState('');
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Reset state when stateCode changes
  useEffect(() => {
    setZipCode('');
    setCompanies([]);
    setHasSearched(false);
    setError(null);
  }, [stateCode]);

  const validateZipCode = (zip) => {
    return /^\d{5}$/.test(zip);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client-side validation
    if (!zipCode.trim()) {
      setError('Please enter a zip code');
      return;
    }

    if (!validateZipCode(zipCode)) {
      setError('Invalid zip code. Please enter a 5-digit US zip code.');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(
        `${apiUrl}/api/solar-companies?zip=${zipCode}&state=${stateCode}`,
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        
        if (response.status === 400) {
          throw new Error(errorData.error || 'Invalid request');
        } else if (response.status === 429) {
          throw new Error('Daily search limit reached. Please try again tomorrow.');
        } else if (response.status === 502 || response.status === 504) {
          throw new Error('Service temporarily unavailable. Please try again.');
        } else {
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }
      }

      const data = await response.json();
      setCompanies(data.companies || []);
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Request timeout. Please check your connection and try again.');
      } else {
        setError(err.message || 'Failed to fetch solar companies');
      }
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleZipChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5); // Only digits, max 5
    setZipCode(value);
    if (hasSearched && error) {
      setError(null);
    }
  };

  const renderStars = (rating) => {
    if (!rating) return null;

    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - Math.ceil(rating);

    return (
      <div className="stars" aria-label={`Rating: ${rating} out of 5 stars`}>
        {[...Array(fullStars)].map((_, i) => (
          <span key={`full-${i}`} className="star-filled">★</span>
        ))}
        {hasHalfStar && <span className="star-half">★</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={`empty-${i}`} className="star-empty">★</span>
        ))}
      </div>
    );
  };

  return (
    <div className="solar-company-finder" data-testid="solar-company-finder">
      <h3>Find Solar Companies Near You</h3>
      <p className="subtitle">Get quotes from local solar installers in {stateName}</p>

      <form onSubmit={handleSubmit} className="search-form">
        <label htmlFor="zip-input" className="zip-label">Enter your zip code:</label>
        <div className="zip-input-group">
          <input
            id="zip-input"
            type="text"
            value={zipCode}
            onChange={handleZipChange}
            placeholder="12345"
            inputMode="numeric"
            pattern="\d{5}"
            maxLength={5}
            disabled={loading}
            aria-label="Zip code"
            aria-invalid={!!error}
            data-testid="zip-input"
          />
          <button
            type="submit"
            disabled={loading}
            className="search-button"
            aria-disabled={loading}
            data-testid="search-button"
          >
            {loading ? 'Searching...' : 'Find Companies'}
          </button>
        </div>
      </form>

      {error && (
        <div className="error-message" role="alert" data-testid="error-message">
          {error}
        </div>
      )}

      {!loading && hasSearched && companies.length > 0 && (
        <div className="results-info" data-testid="results-info">
          Found {companies.length} solar {companies.length === 1 ? 'company' : 'companies'} near zip code {zipCode}
        </div>
      )}

      {loading && (
        <div className="loading" data-testid="loading">
          <div className="spinner"></div>
          <p>Searching for solar companies...</p>
        </div>
      )}

      {companies.length > 0 && (
        <div className="companies-grid" data-testid="companies-grid">
          {companies.map((company, index) => (
            <div key={company.placeId || index} className="company-card" data-testid={`company-card-${index}`}>
              <h4 className="company-name">{company.name}</h4>
              
              {company.rating && (
                <div className="rating-section">
                  {renderStars(company.rating)}
                  {company.reviewCount > 0 && (
                    <span className="review-count">
                      ({company.reviewCount} {company.reviewCount === 1 ? 'review' : 'reviews'})
                    </span>
                  )}
                </div>
              )}

              <div className="company-address">
                <svg className="address-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <span>{company.address}</span>
              </div>

              {company.businessStatus === 'OPERATIONAL' && (
                <div className="business-status operational">Open for business</div>
              )}

              <div className="company-actions">
                {company.phone && (
                  <a
                    href={`tel:${company.phone.replace(/[^0-9]/g, '')}`}
                    className="action-button phone-button"
                    aria-label={`Call ${company.name}`}
                    data-testid={`phone-button-${index}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                    {company.phone}
                  </a>
                )}

                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="action-button website-button"
                    aria-label={`Visit ${company.name} website`}
                    data-testid={`website-button-${index}`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                    Visit Website
                  </a>
                )}

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(company.name + ' ' + company.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="action-button maps-button"
                  aria-label={`View ${company.name} on Google Maps`}
                  data-testid={`maps-button-${index}`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                  </svg>
                  View on Google Maps
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && hasSearched && companies.length === 0 && !error && (
        <div className="no-results" data-testid="no-results">
          <p>No solar companies found in or near zip code {zipCode}.</p>
          <p>Try entering a nearby zip code or contact your local utility company for recommendations.</p>
        </div>
      )}
    </div>
  );
}

SolarCompanyFinder.propTypes = {
  stateCode: PropTypes.string.isRequired,
  stateName: PropTypes.string.isRequired,
  apiUrl: PropTypes.string.isRequired,
};

export default SolarCompanyFinder;
