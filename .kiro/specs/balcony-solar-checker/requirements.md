# Requirements Document: Balcony Solar Legal State Checker

## Introduction

The Balcony Solar Legal State Checker is an interactive tool that helps users quickly determine whether balcony solar systems are legal in their state, what the maximum wattage limits are, and what regulatory requirements they must follow. The tool will be deployed as a Cloudflare page connected to SolarCurrents, with automated data updates from official state sources via n8n workflows. This tool serves as both a user resource and a lead magnet for SolarCurrents' newsletter and solar company partnerships.

## Glossary

- **Balcony Solar System**: A small-scale solar photovoltaic system (typically 300-1200W) designed to be mounted on apartment balconies or small residential spaces, often called "plug-and-play" or "micro-inverter" systems
- **State Regulation**: Official laws, codes, or utility commission rules governing residential solar installations in a specific state
- **Interconnection**: The process and requirements for connecting a solar system to the electrical grid or utility network
- **Wattage Limit**: The maximum rated power output (in watts) allowed for a balcony solar system under state regulations
- **Utility Notification**: The requirement for a system owner to inform their utility company about the solar installation
- **Building Permit**: Official authorization from local government required before installing certain electrical systems
- **Data Source**: Official state electrical codes, utility commission websites, and state solar regulations
- **n8n Workflow**: Automated process that scrapes, parses, and updates state regulation data on a scheduled basis
- **Airtable Base**: Cloud database serving as the single source of truth for all state regulation data
- **REST API**: Backend endpoint that serves state regulation data to the frontend application
- **Cloudflare Page**: Serverless deployment platform hosting the interactive checker tool

## Requirements

### Requirement 1

**User Story:** As a prospective balcony solar user, I want to quickly check if balcony solar is legal in my state, so that I can determine if I can install a system at my residence.

#### Acceptance Criteria

1. WHEN a user selects their state from the interface THEN the system SHALL display whether balcony solar is legal in that state with a clear visual indicator (✅ LEGAL or ❌ NOT LEGAL)
2. WHEN a user views the results THEN the system SHALL display the maximum wattage allowed for balcony solar systems in that state
3. WHEN a user views the results THEN the system SHALL display the key state law or regulation governing balcony solar installations
4. WHEN a user selects a state THEN the system SHALL display results within 500 milliseconds
5. WHEN a user accesses the tool on a mobile device THEN the system SHALL render the interface responsively with readable text and accessible touch targets

### Requirement 2

**User Story:** As a prospective balcony solar user, I want to understand the specific regulatory requirements for my state, so that I can prepare for installation and avoid legal issues.

#### Acceptance Criteria

1. WHEN a user views state results THEN the system SHALL display detailed information about interconnection requirements (required yes/no and description)
2. WHEN a user views state results THEN the system SHALL display detailed information about permit requirements (required yes/no and description)
3. WHEN a user views state results THEN the system SHALL display detailed information about utility approval requirements (required yes/no and description)
4. WHEN a user views state results THEN the system SHALL display the allowed connection type (standard outlet, special outlet, hardwired, etc.)
5. WHEN a user views state results THEN the system SHALL display any special notes or considerations specific to that state

### Requirement 3

**User Story:** As a user, I want to access helpful resources and links, so that I can learn more about my state's regulations and find official information.

#### Acceptance Criteria

1. WHEN a user views state results THEN the system SHALL display links to official state resources (state utility commission, solar commission, etc.)
2. WHEN a user clicks a resource link THEN the system SHALL open the link in a new browser tab without leaving the checker
3. WHEN a user views state results THEN the system SHALL display at least one official resource link for each state

### Requirement 4

**User Story:** As a content creator, I want to share specific state results with others, so that I can drive traffic and engagement through social media and forums.

#### Acceptance Criteria

1. WHEN a user selects a state THEN the system SHALL generate a shareable URL that includes the selected state (e.g., yourdomain.com/checker?state=ca)
2. WHEN a user accesses the checker with a state parameter in the URL THEN the system SHALL automatically load and display results for that state
3. WHEN a user views state results THEN the system SHALL display a copy-to-clipboard button for the shareable URL
4. WHEN a user prints the page THEN the system SHALL render state results in a print-friendly format with appropriate styling

### Requirement 5

**User Story:** As a SolarCurrents administrator, I want state regulation data to stay current automatically, so that I don't have to manually update information when regulations change.

#### Acceptance Criteria

1. WHEN state regulations are updated on official sources THEN the n8n workflow SHALL detect changes and update the Airtable base within 7 days
2. WHEN the Airtable base is updated THEN the REST API SHALL serve the updated data to the frontend within 1 minute
3. WHEN the frontend loads THEN the system SHALL fetch the latest state data from the REST API
4. WHEN data is fetched from the API THEN the system SHALL cache results for 24 hours to reduce API calls
5. WHEN an API request fails THEN the system SHALL display cached data or a user-friendly error message

### Requirement 6

**User Story:** As a solar company, I want to embed this checker on my website, so that I can provide value to my customers and drive leads.

#### Acceptance Criteria

1. WHEN a solar company embeds the checker via iframe THEN the system SHALL render correctly within the iframe without breaking layout
2. WHEN the checker is embedded THEN the system SHALL maintain full functionality (state selection, result display, sharing)
3. WHEN the checker is embedded THEN the system SHALL not require the embedding site to load additional dependencies beyond the iframe tag

### Requirement 7

**User Story:** As a developer maintaining the tool, I want a clear data structure and API contract, so that I can reliably update and extend the system.

#### Acceptance Criteria

1. WHEN the REST API returns state data THEN the system SHALL return a consistent JSON structure for all states with required fields: name, abbreviation, isLegal, maxWattage, keyLaw, details, resources, lastUpdated
2. WHEN the Airtable base is structured THEN the system SHALL organize data into linked tables: States, Details, Resources, and UpdateLog
3. WHEN the n8n workflow runs THEN the system SHALL log all data updates with timestamps and source information for audit purposes
4. WHEN a state's data is missing or incomplete THEN the system SHALL display a "Data pending" message rather than showing incorrect information

### Requirement 8

**User Story:** As a SolarCurrents user, I want to discover this tool easily, so that I can use it to make informed decisions about balcony solar.

#### Acceptance Criteria

1. WHEN a user visits SolarCurrents THEN the system SHALL display a prominent link or CTA to the balcony solar checker
2. WHEN a user searches for "balcony solar legal" THEN the system SHALL rank the checker page in search results within 12 weeks
3. WHEN a user views the checker page THEN the system SHALL include internal links to related SolarCurrents content (balcony solar guides, comparisons, etc.)
4. WHEN a user completes a state lookup THEN the system SHALL display a CTA to subscribe to the SolarCurrents newsletter or view related products
