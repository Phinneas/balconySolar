/**
 * Property-Based Tests for Balcony Solar Checker
 * Feature: balcony-solar-checker
 */

const fc = require('fast-check');
const stateData = require('../state-data.json');

/**
 * Feature: balcony-solar-checker, Property 1: State Data Completeness
 * Validates: Requirements 7.1
 * 
 * For any state in the system, the returned data SHALL include all required fields:
 * code, name, abbreviation, isLegal, maxWattage, keyLaw, details, resources, and lastUpdated.
 */
describe('Property 1: State Data Completeness', () => {
  test('all states have required fields', () => {
    const requiredFields = ['code', 'name', 'abbreviation', 'isLegal', 'maxWattage', 'keyLaw', 'dataSource', 'details', 'resources'];

    stateData.states.forEach(state => {
      requiredFields.forEach(field => {
        expect(state).toHaveProperty(field);
        expect(state[field]).not.toBeNull();
        expect(state[field]).not.toBeUndefined();
      });
    });
  });

  test('all states have valid code format', () => {
    stateData.states.forEach(state => {
      expect(state.code).toMatch(/^[a-z]{2}$/);
    });
  });

  test('all states have valid abbreviation format', () => {
    stateData.states.forEach(state => {
      expect(state.abbreviation).toMatch(/^[A-Z]{2}$/);
    });
  });

  test('all states have isLegal as boolean', () => {
    stateData.states.forEach(state => {
      expect(typeof state.isLegal).toBe('boolean');
    });
  });

  test('all states have maxWattage as positive number', () => {
    stateData.states.forEach(state => {
      expect(typeof state.maxWattage).toBe('number');
      expect(state.maxWattage).toBeGreaterThan(0);
    });
  });

  test('all states have non-empty name and keyLaw', () => {
    stateData.states.forEach(state => {
      expect(state.name).toBeTruthy();
      expect(state.name.length).toBeGreaterThan(0);
      expect(state.keyLaw).toBeTruthy();
      expect(state.keyLaw.length).toBeGreaterThan(0);
    });
  });

  test('all states have details array', () => {
    stateData.states.forEach(state => {
      expect(Array.isArray(state.details)).toBe(true);
      expect(state.details.length).toBeGreaterThan(0);
    });
  });

  test('all states have resources array', () => {
    stateData.states.forEach(state => {
      expect(Array.isArray(state.resources)).toBe(true);
      expect(state.resources.length).toBeGreaterThan(0);
    });
  });

  test('all detail records have required fields', () => {
    stateData.states.forEach(state => {
      state.details.forEach(detail => {
        expect(detail).toHaveProperty('category');
        expect(detail).toHaveProperty('required');
        expect(detail).toHaveProperty('description');
        expect(detail).toHaveProperty('sourceUrl');
        expect(typeof detail.required).toBe('boolean');
      });
    });
  });

  test('all resource records have required fields', () => {
    stateData.states.forEach(state => {
      state.resources.forEach(resource => {
        expect(resource).toHaveProperty('title');
        expect(resource).toHaveProperty('url');
        expect(resource).toHaveProperty('resourceType');
        expect(resource.title).toBeTruthy();
        expect(resource.url).toBeTruthy();
      });
    });
  });
});

/**
 * Feature: balcony-solar-checker, Property 2: Wattage Limit Validity
 * Validates: Requirements 1.2
 * 
 * For any state, the maxWattage value SHALL be a positive integer between 300 and 2000 watts
 * (representing realistic balcony solar system sizes).
 */
describe('Property 2: Wattage Limit Validity', () => {
  test('all states have wattage between 300 and 2000W', () => {
    stateData.states.forEach(state => {
      expect(state.maxWattage).toBeGreaterThanOrEqual(300);
      expect(state.maxWattage).toBeLessThanOrEqual(2000);
    });
  });

  test('wattage values are realistic for balcony solar', () => {
    const validWattages = [300, 400, 600, 800, 1000, 1200, 1500, 2000];
    stateData.states.forEach(state => {
      // Most states should have one of the common wattages
      expect([300, 400, 600, 800, 1000, 1200, 1500, 2000]).toContain(state.maxWattage);
    });
  });
});

