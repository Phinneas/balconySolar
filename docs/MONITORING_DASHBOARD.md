# Monitoring Dashboard & Analytics Guide

## Overview

The Balcony Solar Checker includes comprehensive monitoring and analytics capabilities to track user engagement, API performance, and collect user feedback. This guide explains how to use the monitoring system to track metrics and iterate on improvements.

## Components

### 1. Frontend Analytics Tracker

The frontend analytics tracker (`frontend/src/analytics.js`) automatically tracks user interactions and engagement metrics.

#### Features

- **Session Tracking**: Unique session IDs for each user visit
- **Event Tracking**: Automatic tracking of user interactions
- **Periodic Sending**: Events are batched and sent to the backend periodically
- **Offline Support**: Events are retained if the network is unavailable

#### Tracked Events

- `page_view`: User visits the checker
- `select_state`: User selects a state from the dropdown
- `view_state`: User views state results
- `copy_link`: User copies the shareable link
- `click_resource`: User clicks on a resource link
- `click_newsletter_cta`: User clicks the newsletter CTA
- `click_related_content`: User clicks related content links
- `error`: An error occurs in the application
- `session_end`: User session ends

#### Usage in Frontend

```javascript
import AnalyticsTracker from './analytics.js';

// Initialize tracker
const tracker = new AnalyticsTracker({
  apiUrl: 'http://localhost:8787',
  maxEventsBeforeSend: 10,
  sendIntervalMs: 30000,
});

// Track events
tracker.trackStateSelection('ca');
tracker.trackStateView('ca', true);
tracker.trackLinkCopy('ca');
tracker.trackResourceClick('ca', 'CPUC', 'https://cpuc.ca.gov');
tracker.trackNewsletterClick('ca');
tracker.trackRelatedContentClick('guide', 'ca');
tracker.trackError('NETWORK_ERROR', 'Failed to fetch');

// Flush events on page unload
window.addEventListener('beforeunload', () => {
  tracker.flush();
});
```

### 2. User Feedback Collector

The feedback collector (`frontend/src/feedback.js`) allows users to submit ratings, suggestions, and bug reports.

#### Features

- **Rating Submission**: 1-5 star ratings
- **Suggestions**: Feature requests and improvements
- **Bug Reports**: Error reports with email for follow-up
- **General Feedback**: Open-ended feedback

#### Usage in Frontend

```javascript
import FeedbackCollector from './feedback.js';

const feedback = new FeedbackCollector({
  apiUrl: 'http://localhost:8787',
});

// Submit rating
await feedback.submitRating(5, 'ca');

// Submit suggestion
await feedback.submitSuggestion('Add more states', 'ca');

// Submit bug report
await feedback.submitBugReport(
  'Link not working',
  'ny',
  'user@example.com'
);

// Submit general feedback
await feedback.submitGeneralFeedback(
  'Love this tool!',
  'tx',
  'user@example.com'
);
```

### 3. Backend Analytics Service

The backend analytics service (`api/src/analytics.js`) processes and stores analytics data.

#### Features

- **Event Recording**: Stores user events with session tracking
- **Feedback Recording**: Stores user feedback and ratings
- **Analytics Summary**: Generates summary statistics
- **Engagement Metrics**: Calculates conversion rates and interactions
- **Feedback Summary**: Aggregates feedback by type

#### API Endpoints

##### POST /api/analytics/events

Records user events from the frontend.

**Request:**
```json
{
  "sessionId": "session-1234567890",
  "events": [
    {
      "type": "view_state",
      "timestamp": 1234567890,
      "sessionId": "session-1234567890",
      "data": {
        "stateCode": "ca",
        "isLegal": true
      }
    }
  ]
}
```

**Response:**
```json
{
  "status": "events recorded",
  "count": 1,
  "timestamp": "2024-01-08T12:00:00Z"
}
```

##### POST /api/feedback

Records user feedback.

**Request:**
```json
{
  "type": "rating",
  "rating": 5,
  "stateCode": "ca",
  "email": "user@example.com",
  "timestamp": "2024-01-08T12:00:00Z",
  "userAgent": "Mozilla/5.0...",
  "url": "https://checker.solarcurrents.com?state=ca"
}
```

**Response:**
```json
{
  "status": "feedback recorded",
  "timestamp": "2024-01-08T12:00:00Z"
}
```

##### GET /api/analytics/summary

Gets analytics summary (requires authentication).

**Query Parameters:**
- `window`: Time window in milliseconds (default: 86400000 = 24 hours)

**Response:**
```json
{
  "timeWindow": "24 hours",
  "totalEvents": 1250,
  "totalSessions": 342,
  "totalFeedback": 45,
  "eventTypes": {
    "view_state": 450,
    "select_state": 342,
    "copy_link": 180,
    "click_resource": 120,
    "click_newsletter_cta": 95,
    "click_related_content": 63
  },
  "feedbackTypes": {
    "rating": 30,
    "suggestion": 10,
    "bug_report": 5
  },
  "topStates": [
    { "code": "ca", "count": 150 },
    { "code": "ny", "count": 120 },
    { "code": "tx", "count": 95 }
  ],
  "averageRating": "4.50",
  "activeSessions": 12
}
```

##### GET /api/analytics/engagement

Gets engagement metrics (requires authentication).

**Query Parameters:**
- `window`: Time window in milliseconds (default: 86400000 = 24 hours)

**Response:**
```json
{
  "uniqueSessions": 342,
  "totalInteractions": 1250,
  "interactions": {
    "stateSelections": 342,
    "stateViews": 450,
    "linkCopies": 180,
    "resourceClicks": 120,
    "newsletterClicks": 95,
    "relatedContentClicks": 63,
    "errors": 5
  },
  "conversionRates": {
    "viewToShare": "40.00",
    "viewToNewsletter": "21.11",
    "viewToRelatedContent": "14.00"
  }
}
```

