# n8n Workflow Setup Guide

## Overview

This guide explains how to set up n8n workflows for automated data scraping and updates to the Balcony Solar Checker database. n8n is a free, open-source workflow automation platform that runs on your infrastructure.

**n8n Instance**: Self-hosted or cloud deployment
**Workflow Purpose**: Weekly scraping of state utility commission websites and updating Teable database
**Schedule**: Monday 2 AM UTC (configurable)

---

## Prerequisites

- n8n instance running (self-hosted or cloud)
- Teable instance with database set up (see TEABLE_DATABASE_STRUCTURE.md)
- Teable API token
- Basic understanding of n8n workflows

---

## Installation

### Option 1: Self-Hosted n8n (Docker)

```bash
docker run -d \
  -p 5678:5678 \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=your-password \
  -e DB_TYPE=postgresdb \
  -e DB_POSTGRESDB_HOST=postgres \
  -e DB_POSTGRESDB_PORT=5432 \
  -e DB_POSTGRESDB_DATABASE=n8n \
  -e DB_POSTGRESDB_USER=n8n \
  -e DB_POSTGRESDB_PASSWORD=n8n-password \
  n8nio/n8n:latest
```

Access at: `http://localhost:5678`

### Option 2: Cloud n8n

1. Visit https://n8n.cloud
2. Sign up for account
3. Create new workflow

---

## Workflow Architecture

The main workflow consists of these steps:

```
1. Trigger (Cron: Monday 2 AM UTC)
   ↓
2. Get All States (from Teable)
   ↓
3. For Each State:
   ├─ Scrape State Website
   ├─ Parse Regulation Data
   ├─ Compare with Existing Data
   ├─ Update Teable if Changed
   └─ Log Change to UpdateLog
   ↓
4. Send Admin Notification (if critical changes)
   ↓
5. Trigger API Cache Invalidation
```

---

## Step-by-Step Setup

### Step 1: Create Workflow

1. In n8n, click "New Workflow"
2. Name it: "Balcony Solar Data Update"
3. Save the workflow

### Step 2: Add Cron Trigger

1. Click "+" to add node
2. Search for "Cron"
3. Select "Cron" trigger
4. Configure:
   - **Trigger Time**: `0 2 * * 1` (Monday 2 AM UTC)
   - **Timezone**: UTC

**Cron Expression Reference**:
```
0 2 * * 1
│ │ │ │ └─ Day of week (1 = Monday)
│ │ │ └─── Month (*)
│ │ └───── Day of month (*)
│ └─────── Hour (2 = 2 AM)
└───────── Minute (0)
```

### Step 3: Get All States from Teable

1. Click "+" to add node after Cron
2. Search for "HTTP Request"
3. Configure:
   - **Method**: GET
   - **URL**: `https://your-teable-instance.com/api/tables/States/records`
   - **Headers**:
     - `Authorization: Bearer YOUR_TEABLE_API_TOKEN`
     - `Content-Type: application/json`
4. Name the node: "Get All States"

### Step 4: Loop Through Each State

1. Click "+" to add node
2. Search for "Loop"
3. Select "Loop Over Items"
4. Configure:
   - **Items to Loop Over**: `{{ $node["Get All States"].json.records }}`
5. Name the node: "Loop States"

### Step 5: Scrape State Website

Inside the loop, add a node to scrape state websites:

1. Click "+" inside the loop
2. Search for "HTTP Request"
3. Configure:
   - **Method**: GET
   - **URL**: `{{ $item.json.fields.dataSource }}`
   - **Response Format**: Text
4. Name the node: "Fetch State Website"

**Note**: This assumes each state has a `dataSource` URL in Teable. You may need to configure specific URLs for each state.

### Step 6: Parse HTML Content

1. Click "+" to add node
2. Search for "HTML Extract"
3. Configure extraction rules based on state website structure
4. Name the node: "Parse Regulation Data"

**Example for California**:
```
Extract from: <div class="regulation">
  - isLegal: Check if "legal" keyword present
  - maxWattage: Extract number from "maximum X watts"
  - keyLaw: Extract law reference like "SB 709"
```

### Step 7: Compare with Existing Data

