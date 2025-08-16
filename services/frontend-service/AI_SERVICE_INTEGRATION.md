# AI Service Integration for CV Processing

This document describes the integration of AI service for CV extraction and enhancement in the frontend application.

## Overview

The frontend now integrates with the AI service (`extract_and_improve_cv`) for CV processing instead of using the business service. This provides direct access to AI-powered CV analysis and improvement suggestions.

## Files Modified

### 1. `src/services/cvApi.ts` (NEW)
- **Purpose**: API service for CV operations using AI service
- **Endpoints**:
  - `extractCV(file)`: Extract CV information from PDF
  - `improveCV(request)`: Get AI improvement suggestions
  - `saveFeedback(rating, comment)`: Save user feedback
  - `checkAIServiceHealth()`: Health check

### 2. `src/components/candidate/Resume.tsx` (UPDATED)
- **Changes**:
  - Removed mock data and business service API calls
  - Added AI service integration for CV extraction
  - Updated UI to show real extracted data
  - Added localStorage for temporary data storage
  - Improved loading states and error handling

### 3. `src/components/candidate/EnhanceResumeModal.tsx` (UPDATED)
- **Changes**:
  - Integrated with AI improvement endpoint
  - Added form inputs for job details (company, position, field)
  - Updated UI to display AI enhancement report
  - Removed mock enhancement data

### 4. `src/services/index.ts` (UPDATED)
- **Changes**: Added export for `cvApi`

## AI Service Configuration

### Base URL
```typescript
const AI_SERVICE_BASE_URL = 'http://localhost:8003';
```

### Endpoints Used
1. **POST** `/extract-cv` - Extract CV information
2. **POST** `/improve-cv` - Get improvement suggestions  
3. **POST** `/feedback` - Save user feedback
4. **GET** `/health` - Health check

## Data Flow

### CV Upload & Extraction
1. User uploads PDF file
2. Frontend calls `cvApi.extractCV(file)`
3. AI service extracts structured information
4. Data is displayed and stored locally
5. Resume card is created with extracted info

### CV Enhancement
1. User clicks "Enhance resume" on a resume card
2. Modal opens with form for job details
3. User fills in company, position, and field
4. Frontend calls `cvApi.improveCV(request)`
5. AI service analyzes CV and provides suggestions
6. Enhancement report is displayed in modal

## Interface Definitions

### CVExtractResponse
```typescript
interface CVExtractResponse {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  objective: string;
  education: Array<{...}>;
  experience: Array<{...}>;
  skills: Array<{...}>;
  certifications: Array<{...}>;
  projects: Array<{...}>;
  languages: Array<{...}>;
}
```

### CVImproveRequest
```typescript
interface CVImproveRequest {
  cv: File;
  cong_ty_ung_tuyen: string;  // Target company
  vi_tri_ung_tuyen: string;   // Position
  linh_vuc: string;           // Field/Industry
}
```

## Error Handling

- Network errors are caught and displayed to user
- File validation (PDF only, max 5MB)
- Required field validation for enhancement
- Loading states for all async operations

## Future Improvements

1. **Backend Integration**: Replace localStorage with proper backend storage
2. **Enhanced Parsing**: Parse AI response into structured format
3. **Feedback System**: Implement rating system for AI suggestions
4. **Caching**: Add response caching for better performance
5. **Retry Logic**: Add automatic retry for failed requests

## Testing

### Prerequisites
1. AI service must be running on port 8003
2. AI service should have GROQ API key configured
3. PDF files for testing should be under 5MB

### Test Scenarios
1. Upload valid PDF and verify extraction
2. Try enhancement with different job details
3. Test error cases (invalid files, network errors)
4. Verify localStorage persistence across sessions

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure AI service has CORS enabled
2. **File Upload Fails**: Check file size and format
3. **Enhancement Fails**: Verify all form fields are filled
4. **Network Errors**: Check AI service is running on correct port

### Debug Steps
1. Check browser console for errors
2. Verify AI service health endpoint
3. Check network tab for failed requests
4. Validate file format and size

## Business Service (Commented Out)

The business service integration has been commented out but preserved for future reference:

```typescript
// Business Service CV operations (commented out)
/*
export const uploadCVToBusinessService = async (request: CVUploadRequest): Promise<any> => {
  // Implementation commented out
};
*/
```

This allows for easy switching back to business service if needed in the future.
