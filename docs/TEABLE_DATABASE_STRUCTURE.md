# Teable Database Structure Documentation

## Overview

The Balcony Solar Checker uses Teable as its single source of truth for all state regulation data. Teable is a free, open-source database alternative to Airtable with unlimited records and API calls.

**Teable Instance**: Self-hosted or cloud deployment
**Database Name**: `balcony-solar-checker`
**Tables**: 4 main tables with relationships

---

## Table Schemas

### 1. States Table

The primary table containing legal status and basic information for each state.

**Table Name**: `States`

**Fields**:

| Field Name | Type | Required | Description | Example |
|------------|------|----------|-------------|---------|
| `id` | Primary Key | Yes | Unique identifier | Auto-generated UUID |
| `code` | Text (Unique) | Yes | Two-letter state code | "ca", "ny", "ut" |
| `name` | Text | Yes | Full state name | "California" |
| `abbreviation` | Text | Yes | State abbreviation | "CA", "NY", "UT" |
| `isLegal` | Checkbox | Yes | Whether balcony solar is legal | true/false |
| `maxWattage` | Number | Yes | Maximum allowed wattage | 800, 1200, 1500 |
| `keyLaw` | Text | Yes | Primary state law or regulation | "SB 709 (2024)" |
| `lastUpdated` | Date | Yes | Last update timestamp | 2024-12-09 |
| `dataSource` | Text | No | URL of official source | "https://www.cpuc.ca.gov/" |
| `linkedDetails` | Link to Details | No | Related detail records | [Link] |
| `linkedResources` | Link to Resources | No | Related resource records | [Link] |

**Indexes**:
- Primary: `id`
- Unique: `code`
- Search: `name`, `abbreviation`

**Sample Data**:
```
| code | name | abbreviation | isLegal | maxWattage | keyLaw | lastUpdated |
|------|------|--------------|---------|-----------|--------|-------------|
| ca | California | CA | true | 800 | SB 709 (2024) | 2024-12-09 |
| ny | New York | NY | true | 1200 | Article 78 | 2024-12-08 |
| tx | Texas | TX | false | 0 | Prohibited | 2024-12-07 |
```

---

### 2. Details Table

Stores detailed regulatory requirements for each state (interconnection, permits, outlets, special notes).

**Table Name**: `Details`

**Fields**:

| Field Name | Type | Required | Description | Example |
|------------|------|----------|-------------|---------|
| `id` | Primary Key | Yes | Unique identifier | Auto-generated UUID |
| `stateCode` | Link to States | Yes | Reference to state | [Link to CA] |
| `category` | Text | Yes | Detail category | "interconnection", "permit", "outlet", "special_notes" |
| `required` | Checkbox | Yes | Whether this requirement applies | true/false |
| `description` | Long Text | Yes | Detailed explanation | "Notification to utility required..." |
| `sourceUrl` | Text | No | Link to official documentation | "https://www.cpuc.ca.gov/..." |

**Indexes**:
- Primary: `id`
- Foreign Key: `stateCode`
- Search: `category`, `description`

**Sample Data**:
```
| stateCode | category | required | description |
|-----------|----------|----------|-------------|
| CA | interconnection | false | Notification to utility required but no formal agreement needed |
| CA | permit | false | No building permit required for systems under 800W |
| CA | outlet | true | Standard Schuko wall outlet allowed as of May 2024 |
| NY | interconnection | true | Formal interconnection agreement required |
| NY | permit | true | Building permit required before installation |
```

---

### 3. Resources Table

Stores official resource links and references for each state.

**Table Name**: `Resources`

**Fields**:

| Field Name | Type | Required | Description | Example |
|------------|------|----------|-------------|---------|
| `id` | Primary Key | Yes | Unique identifier | Auto-generated UUID |
| `stateCode` | Link to States | Yes | Reference to state | [Link to CA] |
| `title` | Text | Yes | Resource title | "California Public Utilities Commission" |
| `url` | Text | Yes | Full URL to resource | "https://www.cpuc.ca.gov/" |
| `resourceType` | Text | Yes | Type of resource | "official", "guide", "tool" |

**Indexes**:
- Primary: `id`
- Foreign Key: `stateCode`
- Search: `title`, `resourceType`

**Sample Data**:
```
| stateCode | title | url | resourceType |
|-----------|-------|-----|--------------|
| CA | California Public Utilities Commission | https://www.cpuc.ca.gov/ | official |
| CA | California Solar Initiative | https://www.csi.ca.gov/ | guide |
| NY | New York Public Service Commission | https://www.dps.ny.gov/ | official |
```

---

### 4. UpdateLog Table

Audit trail for all data changes, used for tracking updates and debugging.

**Table Name**: `UpdateLog`

**Fields**:

| Field Name | Type | Required | Description | Example |
|------------|------|----------|-------------|---------|
| `id` | Primary Key | Yes | Unique identifier | Auto-generated UUID |
| `timestamp` | Date | Yes | When update occurred | 2024-12-09T02:00:00Z |
| `stateCode` | Text | Yes | Which state was updated | "ca" |
| `changeType` | Text | Yes | Type of change | "created", "updated", "verified" |
| `oldValue` | Long Text | No | Previous data (JSON) | `{"maxWattage": 800}` |
| `newValue` | Long Text | No | New data (JSON) | `{"maxWattage": 1000}` |
| `source` | Text | Yes | Who made the change | "n8n_workflow", "manual_admin" |

**Indexes**:
- Primary: `id`
- Search: `stateCode`, `timestamp`, `changeType`

**Sample Data**:
```
| timestamp | stateCode | changeType | oldValue | newValue | source |
|-----------|-----------|-----------|----------|----------|--------|
| 2024-12-09T02:00:00Z | ca | updated | {"maxWattage": 800} | {"maxWattage": 1000} | n8n_workflow |
| 2024-12-08T14:30:00Z | ny | verified | null | null | manual_admin |
```

---

## Table Relationships

```
States (1) ──── (Many) Details
  ↓
  └─ stateCode (Foreign Key)

States (1) ──── (Many) Resources
  ↓
  └─ stateCode (Foreign Key)

UpdateLog (tracks changes to States)
  ↓
  └─ stateCode (Text reference)
```

---

## Setting Up Teable

### Option 1: Self-Hosted Teable

1. **Install Teable** (Docker recommended):
```bash
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:password@postgres:5432/teable" \
  -e JWT_SECRET="your-secret-key" \
  teable/teable:latest
```

2. **Create Database**:
   - Access Teable at `http://localhost:3000`
   - Create new base: "balcony-solar-checker"
   - Create tables as documented above

3. **Configure API Access**:
   - Generate API token in Teable settings
   - Store token securely in environment variables

### Option 2: Cloud Teable

1. Visit https://teable.io
2. Sign up for account
3. Create new base: "balcony-solar-checker"
4. Create tables as documented above
5. Generate API token in account settings

---

## Teable API Integration

### Authentication

All Teable API requests require an API token:

```bash
Authorization: Bearer YOUR_TEABLE_API_TOKEN
```

### Example API Calls

**Get all states**:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-teable-instance.com/api/tables/States/records
```

**Create new state**:
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "code": "ca",
      "name": "California",
      "abbreviation": "CA",
      "isLegal": true,
      "maxWattage": 800,
      "keyLaw": "SB 709 (2024)",
      "lastUpdated": "2024-12-09"
    }
  }' \
  https://your-teable-instance.com/api/tables/States/records
```

**Update state**:
```bash
curl -X PATCH \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fields": {
      "maxWattage": 1000,
      "lastUpdated": "2024-12-10"
    }
  }' \
  https://your-teable-instance.com/api/tables/States/records/RECORD_ID
```

---

## Data Validation Rules

### States Table

- `code`: Must be exactly 2 characters, lowercase (a-z)
- `name`: Must not be empty, max 100 characters
- `abbreviation`: Must be exactly 2 characters, uppercase (A-Z)
- `isLegal`: Boolean (true/false)
- `maxWattage`: Must be between 300-2000 or 0 if not legal
- `keyLaw`: Must not be empty, max 500 characters
- `lastUpdated`: Must be valid ISO 8601 date

### Details Table

- `category`: Must be one of: "interconnection", "permit", "outlet", "special_notes"
- `required`: Boolean (true/false)
- `description`: Must not be empty, max 2000 characters
- `sourceUrl`: Must be valid HTTP/HTTPS URL or empty

### Resources Table

- `title`: Must not be empty, max 200 characters
- `url`: Must be valid HTTP/HTTPS URL
- `resourceType`: Must be one of: "official", "guide", "tool"

### UpdateLog Table

- `timestamp`: Must be valid ISO 8601 datetime
- `stateCode`: Must match existing state code
- `changeType`: Must be one of: "created", "updated", "verified"
- `source`: Must be one of: "n8n_workflow", "manual_admin"

---

## Backup and Recovery

### Regular Backups

1. **Automated Backups** (if using cloud Teable):
   - Teable automatically backs up data daily
   - Backups retained for 30 days

2. **Manual Backups**:
```bash
# Export all data as JSON
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-teable-instance.com/api/tables/States/records \
  > states_backup.json
```

### Recovery Procedure

1. If data is corrupted, restore from most recent backup
2. Verify data integrity using validation rules above
3. Check UpdateLog table for audit trail
4. Notify admins of recovery action

---

## Performance Optimization

### Indexes

Ensure these indexes exist for optimal query performance:

**States Table**:
- Primary index on `id`
- Unique index on `code`
- Search index on `name`, `abbreviation`

**Details Table**:
- Primary index on `id`
- Foreign key index on `stateCode`
- Search index on `category`

**Resources Table**:
- Primary index on `id`
- Foreign key index on `stateCode`

**UpdateLog Table**:
- Primary index on `id`
- Search index on `stateCode`, `timestamp`

### Query Optimization

- Use `stateCode` filter when querying Details or Resources
- Limit results to 100 records per page for large queries
- Use pagination for bulk exports

---

## Maintenance Tasks

### Weekly

- [ ] Verify all 51 states have current data
- [ ] Check UpdateLog for any errors
- [ ] Confirm lastUpdated timestamps are recent (< 7 days)

### Monthly

- [ ] Review data accuracy against official sources
- [ ] Check for duplicate records
- [ ] Verify all resource links are still valid
- [ ] Create backup export

### Quarterly

- [ ] Audit all state regulations for changes
- [ ] Update documentation if schema changes
- [ ] Review and optimize indexes
- [ ] Test disaster recovery procedures

---

## Troubleshooting

### Issue: API returns 404 for valid state

**Solution**: 
1. Verify state code exists in States table
2. Check that `code` field is lowercase
3. Confirm record is not deleted (check UpdateLog)

### Issue: Slow query performance

**Solution**:
1. Verify indexes are created
2. Check for missing `stateCode` links in Details/Resources
3. Limit query results with pagination

### Issue: Data inconsistency between tables

**Solution**:
1. Check UpdateLog for recent changes
2. Verify foreign key relationships
3. Run data validation script
4. Restore from backup if necessary

---

## Support

For Teable-specific issues:
- Documentation: https://docs.teable.io
- GitHub: https://github.com/teableio/teable
- Community: https://discord.gg/teable

For balcony solar checker database issues:
- Contact: support@solarcurrents.com

</content>
</invoke>