on# Implementation Plan: Balcony Solar Legal State Checker

## Phase 1: Backend Infrastructure & Data Layer

- [x] 1. Set up Teable database structure
  - Create Teable workspace and base (self-hosted or cloud)
  - Create States table with fields: code, name, abbreviation, isLegal, maxWattage, keyLaw, lastUpdated, dataSource
  - Create Details table with fields: stateCode (link), category, required, description, sourceUrl
  - Create Resources table with fields: stateCode (link), title, url, resourceType
  - Create UpdateLog table with fields: timestamp, stateCode, changeType, oldValue, newValue, source
  - Configure table relationships and field types
  - _Requirements: 7.1, 7.2_

- [x] 2. Populate initial state data in Teable
  - Research and enter data for all 50 states + DC (51 total)
  - For each state: isLegal status, maxWattage, keyLaw, interconnection requirements, permit requirements, utility approval requirements, connection type, special notes
  - Add at least 2 official resource links per state
  - Verify data accuracy against official state sources
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.3_

- [x] 2.1 Write property test for state data completeness
  - **Property 1: State Data Completeness**
  - **Validates: Requirements 7.1**

- [x] 3. Set up REST API (Cloudflare Workers or Node.js)
  - Create GET /api/states endpoint that returns all states with basic info (fetches from Teable)
  - Create GET /api/states/:code endpoint that returns full state data with details and resources (fetches from Teable)
  - Create GET /api/health endpoint for monitoring
  - Implement error handling for invalid state codes
  - _Requirements: 5.3, 7.1_

- [x] 4. Implement API caching layer
  - Set up 24-hour cache for API responses (Redis or in-memory)
  - Implement cache invalidation mechanism (triggered by n8n on Teable updates)
  - Add cache headers to API responses
  - Test cache behavior with multiple requests
  - _Requirements: 5.4, 5.2_

- [x] 4.1 Write property test for API response time
  - **Property 6: API Response Time**
  - **Validates: Requirements 1.4**

- [x] 4.2 Write property test for data freshness
  - **Property 7: Data Freshness**
  - **Validates: Requirements 5.1, 5.2**

- [x] 4.3 Write property test for cache invalidation
  - **Property 8: Cache Invalidation**
  - **Validates: Requirements 5.2, 5.4**

- [x] 5. Implement API error handling
  - Handle Teable API unavailability with cached data fallback
  - Implement timeout handling (>5 seconds)
  - Return user-friendly error messages for invalid requests
  - Log all errors for debugging
  - _Requirements: 5.5, 7.4_

- [x] 5.1 Write unit tests for API error handling
  - Test Teable unavailability fallback
  - Test timeout handling
  - Test invalid state code responses
  - _Requirements: 5.5, 7.4_

- [x] 6. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 2: Frontend Development

- [x] 7. Set up React project on Cloudflare Pages
  - Create new React project with Vite
  - Configure Cloudflare Pages deployment
  - Set up environment variables for API endpoint
  - Configure build and deployment pipeline
  - _Requirements: 1.5_

- [x] 8. Build StateSelector component
  - Create dropdown or button grid for state selection
  - Implement state change event handling
  - Add loading state during API calls
  - Implement keyboard navigation for accessibility
  - _Requirements: 1.1, 1.5_

- [x] 8.1 Write unit tests for StateSelector
  - Test state selection functionality
  - Test loading state display
  - Test keyboard navigation
  - _Requirements: 1.1_

- [x] 9. Build StateResults component
  - Display legal status with visual indicator (✅/❌)
  - Display max wattage and key law
  - Render details sections (interconnection, permit, outlet, special notes)
  - Display resource links with target="_blank"
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2_

- [x] 9.1 Write unit tests for StateResults
  - Test legal status display
  - Test wattage and law display
  - Test details rendering
  - Test resource link rendering
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2_

- [x] 9.2 Write property test for legal status consistency
  - **Property 3: Legal Status Consistency**
  - **Validates: Requirements 1.1, 2.1**

- [x] 9.3 Write property test for resource link validity
  - **Property 4: Resource Link Validity**
  - **Validates: Requirements 3.1, 3.3**

- [x] 10. Build DetailAccordion component
  - Create expandable sections for each detail category
  - Implement smooth expand/collapse animations
  - Add keyboard navigation (arrow keys, Enter)
  - Display "required" status and description for each item
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 10.1 Write unit tests for DetailAccordion
  - Test expand/collapse functionality
  - Test keyboard navigation
  - Test content rendering
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 11. Implement URL parameter handling
  - Parse state parameter from URL query string
  - Auto-load state results when URL contains state parameter
  - Generate shareable URLs with state parameter
  - Implement copy-to-clipboard functionality
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 11.1 Write property test for URL parameter round trip
  - **Property 5: URL Parameter Round Trip**
  - **Validates: Requirements 4.1, 4.2, 4.3**

- [x] 11.2 Write unit tests for URL parameter handling
  - Test URL parsing for valid state codes
  - Test URL parsing for invalid state codes
  - Test shareable URL generation
  - Test copy-to-clipboard functionality
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 12. Implement responsive design
  - Create mobile-first CSS with breakpoints (320px, 768px, 1024px, 2560px)
  - Ensure text is readable (minimum 14px font size)
  - Ensure touch targets are at least 44px in size
  - Test on multiple device sizes
  - _Requirements: 1.5_

- [x] 12.1 Write property test for mobile responsiveness
  - **Property 9: Mobile Responsiveness**
  - **Validates: Requirements 1.5**

- [x] 12.2 Write unit tests for responsive layout
  - Test layout at different viewport sizes
  - Test touch target sizes
  - Test text readability
  - _Requirements: 1.5_

- [x] 13. Implement print-friendly styling
  - Create print media queries
  - Hide unnecessary UI elements (buttons, navigation)
  - Optimize colors and spacing for printing
  - Test print preview in browser
  - _Requirements: 4.4_

- [x] 13.1 Write unit tests for print styling
  - Test print media query application
  - Test element visibility in print mode
  - _Requirements: 4.4_

- [x] 14. Implement iframe embedding support
  - Ensure component works when embedded in iframe
  - Handle cross-origin communication if needed
  - Test embedding on external websites
  - Document embedding instructions
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 14.1 Write property test for iframe isolation
  - **Property 10: Iframe Embedding Isolation**
  - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 14.2 Write unit tests for iframe embedding
  - Test component rendering in iframe
  - Test functionality within iframe
  - Test no external dependencies required
  - _Requirements: 6.1, 6.2, 6.3_

- [x] 15. Implement error handling and fallbacks
  - Display "Data pending" message for incomplete state data
  - Handle API failures with cached data or error message
  - Display offline indicator when user is offline
  - Implement retry logic for failed API calls
  - _Requirements: 5.5, 7.4_

- [x] 15.1 Write unit tests for error handling
  - Test incomplete data handling
  - Test API failure fallback
  - Test offline detection
  - Test retry logic
  - _Requirements: 5.5, 7.4_

- [x] 16. Checkpoint - Ensure all frontend tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Integration & Automation

- [x] 17. Create Cloudflare Worker for data scraping and updates
  - Set up new Cloudflare Worker project
  - Implement web scraping for state utility commission websites (using cheerio or similar)
  - Parse HTML/PDF for balcony solar regulations
  - Extract: isLegal, maxWattage, keyLaw, requirements
  - Implement Teable API client for reading/writing data
  - _Requirements: 5.1_

- [x] 18. Implement Teable update logic in Worker
  - Compare scraped data with existing Teable records
  - Update Teable database when changes are detected
  - Log all changes to UpdateLog table with timestamps
  - Send admin notification for critical changes (email or webhook)
  - _Requirements: 5.1, 7.3_

- [x] 18.1 Write property test for audit logging
  - **Property 7: Data Freshness** (verify lastUpdated is recent)
  - **Validates: Requirements 5.1, 7.3**

- [x] 19. Set up cron trigger for Worker
  - Configure cron expression (Monday 2 AM UTC: `0 2 * * 1`)
  - Test cron execution and logging
  - Implement error handling for failed runs
  - Set up monitoring/alerting for cron failures
  - _Requirements: 5.1, 5.2_

- [x] 20. Implement cache invalidation endpoint in Worker
  - Create internal endpoint for cache invalidation (e.g., /api/cache-invalidate)
  - Secure endpoint with authentication token
  - Trigger cache invalidation when Teable is updated
  - Verify API returns updated data within 1 minute
  - _Requirements: 5.2_

