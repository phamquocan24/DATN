import React, { useState, useEffect } from 'react';
import Avatar from '../assets/Avatar17.png';

interface TestApplication {
  id: number;
  company: string;
  role: string;
  dateApplied: string;
  status: 'Opening' | 'Closed';
  logo: string;
  logoColor: string;
}

interface TestSuccessProps {
  test: TestApplication;
  onHome: () => void;
  onBackToList: () => void;
}

const TestSuccess: React.FC<TestSuccessProps> = ({
  test,
  onHome,
  onBackToList
}) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showAnimation, setShowAnimation] = useState(false);

  // Simulate elapsed time (in real app, this would be tracked from start)
  const completionTime = "23:043"; // 23 minutes, 43 seconds

  useEffect(() => {
    // Start animation after component mounts
    const timer = setTimeout(() => setShowAnimation(true), 300);
    
    // Animate elapsed time counter
    let counter = 0;
    const increment = () => {
      if (counter < 1403) { // 23:43 in seconds
        setTimeElapsed(counter);
        counter += 5;
        setTimeout(increment, 50);
      } else {
        setTimeElapsed(1403);
      }
    };
    increment();

    return () => clearTimeout(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(3, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        {/* Back Button */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={onBackToList}
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

          {/* Completion Status */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-700 font-medium text-sm">Assessment Completed</span>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Time Taken:</span>
              <span className="text-sm font-medium">{completionTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Questions:</span>
              <span className="text-sm font-medium">3/3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <span className="text-sm font-medium text-green-600">Submitted</span>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <img src={Avatar} alt="User" className="w-8 h-8 rounded-full" />
            <div>
              <p className="font-medium text-sm">Jake Gyll</p>
              <p className="text-gray-500 text-xs">Assessment Complete</p>
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
              <span className="font-mono text-lg">{formatTime(timeElapsed)}</span>
              <span className="text-xs ml-1">min</span>
              <span className="text-xs ml-1">sec</span>
            </div>
          </div>
        </div>

        {/* Success Content */}
        <div className="flex flex-col items-center justify-center h-[60vh]">
          {/* Thank you message */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Thank you!</h2>
          </div>

          {/* Success Animation */}
          <div className={`relative mb-8 transition-all duration-1000 ${showAnimation ? 'scale-100 opacity-100' : 'scale-75 opacity-50'}`}>
            {/* Animated Success Icon */}
            <div className="relative w-32 h-32">
              {/* Background Circle */}
              <div className="absolute inset-0 bg-gradient-to-br from-pink-300 via-purple-400 to-blue-500 rounded-full"></div>
              
              {/* Animated Elements */}
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Stars */}
                <div className={`absolute -top-4 -left-4 text-yellow-400 transition-all duration-500 ${showAnimation ? 'animate-bounce' : ''}`}>
                  ⭐
                </div>
                <div className={`absolute -top-6 right-2 text-yellow-300 transition-all duration-700 ${showAnimation ? 'animate-pulse' : ''}`}>
                  ✨
                </div>
                <div className={`absolute -bottom-2 -right-4 text-blue-400 transition-all duration-600 ${showAnimation ? 'animate-spin' : ''}`}>
                  ✦
                </div>
                <div className={`absolute top-0 -right-6 text-purple-400 transition-all duration-800 ${showAnimation ? 'animate-ping' : ''}`}>
                  •
                </div>
                
                {/* Checkmark */}
                <div className="relative bg-white rounded-full w-16 h-16 flex items-center justify-center">
                  <svg 
                    className={`w-8 h-8 text-green-500 transition-all duration-1000 ${showAnimation ? 'scale-100' : 'scale-0'}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={3} 
                      d="M5 13l4 4L19 7"
                      className={showAnimation ? 'animate-pulse' : ''}
                    />
                  </svg>
                </div>

                {/* Animated Curves */}
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 128 128">
                  <path
                    d="M20 40 Q 64 20, 108 40"
                    stroke="url(#gradient1)"
                    strokeWidth="3"
                    fill="none"
                    className={`transition-all duration-1000 ${showAnimation ? 'opacity-70' : 'opacity-0'}`}
                  />
                  <path
                    d="M20 88 Q 64 108, 108 88"
                    stroke="url(#gradient2)"
                    strokeWidth="3"
                    fill="none"
                    className={`transition-all duration-1200 ${showAnimation ? 'opacity-70' : 'opacity-0'}`}
                  />
                  <defs>
                    <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                    <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>

          {/* Success Message */}
          <div className="text-center max-w-md">
            <p className="text-gray-600 mb-2">
              We have received your assessment test, we will get back to you soon.
            </p>
            <p className="text-gray-600 mb-8">Best of luck</p>

            {/* Home Button */}
            <button
              onClick={onHome}
              className="bg-[#007BFF] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#0056b3] transition-colors"
            >
              Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestSuccess; 