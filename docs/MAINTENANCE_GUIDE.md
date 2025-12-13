# Balcony Solar Checker - Maintenance Guide

## Overview

This guide provides procedures for maintaining the Balcony Solar Checker system, including data updates, monitoring, troubleshooting, and disaster recovery.

**Maintenance Owner**: SolarCurrents Admin Team
**Update Frequency**: Weekly (automated via n8n)
**Manual Review**: Monthly
**Backup Schedule**: Daily (automated)

---

## Daily Maintenance Tasks

### Morning Check (9 AM UTC)

- [ ] Verify API is responding: `curl https://api.checker.solarcurrents.com/api/health`
- [ ] Check for any error notifications from n8n workflow
- [ ] Monitor Cloudflare Analytics for unusual traffic patterns
- [ ] Verify cache hit rate is > 95%

### Evening Check (5 PM UTC)

- [ ] Review any user-reported issues
- [ ] Check UpdateLog table for unexpected changes
- [ ] Verify all 51 states have data
- [ ] Monitor API response times (target: < 500ms)

---

## Weekly Maintenance Tasks

### Monday (After n8n Workflow Runs)

**Time**: 3 AM UTC (after 2 AM workflow execution)

- [ ] Verify workflow completed successfully
- [ ] Check UpdateLog for all state updates
- [ ] Review any changes detected by workflow
- [ ] Verify Teable database integrity
- [ ] Confirm API cache was invalidated
- [ ] Check for any parsing errors in workflow logs

**Checklist**:
```bash
# 1. Check workflow execution
curl -H "Authorization: Bearer YOUR_N8N_TOKEN" \
  https://your-n8n-instance.com/api/executions?workflowId=WORKFLOW_ID

# 2. Verify UpdateLog entries
curl -H "Authorization: Bearer YOUR_TEABLE_TOKEN" \
  https://your-teable-instance.com/api/tables/UpdateLog/records \
  | jq '.records | length'

# 3. Check API health
curl https://api.checker.solarcurrents.com/api/health | jq .

# 4. Verify cache invalidation
curl https://api.checker.solarcurrents.com/api/states | jq '.states[0].lastUpdated'
```

### Wednesday (Mid-Week Review)

- [ ] Review user feedback and support tickets
- [ ] Check for any data inconsistencies
- [ ] Verify resource links are still valid (spot check 5-10 states)
- [ ] Monitor API performance metrics
- [ ] Check Cloudflare Worker logs for errors

### Friday (Pre-Weekend Check)

- [ ] Verify all systems are stable
- [ ] Create backup of Teable database
- [ ] Review upcoming maintenance windows
- [ ] Prepare for weekend monitoring

---

## Monthly Maintenance Tasks

### First Monday of Month

**Data Accuracy Review**:

1. **Select 5 Random States**:
   ```bash
   # Get random states
   curl -H "Authorization: Bearer YOUR_TEABLE_TOKEN" \
     https://your-teable-instance.com/api/tables/States/records \
     | jq '.records | sort_by(.fields.code) | .[0,10,20,30,40]'
   ```

2. **Verify Against Official Sources**:
   - Visit each state's utility commission website
   - Compare: isLegal, maxWattage, keyLaw
   - Document any discrepancies
   - Update Teable if changes found

3. **Check Resource Links**:
   - Test each resource URL
   - Verify links are still valid
   - Update or remove broken links
   - Add new resources if available

4. **Document Findings**:
   - Create monthly report
   - Note any regulatory changes
   - Plan updates for next month

### Second Monday of Month

**Performance Review**:

1. **Analyze Metrics**:
   ```bash
   # Get API response times
   curl https://api.checker.solarcurrents.com/api/health | jq '.responseTime'
   
   # Check cache hit rate
   curl https://api.checker.solarcurrents.com/api/health | jq '.cacheHitRate'
   ```

2. **Review Logs**:
   - Check Cloudflare Worker logs
   - Review n8n workflow execution times
   - Identify any performance bottlenecks
   - Plan optimizations if needed

3. **Capacity Planning**:
   - Monitor database size
   - Check API request volume
   - Verify cache size is adequate
   - Plan for growth

### Third Monday of Month

**Security Review**:

1. **Access Control**:
   - Review API token usage
   - Verify only authorized users have access
   - Rotate tokens if needed
   - Check for suspicious activity

2. **Data Validation**:
   - Run data validation script
   - Check for invalid entries
   - Verify data types and formats
   - Fix any issues found

3. **Backup Verification**:
   - Test backup restoration
   - Verify backup integrity
   - Document backup location
   - Update disaster recovery plan

### Fourth Monday of Month

**Documentation Update**:

- [ ] Review and update API documentation
- [ ] Update Teable schema documentation
- [ ] Review n8n workflow documentation
- [ ] Update embedding instructions if needed
- [ ] Update this maintenance guide

---

## Quarterly Maintenance Tasks

### Q1, Q2, Q3, Q4 (First Week of Month)

**Comprehensive Audit**:

1. **Data Completeness**:
   - Verify all 51 states have complete data
   - Check for missing details or resources
   - Verify no duplicate records
   - Validate all required fields

2. **Regulatory Changes**:
   - Research major regulatory changes
   - Update affected states
   - Document changes in UpdateLog
   - Notify users of significant changes

3. **System Performance**:
   - Analyze quarterly metrics
   - Compare with previous quarters
   - Identify trends
   - Plan improvements

4. **Disaster Recovery Test**:
   - Restore from backup
   - Verify all data is intact
   - Test failover procedures
   - Document any issues

---

## Data Update Procedures

### Automated Updates (n8n Workflow)

The n8n workflow runs automatically every Monday at 2 AM UTC:

1. **Scrapes** state utility commission websites
2. **Parses** regulation data
3. **Compares** with existing data
4. **Updates** Teable if changes detected
5. **Logs** all changes to UpdateLog
6. **Invalidates** API cache

**Monitoring**:
- Check n8n execution history
- Review UpdateLog for changes
- Verify API returns updated data

### Manual Updates

For urgent updates or when automated process fails:

1. **Access Teable**:
   - Go to https://your-teable-instance.com
   - Navigate to States table
   - Find state to update

2. **Update Record**:
   - Click on state record
   - Edit fields: isLegal, maxWattage, keyLaw
   - Update lastUpdated to current date
   - Save changes

3. **Log Change**:
   - Go to UpdateLog table
   - Create new record:
     - timestamp: current date/time
     - stateCode: state code
     - changeType: "updated"
     - oldValue: previous data
     - newValue: new data
     - source: "manual_admin"

4. **Invalidate Cache**:
   ```bash
   curl -X POST https://api.checker.solarcurrents.com/api/cache-invalidate \
     -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"state": "ca"}'
   ```

5. **Verify Update**:
   ```bash
   # Wait 1 minute for cache invalidation
   sleep 60
   
   # Verify API returns updated data
   curl https://api.checker.solarcurrents.com/api/states/ca | jq '.state'
   ```

---

## Monitoring and Alerting

### Key Metrics to Monitor

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| API Response Time | < 500ms | > 1000ms |
| Cache Hit Rate | > 95% | < 80% |
| Error Rate | < 0.1% | > 1% |
| Data Freshness | < 7 days | > 14 days |
| Uptime | 99.9% | < 99% |

### Monitoring Tools

**Cloudflare Analytics**:
- Monitor API endpoint performance
- Track request volume
- Review error rates
- Analyze cache performance

**n8n Monitoring**:
- Check workflow execution status
- Review execution logs
- Monitor execution times
- Set up failure alerts

**Teable Monitoring**:
- Monitor database size
- Track API usage
- Review access logs
- Monitor performance

### Setting Up Alerts

**Email Alerts** (via n8n):

1. Create workflow to check metrics
2. If metric exceeds threshold, send email
3. Include metric value and timestamp
4. Suggest remediation steps

**Example Alert Email**:
```
Subject: API Response Time Alert

The API response time has exceeded the threshold:
- Current: 1200ms
- Threshold: 1000ms
- Time: 2024-12-09 14:30 UTC

Recommended Actions:
1. Check Cloudflare Worker logs
2. Verify Teable database performance
3. Review cache hit rate
4. Contact support if issue persists
```

---

## Troubleshooting Guide

