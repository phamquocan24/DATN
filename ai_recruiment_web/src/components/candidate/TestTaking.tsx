import React, { useState, useEffect } from 'react';
import Avatar from '../../assets/Avatar17.png';

interface TestApplication {
  id: number;
  company: string;
  role: string;
  dateApplied: string;
  status: 'Opening' | 'Closed';
  logo: string;
  logoColor: string;
}

interface TestTakingProps {
  test: TestApplication;
  onComplete: () => void;
  onBack: () => void;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
}

const TestTaking: React.FC<TestTakingProps> = ({
  test,
  onComplete,
  onBack
}) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canSubmit, setCanSubmit] = useState(false);

  // Sample questions - in real app, these would be fetched based on test
  const questions: Question[] = [
    {
      id: 1,
      question: "What is the purpose of HDR technology?",
      options: [
        "To reduce the file size of images and videos.",
        "To speed up 3D rendering performance.",
        "To support higher video resolutions.",
        "To display more colors in images and videos"
      ],
      correctAnswer: 2
    },
    {
      id: 2,
      question: "Which React hook is used for side effects?",
      options: [
        "useState",
        "useEffect",
        "useContext",
        "useReducer"
      ],
      correctAnswer: 1
    },
    {
      id: 3,
      question: "What does CSS Grid provide?",
      options: [
        "Animation capabilities",
        "Two-dimensional layout system",
        "Color management",
        "Font styling"
      ],
      correctAnswer: 1
    }
  ];

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
    setCanSubmit(Object.keys(selectedAnswers).length === questions.length);
  }, [selectedAnswers, questions.length]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(3, '0')}`;
  };

  const handleAnswerSelect = (questionId: number, answerIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleFinish = () => {
    // Here you would typically submit the answers to a backend
    onComplete();
  };

  const currentQuestionData = questions[currentQuestion];

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
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${test.logoColor}`}>
              {test.logo}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{test.company}</h3>
              <p className="text-sm text-gray-500">{test.role}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{currentQuestion + 1} of {questions.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#007BFF] h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Question Navigation */}
          <div className="grid grid-cols-3 gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-8 h-8 rounded-lg text-sm font-medium ${
                  index === currentQuestion
                    ? 'bg-[#007BFF] text-white'
                    : selectedAnswers[questions[index].id] !== undefined
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
          <h1 className="text-2xl font-bold text-gray-900">{test.role}</h1>
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
        <div className="mb-8">
          <p className="text-gray-600">
            Click the finish button below to submit assessment, you can go back at any time to edit your answers.
          </p>
        </div>

        {/* Question */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-2">Question {currentQuestion + 1}</p>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {currentQuestionData.question}
            </h2>
          </div>

          {/* Answer Options */}
          <div className="space-y-4">
            {currentQuestionData.options.map((option, index) => (
              <label
                key={index}
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                  selectedAnswers[currentQuestionData.id] === index
                    ? 'border-[#007BFF] bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestionData.id}`}
                  value={index}
                  checked={selectedAnswers[currentQuestionData.id] === index}
                  onChange={() => handleAnswerSelect(currentQuestionData.id, index)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded-full border-2 mr-4 flex items-center justify-center ${
                  selectedAnswers[currentQuestionData.id] === index
                    ? 'border-[#007BFF] bg-[#007BFF]'
                    : 'border-gray-300'
                }`}>
                  {selectedAnswers[currentQuestionData.id] === index && (
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
            {currentQuestion < questions.length - 1 ? (
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
                disabled={!canSubmit}
                className="px-8 py-3 bg-gray-400 text-white rounded-lg hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Finish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestTaking; 