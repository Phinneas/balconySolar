import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import fc from 'fast-check'
import StateResults from './StateResults'

/**
 * Feature: balcony-solar-checker, Property 3: Legal Status Consistency
 * Validates: Requirements 1.1, 2.1
 * 
 * Property: For any state, if isLegal is true, then at least one detail category 
 * SHALL have required=false (indicating the system is permitted). If isLegal is false, 
 * then all detail categories SHALL have required=true or the description SHALL indicate prohibition.
 */
describe('StateResults - Property 3: Legal Status Consistency', () => {
  // Arbitraries for generating test data
  const detailArbitrary = () =>
    fc.record({
      required: fc.boolean(),
      description: fc.string({ minLength: 1, maxLength: 200 })
    })

  const detailsArbitrary = () =>
    fc.record({
      interconnection: detailArbitrary(),
      permit: detailArbitrary(),
      outlet: detailArbitrary(),
      special_notes: detailArbitrary()
    })

  const legalStateArbitrary = () =>
    fc.record({
      name: fc.string({ minLength: 1, maxLength: 50 }),
      abbreviation: fc.string({ minLength: 2, maxLength: 2 }),
      isLegal: fc.constant(true),
      maxWattage: fc.integer({ min: 300, max: 2000 }),
      keyLaw: fc.string({ minLength: 1, maxLength: 100 }),
      details: detailsArbitrary()
    }).filter(state => {
      // For legal states, at least one detail must have required=false
      const details = Object.values(state.details)
      return details.some(detail => detail.required === false)
    })

  const illegalStateArbitrary = () =>
    fc.record({
      name: fc.string({ minLength: 1, maxLength: 50 }),
      abbreviation: fc.string({ minLength: 2, maxLength: 2 }),
      isLegal: fc.constant(false),
      maxWattage: fc.constant(0),
      keyLaw: fc.string({ minLength: 1, maxLength: 100 }),
      details: detailsArbitrary().map(details => ({
        interconnection: { ...details.interconnection, required: true },
        permit: { ...details.permit, required: true },
        outlet: { ...details.outlet, required: true },
        special_notes: { ...details.special_notes, required: true }
      }))
    })

  it('legal states have at least one non-required detail', () => {
    fc.assert(
      fc.property(legalStateArbitrary(), (state) => {
        render(<StateResults state={state} />)
        
        // Check that at least one detail has "Not Required" badge
        const notRequiredBadges = screen.queryAllByText('Not Required')
        expect(notRequiredBadges.length).toBeGreaterThan(0)
      }),
      { numRuns: 100 }
    )
  })

  it('illegal states have all details marked as required', () => {
    fc.assert(
      fc.property(illegalStateArbitrary(), (state) => {
        const { unmount } = render(<StateResults state={state} />)
        
        // Check that all details have "Required" badge
        const requiredBadges = screen.queryAllByText('Required')
        expect(requiredBadges.length).toBe(4) // 4 detail categories
        
        unmount()
      }),
      { numRuns: 100 }
    )
  })

  it('legal status indicator matches isLegal property', () => {
    fc.assert(
      fc.property(legalStateArbitrary(), (state) => {
        const { unmount } = render(<StateResults state={state} />)
        
        if (state.isLegal) {
          expect(screen.getByTestId('legal-indicator')).toBeInTheDocument()
          expect(screen.queryByTestId('illegal-indicator')).not.toBeInTheDocument()
        } else {
          expect(screen.getByTestId('illegal-indicator')).toBeInTheDocument()
          expect(screen.queryByTestId('legal-indicator')).not.toBeInTheDocument()
        }
        
        unmount()
      }),
      { numRuns: 100 }
    )
  })
})

/**
 * Feature: balcony-solar-checker, Property 4: Resource Link Validity
 * Validates: Requirements 3.1, 3.3
 * 
 * Property: For any state with resources, all resource URLs SHALL be valid HTTP/HTTPS URLs 
 * and SHALL not be empty strings.
 */
describe('StateResults - Property 4: Resource Link Validity', () => {
  // Arbitrary for generating valid HTTP/HTTPS URLs
  const validUrlArbitrary = () =>
    fc.tuple(
      fc.constantFrom('http', 'https'),
      fc.domain(),
      fc.webPath()
    ).map(([protocol, domain, path]) => `${protocol}://${domain}${path}`)

  const resourceArbitrary = () =>
    fc.record({
      title: fc.string({ minLength: 1, maxLength: 100 }),
      url: validUrlArbitrary(),
      resourceType: fc.constantFrom('official', 'guide', 'tool')
    })

  const stateWithResourcesArbitrary = () =>
    fc.record({
      name: fc.string({ minLength: 1, maxLength: 50 }),
      abbreviation: fc.string({ minLength: 2, maxLength: 2 }),
      isLegal: fc.boolean(),
      maxWattage: fc.integer({ min: 0, max: 2000 }),
      keyLaw: fc.string({ minLength: 1, maxLength: 100 }),
      details: fc.record({
        interconnection: fc.record({ required: fc.boolean(), description: fc.string() }),
        permit: fc.record({ required: fc.boolean(), description: fc.string() }),
        outlet: fc.record({ required: fc.boolean(), description: fc.string() }),
        special_notes: fc.record({ required: fc.boolean(), description: fc.string() })
      }),
      resources: fc.array(resourceArbitrary(), { minLength: 1, maxLength: 5 })
    })

  it('all resource URLs are valid HTTP/HTTPS URLs', () => {
    fc.assert(
      fc.property(stateWithResourcesArbitrary(), (state) => {
        const { unmount } = render(<StateResults state={state} />)
        
        // Check that all links have valid href attributes
        const links = screen.getAllByRole('link')
        links.forEach(link => {
          const href = link.getAttribute('href')
          expect(href).toBeTruthy()
          expect(href).toMatch(/^https?:\/\//)
        })
        
        unmount()
      }),
      { numRuns: 100 }
    )
  })

  it('all resource links have target="_blank"', () => {
    fc.assert(
      fc.property(stateWithResourcesArbitrary(), (state) => {
        const { unmount } = render(<StateResults state={state} />)
        
        const links = screen.getAllByRole('link')
        links.forEach(link => {
          expect(link).toHaveAttribute('target', '_blank')
        })
        
        unmount()
      }),
      { numRuns: 100 }
    )
  })

  it('all resource links have rel="noopener noreferrer"', () => {
    fc.assert(
      fc.property(stateWithResourcesArbitrary(), (state) => {
        const { unmount } = render(<StateResults state={state} />)
        
        const links = screen.getAllByRole('link')
        links.forEach(link => {
          expect(link).toHaveAttribute('rel', 'noopener noreferrer')
        })
        
        unmount()
      }),
      { numRuns: 100 }
    )
  })

  it('resource count matches input resources array length', () => {
    fc.assert(
      fc.property(stateWithResourcesArbitrary(), (state) => {
        const { unmount } = render(<StateResults state={state} />)
        
        const links = screen.getAllByRole('link')
        expect(links.length).toBe(state.resources.length)
        
        unmount()
      }),
      { numRuns: 100 }
    )
  })
})
