import React from 'react';
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

interface TestClosedProps {
  test: TestApplication;
  onBack: () => void;
}

const TestClosed: React.FC<TestClosedProps> = ({
  test,
  onBack
}) => {
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

          {/* Closed Status */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-red-700 font-medium text-sm">Assessment Closed</span>
            </div>
          </div>

          {/* Test Details */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Applied Date:</span>
              <span className="text-sm font-medium">{test.dateApplied}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Status:</span>
              <span className="text-sm font-medium text-red-600">Closed</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Deadline:</span>
              <span className="text-sm font-medium text-red-600">Expired</span>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <img src={Avatar} alt="User" className="w-8 h-8 rounded-full" />
            <div>
              <p className="font-medium text-sm">Jake Gyll</p>
              <p className="text-gray-500 text-xs">Test Unavailable</p>
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
              <span className="font-mono text-lg">00:000</span>
              <span className="text-xs ml-1">min</span>
              <span className="text-xs ml-1">sec</span>
            </div>
          </div>
        </div>

        {/* Closed Content */}
        <div className="flex flex-col items-center justify-center h-[60vh]">
          {/* Closed Message */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{test.role}</h2>
            <p className="text-gray-600">
              Click the button below to start assessment, you have limited time for this test
            </p>
          </div>

          {/* Hourglass Icon */}
          <div className="relative mb-8">
            <div className="w-32 h-32 flex items-center justify-center">
              {/* Hourglass SVG */}
              <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              
              {/* Overlay hourglass icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 2v6h.01L6 8.01 10 12l-4 4 .01.01H6V22h12v-5.99h-.01L18 16l-4-4 4-3.99-.01-.01H18V2H6zm10 14.5V20H8v-3.5l4-4 4 4zm-4-5l-4-4V4h8v3.5l-4 4z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Closed Message */}
          <div className="text-center max-w-md">
            <p className="text-gray-600 mb-2">
              We have 4 days left until the next assessment
            </p>
            <p className="text-gray-600 mb-8">Watch this space</p>

            {/* Take Assessment Button (Disabled) */}
            <button
              disabled
              className="bg-gray-400 text-white px-8 py-3 rounded-lg font-medium cursor-not-allowed"
            >
              Take Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestClosed; 