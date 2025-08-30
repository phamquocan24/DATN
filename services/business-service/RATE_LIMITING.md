# Rate Limiting & Performance Optimizations

## Overview
This document outlines the rate limiting configuration and performance optimizations implemented to prevent "429 Too Many Requests" errors.

## Rate Limiting Configuration

### Current Settings
- **Window**: 15 minutes (900,000ms)
- **Production Limit**: 1,000 requests per window
- **Test Limit**: 100,000 requests per window

### Environment-based Skipping
Rate limiting is automatically skipped for:
- `NODE_ENV=development` (default when not set)
- `NODE_ENV=test`
- Requests from localhost

### Headers Returned
- `RateLimit-Policy`: Shows policy configuration
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Remaining requests in current window
- `RateLimit-Reset`: Seconds until window resets

## Frontend Optimizations

### 1. API Caching (`apiCache.ts`)
Implemented client-side caching with TTL (Time To Live):
- **getAllJobs**: 2 minutes cache
- **getLatestJobs**: 1 minute cache
- **getFeaturedJobs**: 3 minutes cache
- **searchJobs**: 30 seconds cache (shorter for dynamic search)

### 2. Request Debouncing
Search queries are debounced by 300ms to prevent excessive API calls while typing.

### 3. Smart Fallback Logic
Replaced parallel fallback calls with sequential error handling to reduce duplicate requests.

### 4. Cache Management
- Automatic cleanup every 5 minutes
- Manual cache clearing for job-related data when needed
- Environment-aware cache keys

## Backend Optimizations

### 1. Pagination Support
All job endpoints now support proper pagination:
- `/api/v1/jobs` - General jobs with pagination
- `/api/v1/jobs/latest` - Latest jobs with page/limit support
- `/api/v1/jobs/search` - Search with pagination

### 2. Status Filtering
Updated to include both ACTIVE and PUBLISHED jobs:
```javascript
status: ['ACTIVE', 'PUBLISHED']
```

### 3. Response Optimization
Consistent response format with pagination metadata:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## Monitoring

### Rate Limit Headers
Monitor these headers in API responses:
- High remaining count = healthy
- Low remaining count = approaching limit
- Reset time = when limit resets

### Development Tips
1. Set `NODE_ENV=development` to skip rate limiting
2. Monitor browser network tab for excessive requests
3. Use cache effectively for repeated data
4. Implement proper error handling for 429 responses

## Troubleshooting

### Still Getting 429 Errors?
1. Check `NODE_ENV` environment variable
2. Verify request hostname (should be localhost)
3. Clear rate limit cache by restarting server
4. Check for request loops in frontend code

### Performance Issues?
1. Monitor cache hit rates
2. Adjust TTL values based on data freshness needs
3. Implement request batching for multiple related calls
4. Use pagination appropriately
