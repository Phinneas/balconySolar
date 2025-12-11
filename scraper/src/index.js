/**
 * Balcony Solar Scraper Worker
 * Cloudflare Worker for scraping state regulations and updating Teable
 * Runs on a weekly cron schedule (Monday 2 AM UTC)
 */

import TeableClient from './teable-client.js';
import RegulationScraper from './scraper.js';

const TABLE_IDS = {
  states: 'tbl9JsNibYgkgi7iEVW',
  details: 'tbl2QU2ySxGNHLhNstq',
  resources: 'tblGYUmWEMeTg4oBTY3',
  updateLog: 'tblNAUNfKxO4Wi0SJ1A',
};

async function invalidateAPICache(cacheInvalidateUrl) {
  try {
    const response = await fetch(cacheInvalidateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pattern: 'state-*' }),
    });

    if (!response.ok) {
      console.error(`Cache invalidation failed: ${response.status}`);
      return false;
    }

    console.log('API cache invalidated successfully');
    return true;
  } catch (error) {
    console.error('Error invalidating cache:', error);
    return false;
  }
}

async function updateStateInTeable(client, stateData, oldStateData = null) {
  try {
    const stateRecord = await client.findStateByCode(TABLE_IDS.states, stateData.code);

    if (!stateRecord) {
      // Create new state record
      const newRecord = await client.createRecord(TABLE_IDS.states, {
        code: stateData.code,
        name: stateData.name,
        abbreviation: stateData.abbreviation,
        isLegal: stateData.isLegal,
        maxWattage: stateData.maxWattage,
        keyLaw: stateData.keyLaw,
        lastUpdated: new Date().toISOString(),
        dataSource: stateData.dataSource,
      });

      // Log creation
      await client.logUpdate(
        TABLE_IDS.updateLog,
        stateData.code,
        'created',
        null,
        stateData,
        'scraper_worker'
      );

      console.log(`Created new state record: ${stateData.code}`);
      return { created: true, updated: false };
    }

    // Check if data has changed
    const hasChanges = 
      stateRecord.fields.isLegal !== stateData.isLegal ||
      stateRecord.fields.maxWattage !== stateData.maxWattage ||
      stateRecord.fields.keyLaw !== stateData.keyLaw;

    if (hasChanges) {
      // Update existing state record
      await client.updateRecord(TABLE_IDS.states, stateRecord.id, {
        isLegal: stateData.isLegal,
        maxWattage: stateData.maxWattage,
        keyLaw: stateData.keyLaw,
        lastUpdated: new Date().toISOString(),
        dataSource: stateData.dataSource,
      });

      // Log update
      await client.logUpdate(
        TABLE_IDS.updateLog,
        stateData.code,
        'updated',
        oldStateData || stateRecord.fields,
        stateData,
        'scraper_worker'
      );

      console.log(`Updated state record: ${stateData.code}`);
      return { created: false, updated: true };
    } else {
      // No changes, just verify
      await client.logUpdate(
        TABLE_IDS.updateLog,
        stateData.code,
        'verified',
        stateRecord.fields,
        stateData,
        'scraper_worker'
      );

      console.log(`Verified state record (no changes): ${stateData.code}`);
      return { created: false, updated: false };
    }
  } catch (error) {
    console.error(`Error updating state ${stateData.code}:`, error);
    throw error;
  }
}

async function updateStateDetails(client, stateCode, details) {
  try {
    // Get existing details
    const existingDetails = await client.getStateDetails(TABLE_IDS.details, stateCode);
    const existingByCategory = {};
    
    existingDetails.forEach(detail => {
      existingByCategory[detail.fields.category] = detail;
    });

    // Update or create details
    for (const [category, detailData] of Object.entries(details)) {
      if (existingByCategory[category]) {
        // Update existing detail
        await client.updateRecord(TABLE_IDS.details, existingByCategory[category].id, {
          required: detailData.required,
          description: detailData.description,
        });
      } else {
        // Create new detail
        await client.createRecord(TABLE_IDS.details, {
          stateCode,
          category,
          required: detailData.required,
          description: detailData.description,
        });
      }
    }

    console.log(`Updated details for state: ${stateCode}`);
  } catch (error) {
    console.error(`Error updating details for ${stateCode}:`, error);
    throw error;
  }
}

async function updateStateResources(client, stateCode, resources) {
  try {
    // Get existing resources
    const existingResources = await client.getStateResources(TABLE_IDS.resources, stateCode);
    
    // Delete existing resources
    for (const resource of existingResources) {
      await client.deleteRecord(TABLE_IDS.resources, resource.id);
    }

    // Create new resources
    for (const resource of resources) {
      await client.createRecord(TABLE_IDS.resources, {
        stateCode,
        title: resource.title,
        url: resource.url,
        resourceType: resource.resourceType,
      });
    }

    console.log(`Updated resources for state: ${stateCode}`);
  } catch (error) {
    console.error(`Error updating resources for ${stateCode}:`, error);
    throw error;
  }
}

