import React, { useState } from 'react';
import Avatar from '../assets/Avatar17.png';
import FindJobsDashboard from './FindJobsDashboard';

interface ProfileProps {
  onHomeClick?: () => void;
  onDashboardClick?: () => void;
  onAgentAIClick?: () => void;
  onMyApplicationsClick?: () => void;
  onTestManagementClick?: () => void;
  onFindJobsClick?: () => void;
  onBrowseCompaniesClick?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ 
  onHomeClick, 
  onDashboardClick,
  onAgentAIClick,
  onMyApplicationsClick,
  onTestManagementClick,
  onFindJobsClick,
  onBrowseCompaniesClick
}) => {
  const [activeTab, setActiveTab] = useState('public-profile');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'agent-ai', label: 'Agent AI', icon: '🤖' },
    { id: 'applications', label: 'My Applications', icon: '📄' },
    { id: 'test-management', label: 'Test Management', icon: '📝' },
    { id: 'find-jobs', label: 'Find Jobs', icon: '🔍' },
    { id: 'browse-companies', label: 'Browse Companies', icon: '🏢' },
    { id: 'public-profile', label: 'My Public Profile', icon: '👤' },
  ];

  const handleGoToProfile = () => {
    setActiveTab('public-profile');
  };

  // Render FindJobsDashboard when find-jobs is active
  if (activeTab === 'find-jobs') {
    return (
      <FindJobsDashboard 
        onProfileClick={handleGoToProfile}
        onHomeClick={onHomeClick}
        onDashboardClick={onDashboardClick}
        onAgentAIClick={onAgentAIClick}
        onMyApplicationsClick={onMyApplicationsClick}
        onTestManagementClick={onTestManagementClick}
        onBrowseCompaniesClick={onBrowseCompaniesClick}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        {/* Menu Items */}
        <nav className="p-4 pt-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'dashboard' && onDashboardClick) {
                  onDashboardClick();
                } else if (item.id === 'agent-ai' && onAgentAIClick) {
                  onAgentAIClick();
                } else if (item.id === 'applications' && onMyApplicationsClick) {
                  onMyApplicationsClick();
                } else if (item.id === 'test-management' && onTestManagementClick) {
                  onTestManagementClick();
                } else if (item.id === 'find-jobs' && onFindJobsClick) {
                  onFindJobsClick();
                } else if (item.id === 'browse-companies' && onBrowseCompaniesClick) {
                  onBrowseCompaniesClick();
                } else {
                  setActiveTab(item.id);
                }
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left mb-1 transition-all ${
                activeTab === item.id
                  ? 'bg-[#007BFF] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Settings */}
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2 text-left">
            SETTINGS
          </h3>
          <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-left">
            <span>⚙️</span>
            <span>Settings</span>
          </button>
          <button className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-left">
            <span>❓</span>
            <span>Help Center</span>
          </button>
          
          {/* Logout Button */}
          <button className="w-full flex items-center space-x-2 text-red-600 hover:text-red-700 py-2 mt-4 text-left">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="font-medium">Logout</span>
          </button>
          
          {/* User Info */}
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center space-x-3">
            <img src={Avatar} alt="User" className="w-8 h-8 rounded-full" />
            <div>
              <p className="font-medium text-sm">Jake Gyll</p>
              <p className="text-gray-500 text-xs">jakegyll@email.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <button 
            onClick={onHomeClick}
            className="flex items-center space-x-2 text-[#007BFF] hover:text-[#0056b3] font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to homepage</span>
          </button>
        </div>

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden relative">
              {/* Background gradient - 2/5 của chiều cao */}
              <div className="h-32 bg-gradient-to-r from-pink-300 via-purple-400 to-purple-600 relative">
                <button className="absolute top-4 right-4 text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </div>
              
              {/* Content section - 3/5 của chiều cao */}
              <div className="h-48 bg-white relative">
                {/* Avatar positioned at the border */}
                <div className="absolute -top-12 left-6">
                  <img 
                    src={Avatar} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
                  />
                </div>
                
                {/* Content area */}
                <div className="pt-16 px-6 pb-6 h-full">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">Jake Gyll</h2>
                      <p className="text-gray-600 text-lg mb-2">Product Designer at <span className="text-[#007BFF] font-medium">Twitter</span></p>
                      <p className="text-gray-500 flex items-center mb-6">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Manchester, UK
                      </p>
                      
                      {/* Badge */}
                      <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-700 border border-green-200">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        OPEN FOR OPPORTUNITIES
                      </span>
                    </div>
                    
                    {/* Edit Profile Button */}
                    <button className="px-6 py-3 bg-[#007BFF] text-white rounded-lg font-medium hover:bg-[#0056b3] ml-6">
                      Edit Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* About Me */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">About Me</h3>
                <button className="text-[#007BFF]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 leading-relaxed">
                I'm a product designer + filmmaker currently working remotely at Twitter from 
                beautiful Manchester, United Kingdom. I'm passionate about designing digital 
                products that have a positive impact on the world.
              </p>
              <p className="text-gray-600 leading-relaxed mt-4">
                For 10 years, I've specialised in interface, experience & interaction design as well as 
                working in user research and product strategy for product agencies, big tech 
                companies & start-ups.
              </p>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Additional Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Additional Details</h3>
                <button className="text-[#007BFF]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m5 0a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h12zM9 7h6" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500">Date of birth:</p>
                    <p className="font-medium">1999-06-12</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">jakegyll@email.com</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">+44 1245 572 135</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4a4 4 0 014-4h5a4 4 0 014 4v4" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500">Languages</p>
                    <p className="font-medium">English, French</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Social Links</h3>
                <button className="text-[#007BFF]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">📷</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Instagram</p>
                    <p className="text-[#007BFF] text-sm">instagram.com/jakegyll</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-[#007BFF] rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">🐦</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Twitter</p>
                    <p className="text-[#007BFF] text-sm">twitter.com/jakegyll</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">🌐</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Website</p>
                    <p className="text-[#007BFF] text-sm">www.jakegyll.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Full Width Sections */}
        <div className="space-y-6 mt-8">
          {/* Experiences */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Experiences</h3>
              <button className="text-[#007BFF]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex space-x-4">
                <div className="w-12 h-12 bg-[#007BFF] rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">Product Designer</h4>
                    <button className="text-[#007BFF]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-[#007BFF] font-medium">Twitter • Full Time • Jun 2019 - Present (1y 1m)</p>
                  <p className="text-gray-500 text-sm">Manchester, UK</p>
                  <p className="text-gray-600 mt-2">
                    Created and executed social media plan for 10 brands utilizing multiple 
                    features and content types to increase brand outreach, engagement, 
                    and leads.
                  </p>
                </div>
              </div>

              <div className="flex space-x-4">
                <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">G</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">Growth Marketing Designer</h4>
                    <button className="text-[#007BFF]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-[#007BFF] font-medium">GoDaddy • Full Time • Jun 2011 - May 2019 (8y)</p>
                  <p className="text-gray-500 text-sm">Manchester, UK</p>
                  <p className="text-gray-600 mt-2">
                    Developed digital marketing strategies, activation plans, proposals, 
                    contests and promotions for client initiatives
                  </p>
                </div>
              </div>
            </div>

            <button className="text-[#007BFF] font-medium mt-4 hover:text-[#007BFF]">
              Show 3 more experiences
            </button>
          </div>

          {/* Education */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Educations</h3>
              <button className="text-[#007BFF]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="flex space-x-4">
                <div className="w-12 h-12 bg-red-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">H</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">Harvard University</h4>
                    <button className="text-[#007BFF]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-gray-600 font-medium">Postgraduate degree, Applied Psychology</p>
                  <p className="text-gray-500 text-sm">2010 - 2012</p>
                  <p className="text-gray-600 mt-2">
                    As an Applied Psychologist in the field of Consumer and Society, I am 
                    specialized in creating business opportunities by observing, analysing, 
                    researching and changing behaviour.
                  </p>
                </div>
              </div>

              <div className="flex space-x-4">
                <div className="w-12 h-12 bg-[#001f3f] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs">T</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">University of Toronto</h4>
                    <button className="text-[#007BFF]">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-gray-600 font-medium">Bachelor of Arts, Visual Communication</p>
                  <p className="text-gray-500 text-sm">2005 - 2009</p>
                </div>
              </div>
            </div>

            <button className="text-[#007BFF] font-medium mt-4 hover:text-[#007BFF]">
              Show 2 more educations
            </button>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
              <div className="flex space-x-2">
                <button className="text-[#007BFF]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
                <button className="text-[#007BFF]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {['Communication', 'Analytics', 'Facebook Ads', 'Content Planning', 'Community Manager'].map((skill) => (
                <span key={skill} className="px-4 py-2 bg-[#007BFF]/10 text-[#007BFF] rounded-full text-sm font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Portfolios */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Portfolios</h3>
              <button className="text-[#007BFF]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-4 gap-6">
              {[
                { title: 'Clinically - clinic & health care website', image: '🏥' },
                { title: 'Grworthy - SaaS Analytics & Sales Website', image: '📊' },
                { title: 'Planna - Project Management App', image: '📱' },
                { title: 'Tunoio - furniture sale app', image: '🪑' }
              ].map((portfolio, index) => (
                <div key={index} className="text-center">
                  <div className="h-28 bg-gradient-to-br from-purple-100 to-[#007BFF]/10 rounded-lg flex items-center justify-center text-3xl mb-3 hover:shadow-md transition-shadow">
                    {portfolio.image}
                  </div>
                  <h4 className="font-medium text-gray-900 text-sm leading-tight">{portfolio.title}</h4>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 