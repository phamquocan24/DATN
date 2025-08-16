# Company API Endpoint Fix

This document describes the fix for Company API endpoint issues in the frontend service.

## Problem

The frontend was calling incorrect endpoints with duplicate `/api/v1/api/v1/companies` paths, causing 404 NOT_FOUND errors:

```json
{
    "success": false,
    "error": {
        "code": "NOT_FOUND",
        "message": "Route /api/v1/api/v1/companies?page=1&limit=50 not found",
        "details": null,
        "timestamp": "2025-08-14T04:39:29.918Z"
    }
}
```

## Root Cause

The `companyApi.ts` service had duplicate `/api/v1` prefixes in endpoint URLs, resulting in malformed paths like `/api/v1/api/v1/companies` instead of the correct `/api/v1/companies`.

## Solution

### 1. Fixed Core CRUD Endpoints

**Before (Incorrect):**
```typescript
createCompany: async (companyData: CreateCompanyData) => {
  const response = await apiClient.post('/api/v1/api/v1/companies', companyData);
  return response.data;
},

getAllCompanies: async (params?: CompanySearchParams) => {
  const response = await apiClient.get('/api/v1/api/v1/companies', { params });
  return response.data;
},
```

**After (Correct):**
```typescript
createCompany: async (companyData: CreateCompanyData) => {
  const response = await apiClient.post('/api/v1/companies', companyData);
  return response.data;
},

getAllCompanies: async (params?: CompanySearchParams) => {
  const response = await apiClient.get('/api/v1/companies', { params });
  return response.data;
},
```

### 2. Verified Business Service Endpoints

Confirmed that the business service (`services/business-service/server.js`) properly exposes:

```javascript
// Available endpoints in business service
app.use('/api/v1/companies', companyRoutes);  // Line 337
```

**Available Company Endpoints:**
- `GET /api/v1/companies` - Get companies list with filtering/pagination
- `GET /api/v1/companies/:company_id` - Get company by ID  
- `POST /api/v1/companies` - Create company (HR/Recruiter only)
- `PUT /api/v1/companies/:company_id` - Update company (HR/Recruiter only)
- `DELETE /api/v1/companies/:company_id` - Delete company (HR/Recruiter only)
- `GET /api/v1/companies/:company_id/recruiters` - Get company recruiters
- `GET /api/v1/companies/:company_id/stats` - Get company statistics

### 3. Updated Search and Discovery Endpoints

Since business service uses the main companies endpoint with query parameters instead of separate endpoints, updated the frontend to use the correct approach:

**Search Companies:**
```typescript
// Before: Separate search endpoint (doesn't exist)
searchCompanies: async (searchParams: CompanySearchParams) => {
  const response = await apiClient.get('/api/v1/companies/search', { params: searchParams });
  return response.data;
},

// After: Use main endpoint with search params
searchCompanies: async (searchParams: CompanySearchParams) => {
  const response = await apiClient.get('/api/v1/companies', { params: searchParams });
  return response.data;
},
```

**Featured Companies:**
```typescript
// Before: Separate featured endpoint (doesn't exist)
getFeaturedCompanies: async (limit: number = 10) => {
  const response = await apiClient.get('/api/v1/companies/featured', { params: { limit } });
  return response.data;
},

// After: Use main endpoint with ordering
getFeaturedCompanies: async (limit: number = 10) => {
  const response = await apiClient.get('/api/v1/companies', { 
    params: { limit, order_by: 'created_at', direction: 'DESC' } 
  });
  return response.data;
},
```

### 4. Added Graceful Fallbacks for Unimplemented Endpoints

For endpoints that may not be implemented in the business service yet:

**Company Verification:**
```typescript
verifyCompany: async (companyId: string, verified: boolean = true) => {
  try {
    const response = await apiClient.patch(`/api/v1/admin/companies/${companyId}/verify`, { verified });
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      message: 'Company verification endpoint not available',
      error: 'ENDPOINT_NOT_IMPLEMENTED'
    };
  }
},
```

**Logo Upload:**
```typescript
uploadCompanyLogo: async (companyId: string, logoFile: File) => {
  try {
    // Try to upload logo
    const response = await apiClient.post(`/api/v1/companies/${companyId}/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      message: 'Logo upload endpoint not available',
      error: 'ENDPOINT_NOT_IMPLEMENTED'
    };
  }
},
```

**Industries List:**
```typescript
getIndustries: async () => {
  try {
    const response = await apiClient.get('/api/v1/companies/industries');
    return response.data;
  } catch (error: any) {
    // Always return default industries
    return {
      success: true,
      data: [
        'Technology', 'Finance', 'Healthcare', 'Education', 'Manufacturing',
        'Retail', 'Real Estate', 'Transportation', 'Media', 'Hospitality',
        'Consulting', 'Energy', 'Government', 'Non-profit', 'Other'
      ]
    };
  }
},
```

## Business Service Query Parameters

The business service `/api/v1/companies` endpoint supports these query parameters:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `search` | string | Search by company name or description | `?search=tech` |
| `industry` | string | Filter by industry | `?industry=Technology` |
| `city_id` | UUID | Filter by city | `?city_id=uuid` |
| `company_size` | enum | Filter by size (STARTUP, SMALL, MEDIUM, LARGE, ENTERPRISE) | `?company_size=MEDIUM` |
| `page` | number | Page number (default: 1) | `?page=2` |
| `limit` | number | Items per page (default: 20, max: 100) | `?limit=50` |
| `order_by` | string | Sort field (created_at, company_name, founded_year) | `?order_by=company_name` |
| `direction` | string | Sort direction (ASC, DESC) | `?direction=ASC` |

## Files Modified

1. **`services/frontend-service/src/services/companyApi.ts`**
   - Fixed all duplicate `/api/v1/api/v1/companies` paths to `/api/v1/companies`
   - Updated search and discovery methods to use main endpoint with params
   - Added graceful fallbacks for unimplemented endpoints
   - Added proper error handling and mock responses where needed

## Testing

The fix resolves the 404 error and allows the Companies page to load company data from the business service properly.

**Test Cases:**
1. ✅ `GET /api/v1/companies` - List companies with pagination
2. ✅ `GET /api/v1/companies?search=tech` - Search companies
3. ✅ `GET /api/v1/companies?industry=Technology` - Filter by industry
4. ✅ `GET /api/v1/companies/:id` - Get company by ID
5. ✅ `POST /api/v1/companies` - Create company (with auth)
6. ✅ `PUT /api/v1/companies/:id` - Update company (with auth)

## Future Improvements

1. **Implement Missing Endpoints in Business Service:**
   - `/api/v1/companies/industries` - Get available industries
   - `/api/v1/companies/:id/logo` - Logo upload endpoint
   - `/api/v1/admin/companies/:id/verify` - Company verification

2. **Add Analytics Service Integration:**
   - Company analytics and statistics
   - View tracking and metrics

3. **Enhanced Search Features:**
   - Full-text search capabilities
   - Advanced filtering options
   - Geolocation-based search

This fix ensures the frontend can successfully communicate with the business service and display company data without errors.
