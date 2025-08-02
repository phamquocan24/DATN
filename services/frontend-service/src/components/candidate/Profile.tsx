import React, { useState, useEffect } from 'react';
import Avatar from '../../assets/Avatar17.png';
import FindJobsDashboard from './FindJobsDashboard';
import DashboardSidebar from './DashboardSidebar';
import SkillManagement from './SkillManagement';
import ProfileSuggestions from './ProfileSuggestions';
import candidateApi from '../../services/candidateApi';

interface ProfileProps {
  onHomeClick?: () => void;
  onDashboardClick?: () => void;
  onAgentAIClick?: () => void;
  onMyApplicationsClick?: () => void;
  onTestManagementClick?: () => void;
  onFindJobsClick?: () => void;
  onBrowseCompaniesClick?: () => void;
  onSettingsClick?: () => void;
  onHelpCenterClick?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ 
  onHomeClick, 
  onDashboardClick, 
  onAgentAIClick, 
  onMyApplicationsClick, 
  onTestManagementClick, 
  onFindJobsClick, 
  onBrowseCompaniesClick, 
  onSettingsClick,
  onHelpCenterClick
}) => {
  const [activeTab, setActiveTab] = useState('public-profile');
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const profileData = await candidateApi.getProfile();
        if (profileData?.data) {
          setProfileData(profileData);
          setError(null);
        } else {
          // No profile data or not authenticated
          setError('Bạn cần đăng nhập để xem profile.');
          setProfileData(null);
        }
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        if (err.response?.status === 401) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else {
          setError('Không thể tải dữ liệu profile.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);


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

  if (isLoading) {
    return (
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-[#007BFF] mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-lg font-medium text-gray-600">Loading Profile...</p>
          </div>
        </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="text-center p-6 bg-red-50 rounded-lg shadow-sm">
          <p className="text-lg font-medium text-red-600">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <p>No profile data available.</p>
      </div>
    )
  }

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
        onProfileClick={handleGoToProfile}
        onSettingsClick={onSettingsClick}
        onHelpCenterClick={onHelpCenterClick}
      />

      {/* Main Content */}
      <div className="flex-1 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <button 
            onClick={onHomeClick}
            className="px-4 py-2 text-[#007BFF] hover:text-white font-medium border border-[#007BFF] rounded-lg hover:bg-[#007BFF] transition-colors"
          >
            Back to homepage
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
                    src={profileData.avatarUrl || Avatar} 
                    alt="Profile" 
                    className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
                  />
                </div>
                
                {/* Content area */}
                <div className="pt-16 px-6 pb-6 h-full text-left">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">{profileData.name}</h2>
                      <p className="text-gray-600 text-lg mb-2">
                        {profileData.headline || 'No headline provided'}
                      </p>
                      <p className="text-gray-500 flex items-center mb-6">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {profileData.location || 'Location not set'}
                      </p>
                      
                      {/* Badge */}
                      <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium ${profileData.isOpenForOpportunities ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'}`}>
                        <span className={`w-2 h-2 rounded-full mr-2 ${profileData.isOpenForOpportunities ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                        {profileData.isOpenForOpportunities ? 'OPEN FOR OPPORTUNITIES' : 'NOT OPEN FOR OPPORTUNITIES'}
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

            {/* Profile Suggestions */}
            <ProfileSuggestions />

            {/* About Me */}
            <div className="bg-white rounded-lg shadow-sm p-6 text-left">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">About Me</h3>
                <button className="text-[#007BFF]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 leading-relaxed">
                {profileData.about || 'No about section provided. Click edit to add one.'}
              </p>
              <p className="text-gray-600 leading-relaxed mt-4">
                For 10 years, I've specialised in interface, experience & interaction design as well as 
                working in user research and product strategy for product agencies, big tech 
                companies & start-ups.
              </p>
            </div>

            {/* Skills Management */}
            <SkillManagement 
              userSkills={profileData.skills || []} 
              onSkillsUpdate={(skills) => {
                setProfileData(prev => ({ ...prev, skills }));
              }}
            />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Additional Details */}
            <div className="bg-white rounded-lg shadow-sm p-6 text-left">
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
                    <p className="font-medium">{profileData.dateOfBirth || 'Not set'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{profileData.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{profileData.phone || 'Not set'}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4a4 4 0 014-4h5a4 4 0 014 4v4" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500">Languages</p>
                    <p className="font-medium">{(profileData.languages && profileData.languages.join(', ')) || 'Not set'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white rounded-lg shadow-sm p-6 text-left">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Social Links</h3>
                <button className="text-[#007BFF]">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-4">
                {profileData.socialLinks && Object.entries(profileData.socialLinks).map(([platform, link]) => (
                    <div className="flex items-center space-x-3" key={platform}>
                      <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-black text-sm">{platform.substring(0,2)}</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 capitalize">{platform}</p>
                        <a href={link as string} target="_blank" rel="noopener noreferrer" className="text-[#007BFF] text-sm break-all">{link as string}</a>
                      </div>
                    </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Full Width Sections */}
        <div className="space-y-6 mt-8 text-left">
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
              {profileData.experiences && profileData.experiences.map((exp: any, index: number) => (
                <div className="flex space-x-4" key={index}>
                  <div className="w-12 h-12 bg-[#007BFF] rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">{exp.title}</h4>
                      <button className="text-[#007BFF]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-[#007BFF] font-medium">{exp.company} • {exp.employmentType} • {exp.startDate} - {exp.endDate || 'Present'}</p>
                    <p className="text-gray-500 text-sm">{exp.location}</p>
                    <p className="text-gray-600 mt-2">
                      {exp.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* <button className="text-[#007BFF] font-medium mt-4 hover:text-[#007BFF]">
              Show 3 more experiences
            </button> */}
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
              {profileData.educations && profileData.educations.map((edu: any, index: number) => (
                <div className="flex space-x-4" key={index}>
                  <div className="w-12 h-12 bg-red-700 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-xs">{edu.school.charAt(0)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">{edu.school}</h4>
                      <button className="text-[#007BFF]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-gray-600 font-medium">{edu.degree}</p>
                    <p className="text-gray-500 text-sm">{edu.startDate} - {edu.endDate}</p>
                    <p className="text-gray-600 mt-2">
                      {edu.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* <button className="text-[#007BFF] font-medium mt-4 hover:text-[#007BFF]">
              Show 2 more educations
            </button> */}
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
              {profileData.skills && profileData.skills.map((skill: string) => (
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
              {profileData.portfolios && profileData.portfolios.map((portfolio: any, index: number) => (
                <div key={index} className="text-left">
                  <a href={portfolio.url} target="_blank" rel="noopener noreferrer" className="block">
                    <div className="h-28 bg-gradient-to-br from-purple-100 to-[#007BFF]/10 rounded-lg flex items-center justify-center text-3xl mb-3 hover:shadow-md transition-shadow">
                      <img src={portfolio.imageUrl} alt={portfolio.title} className="w-full h-full object-cover rounded-lg" />
                    </div>
                    <h4 className="font-medium text-gray-900 text-sm leading-tight">{portfolio.title}</h4>
                  </a>
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