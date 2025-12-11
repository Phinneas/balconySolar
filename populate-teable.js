#!/usr/bin/env node

/**
 * Populate Balcony Solar Checker Teable database with state data
 */

const fs = require('fs');
const stateData = require('./state-data.json');

const baseURL = 'https://app.teable.ai/api';
const baseId = 'bseTnc7nTi3FYus3yIk';
const apiToken = 'teable_accQGmhU1fVBigSZL4a_gsnFqNXarx/RjkgVZXnieOhSeMkSmyugBV0N9Mekvfk=';

const tableIds = {
  states: 'tbl9JsNibYgkgi7iEVW',
  details: 'tbl2QU2ySxGNHLhNstq',
  resources: 'tblGYUmWEMeTg4oBTY3',
  updateLog: 'tblNAUNfKxO4Wi0SJ1A',
};

const headers = {
  'Authorization': `Bearer ${apiToken}`,
  'Content-Type': 'application/json',
};

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

async function populateDatabase() {
  console.log('Populating Balcony Solar Checker database...\n');

  let statesCreated = 0;
  let detailsCreated = 0;
  let resourcesCreated = 0;

  for (const state of stateData.states) {
    // Insert state record
    const stateRecord = await insertRecord(tableIds.states, {
      code: state.code,
      name: state.name,
      abbreviation: state.abbreviation,
      isLegal: state.isLegal,
      maxWattage: state.maxWattage,
      keyLaw: state.keyLaw,
      lastUpdated: new Date().toISOString().split('T')[0],
      dataSource: state.dataSource,
    });

    if (stateRecord) {
      statesCreated++;
      console.log(`✓ Created state: ${state.name}`);

      // Insert details records
      if (state.details) {
        for (const detail of state.details) {
          const detailRecord = await insertRecord(tableIds.details, {
            stateCode: state.code,
            category: detail.category,
            required: detail.required,
            description: detail.description,
            sourceUrl: detail.sourceUrl,
          });

          if (detailRecord) {
            detailsCreated++;
          }
        }
      }

      // Insert resources records
      if (state.resources) {
        for (const resource of state.resources) {
          const resourceRecord = await insertRecord(tableIds.resources, {
            stateCode: state.code,
            title: resource.title,
            url: resource.url,
            resourceType: resource.resourceType,
          });

          if (resourceRecord) {
            resourcesCreated++;
          }
        }
      }
    }
  }

  console.log('\n✓ Database population complete!');
  console.log(`\nRecords created:`);
  console.log(`  States: ${statesCreated}`);
  console.log(`  Details: ${detailsCreated}`);
  console.log(`  Resources: ${resourcesCreated}`);
}

populateDatabase().catch(console.error);
