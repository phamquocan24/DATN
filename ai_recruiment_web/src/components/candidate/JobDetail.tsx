import React, { useState } from 'react';
import JobApplication from './JobApplication';

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  tags: string[];
  logo: string;
  logoColor: string;
  match: number;
  applied: number;
  capacity: number;
  salary?: string;
  description?: string;
  requirements?: string[];
  benefits?: string[];
}

interface JobDetailProps {
  job: Job;
  onBack: () => void;
  applicationStatus?: 'In Review' | 'Hired' | 'Mini-test' | 'Interviewing' | 'Rejected';
}

const JobDetail: React.FC<JobDetailProps> = ({ job, onBack, applicationStatus }) => {
  const [isApplicationOpen, setIsApplicationOpen] = useState(false);

  const handleApply = () => {
    setIsApplicationOpen(true);
  };

  const handleCloseApplication = () => {
    setIsApplicationOpen(false);
  };

  const getStatusButtonStyle = (status: string) => {
    switch (status) {
      case 'In Review':
        return 'bg-orange-100 text-orange-700 border border-orange-200 cursor-not-allowed';
      case 'Hired':
        return 'bg-green-100 text-green-700 border border-green-200 cursor-not-allowed';
      case 'Mini-test':
        return 'bg-blue-100 text-blue-700 border border-blue-200 cursor-not-allowed';
      case 'Interviewing':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-200 cursor-not-allowed';
      case 'Rejected':
        return 'bg-red-100 text-red-700 border border-red-200 cursor-not-allowed';
      default:
        return 'bg-[#007BFF] text-white hover:bg-[#0056b3] transition-colors';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-[#007BFF] hover:text-[#0056b3] font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to job listings</span>
        </button>
      </div>

      {/* Job Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-6">
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${job.logoColor} text-2xl font-bold`}>
              {job.logo}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
              <p className="text-xl text-gray-600 mb-4">{job.company} • {job.location}</p>
              
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  {job.type}
                </span>
                {job.tags.map((tag, index) => (
                  <span 
                    key={index} 
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      tag.includes('Match:') 
                        ? 'bg-orange-100 text-orange-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="text-gray-600 mb-4">
                <span className="font-semibold">{job.applied}</span> applied of <span className="font-semibold">{job.capacity}</span> capacity
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <button 
              onClick={applicationStatus ? undefined : handleApply}
              disabled={!!applicationStatus}
              className={`px-8 py-3 rounded-lg font-medium text-lg ${
                applicationStatus 
                  ? getStatusButtonStyle(applicationStatus)
                  : getStatusButtonStyle('')
              }`}
            >
              {applicationStatus || 'Apply Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Job Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Job Description */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                We are looking for a talented Social Media Assistant to join our dynamic marketing team. 
                You will be responsible for creating engaging content, managing social media accounts, 
                and helping to grow our online presence across various platforms.
              </p>
              <p className="text-gray-700 leading-relaxed mb-4">
                As a Social Media Assistant, you will work closely with our marketing team to develop 
                and implement social media strategies that align with our brand goals and engage our target audience.
              </p>
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
            <ul className="space-y-3">
              {[
                'Bachelor\'s degree in Marketing, Communications, or related field',
                '1-2 years of experience in social media management',
                'Proficiency in social media platforms (Instagram, Twitter, LinkedIn, TikTok)',
                'Experience with content creation tools (Canva, Adobe Creative Suite)',
                'Strong written and verbal communication skills',
                'Knowledge of social media analytics and reporting tools',
                'Creative mindset with attention to detail'
              ].map((requirement, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[#007BFF] rounded-full mt-2.5 flex-shrink-0"></div>
                  <span className="text-gray-700">{requirement}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Benefits */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Benefits</h2>
            <ul className="space-y-3">
              {[
                'Competitive salary and performance bonuses',
                'Health, dental, and vision insurance',
                'Flexible working hours and remote work options',
                'Professional development opportunities',
                'Paid time off and holidays',
                'Modern office environment with great team culture',
                'Opportunity to work with cutting-edge marketing tools'
              ].map((benefit, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2.5 flex-shrink-0"></div>
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Job Overview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Overview</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m5 0a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h12zM9 7h6" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Job Type</p>
                  <p className="font-medium">{job.type}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{job.location}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Salary</p>
                  <p className="font-medium">$2,500 - $3,500</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Posted</p>
                  <p className="font-medium">2 days ago</p>
                </div>
              </div>
            </div>
          </div>

          {/* Company Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">About Company</h3>
            <div className="text-center mb-4">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${job.logoColor} text-2xl font-bold mx-auto mb-3`}>
                {job.logo}
              </div>
              <h4 className="font-semibold text-gray-900">{job.company}</h4>
              <p className="text-sm text-gray-500">Technology • 50-100 employees</p>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              {job.company} is a leading technology company focused on creating innovative solutions 
              that help businesses grow and succeed in the digital age.
            </p>
          </div>
        </div>
      </div>

      {/* Job Application Modal */}
      <JobApplication 
        isOpen={isApplicationOpen}
        onClose={handleCloseApplication}
        job={{
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          type: job.type,
          logo: job.logo,
          logoColor: job.logoColor
        }}
      />
    </div>
  );
};

export default JobDetail; 