##### GET /api/analytics/feedback

Gets feedback summary (requires authentication).

**Query Parameters:**
- `window`: Time window in milliseconds (default: 86400000 = 24 hours)

**Response:**
```json
{
  "totalFeedback": 45,
  "byType": {
    "rating": 30,
    "suggestion": 10,
    "bug_report": 5
  },
  "ratings": {
    "average": "4.50",
    "distribution": {
      "1": 2,
      "2": 1,
      "3": 5,
      "4": 10,
      "5": 12
    }
  },
  "suggestions": [
    {
      "message": "Add more states",
      "stateCode": "ca",
      "timestamp": "2024-01-08T12:00:00Z"
    }
  ],
  "bugReports": [
    {
      "message": "Link not working",
      "stateCode": "ny",
      "email": "user@example.com",
      "timestamp": "2024-01-08T12:00:00Z"
    }
  ]
}
```

## Monitoring Metrics

### Key Performance Indicators (KPIs)

1. **User Engagement**
   - Total sessions in 24 hours
   - Average session duration
   - Unique users
   - Return visitor rate

2. **Feature Usage**
   - State selections per session
   - Share link copies (indicates value)
   - Resource link clicks (indicates trust)
   - Newsletter signups (indicates lead generation)

3. **Conversion Rates**
   - View to Share: % of users who share results
   - View to Newsletter: % of users who subscribe
   - View to Related Content: % of users who explore more

4. **User Satisfaction**
   - Average rating (1-5 stars)
   - Rating distribution
   - Suggestion count
   - Bug report count

5. **API Performance**
   - Response time (tracked by monitoring service)
   - Cache hit rate
   - Error rate
   - Uptime percentage

## Accessing the Dashboard

### Authentication

All analytics endpoints require authentication using a bearer token:

```bash
curl -H "Authorization: Bearer cache_invalidate_token_secret_key_12345" \
  http://localhost:8787/api/analytics/summary
```

### Example Dashboard Queries

**Get 24-hour summary:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8787/api/analytics/summary?window=86400000"
```

**Get 7-day summary:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8787/api/analytics/summary?window=604800000"
```

**Get engagement metrics:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8787/api/analytics/engagement"
```

**Get feedback summary:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8787/api/analytics/feedback"
```

## Iteration Process

### 1. Monitor Key Metrics

Review analytics daily to understand user behavior:

- Which states are most popular?
- What's the share rate? (indicates value)
- What's the newsletter signup rate? (indicates lead generation)
- What's the average user rating?

### 2. Analyze Feedback

Review user feedback weekly:

- What features are users requesting?
- What bugs are being reported?
- What's the sentiment of ratings?

### 3. Identify Improvements

Based on metrics and feedback:

- **High share rate**: Users find value in sharing results
- **Low newsletter rate**: Consider improving CTA placement
- **Low ratings**: Investigate bug reports and suggestions
- **Popular states**: Consider highlighting these
- **Unpopular states**: May need data verification

### 4. Implement Changes

Make targeted improvements:

- Fix reported bugs
- Implement top suggestions
- Optimize CTAs based on conversion rates
- Improve data for low-rated states

### 5. Measure Impact

After implementing changes:

- Monitor metrics for improvement
- Track before/after conversion rates
- Collect feedback on changes
- Iterate based on results

## Example Monitoring Workflow

### Daily Check (5 minutes)

```bash
# Get 24-hour summary
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8787/api/analytics/summary?window=86400000" | jq '.'

# Check engagement
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8787/api/analytics/engagement" | jq '.conversionRates'
```

### Weekly Review (30 minutes)

```bash
# Get 7-day summary
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8787/api/analytics/summary?window=604800000" | jq '.'

# Get feedback
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8787/api/analytics/feedback" | jq '.suggestions, .bugReports'

# Check API monitoring
curl http://localhost:8787/api/health | jq '.cache'
```

### Monthly Analysis (1-2 hours)

1. Review 30-day metrics
2. Analyze top suggestions and bug reports
3. Identify patterns in user behavior
4. Plan improvements for next month
5. Implement high-impact changes

## Best Practices

1. **Regular Monitoring**: Check metrics daily to catch issues early
2. **User-Centric**: Prioritize feedback that improves user experience
3. **Data-Driven**: Make decisions based on metrics, not assumptions
4. **Iterate Quickly**: Implement changes and measure impact
5. **Communicate**: Share improvements with users (e.g., "Fixed bug X based on your feedback")
6. **Privacy**: Never share individual user data; only aggregate metrics
7. **Retention**: Keep analytics data for at least 90 days for trend analysis

## Troubleshooting

### Events Not Being Recorded

1. Check browser console for errors
2. Verify API endpoint is accessible
3. Check network tab for failed requests
4. Verify authentication token is correct

### Low Engagement Metrics

1. Check if analytics is enabled in frontend
2. Verify events are being sent to backend
3. Check if users are blocking analytics
4. Review error logs for issues

### Missing Feedback

1. Verify feedback form is visible to users
2. Check if feedback endpoint is working
3. Review error logs for submission failures
4. Consider adding feedback prompts

## Integration with Existing Monitoring

The analytics system complements the existing monitoring services:

- **API Monitoring** (`api/src/monitoring.js`): Tracks API performance
- **Cron Monitoring** (`scraper/src/cron-monitoring.js`): Tracks data updates
- **Analytics Service** (`api/src/analytics.js`): Tracks user engagement

Together, these provide a complete picture of system health and user satisfaction.
