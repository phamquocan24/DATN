import React, { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import testApi from '../../services/testApi';
import hrApi from '../../services/hrApi';

interface Question {
  question_text: string;
  question_type: 'MULTIPLE_CHOICE' | 'ESSAY' | 'TRUE_FALSE';
  options: string[];
  correct_answer: string;
  points: number;
}

interface CreateTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTestCreated: () => void;
}

const CreateTestModal: React.FC<CreateTestModalProps> = ({ isOpen, onClose, onTestCreated }) => {
  const [loading, setLoading] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    job_id: '',
    test_name: '',
    test_description: '',
    test_type: 'MULTIPLE_CHOICE' as const,
    time_limit: 60,
    passing_score: 70,
    is_active: true
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    question_text: '',
    question_type: 'MULTIPLE_CHOICE',
    options: ['', '', '', ''],
    correct_answer: '',
    points: 5
  });

  // Load available jobs when modal opens
  useEffect(() => {
    if (isOpen) {
      loadJobs();
    }
  }, [isOpen]);

  const loadJobs = async () => {
    try {
      setLoadingJobs(true);
      const response = await hrApi.getMyJobs();
      const jobsArray = response?.data || response?.jobs || (Array.isArray(response) ? response : []);
      setJobs(jobsArray);
    } catch (error) {
      console.error('Error loading jobs:', error);
      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleQuestionChange = (field: keyof Question, value: any) => {
    setCurrentQuestion(prev => ({ ...prev, [field]: value }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
  };

  const addQuestion = () => {
    if (!currentQuestion.question_text.trim()) {
      alert('Please enter a question text');
      return;
    }

    if (currentQuestion.question_type === 'MULTIPLE_CHOICE') {
      const validOptions = currentQuestion.options.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        alert('Please provide at least 2 options for multiple choice questions');
        return;
      }
      if (!currentQuestion.correct_answer.trim()) {
        alert('Please select the correct answer');
        return;
      }
    }

    setQuestions(prev => [...prev, { ...currentQuestion }]);
    setCurrentQuestion({
      question_text: '',
      question_type: 'MULTIPLE_CHOICE',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 5
    });
  };

  const removeQuestion = (index: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Comprehensive validation before submission
    if (!formData.job_id.trim()) {
      alert('Please select a job');
      return;
    }

    if (!formData.test_name.trim()) {
      alert('Please enter a test name');
      return;
    }

    if (questions.length === 0) {
      alert('Please add at least one question to the test');
      return;
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        alert(`Question ${i + 1}: Please enter question text`);
        return;
      }
      if (q.question_type === 'MULTIPLE_CHOICE') {
        const validOptions = q.options.filter(opt => opt.trim());
        if (validOptions.length < 2) {
          alert(`Question ${i + 1}: Multiple choice questions need at least 2 options`);
          return;
        }
        if (!q.correct_answer.trim()) {
          alert(`Question ${i + 1}: Please select the correct answer`);
          return;
        }
      }
      if (!q.correct_answer.trim()) {
        alert(`Question ${i + 1}: Please provide the correct answer`);
        return;
      }
    }

    try {
      setLoading(true);
      // Get current user for created_by field
      let currentUser = null;
      try {
        const savedUser = localStorage.getItem('user');
        currentUser = savedUser ? JSON.parse(savedUser) : null;
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }

      if (!currentUser?.user_id) {
        alert('Authentication error: Unable to identify current user. Please log in again.');
        return;
      }

      const testData = {
        ...formData,
        time_limit: Number(formData.time_limit),
        passing_score: Number(formData.passing_score),
        created_by: currentUser.user_id, // Required by backend
        questions: questions.map(q => ({
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.question_type === 'MULTIPLE_CHOICE' ? q.options.filter(opt => opt.trim()) : [],
          correct_answer: q.correct_answer,
          points: Number(q.points)
        }))
      };

      console.log('Creating test with data:', testData);
      const response = await testApi.createTest(testData);
      console.log('Test creation response:', response);
      
      if (response.success) {
        alert(`Test "${testData.test_name}" created successfully!`);
        onTestCreated(); // This will reload the tests list
        handleClose();
      } else {
        throw new Error(response.message || 'Failed to create test');
      }
    } catch (error: any) {
      console.error('Error creating test:', error);
      
      // Enhanced error messaging
      let errorMessage = 'Failed to create test. ';
      
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        // Handle validation errors from backend
        const validationErrors = error.response.data.errors
          .map((err: any) => `${err.field}: ${err.message}`)
          .join('\n');
        errorMessage += `\nValidation errors:\n${validationErrors}`;
      } else if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage += error.response.data.error;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please check the data and try again.';
      }
      
      // Show authentication errors differently
      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied. You do not have permission to create tests.';
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      job_id: '',
      test_name: '',
      test_description: '',
      test_type: 'MULTIPLE_CHOICE',
      time_limit: 60,
      passing_score: 70,
      is_active: true
    });
    setQuestions([]);
    setCurrentQuestion({
      question_text: '',
      question_type: 'MULTIPLE_CHOICE',
      options: ['', '', '', ''],
      correct_answer: '',
      points: 5
    });
    setJobs([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Create New Test</h2>
          <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Test Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Job *
              </label>
              {loadingJobs ? (
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                  Loading jobs...
                </div>
              ) : (
                <select
                  name="job_id"
                  value={formData.job_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a job</option>
                  {jobs.map((job) => (
                    <option key={job.job_id || job.id} value={job.job_id || job.id}>
                      {job.title} - {job.company?.name || job.company_name || 'Company'}
                    </option>
                  ))}
                </select>
              )}
              {!loadingJobs && jobs.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  No jobs available. Please create a job first.
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Name *
              </label>
              <input
                type="text"
                name="test_name"
                value={formData.test_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test Description
            </label>
            <textarea
              name="test_description"
              value={formData.test_description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Type
              </label>
              <select
                name="test_type"
                value={formData.test_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                <option value="ESSAY">Essay</option>
                <option value="MIXED">Mixed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Limit (minutes)
              </label>
              <input
                type="number"
                name="time_limit"
                value={formData.time_limit}
                onChange={handleInputChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passing Score (%)
              </label>
              <input
                type="number"
                name="passing_score"
                value={formData.passing_score}
                onChange={handleInputChange}
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              Test is active
            </label>
          </div>

          {/* Questions Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Questions ({questions.length})</h3>
            
            {/* Add Question Form */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-gray-700 mb-3">Add New Question</h4>
              
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder="Enter question text"
                    value={currentQuestion.question_text}
                    onChange={(e) => handleQuestionChange('question_text', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={currentQuestion.question_type}
                    onChange={(e) => handleQuestionChange('question_type', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                    <option value="ESSAY">Essay</option>
                    <option value="TRUE_FALSE">True/False</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Points"
                    value={currentQuestion.points}
                    onChange={(e) => handleQuestionChange('points', Number(e.target.value))}
                    min="1"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {currentQuestion.question_type === 'MULTIPLE_CHOICE' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Options:</label>
                    {currentQuestion.options.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="radio"
                          name="correct_answer"
                          checked={currentQuestion.correct_answer === option}
                          onChange={() => handleQuestionChange('correct_answer', option)}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-500">Correct</span>
                      </div>
                    ))}
                  </div>
                )}

                {currentQuestion.question_type === 'ESSAY' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sample Answer:</label>
                    <textarea
                      placeholder="Enter the expected answer or key points"
                      value={currentQuestion.correct_answer}
                      onChange={(e) => handleQuestionChange('correct_answer', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={addQuestion}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <FiPlus /> Add Question
                </button>
              </div>
            </div>

            {/* Questions List */}
            {questions.length > 0 && (
              <div className="space-y-3">
                {questions.map((question, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          {index + 1}. {question.question_text}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span>Type: {question.question_type}</span>
                          <span>Points: {question.points}</span>
                        </div>
                        {question.question_type === 'MULTIPLE_CHOICE' && (
                          <div className="mt-2">
                            <p className="text-sm text-gray-600">Options:</p>
                            <ul className="list-disc list-inside text-sm text-gray-700">
                              {question.options.map((option, optIndex) => (
                                <li key={optIndex} className={option === question.correct_answer ? 'font-semibold text-green-600' : ''}>
                                  {option} {option === question.correct_answer && '(Correct)'}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeQuestion(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4 border-t pt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || loadingJobs || jobs.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title={jobs.length === 0 ? 'No jobs available to create test for' : ''}
            >
              {loading ? 'Creating...' : loadingJobs ? 'Loading Jobs...' : 'Create Test'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTestModal;