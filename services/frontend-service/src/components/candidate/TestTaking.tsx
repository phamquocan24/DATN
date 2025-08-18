import React, { useState, useEffect } from 'react';
import Avatar from '../../assets/Avatar17.png';
import candidateApi from '../../services/candidateApi';

interface TestAssignment {
  result_id: string;
  test_id: string;
  application_id: string;
  test_name: string;
  test_description: string;
  time_limit: number;
  passing_score: number;
  job_title: string;
  company_name: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'TIMEOUT' | 'ABANDONED';
  created_at: string; // For assigned date
  start_time?: string; // For started date  
  submit_time?: string; // For completed date
  total_score?: number;
  percentage?: number; // Database column name
  passed?: boolean;
  time_taken_seconds?: number;
}

interface TestTakingProps {
  test: TestAssignment;
  onComplete: () => void;
  onBack: () => void;
}

interface Question {
  question_id: string;
  question_text: string;
  question_type: string;
  options: string[];
  points: number;
  order_index: number;
}

interface TestDetail {
  test_id: string;
  test_name: string;
  test_description: string;
  time_limit: number;
  passing_score: number;
  job_title: string;
  company_name: string;
  questions: Question[];
}

const TestTaking: React.FC<TestTakingProps> = ({
  test,
  onComplete,
  onBack
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string }>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [canSubmit, setCanSubmit] = useState(false);
  const [testDetail, setTestDetail] = useState<TestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch test details when component mounts
  useEffect(() => {
    const fetchTestDetail = async () => {
      setIsLoading(true);
      try {
        const response = await candidateApi.getTestById(test.test_id);
        setTestDetail(response.data);
        setTimeLeft(response.data.time_limit * 60); // Convert minutes to seconds
        setError(null);
      } catch (err) {
        setError('Failed to load test details.');
        console.error('Error fetching test details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestDetail();
  }, [test.test_id]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Auto submit when time is up
      handleFinish();
    }
  }, [timeLeft]);

  // Check if all questions are answered
  useEffect(() => {
    if (testDetail) {
      setCanSubmit(Object.keys(selectedAnswers).length === testDetail.questions.length);
    }
  }, [selectedAnswers, testDetail]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(3, '0')}`;
  };

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNext = () => {
    if (testDetail && currentQuestion < testDetail.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleFinish = async () => {
    if (!testDetail || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      // Use application_id from test assignment
      await candidateApi.submitTest(test.test_id, { answers: selectedAnswers }, test.application_id);
      onComplete();
    } catch (err) {
      setError('Failed to submit test. Please try again.');
      console.error('Error submitting test:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#007BFF] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !testDetail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Test not found'}</p>
          <button 
            onClick={onBack}
            className="px-4 py-2 bg-[#007BFF] text-white rounded-lg hover:bg-[#0056b3]"
          >
            Back to Tests
          </button>
        </div>
      </div>
    );
  }

  const currentQuestionData = testDetail.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        {/* Back Button */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to Tests</span>
          </button>
        </div>

        {/* Test Info */}
        <div className="p-4 text-left">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center font-bold bg-blue-500 text-white">
              {test.company_name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{test.company_name}</h3>
              <p className="text-sm text-gray-500">{test.test_name}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{currentQuestion + 1} of {testDetail.questions.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#007BFF] h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / testDetail.questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Question Navigation */}
          <div className="grid grid-cols-3 gap-2">
            {testDetail.questions.map((question, index) => (
              <button
                key={question.question_id}
                onClick={() => setCurrentQuestion(index)}
                className={`w-8 h-8 rounded-lg text-sm font-medium ${
                  index === currentQuestion
                    ? 'bg-[#007BFF] text-white'
                    : selectedAnswers[question.question_id] !== undefined
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* User Info */}
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <img src={Avatar} alt="User" className="w-8 h-8 rounded-full" />
            <div>
              <p className="font-medium text-sm">Jake Gyll</p>
              <p className="text-gray-500 text-xs">Taking Assessment</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{testDetail.test_name}</h1>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>Timer</span>
            <div className="bg-white border border-gray-300 rounded-lg px-3 py-1">
              <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
              <span className="text-xs ml-1">min</span>
              <span className="text-xs ml-1">sec</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mb-8 text-left">
          <p className="text-gray-600">
            {testDetail.test_description || 'Click the finish button below to submit assessment, you can go back at any time to edit your answers.'}
          </p>
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8 text-left">
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-2">Question {currentQuestion + 1}</p>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {currentQuestionData.question_text}
            </h2>
          </div>

          {/* Answer Options */}
          <div className="space-y-4">
            {currentQuestionData.options.map((option, index) => (
              <label
                key={index}
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedAnswers[currentQuestionData.question_id] === option
                    ? 'border-[#007BFF] bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestionData.question_id}`}
                  value={option}
                  checked={selectedAnswers[currentQuestionData.question_id] === option}
                  onChange={() => handleAnswerSelect(currentQuestionData.question_id, option)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full border-2 mr-4 flex items-center justify-center ${
                  selectedAnswers[currentQuestionData.question_id] === option
                    ? 'border-[#007BFF] bg-[#007BFF]'
                    : 'border-gray-300'
                }`}>
                  {selectedAnswers[currentQuestionData.question_id] === option && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
                <span className="text-gray-700">{String.fromCharCode(65 + index)}. {option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="flex items-center space-x-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Previous</span>
          </button>

          <div className="flex space-x-4">
            {currentQuestion < testDetail.questions.length - 1 ? (
              <button
                onClick={handleNext}
                className="flex items-center space-x-2 px-6 py-3 bg-[#007BFF] text-white rounded-lg hover:bg-[#0056b3]"
              >
                <span>Next</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={!canSubmit || isSubmitting}
                className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                  canSubmit && !isSubmitting
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-400 text-white cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Finish'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestTaking; 