1. Click "+" to add node
2. Search for "Function"
3. Add JavaScript to compare old vs new data:

```javascript
const oldData = $node["Get All States"].json.records.find(
  r => r.fields.code === $item.json.fields.code
);

const newData = {
  isLegal: $node["Parse Regulation Data"].json.isLegal,
  maxWattage: $node["Parse Regulation Data"].json.maxWattage,
  keyLaw: $node["Parse Regulation Data"].json.keyLaw
};

const hasChanges = JSON.stringify(oldData.fields) !== JSON.stringify(newData);

return {
  stateCode: $item.json.fields.code,
  hasChanges: hasChanges,
  oldData: oldData.fields,
  newData: newData
};
```

4. Name the node: "Compare Data"

### Step 8: Update Teable if Changed

1. Click "+" to add node
2. Search for "IF"
3. Configure condition: `{{ $node["Compare Data"].json.hasChanges === true }}`
4. In the "true" branch, add HTTP Request:
   - **Method**: PATCH
   - **URL**: `https://your-teable-instance.com/api/tables/States/records/{{ $item.json.id }}`
   - **Headers**:
     - `Authorization: Bearer YOUR_TEABLE_API_TOKEN`
     - `Content-Type: application/json`
   - **Body**:
     ```json
     {
       "fields": {
         "isLegal": "{{ $node['Compare Data'].json.newData.isLegal }}",
         "maxWattage": "{{ $node['Compare Data'].json.newData.maxWattage }}",
         "keyLaw": "{{ $node['Compare Data'].json.newData.keyLaw }}",
         "lastUpdated": "{{ now().toISOString() }}"
       }
     }
     ```
5. Name the node: "Update Teable"

### Step 9: Log Changes to UpdateLog

1. Click "+" to add node (still in "true" branch)
2. Search for "HTTP Request"
3. Configure to create UpdateLog record:
   - **Method**: POST
   - **URL**: `https://your-teable-instance.com/api/tables/UpdateLog/records`
   - **Headers**:
     - `Authorization: Bearer YOUR_TEABLE_API_TOKEN`
     - `Content-Type: application/json`
   - **Body**:
     ```json
     {
       "fields": {
         "timestamp": "{{ now().toISOString() }}",
         "stateCode": "{{ $node['Compare Data'].json.stateCode }}",
         "changeType": "updated",
         "oldValue": "{{ JSON.stringify($node['Compare Data'].json.oldData) }}",
         "newValue": "{{ JSON.stringify($node['Compare Data'].json.newData) }}",
         "source": "n8n_workflow"
       }
     }
     ```
4. Name the node: "Log Change"

### Step 10: Send Admin Notification (Optional)

1. Click "+" to add node (after loop)
2. Search for "Email"
3. Configure:
   - **To**: admin@solarcurrents.com
   - **Subject**: "Balcony Solar Data Update - Changes Detected"
   - **Body**: Include summary of changes from UpdateLog
4. Name the node: "Send Notification"

### Step 11: Trigger API Cache Invalidation

1. Click "+" to add node (after notification)
2. Search for "HTTP Request"
3. Configure:
   - **Method**: POST
   - **URL**: `https://api.checker.solarcurrents.com/api/cache-invalidate`
   - **Headers**:
     - `Authorization: Bearer YOUR_ADMIN_TOKEN`
     - `Content-Type: application/json`
   - **Body**:
     ```json
     {
       "action": "invalidate_all"
     }
     ```
4. Name the node: "Invalidate Cache"

---

## Environment Variables

Store sensitive data in n8n environment variables:

1. Go to Settings → Environment Variables
2. Add:
   - `TEABLE_API_TOKEN`: Your Teable API token
   - `TEABLE_BASE_URL`: Your Teable instance URL
   - `ADMIN_EMAIL`: Admin email for notifications
   - `ADMIN_TOKEN`: Admin token for cache invalidation
   - `SMTP_HOST`: Email server host (for notifications)
   - `SMTP_USER`: Email server username
   - `SMTP_PASSWORD`: Email server password

Reference in workflow: `{{ $env.TEABLE_API_TOKEN }}`

---

## Error Handling

Add error handling to the workflow:

### Retry Logic

1. For each HTTP Request node, configure:
   - **Retry**: Enabled
   - **Max Retries**: 3
   - **Backoff**: Exponential (1s, 2s, 4s)

### Error Notification

1. Add "Catch" node after main workflow
2. Configure to send error email:
   - **To**: admin@solarcurrents.com
   - **Subject**: "Balcony Solar Workflow Error"
   - **Body**: Include error details and timestamp

### Logging

1. Add "Function" node to log execution:
```javascript
console.log(`Workflow executed at ${new Date().toISOString()}`);
console.log(`States processed: ${$node["Loop States"].json.length}`);
console.log(`Changes detected: ${$node["Compare Data"].json.filter(c => c.hasChanges).length}`);
```

---

## Testing the Workflow

### Manual Test

1. Click "Test Workflow" button
2. Verify each step executes correctly
3. Check Teable database for updates
4. Verify UpdateLog entries created

### Dry Run

1. Configure workflow to run but not update Teable
2. Review what changes would be made
3. Verify accuracy before enabling live updates

### Scheduled Test

1. Set cron to run in 5 minutes
2. Monitor execution
3. Verify results
4. Adjust if needed

---

## Monitoring and Maintenance

### Monitor Workflow Execution

1. In n8n, go to "Executions"
2. View execution history
3. Check for errors or failures

### Key Metrics

- **Execution Time**: Should complete in < 5 minutes
- **Success Rate**: Target 100%
- **Data Changes**: Track number of updates per run
- **Error Rate**: Target 0%

### Weekly Checklist

- [ ] Verify workflow executed successfully
- [ ] Check UpdateLog for all changes
- [ ] Verify Teable data is accurate
- [ ] Confirm API cache was invalidated
- [ ] Check for any error notifications

### Monthly Maintenance

- [ ] Review workflow performance
- [ ] Update state website URLs if changed
- [ ] Test error handling
- [ ] Backup workflow configuration
- [ ] Review and optimize parsing logic

---

## Advanced Configuration

### Multiple Workflows

Create separate workflows for different state groups:

1. **Workflow 1**: States A-M (Monday 2 AM)
2. **Workflow 2**: States N-Z (Monday 3 AM)

This prevents timeouts on large datasets.

### Custom Parsing per State

Create conditional logic for states with different website structures:

```javascript
const stateCode = $item.json.fields.code;

if (stateCode === 'ca') {
  // California-specific parsing
} else if (stateCode === 'ny') {
  // New York-specific parsing
} else {
  // Default parsing
}
```

### Webhook Triggers

Allow manual updates via webhook:

1. Add "Webhook" trigger node
2. Configure: POST `/webhook/update-state`
3. Accept state code as parameter
4. Trigger immediate update for that state

---

## Troubleshooting

### Issue: Workflow times out

**Solution**:
1. Split into multiple workflows
2. Reduce number of states per run
3. Optimize parsing logic
4. Increase timeout limit

### Issue: Teable API returns 401 Unauthorized

**Solution**:
1. Verify API token is correct
2. Check token hasn't expired
3. Regenerate token in Teable settings
4. Update environment variable

### Issue: HTML parsing fails

**Solution**:
1. Verify website structure hasn't changed
2. Update CSS selectors
3. Add error handling for missing elements
4. Test parsing with sample HTML

### Issue: Duplicate UpdateLog entries

**Solution**:
1. Check for duplicate state records in Teable
2. Verify comparison logic is correct
3. Add deduplication step
4. Review workflow execution logs

---

## Backup and Recovery

### Export Workflow

1. In n8n, click workflow menu
2. Select "Download"
3. Save JSON file to version control

### Import Workflow

1. In n8n, click "Import"
2. Select JSON file
3. Verify all nodes and connections
4. Update environment variables
5. Test before enabling schedule

---

## Support

For n8n-specific issues:
- Documentation: https://docs.n8n.io
- Community: https://community.n8n.io
- GitHub: https://github.com/n8n-io/n8n

For balcony solar checker workflow issues:
- Contact: support@solarcurrents.com

</content>
</invoke>