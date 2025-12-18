#!/usr/bin/env node

/**
 * Simple update script for priority states
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
  }
];

async function getAllRecords(tableId) {
  const response = await fetch(`${baseURL}/table/${tableId}/record`, {
    headers,
  });
  const data = await response.json();
  return data.records || [];
}

async function updateRecord(tableId, recordId, fields) {
  const response = await fetch(`${baseURL}/table/${tableId}/record/${recordId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ record: { fields } }),
  });
  return response.ok;
}

async function deleteRecord(tableId, recordId) {
  await fetch(`${baseURL}/table/${tableId}/record/${recordId}`, {
    method: 'DELETE',
    headers,
  });
}

async function insertRecord(tableId, fields) {
  const response = await fetch(`${baseURL}/table/${tableId}/record`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ records: [{ fields }] }),
  });
  const data = await response.json();
  return data.records?.[0]?.id;
}

async function updateStates() {
  console.log('🔍 Updating priority states...\n');

  // Get all existing records
  const stateRecords = await getAllRecords(tableIds.states);
  const detailRecords = await getAllRecords(tableIds.details);
  const resourceRecords = await getAllRecords(tableIds.resources);

  let updated = 0;

  for (const stateData of priorityStatesData) {
    console.log(`📊 Updating ${stateData.name}...`);

    // Find the state record
    const stateRecord = stateRecords.find(r => r.fields.code === stateData.code);
    
    if (!stateRecord) {
      console.log(`  ❌ State ${stateData.code} not found`);
      continue;
    }

    // Update state
    await updateRecord(tableIds.states, stateRecord.id, {
      isLegal: stateData.isLegal,
      maxWattage: stateData.maxWattage,
      keyLaw: stateData.keyLaw,
      dataSource: stateData.dataSource,
      lastUpdated: new Date().toISOString().split('T')[0],
    });

    // Delete old details
    const oldDetails = detailRecords.filter(r => r.fields.stateCode === stateData.code);
    for (const detail of oldDetails) {
      await deleteRecord(tableIds.details, detail.id);
    }

    // Add new details
    for (const detail of stateData.details) {
      await insertRecord(tableIds.details, {
        stateCode: stateData.code,
        category: detail.category,
        required: detail.required,
        description: detail.description,
        sourceUrl: detail.sourceUrl,
      });
    }

    // Delete old resources
    const oldResources = resourceRecords.filter(r => r.fields.stateCode === stateData.code);
    for (const resource of oldResources) {
      await deleteRecord(tableIds.resources, resource.id);
    }

    // Add new resources
    for (const resource of stateData.resources) {
      await insertRecord(tableIds.resources, {
        stateCode: stateData.code,
        title: resource.title,
        url: resource.url,
        resourceType: resource.resourceType,
      });
    }

    console.log(`  ✅ Updated ${stateData.name}`);
    updated++;
  }

  console.log(`\n🎉 Updated ${updated}/${priorityStatesData.length} states`);
  console.log(`\n📈 Total researched: ${3 + updated}/51 states`);
}

updateStates().catch(console.error);