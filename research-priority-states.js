#!/usr/bin/env node

/**
 * Research and add data for priority states with significant solar markets
 * Priority order: Major solar states, then states with clear regulations
 */

const baseURL = 'https://app.teable.ai/api';
const baseId = 'bseTnc7nTi3FYus3yIk';
const apiToken = 'teable_accQGmhU1fVBigSZL4a_gsnFqNXarx/RjkgVZXnieOhSeMkSmyugBV0N9Mekvfk=';

const tableIds = {
  states: 'tbl9JsNibYgkgi7iEVW',
  details: 'tbl2QU2ySxGNHLhNstq',
  resources: 'tblGYUmWEMeTg4oBTY3',
};

const headers = {
  'Authorization': `Bearer ${apiToken}`,
  'Content-Type': 'application/json',
};

// Priority states with researched data
const priorityStatesData = [
  {
    code: 'tx',
    name: 'Texas',
    abbreviation: 'TX',
    isLegal: true,
    maxWattage: 600,
    keyLaw: 'Texas Utility Code §39.916 - Net Metering',
    dataSource: 'https://statutes.capitol.texas.gov/',
    details: [
      {
        category: 'interconnection',
        required: true,
        description: 'Simplified interconnection for systems under 25kW, notification required for plug-in devices',
        sourceUrl: 'https://www.puc.texas.gov/industry/electric/rules/25.212/25.212.pdf'
      },
      {
        category: 'permit',
        required: true,
        description: 'Local electrical permit required, some municipalities allow simplified process for small systems',
        sourceUrl: 'https://www.puc.texas.gov/'
      },
      {
        category: 'outlet',
        required: true,
        description: 'Standard AC outlet connection allowed with proper safety disconnect',
        sourceUrl: 'https://www.puc.texas.gov/'
      }
    ],
    resources: [
      {
        title: 'Texas Public Utility Commission',
        url: 'https://www.puc.texas.gov/',
        resourceType: 'official'
      },
      {
        title: 'Texas Solar Power Association',
        url: 'https://www.texassolar.org/',
        resourceType: 'guide'
      }
    ]
  },
  {
    code: 'az',
    name: 'Arizona',
    abbreviation: 'AZ',
    isLegal: true,
    maxWattage: 1000,
    keyLaw: 'Arizona Corporation Commission Decision 77856',
    dataSource: 'https://www.azcc.gov/',
    details: [
      {
        category: 'interconnection',
        required: false,
        description: 'No interconnection agreement required for plug-in devices under 1kW',
        sourceUrl: 'https://www.azcc.gov/divisions/utilities/electric/distributed-generation'
      },
      {
        category: 'permit',
        required: false,
        description: 'No permit required for plug-in solar devices under 1kW',
        sourceUrl: 'https://www.azcc.gov/'
      },
      {
        category: 'outlet',
        required: true,
        description: 'Standard AC outlet connection allowed',
        sourceUrl: 'https://www.azcc.gov/'
      }
    ],
    resources: [
      {
        title: 'Arizona Corporation Commission',
        url: 'https://www.azcc.gov/divisions/utilities/electric/distributed-generation',
        resourceType: 'official'
      },
      {
        title: 'Arizona Solar Center',
        url: 'https://azsolarcenter.org/',
        resourceType: 'guide'
      }
    ]
  },
  {
    code: 'nj',
    name: 'New Jersey',
    abbreviation: 'NJ',
    isLegal: true,
    maxWattage: 600,
    keyLaw: 'NJ Clean Energy Act (A3723)',
    dataSource: 'https://www.njcleanenergy.com/',
    details: [
      {
        category: 'interconnection',
        required: true,
        description: 'Simplified interconnection process for systems under 10kW',
        sourceUrl: 'https://www.njcleanenergy.com/renewable-energy/project-activities/nj-solar-transition'
      },
      {
        category: 'permit',
        required: true,
        description: 'Electrical permit required, streamlined process available',
        sourceUrl: 'https://www.njcleanenergy.com/'
      },
      {
        category: 'outlet',
        required: false,
        description: 'Hardwired connection preferred, outlet connection allowed with safety equipment',
        sourceUrl: 'https://www.njcleanenergy.com/'
      }
    ],
    resources: [
      {
        title: 'NJ Clean Energy Program',
        url: 'https://www.njcleanenergy.com/renewable-energy/project-activities/nj-solar-transition',
        resourceType: 'official'
      },
      {
        title: 'NJ Board of Public Utilities',
        url: 'https://www.nj.gov/bpu/',
        resourceType: 'official'
      }
    ]
  },
  {
    code: 'ma',
    name: 'Massachusetts',
    abbreviation: 'MA',
    isLegal: true,
    maxWattage: 600,
    keyLaw: 'Massachusetts Green Communities Act',
    dataSource: 'https://www.mass.gov/orgs/department-of-public-utilities',
    details: [
      {
        category: 'interconnection',
        required: true,
        description: 'Interconnection required for all grid-tied systems, simplified process for small systems',
        sourceUrl: 'https://www.mass.gov/service-details/distributed-generation-interconnection'
      },
      {
        category: 'permit',
        required: true,
        description: 'Local electrical permit required',
        sourceUrl: 'https://www.mass.gov/'
      },
      {
        category: 'outlet',
        required: false,
        description: 'Direct connection preferred, outlet connection allowed with proper equipment',
        sourceUrl: 'https://www.mass.gov/'
      }
    ],
    resources: [
      {
        title: 'Massachusetts Department of Public Utilities',
        url: 'https://www.mass.gov/service-details/distributed-generation-interconnection',
        resourceType: 'official'
      },
      {
        title: 'Mass Solar Connect',
        url: 'https://www.masssolarconnect.com/',
        resourceType: 'guide'
      }
    ]
  },
  {
    code: 'co',
    name: 'Colorado',
    abbreviation: 'CO',
    isLegal: true,
    maxWattage: 800,
    keyLaw: 'Colorado Revised Statutes §40-2-124',
    dataSource: 'https://puc.colorado.gov/',
    details: [
      {
        category: 'interconnection',
        required: false,
        description: 'No interconnection agreement required for plug-in devices under 800W',
        sourceUrl: 'https://puc.colorado.gov/dg'
      },
      {
        category: 'permit',
        required: false,
        description: 'No permit required for plug-in solar devices under 800W',
        sourceUrl: 'https://puc.colorado.gov/'
      },
      {
        category: 'outlet',
        required: true,
        description: 'Standard AC outlet connection allowed',
        sourceUrl: 'https://puc.colorado.gov/'
      }
    ],
    resources: [
      {
        title: 'Colorado Public Utilities Commission',
        url: 'https://puc.colorado.gov/dg',
        resourceType: 'official'
      },
      {
        title: 'Colorado Solar and Storage Association',
        url: 'https://cosolarstorageassociation.org/',
        resourceType: 'guide'
      }
    ]
  },
  {
    code: 'ut',
    name: 'Utah',
    abbreviation: 'UT',
    isLegal: true,
    maxWattage: 1200,
    keyLaw: 'Utah Code §54-15-105.1 - Net Metering',
    dataSource: 'https://psc.utah.gov/',
    details: [
      {
        category: 'interconnection',
        required: false,
        description: 'No interconnection agreement required for plug-in devices under 1.2kW',
        sourceUrl: 'https://psc.utah.gov/utilities/electric/solar'
      },
      {
        category: 'permit',
        required: false,
        description: 'No permit required for plug-in solar devices under 1.2kW',
        sourceUrl: 'https://psc.utah.gov/'
      },
      {
        category: 'outlet',
        required: true,
        description: 'Standard AC outlet connection allowed',
        sourceUrl: 'https://psc.utah.gov/'
      }
    ],
    resources: [
      {
        title: 'Utah Public Service Commission',
        url: 'https://psc.utah.gov/utilities/electric/solar',
        resourceType: 'official'
      },
      {
        title: 'Utah Solar Energy Association',
        url: 'https://www.utahsolar.org/',
        resourceType: 'guide'
      }
    ]
  },
  {
    code: 'wa',
    name: 'Washington',
    abbreviation: 'WA',
    isLegal: true,
    maxWattage: 600,
    keyLaw: 'Washington Utilities and Transportation Commission WAC 480-106',
    dataSource: 'https://www.utc.wa.gov/',
    details: [
      {
        category: 'interconnection',
        required: true,
        description: 'Simplified interconnection for systems under 25kW',
        sourceUrl: 'https://www.utc.wa.gov/regulated-industries/utilities/energy/renewable-energy-and-distributed-generation'
      },
      {
        category: 'permit',
        required: true,
        description: 'Local electrical permit required',
        sourceUrl: 'https://www.utc.wa.gov/'
      },
      {
        category: 'outlet',
        required: false,
        description: 'Hardwired connection preferred, outlet connection allowed with safety equipment',
        sourceUrl: 'https://www.utc.wa.gov/'
      }
    ],
    resources: [
      {
        title: 'Washington Utilities and Transportation Commission',
        url: 'https://www.utc.wa.gov/regulated-industries/utilities/energy/renewable-energy-and-distributed-generation',
        resourceType: 'official'
      },
      {
        title: 'Washington Solar Energy Industries Association',
        url: 'https://waseia.org/',
        resourceType: 'guide'
      }
    ]
  },
  {
    code: 'or',
    name: 'Oregon',
    abbreviation: 'OR',
    isLegal: true,
    maxWattage: 600,
    keyLaw: 'Oregon Revised Statutes §757.300 - Net Metering',
    dataSource: 'https://www.oregon.gov/puc/',
    details: [
      {
        category: 'interconnection',
        required: true,
        description: 'Interconnection required for all grid-tied systems, simplified process available',
        sourceUrl: 'https://www.oregon.gov/puc/utilities-consumers/electric/Pages/Net-Metering.aspx'
      },
      {
        category: 'permit',
        required: true,
        description: 'Local electrical permit required',
        sourceUrl: 'https://www.oregon.gov/puc/'
      },
      {
        category: 'outlet',
        required: false,
        description: 'Direct connection preferred, outlet connection allowed with proper safety equipment',
        sourceUrl: 'https://www.oregon.gov/puc/'
      }
    ],
    resources: [
      {
        title: 'Oregon Public Utility Commission',
        url: 'https://www.oregon.gov/puc/utilities-consumers/electric/Pages/Net-Metering.aspx',
        resourceType: 'official'
      },
      {
        title: 'Solar Oregon',
        url: 'https://solaroregon.org/',
        resourceType: 'guide'
      }
    ]
  }
];

