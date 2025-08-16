# JD-CV Matching Integration

This document describes the integration of JD-CV matching functionality into the Resume component.

## Overview

The frontend now includes CV-JD matching capabilities that calculate how well a candidate's CV matches with job descriptions. This provides instant feedback on CV compatibility with job requirements.

## Files Modified/Created

### 1. `src/services/matchingApi.ts` (NEW)
- **Purpose**: API service for JD-CV matching operations
- **Endpoints**:
  - `calculateSimpleMatch()`: Text-based matching calculation
  - `calculateDatabaseMatch()`: Database-based matching (requires CV/Job IDs)
  - `getJobRecommendations()`: Get job recommendations for candidate
  - `calculateTextBasedMatch()`: Enhanced text-based matching with fallback
  - `checkMatchingServiceHealth()`: Health check for matching service

### 2. `src/components/candidate/Resume.tsx` (UPDATED)
- **Changes**:
  - Added matching score calculation when uploading CV
  - Updated Resume interface to include `matchingScore` and `isCalculatingMatch`
  - Replaced contact info display with matching score in resume cards
  - Added sample job description for matching comparison
  - Integrated color-coded matching score display

### 3. `src/services/index.ts` (UPDATED)
- **Changes**: Added export for `matchingApi`

## Matching Algorithm

### Sample Job Description
The system uses a predefined Software Engineer job description for matching:

```typescript
const sampleJD = `
We are looking for a skilled Software Engineer to join our dynamic team. 

Requirements:
- Bachelor's degree in Computer Science or related field
- 2+ years of experience in software development
- Proficiency in React, Node.js, JavaScript, TypeScript
- Experience with databases (MySQL, PostgreSQL)
- Strong problem-solving skills
- Good communication skills in English

Responsibilities:
- Develop and maintain web applications
- Collaborate with cross-functional teams
- Write clean, maintainable code
- Participate in code reviews
- Debug and resolve technical issues
`;
```

### Matching Process
1. **CV Text Creation**: Combines extracted CV data into structured text
2. **Text Analysis**: Compares CV content with job description
3. **Score Calculation**: Uses word overlap and keyword matching
4. **Percentage Conversion**: Converts similarity score to percentage (0-100%)

### Fallback Calculation
If the matching service is unavailable, the system uses a local fallback:
- Word tokenization and filtering (words > 3 characters)
- Common word identification between CV and JD
- Similarity ratio calculation based on overlap

## UI Components

### Resume Card Matching Display
```typescript
// Color-coded matching score
{resume.matchingScore >= 70 ? 'bg-green-100 text-green-700' :    // Good match
 resume.matchingScore >= 50 ? 'bg-yellow-100 text-yellow-700' :  // Average match
 'bg-red-100 text-red-700'}                                      // Poor match
```

### Loading States
- **Calculating match**: Shows animated pulse during calculation
- **Match calculated**: Displays percentage with color coding
- **Not calculated**: Fallback message for missing scores

## API Service Configuration

### Matching Service URL
```typescript
const MATCHING_SERVICE_BASE_URL = 'http://localhost:8001';
```

### Service Health Check
The system checks if the matching service is available before making requests. If unavailable, it falls back to local calculation.

## Data Flow

### CV Upload & Matching
1. User uploads PDF file
2. AI service extracts CV information
3. System creates structured CV text
4. Matching algorithm compares CV with sample JD
5. Score is calculated and stored with resume
6. UI displays color-coded matching percentage

### Resume Card Display
1. Load saved resumes from localStorage
2. Display resume cards with matching scores
3. Show loading states during score calculation
4. Color-code scores: Green (70%+), Yellow (50-69%), Red (<50%)

## Interface Definitions

### MatchingScore
```typescript
interface MatchingScore {
  overall_similarity: number;
  skills_similarity: number;
  experience_similarity: number;
  education_similarity: number;
  weighted_score: number;
}
```

### SimpleMatchRequest
```typescript
interface SimpleMatchRequest {
  cv_text: string;
  job_description: string;
  job_requirements?: string;
  job_responsibilities?: string;
}
```

### Updated Resume Interface
```typescript
interface Resume {
  // ... existing fields
  matchingScore?: number;        // Matching percentage (0-100)
  isCalculatingMatch?: boolean;  // Loading state
}
```

## Error Handling

- **Service Unavailable**: Falls back to local calculation
- **Calculation Failure**: Returns 0% score with warning
- **Network Errors**: Gracefully handles connection issues
- **Invalid Data**: Validates input before processing

## Future Enhancements

1. **Real-time JD Input**: Allow users to paste job descriptions for matching
2. **Multiple JD Support**: Compare CV against multiple job postings
3. **Detailed Breakdown**: Show skill-wise, experience-wise matching
4. **Job Recommendations**: Suggest jobs based on CV content
5. **Machine Learning**: Improve matching accuracy with ML models

## Performance Considerations

- **Lazy Calculation**: Only calculate when needed
- **Caching**: Store results to avoid recalculation
- **Batch Processing**: Process multiple CVs efficiently
- **Fallback Strategy**: Ensure functionality without external service

## Testing

### Test Scenarios
1. Upload CV and verify matching calculation
2. Test color-coded score display
3. Verify fallback calculation when service unavailable
4. Test loading states during calculation
5. Check localStorage persistence of scores

### Mock Data
The system includes sample job descriptions and CVs for testing matching functionality.

## Troubleshooting

### Common Issues
1. **Matching Service Not Running**: Check if service is on port 8001
2. **Low Matching Scores**: Verify CV content extraction quality
3. **Calculation Timeout**: Implement timeout handling
4. **UI Not Updating**: Check state management for matching scores

### Debug Steps
1. Check browser console for matching API errors
2. Verify CV text generation from extracted data
3. Test sample JD content quality
4. Validate matching algorithm logic

This integration provides a solid foundation for CV-JD matching with room for future enhancements and improvements.
