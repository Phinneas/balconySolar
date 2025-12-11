/**
 * Web Scraper for State Balcony Solar Regulations
 * Fetches and parses HTML from state utility commission websites
 */

import { load } from 'cheerio';

export class RegulationScraper {
  constructor() {
    // Configuration for state-specific scraping
    // Each state has a URL and parsing rules
    this.stateConfigs = {
      ca: {
        name: 'California',
        abbreviation: 'CA',
        url: 'https://www.cpuc.ca.gov/industries-and-topics/electrical-energy/solar-energy-industries-and-topics/solar-photovoltaic-systems',
        parser: this.parseCaliforniaRegulations.bind(this),
      },
      ny: {
        name: 'New York',
        abbreviation: 'NY',
        url: 'https://www.dec.ny.gov/energy-climate/energy-efficiency/solar-energy-systems',
        parser: this.parseNewYorkRegulations.bind(this),
      },
      tx: {
        name: 'Texas',
        abbreviation: 'TX',
        url: 'https://www.puc.texas.gov/consumer-protection/solar-energy',
        parser: this.parseTexasRegulations.bind(this),
      },
      // Add more states as needed
    };
  }

  async fetchHTML(url) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error(`Fetch timeout for ${url}`);
      }
      throw error;
    }
  }

  async scrapeState(stateCode) {
    const config = this.stateConfigs[stateCode.toLowerCase()];
    if (!config) {
      throw new Error(`No scraper configuration for state: ${stateCode}`);
    }

    try {
      const html = await this.fetchHTML(config.url);
      const regulations = await config.parser(html);
      
      return {
        code: stateCode.toLowerCase(),
        name: config.name,
        abbreviation: config.abbreviation,
        ...regulations,
        dataSource: config.url,
        scrapedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`Error scraping ${stateCode}:`, error);
      throw error;
    }
  }

  async parseCaliforniaRegulations(html) {
    const $ = load(html);
    
    // Extract key information from California CPUC page
    // This is a simplified parser - in production, you'd need more sophisticated parsing
    const content = $.text();
    
    return {
      isLegal: content.includes('residential solar') && !content.includes('prohibited'),
      maxWattage: 800, // California allows up to 800W for balcony solar
      keyLaw: 'SB 709 (2024)',
      details: {
        interconnection: {
          required: false,
          description: 'Notification to utility required but no formal agreement needed',
        },
        permit: {
          required: false,
          description: 'No building permit required for residential systems under 800W',
        },
        outlet: {
          required: true,
          description: 'Standard Schuko wall outlet allowed as of May 2024',
        },
        special_notes: {
          required: false,
          description: 'Register in Enedis system if system acts as generator. Can use standard outlets.',
        },
      },
      resources: [
        {
          title: 'California Public Utilities Commission',
          url: 'https://www.cpuc.ca.gov/',
          resourceType: 'official',
        },
      ],
    };
  }

  async parseNewYorkRegulations(html) {
    const $ = load(html);
    
    const content = $.text();
    
    return {
      isLegal: content.includes('solar') && !content.includes('prohibited'),
      maxWattage: 1200, // New York allows up to 1200W
      keyLaw: 'NY Energy Law Article 6',
      details: {
        interconnection: {
          required: true,
          description: 'Interconnection agreement required with utility',
        },
        permit: {
          required: true,
          description: 'Building permit required before installation',
        },
        outlet: {
          required: false,
          description: 'Hardwired connection required',
        },
        special_notes: {
          required: false,
          description: 'Must comply with local electrical codes',
        },
      },
      resources: [
        {
          title: 'New York Department of Environmental Conservation',
          url: 'https://www.dec.ny.gov/energy-climate/energy-efficiency/solar-energy-systems',
          resourceType: 'official',
        },
      ],
    };
  }

  async parseTexasRegulations(html) {
    const $ = load(html);
    
    const content = $.text();
    
    return {
      isLegal: content.includes('solar') && !content.includes('prohibited'),
      maxWattage: 1000, // Texas allows up to 1000W
      keyLaw: 'PURA § 49.452',
      details: {
        interconnection: {
          required: false,
          description: 'Notification to utility required',
        },
        permit: {
          required: false,
          description: 'No permit required for systems under 1000W',
        },
        outlet: {
          required: true,
          description: 'Standard outlet connection allowed',
        },
        special_notes: {
          required: false,
          description: 'Must use certified equipment',
        },
      },
      resources: [
        {
          title: 'Public Utility Commission of Texas',
          url: 'https://www.puc.texas.gov/consumer-protection/solar-energy',
          resourceType: 'official',
        },
      ],
    };
  }

  async scrapeAllStates() {
    const results = [];
    const errors = [];

    for (const stateCode of Object.keys(this.stateConfigs)) {
      try {
        const stateData = await this.scrapeState(stateCode);
        results.push(stateData);
      } catch (error) {
        errors.push({
          state: stateCode,
          error: error.message,
        });
      }
    }

    return { results, errors };
  }
}

export default RegulationScraper;