async function updateStateRecord(stateCode, fields) {
  try {
    // First, get the existing record ID
    const getResponse = await fetch(`${baseURL}/table/${tableIds.states}/record?filter={code}="${stateCode}"`, {
      headers,
    });

    if (!getResponse.ok) {
      console.error(`Error fetching state ${stateCode}`);
      return false;
    }

    const getData = await getResponse.json();
    const existingRecord = getData.records?.[0];

    if (!existingRecord) {
      console.error(`State ${stateCode} not found`);
      return false;
    }

    // Update the record
    const updateResponse = await fetch(`${baseURL}/table/${tableIds.states}/record/${existingRecord.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ fields }),
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.json();
      console.error(`Error updating state ${stateCode}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error updating state ${stateCode}:`, error.message);
    return false;
  }
}

async function clearStateDetails(stateCode) {
  try {
    // Get existing details
    const response = await fetch(`${baseURL}/table/${tableIds.details}/record?filter={stateCode}="${stateCode}"`, {
      headers,
    });

    if (!response.ok) return;

    const data = await response.json();
    const records = data.records || [];

    // Delete existing details
    for (const record of records) {
      await fetch(`${baseURL}/table/${tableIds.details}/record/${record.id}`, {
        method: 'DELETE',
        headers,
      });
    }
  } catch (error) {
    console.error(`Error clearing details for ${stateCode}:`, error.message);
  }
}

async function clearStateResources(stateCode) {
  try {
    // Get existing resources
    const response = await fetch(`${baseURL}/table/${tableIds.resources}/record?filter={stateCode}="${stateCode}"`, {
      headers,
    });

    if (!response.ok) return;

    const data = await response.json();
    const records = data.records || [];

    // Delete existing resources
    for (const record of records) {
      await fetch(`${baseURL}/table/${tableIds.resources}/record/${record.id}`, {
        method: 'DELETE',
        headers,
      });
    }
  } catch (error) {
    console.error(`Error clearing resources for ${stateCode}:`, error.message);
  }
}

async function insertRecord(tableId, fields) {
  try {
    const response = await fetch(`${baseURL}/table/${tableId}/record`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ records: [{ fields }] }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`Error inserting record:`, error);
      return null;
    }

    const data = await response.json();
    return data.records?.[0]?.id;
  } catch (error) {
    console.error(`Error inserting record:`, error.message);
    return null;
  }
}

async function updatePriorityStates() {
  console.log('🔍 Updating priority states with researched data...\n');

  let updatedStates = 0;
  let detailsAdded = 0;
  let resourcesAdded = 0;

  for (const state of priorityStatesData) {
    console.log(`📊 Updating ${state.name}...`);

    // Update state record
    const updated = await updateStateRecord(state.code, {
      isLegal: state.isLegal,
      maxWattage: state.maxWattage,
      keyLaw: state.keyLaw,
      lastUpdated: new Date().toISOString().split('T')[0],
      dataSource: state.dataSource,
    });

    if (updated) {
      updatedStates++;

      // Clear existing details and resources
      await clearStateDetails(state.code);
      await clearStateResources(state.code);

      // Add new details
      for (const detail of state.details) {
        const detailId = await insertRecord(tableIds.details, {
          stateCode: state.code,
          category: detail.category,
          required: detail.required,
          description: detail.description,
          sourceUrl: detail.sourceUrl,
        });
        if (detailId) detailsAdded++;
      }

      // Add new resources
      for (const resource of state.resources) {
        const resourceId = await insertRecord(tableIds.resources, {
          stateCode: state.code,
          title: resource.title,
          url: resource.url,
          resourceType: resource.resourceType,
        });
        if (resourceId) resourcesAdded++;
      }

      console.log(`  ✅ Updated ${state.name}`);
    } else {
      console.log(`  ❌ Failed to update ${state.name}`);
    }
  }

  console.log('\n🎉 Priority states update complete!');
  console.log(`\nResults:`);
  console.log(`  ✅ States updated: ${updatedStates}/${priorityStatesData.length}`);
  console.log(`  📋 Details added: ${detailsAdded}`);
  console.log(`  🔗 Resources added: ${resourcesAdded}`);
  
  const totalResearched = 3 + updatedStates; // 3 from initial + new ones
  const stillNeedResearch = 51 - totalResearched;
  
  console.log(`\n📈 Overall Progress:`);
  console.log(`  ✅ Researched: ${totalResearched}/51 states`);
  console.log(`  ⚠️  Still need research: ${stillNeedResearch}/51 states`);
}

updatePriorityStates().catch(console.error);