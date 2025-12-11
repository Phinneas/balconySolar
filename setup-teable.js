#!/usr/bin/env node

/**
 * Setup script for Balcony Solar Checker Teable database
 * Creates tables: States, Details, Resources, UpdateLog
 */

const baseURL = 'https://app.teable.ai/api';
const baseId = 'bseTnc7nTi3FYus3yIk';
const apiToken = 'teable_accQGmhU1fVBigSZL4a_gsnFqNXarx/RjkgVZXnieOhSeMkSmyugBV0N9Mekvfk=';

const headers = {
  'Authorization': `Bearer ${apiToken}`,
  'Content-Type': 'application/json',
};

async function createTable(name, fields) {
  try {
    const response = await fetch(`${baseURL}/base/${baseId}/table`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name,
        fields,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error(`Error creating table ${name}:`, error);
      return null;
    }

    const data = await response.json();
    console.log(`✓ Created table: ${name} (ID: ${data.id})`);
    return data.id;
  } catch (error) {
    console.error(`Error creating table ${name}:`, error.message);
    return null;
  }
}

function getFieldType(type) {
  // Map custom types to Teable field types
  const typeMap = {
    'url': 'singleLineText',
    'singleLineText': 'singleLineText',
    'longText': 'longText',
    'checkbox': 'checkbox',
    'number': 'number',
    'date': 'date',
    'autoNumber': 'autoNumber',
  };
  return typeMap[type] || type;
}

async function setupDatabase() {
  console.log('Setting up Balcony Solar Checker database...\n');

  // Create States table
  const statesTableId = await createTable('States', [
    { name: 'code', type: 'singleLineText', isPrimary: true },
    { name: 'name', type: 'singleLineText' },
    { name: 'abbreviation', type: 'singleLineText' },
    { name: 'isLegal', type: 'checkbox' },
    { name: 'maxWattage', type: 'number' },
    { name: 'keyLaw', type: 'singleLineText' },
    { name: 'lastUpdated', type: 'date' },
    { name: 'dataSource', type: 'singleLineText' },
  ]);

  // Create Details table
  const detailsTableId = await createTable('Details', [
    { name: 'id', type: 'autoNumber', isPrimary: true },
    { name: 'stateCode', type: 'singleLineText' },
    { name: 'category', type: 'singleLineText' },
    { name: 'required', type: 'checkbox' },
    { name: 'description', type: 'longText' },
    { name: 'sourceUrl', type: 'singleLineText' },
  ]);

  // Create Resources table
  const resourcesTableId = await createTable('Resources', [
    { name: 'id', type: 'autoNumber', isPrimary: true },
    { name: 'stateCode', type: 'singleLineText' },
    { name: 'title', type: 'singleLineText' },
    { name: 'url', type: 'singleLineText' },
    { name: 'resourceType', type: 'singleLineText' },
  ]);

  // Create UpdateLog table
  const updateLogTableId = await createTable('UpdateLog', [
    { name: 'id', type: 'autoNumber', isPrimary: true },
    { name: 'timestamp', type: 'date' },
    { name: 'stateCode', type: 'singleLineText' },
    { name: 'changeType', type: 'singleLineText' },
    { name: 'oldValue', type: 'longText' },
    { name: 'newValue', type: 'longText' },
    { name: 'source', type: 'singleLineText' },
  ]);

  console.log('\n✓ Database setup complete!');
  console.log('\nTable IDs:');
  console.log(`  States: ${statesTableId}`);
  console.log(`  Details: ${detailsTableId}`);
  console.log(`  Resources: ${resourcesTableId}`);
  console.log(`  UpdateLog: ${updateLogTableId}`);
}

setupDatabase().catch(console.error);