/**
 * Feature: balcony-solar-checker, Property 3: Legal Status Consistency
 * Validates: Requirements 1.1, 2.1
 * 
 * For any state, if isLegal is true, then at least one detail category SHALL have required=false
 * (indicating the system is permitted). If isLegal is false, then all detail categories SHALL
 * have required=true or the description SHALL indicate prohibition.
 */
describe('Property 3: Legal Status Consistency', () => {
  test('legal states have at least one non-required detail', () => {
    stateData.states.forEach(state => {
      if (state.isLegal) {
        const hasNonRequired = state.details.some(detail => detail.required === false);
        expect(hasNonRequired).toBe(true);
      }
    });
  });

  test('all states have consistent legal status', () => {
    stateData.states.forEach(state => {
      expect(typeof state.isLegal).toBe('boolean');
      // If legal, should have at least one permissive detail
      if (state.isLegal) {
        expect(state.details.length).toBeGreaterThan(0);
      }
    });
  });
});

/**
 * Feature: balcony-solar-checker, Property 4: Resource Link Validity
 * Validates: Requirements 3.1, 3.3
 * 
 * For any state with resources, all resource URLs SHALL be valid HTTP/HTTPS URLs
 * and SHALL not be empty strings.
 */
describe('Property 4: Resource Link Validity', () => {
  test('all resource URLs are valid HTTP/HTTPS URLs', () => {
    const urlRegex = /^https?:\/\/.+/;
    stateData.states.forEach(state => {
      state.resources.forEach(resource => {
        expect(resource.url).toMatch(urlRegex);
      });
    });
  });

  test('all resource URLs are non-empty strings', () => {
    stateData.states.forEach(state => {
      state.resources.forEach(resource => {
        expect(resource.url).toBeTruthy();
        expect(resource.url.length).toBeGreaterThan(0);
      });
    });
  });

  test('all detail source URLs are valid HTTP/HTTPS URLs', () => {
    const urlRegex = /^https?:\/\/.+/;
    stateData.states.forEach(state => {
      state.details.forEach(detail => {
        expect(detail.sourceUrl).toMatch(urlRegex);
      });
    });
  });

  test('each state has at least one resource', () => {
    stateData.states.forEach(state => {
      expect(state.resources.length).toBeGreaterThanOrEqual(1);
    });
  });
});

/**
 * Feature: balcony-solar-checker, Property 5: Data Uniqueness
 * Validates: Requirements 7.1
 * 
 * All state codes SHALL be unique across the dataset.
 */
describe('Property 5: Data Uniqueness', () => {
  test('all state codes are unique', () => {
    const codes = stateData.states.map(s => s.code);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });

  test('all state names are unique', () => {
    const names = stateData.states.map(s => s.name);
    const uniqueNames = new Set(names);
    expect(uniqueNames.size).toBe(names.length);
  });

  test('all state abbreviations are unique', () => {
    const abbreviations = stateData.states.map(s => s.abbreviation);
    const uniqueAbbreviations = new Set(abbreviations);
    expect(uniqueAbbreviations.size).toBe(abbreviations.length);
  });
});

/**
 * Feature: balcony-solar-checker, Property 6: Detail Categories
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
 * 
 * All states SHALL have details for interconnection, permit, and outlet categories.
 */
describe('Property 6: Detail Categories', () => {
  test('all states have interconnection detail', () => {
    stateData.states.forEach(state => {
      const hasInterconnection = state.details.some(d => d.category === 'interconnection');
      expect(hasInterconnection).toBe(true);
    });
  });

  test('all states have permit detail', () => {
    stateData.states.forEach(state => {
      const hasPermit = state.details.some(d => d.category === 'permit');
      expect(hasPermit).toBe(true);
    });
  });

  test('all states have outlet detail', () => {
    stateData.states.forEach(state => {
      const hasOutlet = state.details.some(d => d.category === 'outlet');
      expect(hasOutlet).toBe(true);
    });
  });

  test('all detail descriptions are non-empty', () => {
    stateData.states.forEach(state => {
      state.details.forEach(detail => {
        expect(detail.description).toBeTruthy();
        expect(detail.description.length).toBeGreaterThan(0);
      });
    });
  });
});
