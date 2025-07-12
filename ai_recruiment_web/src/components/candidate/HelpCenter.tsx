import React, { useState } from 'react';
import DashboardSidebar from './DashboardSidebar';

interface HelpCenterProps {
  onHomeClick?: () => void;
  onDashboardClick?: () => void;
  onProfileClick?: () => void;
  onAgentAIClick?: () => void;
  onMyApplicationsClick?: () => void;
  onTestManagementClick?: () => void;
  onFindJobsClick?: () => void;
  onBrowseCompaniesClick?: () => void;
  onSettingsClick?: () => void;
}

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  isHelpful?: boolean;
}

const HelpCenter: React.FC<HelpCenterProps> = ({
  onHomeClick,
  onDashboardClick,
  onProfileClick,
  onAgentAIClick,
  onMyApplicationsClick,
  onTestManagementClick,
  onFindJobsClick,
  onBrowseCompaniesClick,
  onSettingsClick
}) => {
  const [activeTab] = useState('help-center');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Getting Started');
  const [sortBy, setSortBy] = useState('Most relevant');
  const [faqItems, setFaqItems] = useState<FAQItem[]>([
    {
      id: 1,
      question: "What is My Applications?",
      answer: "My Applications is a way for you to track jobs as you move through the application process. Depending on the job you applied to, you may also receive notifications indicating that an application has been actioned by an employer.",
      isHelpful: undefined
    },
    {
      id: 2,
      question: "How to access my applications history",
      answer: "To access applications history, go to your My Applications page on your dashboard profile. You must be signed in to your JobHuntly account to view this page.",
      isHelpful: undefined
    },
    {
      id: 3,
      question: "Not seeing jobs you applied in your my application list?",
      answer: "Please note that we are unable to track materials submitted for jobs you apply to via an external link. Only those applications are not recorded in the My Applications section of your JobHuntly account. We suggest keeping a personal record of all positions you have applied to externally.",
      isHelpful: undefined
    }
  ]);

  const categories = [
    'Getting Started',
    'My Profile',
    'Applying for a job',
    'Job Search Tips',
    'Job Alerts'
  ];

  const handleVote = (id: number, isHelpful: boolean) => {
    setFaqItems(items =>
      items.map(item =>
        item.id === id ? { ...item, isHelpful } : item
      )
    );
  };

  const filteredFAQs = faqItems.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <DashboardSidebar 
        activeTab={activeTab}
        onDashboardClick={onDashboardClick}
        onAgentAIClick={onAgentAIClick}
        onMyApplicationsClick={onMyApplicationsClick}
        onTestManagementClick={onTestManagementClick}
        onFindJobsClick={onFindJobsClick}
        onBrowseCompaniesClick={onBrowseCompaniesClick}
        onProfileClick={onProfileClick}
        onSettingsClick={onSettingsClick}
      />

      {/* Vertical Divider */}
      <div className="w-px bg-gray-200"></div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Sidebar - Categories */}
        <div className="w-64 bg-white border-r border-gray-200">
          <div className="p-6">
            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Type your question or search keyword"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007BFF] focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-[#007BFF] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Contact Support */}
            <div className="mt-8 p-4 bg-[#007BFF] rounded-lg text-white">
              <h3 className="font-semibold mb-2 text-left">Didn't find what you were looking for?</h3>
              <p className="text-sm mb-3 text-blue-100 text-left">Contact our customer service</p>
              <button className="w-full bg-white text-[#007BFF] py-2 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors text-left">
                Contact Us
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Help Center</h1>
            <button 
              onClick={onHomeClick}
              className="px-4 py-2 text-[#007BFF] hover:text-white font-medium border border-[#007BFF] rounded-lg hover:bg-[#007BFF] transition-colors"
            >
              Back to homepage
            </button>
          </div>

          {/* Sort Options */}
          <div className="flex items-center justify-start mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 text-left">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#007BFF] focus:border-transparent text-left"
              >
                <option>Most relevant</option>
                <option>Most recent</option>
                <option>Most helpful</option>
              </select>
            </div>
          </div>

          {/* FAQ Items */}
          <div className="space-y-6">
            {filteredFAQs.map((item) => (
              <div key={item.id} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex-1 text-left">{item.question}</h3>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
                
                <p className="text-gray-600 mb-4 leading-relaxed text-left">{item.answer}</p>
                
                {/* Helpful Voting */}
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600 text-left">Was this article helpful?</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleVote(item.id, true)}
                      className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        item.isHelpful === true
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      <span>Yes</span>
                    </button>
                    <button
                      onClick={() => handleVote(item.id, false)}
                      className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                        item.isHelpful === false
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2M5 4h2a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
                      </svg>
                      <span>No</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter; 