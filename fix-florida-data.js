#!/usr/bin/env node

const baseURL = 'https://app.teable.ai/api';
const baseId = 'bseTnc7nTi3FYus3yIk';
const apiToken = 'teable_accQGmhU1fVBigSZL4a_gsnFqNXarx/RjkgVZXnieOhSeMkSmyugBV0N9Mekvfk=';
const tableId = 'tbl9JsNibYgkgi7iEVW';

const headers = {
  'Authorization': `Bearer ${apiToken}`,
  'Content-Type': 'application/json',
};

async function fixFloridaData() {
  // Get Florida record
  const response = await fetch(`${baseURL}/table/${tableId}/record`, { headers });
  const data = await response.json();
  const flRecord = data.records.find(r => r.fields.code === 'fl');
  
  console.log('Found FL record:', flRecord.id);
  console.log('Current fields:', flRecord.fields);

  // Update Florida to show it's NOT legal
  const updateResponse = await fetch(`${baseURL}/table/${tableId}/record/${flRecord.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ 
      record: {
        fields: {
          isLegal: false,
          maxWattage: 0,
          keyLaw: 'Florida Statute 163.04 - Utility Interconnection',
          dataSource: 'https://www.flsenate.gov/'
        }
      }
    }),
  });

  if (updateResponse.ok) {
    console.log('✅ Updated Florida to show isLegal: false');
  } else {
    console.log('❌ Failed to update Florida');
  }
}

fixFloridaData().catch(console.error);