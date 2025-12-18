#!/usr/bin/env node

const baseURL = 'https://app.teable.ai/api';
const baseId = 'bseTnc7nTi3FYus3yIk';
const apiToken = 'teable_accQGmhU1fVBigSZL4a_gsnFqNXarx/RjkgVZXnieOhSeMkSmyugBV0N9Mekvfk=';
const tableId = 'tbl9JsNibYgkgi7iEVW';

const headers = {
  'Authorization': `Bearer ${apiToken}`,
  'Content-Type': 'application/json',
};

async function testUpdate() {
  // Get Texas record
  const response = await fetch(`${baseURL}/table/${tableId}/record`, { headers });
  const data = await response.json();
  const txRecord = data.records.find(r => r.fields.code === 'tx');
  
  console.log('Found TX record:', txRecord.id);
  console.log('Current fields:', txRecord.fields);

  // Try to update it
  const updateResponse = await fetch(`${baseURL}/table/${tableId}/record/${txRecord.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ 
      record: {
        fields: {
          isLegal: true,
          maxWattage: 600,
          keyLaw: 'Texas Utility Code §39.916 - Net Metering'
        }
      }
    }),
  });

  console.log('Update response status:', updateResponse.status);
  
  if (!updateResponse.ok) {
    const error = await updateResponse.json();
    console.log('Update error:', error);
  } else {
    const result = await updateResponse.json();
    console.log('Update success:', result);
  }
}

testUpdate().catch(console.error);