### Issue: API Returns 500 Error

**Symptoms**: API endpoint returns "Internal Server Error"

**Diagnosis**:
```bash
# Check API health
curl https://api.checker.solarcurrents.com/api/health

# Check Cloudflare Worker logs
# (via Cloudflare dashboard)

# Check Teable API status
curl -H "Authorization: Bearer YOUR_TEABLE_TOKEN" \
  https://your-teable-instance.com/api/health
```

**Solutions**:
1. Verify Teable API is responding
2. Check API token is valid
3. Verify network connectivity
4. Restart Cloudflare Worker
5. Check for rate limiting

### Issue: Stale Data (lastUpdated > 7 days)

**Symptoms**: API returns old data, lastUpdated is old

**Diagnosis**:
```bash
# Check last update timestamp
curl https://api.checker.solarcurrents.com/api/states | jq '.states[0].lastUpdated'

# Check n8n workflow execution
# (via n8n dashboard)

# Check UpdateLog for recent changes
curl -H "Authorization: Bearer YOUR_TEABLE_TOKEN" \
  https://your-teable-instance.com/api/tables/UpdateLog/records \
  | jq '.records | sort_by(.fields.timestamp) | .[-1]'
```

**Solutions**:
1. Verify n8n workflow ran successfully
2. Check workflow logs for errors
3. Manually run workflow
4. Verify Teable API is accessible
5. Check for network issues

### Issue: Cache Not Invalidating

**Symptoms**: API returns old data after update

**Diagnosis**:
```bash
# Check cache status
curl https://api.checker.solarcurrents.com/api/health | jq '.cacheStatus'

# Verify cache invalidation endpoint
curl -X POST https://api.checker.solarcurrents.com/api/cache-invalidate \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "test"}'
```

**Solutions**:
1. Manually invalidate cache
2. Verify admin token is valid
3. Check Cloudflare Worker logs
4. Restart cache service
5. Verify cache configuration

### Issue: Duplicate Records in Teable

**Symptoms**: Same state appears multiple times

**Diagnosis**:
```bash
# Check for duplicates
curl -H "Authorization: Bearer YOUR_TEABLE_TOKEN" \
  https://your-teable-instance.com/api/tables/States/records \
  | jq '.records | group_by(.fields.code) | map(select(length > 1))'
```

**Solutions**:
1. Identify duplicate records
2. Verify which is correct
3. Delete incorrect record
4. Update UpdateLog with deletion
5. Verify no other duplicates

### Issue: Resource Links Broken

**Symptoms**: Resource URLs return 404 or timeout

**Diagnosis**:
```bash
# Test resource links
curl -I https://www.cpuc.ca.gov/

# Check Resources table
curl -H "Authorization: Bearer YOUR_TEABLE_TOKEN" \
  https://your-teable-instance.com/api/tables/Resources/records \
  | jq '.records[] | select(.fields.url | contains("404"))'
```

**Solutions**:
1. Identify broken links
2. Find replacement URLs
3. Update Resources table
4. Test new links
5. Document changes in UpdateLog

---

## Backup and Recovery

### Backup Strategy

**Automated Backups**:
- Teable: Daily (if using cloud)
- Cloudflare: Continuous (built-in)
- n8n: Daily (if using cloud)

**Manual Backups**:
- Export Teable data weekly
- Export n8n workflows weekly
- Store in version control

### Backup Procedures

**Export Teable Data**:
```bash
# Export all states
curl -H "Authorization: Bearer YOUR_TEABLE_TOKEN" \
  https://your-teable-instance.com/api/tables/States/records \
  > backup_states_$(date +%Y%m%d).json

# Export all details
curl -H "Authorization: Bearer YOUR_TEABLE_TOKEN" \
  https://your-teable-instance.com/api/tables/Details/records \
  > backup_details_$(date +%Y%m%d).json

# Export all resources
curl -H "Authorization: Bearer YOUR_TEABLE_TOKEN" \
  https://your-teable-instance.com/api/tables/Resources/records \
  > backup_resources_$(date +%Y%m%d).json

# Export update log
curl -H "Authorization: Bearer YOUR_TEABLE_TOKEN" \
  https://your-teable-instance.com/api/tables/UpdateLog/records \
  > backup_updatelog_$(date +%Y%m%d).json
```

**Export n8n Workflow**:
```bash
# Via n8n UI: Workflow menu → Download
# Or via API:
curl -H "Authorization: Bearer YOUR_N8N_TOKEN" \
  https://your-n8n-instance.com/api/workflows/WORKFLOW_ID \
  > backup_workflow_$(date +%Y%m%d).json
```

### Recovery Procedures

**Restore from Backup**:

1. **Stop Automated Updates**:
   - Disable n8n workflow
   - Disable cache invalidation

2. **Restore Data**:
   ```bash
   # Delete current records
   # (via Teable UI or API)
   
   # Import backup data
   # (via Teable UI or API)
   ```

3. **Verify Data**:
   - Check all 51 states present
   - Verify data integrity
   - Test API endpoints

4. **Resume Operations**:
   - Enable n8n workflow
   - Invalidate cache
   - Monitor for issues

---

## Performance Optimization

### Database Optimization

1. **Verify Indexes**:
   - Ensure all recommended indexes exist
   - Check index usage
   - Remove unused indexes

2. **Query Optimization**:
   - Use pagination for large queries
   - Filter by stateCode when possible
   - Limit result fields

3. **Cleanup**:
   - Remove old UpdateLog entries (> 90 days)
   - Archive historical data
   - Optimize table structure

### API Optimization

1. **Cache Tuning**:
   - Monitor cache hit rate
   - Adjust TTL if needed
   - Verify cache size

2. **Response Optimization**:
   - Minimize response payload
   - Use compression
   - Optimize JSON structure

3. **Worker Optimization**:
   - Review Worker code
   - Optimize database queries
   - Reduce execution time

---

## Disaster Recovery Plan

### Recovery Time Objectives (RTO)

| Component | RTO | RPO |
|-----------|-----|-----|
| API | 1 hour | 1 hour |
| Database | 4 hours | 1 day |
| Frontend | 30 minutes | 1 hour |

### Disaster Scenarios

**Scenario 1: API Down**
1. Check Cloudflare Worker status
2. Review error logs
3. Restart Worker if needed
4. Verify Teable connectivity
5. Test API endpoints

**Scenario 2: Database Corrupted**
1. Stop all write operations
2. Restore from most recent backup
3. Verify data integrity
4. Resume operations
5. Document incident

**Scenario 3: Data Loss**
1. Restore from backup
2. Verify backup integrity
3. Check UpdateLog for missing data
4. Manually re-enter if necessary
5. Document incident

---

## Escalation Procedures

### Level 1: Automated Response

- Alert sent to admin email
- Automated remediation attempted
- Issue logged

### Level 2: Manual Investigation

- Admin reviews alert
- Investigates root cause
- Implements fix
- Documents solution

### Level 3: Escalation

- If Level 2 unsuccessful after 1 hour
- Escalate to senior admin
- Consider external support
- Implement workaround

### Contact Information

- **Primary Admin**: admin@solarcurrents.com
- **Secondary Admin**: backup-admin@solarcurrents.com
- **Support Team**: support@solarcurrents.com
- **Emergency**: +1-800-SOLAR-HELP

---

## Documentation

### Keep Updated

- [ ] API documentation
- [ ] Teable schema documentation
- [ ] n8n workflow documentation
- [ ] Embedding instructions
- [ ] This maintenance guide

### Version Control

- Store all documentation in Git
- Tag releases with version numbers
- Maintain changelog
- Review quarterly

---

## Compliance and Auditing

### Data Privacy

- Verify no PII is stored
- Ensure GDPR compliance
- Review data retention policies
- Document data handling

### Security Audits

- Quarterly security review
- Verify access controls
- Check for vulnerabilities
- Update security policies

### Compliance Checklist

- [ ] Data privacy compliant
- [ ] Security standards met
- [ ] Backups verified
- [ ] Disaster recovery tested
- [ ] Documentation current

---

## Support and Escalation

For maintenance issues:
- Email: support@solarcurrents.com
- Phone: 1-800-SOLAR-HELP
- Slack: #solar-checker-support

</content>
</invoke>