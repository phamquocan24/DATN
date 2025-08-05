# Test API Integration Guide

## 📋 Overview

Test API đã được tích hợp hoàn chỉnh cho 3 roles với các permissions khác nhau:

- **🔴 Admin**: Full access - quản lý tất cả tests, override permissions
- **🟡 HR/Recruiter**: Create & manage own tests, assign to candidates, view results
- **🟢 Candidate**: Take assigned tests, view own results

## 🚀 API Services Setup

### Import Services
```typescript
import { testApi, hrApi, candidateApi, adminApi } from '../services';
```

## 👨‍💼 HR/Recruiter Functions

### Create New Test
```typescript
const createTest = async () => {
  const testData = {
    job_id: "123e4567-e89b-12d3-a456-426614174000",
    test_name: "JavaScript Developer Assessment",
    test_description: "Technical assessment for JavaScript developers",
    test_type: "MULTIPLE_CHOICE",
    time_limit: 90,
    passing_score: 75,
    is_active: true,
    questions: [
      {
        question_text: "What is the correct way to declare a variable in JavaScript?",
        question_type: "MULTIPLE_CHOICE",
        options: [
          "var x = 1;",
          "let x = 1;",
          "const x = 1;",
          "All of the above"
        ],
        correct_answer: "All of the above",
        points: 5
      }
    ]
  };

  try {
    const result = await hrApi.createTest(testData);
    console.log('Test created:', result);
  } catch (error) {
    console.error('Failed to create test:', error);
  }
};
```

### Get HR's Tests
```typescript
const getMyTests = async () => {
  try {
    const tests = await hrApi.getMyTests({
      page: 1,
      limit: 10,
      test_type: "MULTIPLE_CHOICE",
      is_active: true
    });
    console.log('My tests:', tests);
  } catch (error) {
    console.error('Failed to fetch tests:', error);
  }
};
```

### Assign Test to Candidate
```typescript
const assignTest = async (testId: string) => {
  try {
    const assignment = await hrApi.assignTestToCandidate(testId, {
      candidate_id: "123e4567-e89b-12d3-a456-426614174001",
      application_id: "123e4567-e89b-12d3-a456-426614174002"
    });
    console.log('Test assigned:', assignment);
  } catch (error) {
    console.error('Failed to assign test:', error);
  }
};
```

### View Test Results
```typescript
const getTestResults = async (testId: string) => {
  try {
    const results = await hrApi.getTestResults(testId, {
      page: 1,
      limit: 20,
      status: "COMPLETED"
    });
    console.log('Test results:', results);
  } catch (error) {
    console.error('Failed to get results:', error);
  }
};
```

### Get Test Statistics
```typescript
const getStats = async (testId: string) => {
  try {
    const stats = await hrApi.getTestStatistics(testId);
    console.log('Test statistics:', stats);
  } catch (error) {
    console.error('Failed to get stats:', error);
  }
};
```

## 👨‍🎓 Candidate Functions

### Get My Assigned Tests
```typescript
const getMyTests = async () => {
  try {
    const myTests = await candidateApi.getMyTests({
      status: "ASSIGNED",
      page: 1,
      limit: 10
    });
    console.log('My assigned tests:', myTests);
  } catch (error) {
    console.error('Failed to fetch my tests:', error);
  }
};
```

### Start a Test
```typescript
const startTest = async (testId: string) => {
  try {
    const testSession = await candidateApi.startTest(testId);
    console.log('Test started:', testSession);
    // Navigate to test taking page
  } catch (error) {
    console.error('Failed to start test:', error);
  }
};
```

### Submit Test Answers
```typescript
const submitTest = async (testId: string) => {
  const answers = {
    "123e4567-e89b-12d3-a456-426614174004": "All of the above",
    "123e4567-e89b-12d3-a456-426614174005": "True",
    "123e4567-e89b-12d3-a456-426614174006": "JavaScript is a programming language..."
  };

  try {
    const result = await candidateApi.submitTest(testId, answers);
    console.log('Test submitted:', result);
    // Show success message and results
  } catch (error) {
    console.error('Failed to submit test:', error);
  }
};
```

### Save Test Progress (Auto-save)
```typescript
const saveProgress = async (testId: string, currentAnswers: Record<string, string>) => {
  try {
    await candidateApi.saveTestProgress(testId, currentAnswers);
    console.log('Progress saved');
  } catch (error) {
    console.error('Failed to save progress:', error);
  }
};

// Auto-save every 30 seconds
useEffect(() => {
  const interval = setInterval(() => {
    if (currentAnswers && Object.keys(currentAnswers).length > 0) {
      saveProgress(testId, currentAnswers);
    }
  }, 30000);

  return () => clearInterval(interval);
}, [testId, currentAnswers]);
```

### Get Test Result
```typescript
const getMyResult = async (testId: string) => {
  try {
    const result = await candidateApi.getMyTestResult(testId);
    console.log('My test result:', result);
  } catch (error) {
    console.error('Failed to get result:', error);
  }
};
```

## 👨‍💻 Admin Functions

### Get All Tests in System
```typescript
const getAllTests = async () => {
  try {
    const allTests = await adminApi.getAllTests({
      page: 1,
      limit: 50,
      search: "JavaScript",
      test_type: "MULTIPLE_CHOICE",
      is_active: true
    });
    console.log('All tests:', allTests);
  } catch (error) {
    console.error('Failed to fetch all tests:', error);
  }
};
```

### Override Test (Admin Emergency Action)
```typescript
const overrideTest = async (testId: string, candidateId: string) => {
  try {
    const result = await adminApi.overrideTestAssignment(testId, candidateId, 'reset');
    console.log('Test overridden:', result);
  } catch (error) {
    console.error('Failed to override test:', error);
  }
};
```