- [x] 21. Set up monitoring and alerting
  - Monitor API endpoint uptime
  - Alert on cron Worker failures
  - Track API response times
  - Monitor cache hit rates
  - Set up Cloudflare Analytics for Worker performance
  - _Requirements: 5.1, 5.2_

- [x] 22. Integrate checker with SolarCurrents
  - Add prominent link/CTA to checker on SolarCurrents homepage
  - Create dedicated landing page for checker
  - Add internal links to related SolarCurrents content
  - Add newsletter subscription CTA after state lookup
  - _Requirements: 8.1, 8.3, 8.4_

- [x] 22.1 Write unit tests for SolarCurrents integration
  - Test link presence on homepage
  - Test landing page rendering
  - Test internal link functionality
  - Test CTA display
  - _Requirements: 8.1, 8.3, 8.4_

- [x] 23. Create documentation
  - Write API documentation with endpoint examples
  - Document Airtable base structure and field definitions
  - Create n8n workflow setup guide
  - Write embedding instructions for solar companies
  - Create maintenance guide for updating state data
  - _Requirements: 7.1, 7.2_

- [x] 24. Checkpoint - Ensure all integration tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Testing & Validation

- [x] 25. Write comprehensive property-based tests
  - **Property 1: State Data Completeness** - Verify all required fields present
  - **Property 2: Wattage Limit Validity** - Verify wattage is 300-2000W
  - **Property 3: Legal Status Consistency** - Verify legal status matches details
  - **Property 4: Resource Link Validity** - Verify URLs are valid HTTP/HTTPS
  - **Property 5: URL Parameter Round Trip** - Verify URL parameter handling
  - **Property 6: API Response Time** - Verify response < 500ms
  - **Property 7: Data Freshness** - Verify lastUpdated is recent
  - **Property 8: Cache Invalidation** - Verify cache updates within 1 minute
  - **Property 9: Mobile Responsiveness** - Verify layout at all viewport sizes
  - **Property 10: Iframe Embedding Isolation** - Verify iframe independence
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.4, 6.1, 6.2, 6.3, 7.1_

- [x] 26. Write comprehensive unit tests
  - Test all components (StateSelector, StateResults, DetailAccordion)
  - Test API client and error handling
  - Test URL parameter parsing and generation
  - Test responsive layout at multiple breakpoints
  - Test print styling
  - Test iframe embedding
  - Test error handling and fallbacks
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 5.5, 6.1, 6.2, 6.3, 7.4_

- [x] 27. Perform end-to-end testing
  - Test complete user flow: select state → view results → share URL → print
  - Test on multiple browsers (Chrome, Firefox, Safari, Edge)
  - Test on multiple devices (desktop, tablet, mobile)
  - Test embedding on external websites
  - Test API with various network conditions
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 6.1, 6.2, 6.3_

- [x] 28. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Deployment & Launch

- [x] 29. Deploy frontend to Cloudflare Pages
  - Build production bundle
  - Deploy to Cloudflare Pages
  - Verify deployment and test all functionality
  - Set up custom domain (checker.solarcurrents.com or /checker)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 30. Deploy backend API Worker
  - Deploy API Worker to Cloudflare
  - Configure environment variables (Teable API key, cache settings)
  - Test API endpoints in production
  - Verify caching is working
  - _Requirements: 5.3, 5.4_

- [x] 31. Deploy cron Worker
  - Deploy cron Worker to Cloudflare
  - Configure environment variables (Teable API key, admin email)
  - Test cron execution manually
  - Verify data updates in Teable
  - Set up monitoring and alerting
  - _Requirements: 5.1, 5.2, 7.3_

- [x] 32. Launch on SolarCurrents
  - Publish landing page
  - Add links and CTAs to homepage
  - Verify all internal links work
  - Test newsletter subscription CTA
  - _Requirements: 8.1, 8.3, 8.4_

- [x] 33. Create launch content
  - Write blog post about balcony solar checker
  - Create social media posts
  - Prepare email announcement for newsletter
  - Optimize for SEO (keywords, meta tags, internal links)
  - _Requirements: 8.2_

- [x] 34. Monitor and iterate
  - Track usage metrics and user engagement
  - Monitor API performance and uptime
  - Collect user feedback
  - Plan improvements based on data
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
