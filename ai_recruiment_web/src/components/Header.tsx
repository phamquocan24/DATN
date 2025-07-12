import React, { useState } from 'react';
import Logo from '../assets/Logo.png';
import BellIcon from '../assets/bell-outlined.png';
import UserIcon from '../assets/user-outlined.png';
import NotificationPanel from './NotificationPanel';

type CurrentPage = 'home' | 'find-jobs' | 'favorite-jobs' | 'companies' | 'find-companies' | 'job-detail' | 'company-profile' | 'resume' | 'profile' | 'dashboard' | 'my-applications' | 'test-management';

interface HeaderProps {
  onPageChange: (page: CurrentPage) => void;
  currentPage: CurrentPage;
  onAuthOpen: () => void;
  onHomeClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onPageChange, currentPage, onAuthOpen, onHomeClick }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const handleMarkAllAsRead = () => {
    setHasUnreadNotifications(false);
  };

  return (
    <>
      <header className="bg-white border-b border-gray-100 px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 w-full">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex items-center cursor-pointer" onClick={onHomeClick}>
                <img src={Logo} alt="JobHuntly" className="h-8" />
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <div className="relative group">
                <button 
                  className={`font-medium py-4 flex items-center space-x-1 ${
                    currentPage === 'find-jobs' || currentPage === 'favorite-jobs'
                      ? 'text-[#007BFF] border-b-2 border-[#007BFF]' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span>Jobs</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="py-2">
                    <button
                      onClick={() => onPageChange('find-jobs')}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                        currentPage === 'find-jobs' ? 'text-[#007BFF] bg-[#007BFF]/5' : 'text-gray-700'
                      }`}
                    >
                      Find Jobs
                    </button>
                    <button
                      onClick={() => onPageChange('favorite-jobs')}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                        currentPage === 'favorite-jobs' ? 'text-[#007BFF] bg-[#007BFF]/5' : 'text-gray-700'
                      }`}
                    >
                      Favorite Jobs
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="relative group">
                <button 
                  className={`font-medium py-4 flex items-center space-x-1 ${
                    currentPage === 'companies' || currentPage === 'find-companies'
                      ? 'text-[#007BFF] border-b-2 border-[#007BFF]' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span>Companies</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                  <div className="py-2">
                    <button
                      onClick={() => onPageChange('companies')}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                        currentPage === 'companies' ? 'text-[#007BFF] bg-[#007BFF]/5' : 'text-gray-700'
                      }`}
                    >
                      Companies
                    </button>
                    <button
                      onClick={() => onPageChange('find-companies')}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${
                        currentPage === 'find-companies' ? 'text-[#007BFF] bg-[#007BFF]/5' : 'text-gray-700'
                      }`}
                    >
                      Find Companies
                    </button>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => onPageChange('resume')}
                className={`font-medium py-4 ${
                  currentPage === 'resume' 
                    ? 'text-[#007BFF] border-b-2 border-[#007BFF]' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Resume
              </button>

              <button 
                onClick={() => onPageChange('dashboard')}
                className={`font-medium py-4 ${
                  currentPage === 'dashboard' 
                    ? 'text-[#007BFF] border-b-2 border-[#007BFF]' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Dashboard
              </button>
            </nav>

            {/* Right side buttons */}
            <div className="flex items-center space-x-4">
              {/* Notification icon container */}
              <div className="relative">
                <button 
                  onClick={toggleNotifications}
                  className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <img src={BellIcon} alt="Notifications" className="w-5 h-5" />
                  {/* Notification dot - only show if there are unread notifications */}
                  {hasUnreadNotifications && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
                  )}
                </button>

                {/* Notification Panel - positioned relative to this container */}
                <NotificationPanel 
                  isOpen={showNotifications}
                  onClose={() => setShowNotifications(false)}
                  position="header"
                  onMarkAllAsRead={handleMarkAllAsRead}
                />
              </div>

              {/* Auth buttons */}
              <button 
                onClick={onAuthOpen}
                className="text-[#007BFF] font-medium hover:text-[#007BFF]"
              >
                Login
              </button>
              <button 
                onClick={onAuthOpen}
                className="bg-[#007BFF] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#0056b3] transition-colors"
              >
                Sign Up
              </button>

              {/* Profile avatar */}
              <div className="flex items-center justify-center">
                <img src={UserIcon} alt="User" className="w-6 h-6" />
              </div>
            </div>
          </div>
        </header>
    </>
  );
};

export default Header; 