async function sendErrorNotification(env, error, context = {}) {
  try {
    // Send error notification to admin
    // This could be email, Slack, or other monitoring service
    const errorMessage = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      context,
    };

    console.error('CRITICAL ERROR - Sending notification:', errorMessage);

    // In production, integrate with monitoring service (e.g., Sentry, DataDog, etc.)
    // For now, log to console which Cloudflare Workers will capture
    if (env.ADMIN_EMAIL) {
      // TODO: Implement email notification via SendGrid or similar
      console.log(`Would send email to ${env.ADMIN_EMAIL}`);
    }

    return true;
  } catch (notificationError) {
    console.error('Failed to send error notification:', notificationError);
    return false;
  }
}

async function handleScheduled(event, env) {
  const startTime = Date.now();
  const jobId = `scraper-${new Date().toISOString()}`;
  
  console.log(`[${jobId}] Starting scheduled scraper job`);

  const teableClient = new TeableClient(
    env.TEABLE_API_URL,
    env.TEABLE_BASE_ID,
    env.TEABLE_API_TOKEN
  );

  const scraper = new RegulationScraper();

  try {
    // Scrape all states
    console.log(`[${jobId}] Scraping all states...`);
    const { results, errors: scrapeErrors } = await scraper.scrapeAllStates();

    console.log(`[${jobId}] Scraped ${results.length} states, ${scrapeErrors.length} scrape errors`);

    // Update Teable with scraped data
    let updatedCount = 0;
    let createdCount = 0;
    const updateErrors = [];

    for (const stateData of results) {
      try {
        const { details, resources, ...stateFields } = stateData;

        // Update state record
        const result = await updateStateInTeable(teableClient, stateFields);
        if (result.created) createdCount++;
        if (result.updated) updatedCount++;

        // Update details and resources
        await updateStateDetails(teableClient, stateData.code, details);
        await updateStateResources(teableClient, stateData.code, resources);
      } catch (error) {
        console.error(`[${jobId}] Failed to update state ${stateData.code}:`, error);
        updateErrors.push({
          state: stateData.code,
          error: `Update failed: ${error.message}`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Invalidate API cache
    console.log(`[${jobId}] Invalidating API cache...`);
    const cacheInvalidated = await invalidateAPICache(env.API_CACHE_INVALIDATE_URL);

    // Calculate execution time
    const executionTime = Date.now() - startTime;

    // Log summary
    const summary = {
      jobId,
      timestamp: new Date().toISOString(),
      executionTimeMs: executionTime,
      statesProcessed: results.length,
      statesCreated: createdCount,
      statesUpdated: updatedCount,
      statesVerified: results.length - createdCount - updatedCount,
      scrapeErrors: scrapeErrors.length,
      updateErrors: updateErrors.length,
      totalErrors: scrapeErrors.length + updateErrors.length,
      cacheInvalidated,
      status: updateErrors.length === 0 ? 'success' : 'partial_failure',
    };

    console.log(`[${jobId}] Scraper job completed:`, JSON.stringify(summary));

    // Send notification if there were critical errors
    if (updateErrors.length > 0) {
      console.warn(`[${jobId}] Update errors detected:`, updateErrors);
      await sendErrorNotification(env, new Error('Scraper job had update errors'), {
        jobId,
        updateErrors,
        summary,
      });
    }

    // Warn if scrape errors occurred
    if (scrapeErrors.length > 0) {
      console.warn(`[${jobId}] Scrape errors:`, scrapeErrors);
    }

    // Warn if execution took too long (>30 seconds)
    if (executionTime > 30000) {
      console.warn(`[${jobId}] Execution time exceeded 30 seconds: ${executionTime}ms`);
    }

    return summary;
  } catch (error) {
    const executionTime = Date.now() - startTime;
    
    console.error(`[${jobId}] Fatal error in scraper job:`, error);
    
    // Send critical error notification
    await sendErrorNotification(env, error, {
      jobId,
      executionTimeMs: executionTime,
      stage: 'fatal',
    });

    // Re-throw to ensure Cloudflare logs the failure
    throw error;
  }
}

async function handleRequest(request, env) {
  // Manual trigger endpoint for testing
  if (request.method === 'POST' && request.url.includes('/scrape')) {
    try {
      const result = await handleScheduled({}, env);
      return new Response(JSON.stringify(result), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response('Not found', { status: 404 });
}

export default {
  async fetch(request, env) {
    return handleRequest(request, env);
  },
  async scheduled(event, env) {
    return handleScheduled(event, env);
  },
};
