#!/usr/bin/env node

const baseURL = 'https://app.teable.ai/api';
const tableId = 'tbl9JsNibYgkgi7iEVW';
const apiToken = 'teable_accQGmhU1fVBigSZL4a_gsnFqNXarx/RjkgVZXnieOhSeMkSmyugBV0N9Mekvfk=';

const headers = {
  'Authorization': `Bearer ${apiToken}`,
  'Content-Type': 'application/json',
};

async function updateFlorida() {
  // Get all records and find Florida
  const response = await fetch(`${baseURL}/table/${tableId}/record`, { headers });
  const data = await response.json();
  const flRecord = data.records.find(r => r.fields.code === 'fl');
  
  console.log('Florida record ID:', flRecord.id);
  console.log('Current isLegal:', flRecord.fields.isLegal);

  // Update with explicit false
  const updateResponse = await fetch(`${baseURL}/table/${tableId}/record/${flRecord.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ 
      record: {
        fields: {
          isLegal: false
        }
      }
    }),
  });

  if (updateResponse.ok) {
    const result = await updateResponse.json();
    console.log('✅ Updated Florida isLegal to:', result.fields.isLegal);
  } else {
    const error = await updateResponse.json();
    console.log('❌ Update failed:', error);
  }
}

updateFlorida().catch(console.error);