### Bulk Test Actions
```typescript
const bulkActions = async (testIds: string[]) => {
  try {
    const result = await adminApi.bulkTestAction('deactivate', testIds);
    console.log('Bulk action completed:', result);
  } catch (error) {
    console.error('Bulk action failed:', error);
  }
};
```

### Get Test Analytics
```typescript
const getAnalytics = async () => {
  try {
    const analytics = await adminApi.getTestAnalytics({
      start_date: "2024-01-01",
      end_date: "2024-12-31",
      test_type: "MULTIPLE_CHOICE"
    });
    console.log('Test analytics:', analytics);
  } catch (error) {
    console.error('Failed to get analytics:', error);
  }
};
```

## 🎯 Component Integration Examples

### HR Test Management Component
```typescript
import React, { useState, useEffect } from 'react';
import { hrApi } from '../services';

const TestManagement: React.FC = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const result = await hrApi.getMyTests({ page: 1, limit: 10 });
      setTests(result.data || []);
    } catch (error) {
      console.error('Failed to fetch tests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const handleCreateTest = async (testData: any) => {
    try {
      await hrApi.createTest(testData);
      fetchTests(); // Refresh list
    } catch (error) {
      console.error('Failed to create test:', error);
    }
  };

  return (
    <div className="test-management">
      <h2>My Tests</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="test-list">
          {tests.map((test: any) => (
            <div key={test.test_id} className="test-item">
              <h3>{test.test_name}</h3>
              <p>{test.test_description}</p>
              <button onClick={() => handleAssignTest(test.test_id)}>
                Assign to Candidate
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### Candidate Test Taking Component
```typescript
import React, { useState, useEffect } from 'react';
import { candidateApi } from '../services';

const TestTaking: React.FC<{ testId: string }> = ({ testId }) => {
  const [test, setTest] = useState(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    loadTest();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [testId]);

  const loadTest = async () => {
    try {
      const testData = await candidateApi.getAssignedTest(testId);
      setTest(testData);
      setTimeRemaining(testData.time_limit * 60); // Convert to seconds
    } catch (error) {
      console.error('Failed to load test:', error);
    }
  };

  const updateTimer = async () => {
    try {
      const timeData = await candidateApi.getTestTimeRemaining(testId);
      setTimeRemaining(timeData.remaining_seconds);
      
      if (timeData.remaining_seconds <= 0) {
        handleSubmit(); // Auto-submit when time runs out
      }
    } catch (error) {
      console.error('Failed to update timer:', error);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
    
    // Auto-save progress
    candidateApi.saveTestProgress(testId, newAnswers);
  };

  const handleSubmit = async () => {
    try {
      const result = await candidateApi.submitTest(testId, answers);
      console.log('Test submitted:', result);
      // Navigate to results page
    } catch (error) {
      console.error('Failed to submit test:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="test-taking">
      <div className="test-header">
        <h2>{test?.test_name}</h2>
        <div className="timer">
          Time Remaining: {formatTime(timeRemaining)}
        </div>
      </div>
      
      <div className="questions">
        {test?.questions?.map((question: any, index: number) => (
          <div key={question.question_id} className="question">
            <h3>Question {index + 1}</h3>
            <p>{question.question_text}</p>
            
            {question.question_type === 'MULTIPLE_CHOICE' && (
              <div className="options">
                {question.options.map((option: string, optIndex: number) => (
                  <label key={optIndex}>
                    <input
                      type="radio"
                      name={question.question_id}
                      value={option}
                      onChange={(e) => handleAnswerChange(question.question_id, e.target.value)}
                    />
                    {option}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      <button onClick={handleSubmit} className="submit-btn">
        Submit Test
      </button>
    </div>
  );
};
```

## 🔗 API Endpoints Reference

| Role | Method | Endpoint | Description |
|------|--------|----------|-------------|
| HR | POST | `/api/v1/tests` | Create new test |
| HR | GET | `/api/v1/tests/{id}` | Get test details (with answers) |
| HR | PUT | `/api/v1/tests/{id}` | Update test |
| HR | DELETE | `/api/v1/tests/{id}` | Delete test |
| HR | POST | `/api/v1/tests/{id}/assign` | Assign test to candidate |
| HR | GET | `/api/v1/tests/{id}/results` | Get test results |
| HR | GET | `/api/v1/tests/{id}/stats` | Get test statistics |
| Candidate | GET | `/api/v1/tests/my-tests` | Get assigned tests |
| Candidate | GET | `/api/v1/tests/{id}` | Get test details (no answers) |
| Candidate | POST | `/api/v1/tests/{id}/start` | Start test |
| Candidate | POST | `/api/v1/tests/{id}/submit` | Submit test answers |
| Candidate | POST | `/api/v1/tests/{id}/save-progress` | Save progress |
| Admin | GET | `/api/v1/admin/tests` | Get all tests |
| Admin | PUT | `/api/v1/admin/tests/{id}` | Update any test |
| Admin | DELETE | `/api/v1/admin/tests/{id}` | Delete any test |
| Admin | POST | `/api/v1/admin/tests/bulk-action` | Bulk operations |
| Admin | POST | `/api/v1/admin/tests/{id}/override` | Override test assignment |

## ⚠️ Error Handling

```typescript
const handleApiCall = async () => {
  try {
    const result = await hrApi.createTest(testData);
    // Success handling
  } catch (error: any) {
    if (error.response?.status === 403) {
      console.error('Permission denied');
    } else if (error.response?.status === 404) {
      console.error('Test not found');
    } else {
      console.error('API call failed:', error.message);
    }
  }
};
```

## 🎉 Ready to Use!

All test API integrations are now ready and can be used in your components. Each role has appropriate permissions and access levels as specified in the API documentation.