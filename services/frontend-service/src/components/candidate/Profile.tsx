import React, { useState, useEffect } from 'react';

import DashboardSidebar from './DashboardSidebar';
import SkillManagement from './SkillManagement';
import candidateApi from '../../services/candidateApi';

interface Suggestion {
  id: string;
  type: 'profile' | 'skills' | 'experience' | 'education' | 'cv';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  completed?: boolean;
  action_url?: string;
}

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
  
  // Section-specific edit mode states
  const [editingSections, setEditingSections] = useState<{ [key: string]: boolean }>({});
  const [editedData, setEditedData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // ProfileSuggestions states
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const profileResponse = await candidateApi.getProfile();
        console.log('Profile response:', profileResponse);
        
        if (profileResponse?.success && profileResponse?.data) {
          setProfileData(profileResponse.data);
          setEditedData(profileResponse.data); // Initialize edit data
          setError(null);
        } else if (profileResponse?.data) {
          // Handle direct data response
          setProfileData(profileResponse.data);
          setEditedData(profileResponse.data); // Initialize edit data
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

    const fetchSuggestions = async () => {
      try {
        setSuggestionsLoading(true);
        setSuggestionsError(null);
        const response = await candidateApi.getProfileSuggestions();
        
        // Handle different response formats
        let suggestionsData = [];
        
        if (response && typeof response === 'object') {
          if (response.success && Array.isArray(response.data)) {
            suggestionsData = response.data;
          } else if (Array.isArray(response)) {
            suggestionsData = response;
          } else if (response.data && Array.isArray(response.data)) {
            suggestionsData = response.data;
          }
        }
        
        setSuggestions(suggestionsData);
      } catch (err: any) {
        console.error('Error fetching profile suggestions:', err);
        setSuggestions([]); // Ensure suggestions is always an array
        if (err.response?.status === 401) {
          setSuggestionsError('Please log in to view profile suggestions.');
        } else {
          setSuggestionsError('Unable to load suggestions at this time.');
        }
      } finally {
        setSuggestionsLoading(false);
      }
    };

    fetchProfile();
    fetchSuggestions();
  }, []);


  const handleGoToProfile = () => {
    setActiveTab('public-profile');
  };

  // ProfileSuggestions helper functions
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return (
          <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'medium':
        return (
          <svg className="h-4 w-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'low':
        return (
          <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'profile':
        return (
          <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'skills':
        return (
          <svg className="h-5 w-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'experience':
        return (
          <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 6V8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2z" />
          </svg>
        );
      case 'education':
        return (
          <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'cv':
        return (
          <svg className="h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const handleSuggestionAction = (suggestion: Suggestion) => {
    // Handle suggestion action here
    console.log('Suggestion action:', suggestion);
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
  };

  const refreshSuggestions = async () => {
    try {
      setSuggestionsLoading(true);
      setSuggestionsError(null);
      const response = await candidateApi.getProfileSuggestions();
      
      // Handle different response formats
      let suggestionsData = [];
      
      if (response && typeof response === 'object') {
        if (response.success && Array.isArray(response.data)) {
          suggestionsData = response.data;
        } else if (Array.isArray(response)) {
          suggestionsData = response;
        } else if (response.data && Array.isArray(response.data)) {
          suggestionsData = response.data;
        }
      }
      
      setSuggestions(suggestionsData);
    } catch (err: any) {
      console.error('Error refreshing suggestions:', err);
      setSuggestions([]);
      if (err.response?.status === 401) {
        setSuggestionsError('Please log in to view profile suggestions.');
      } else {
        setSuggestionsError('Unable to load suggestions at this time.');
      }
    } finally {
      setSuggestionsLoading(false);
    }
  };

  // Section-specific edit functions
  const handleSectionEdit = (sectionName: string) => {
    setEditingSections(prev => ({ ...prev, [sectionName]: true }));
    setEditedData({ ...profileData }); // Copy current data to edit state
    setSaveError(null);
    setSaveSuccess(null);
  };

  const handleSectionCancel = (sectionName: string) => {
    setEditingSections(prev => ({ ...prev, [sectionName]: false }));
    setEditedData({ ...profileData }); // Reset to original data
    setSaveError(null);
    setSaveSuccess(null);
  };

  const handleFieldChange = (field: string, value: any, nestedField?: string) => {
    setEditedData((prev: any) => {
      if (nestedField) {
        return {
          ...prev,
          [field]: {
            ...prev[field],
            [nestedField]: value
          }
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
  };

  const handleSaveProfile = async (sectionName?: string) => {
    try {
      setIsSaving(true);
      setSaveError(null);
      setSaveSuccess(null);

      // Prepare data for API call - only send fields that are allowed by the backend
      const updateData: any = {};
      
      // Basic profile fields (based on actual API schema)
      if (editedData.full_name !== undefined) updateData.full_name = editedData.full_name;
      if (editedData.phone !== undefined) updateData.phone = editedData.phone;
      if (editedData.bio !== undefined) updateData.bio = editedData.bio;
      if (editedData.avatar_url !== undefined) updateData.avatar_url = editedData.avatar_url;
      if (editedData.location !== undefined) updateData.location = editedData.location;

      // Personal details
      if (editedData.date_of_birth !== undefined) updateData.date_of_birth = editedData.date_of_birth;
      if (editedData.gender !== undefined) updateData.gender = editedData.gender;
      if (editedData.address !== undefined) updateData.address = editedData.address;

      // Career details (only fields that exist in API)
      if (editedData.experience_level !== undefined) updateData.experience_level = editedData.experience_level;
      if (editedData.current_job_title !== undefined) updateData.current_job_title = editedData.current_job_title;
      if (editedData.years_of_experience !== undefined) updateData.years_of_experience = editedData.years_of_experience;
      if (editedData.job_seeking_status !== undefined) updateData.job_seeking_status = editedData.job_seeking_status;

      // Education
      if (editedData.education_level !== undefined) updateData.education_level = editedData.education_level;

      // Legacy candidate_profile fields mapping for backward compatibility
      if (editedData.candidate_profile) {
        if (editedData.candidate_profile.date_of_birth !== undefined) updateData.date_of_birth = editedData.candidate_profile.date_of_birth;
        if (editedData.candidate_profile.gender !== undefined) updateData.gender = editedData.candidate_profile.gender;
        if (editedData.candidate_profile.address !== undefined) updateData.address = editedData.candidate_profile.address;
        if (editedData.candidate_profile.city_id !== undefined) updateData.city_id = editedData.candidate_profile.city_id;
        if (editedData.candidate_profile.district_id !== undefined) updateData.district_id = editedData.candidate_profile.district_id;
        if (editedData.candidate_profile.education_level !== undefined) updateData.education_level = editedData.candidate_profile.education_level;
        if (editedData.candidate_profile.years_experience !== undefined) updateData.years_of_experience = editedData.candidate_profile.years_experience;
        if (editedData.candidate_profile.current_job_title !== undefined) updateData.current_job_title = editedData.candidate_profile.current_job_title;
        if (editedData.candidate_profile.current_company !== undefined) updateData.current_company = editedData.candidate_profile.current_company;
        if (editedData.candidate_profile.job_seeking_status !== undefined) updateData.job_seeking_status = editedData.candidate_profile.job_seeking_status;
      }

      console.log('Updating profile with data:', updateData);

      const response = await candidateApi.updateProfile(updateData);
      console.log('Profile update response:', response);

      if (response.success) {
        // Update the profile data with the response
        setProfileData(response.data);
        setEditedData(response.data);
        
        // Close the specific section edit mode if provided
        if (sectionName) {
          setEditingSections(prev => ({ ...prev, [sectionName]: false }));
        } else {
          // Close all edit modes
          setEditingSections({});
        }
        
        setSaveSuccess('Profile updated successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSaveSuccess(null), 3000);
      } else {
        setSaveError(response.message || 'Failed to update profile');
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setSaveError(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };



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
        isCollapsed={false}
        onToggleSidebar={() => {}}
        onDashboardClick={onDashboardClick}
        onAgentAIClick={onAgentAIClick}
        onMyApplicationsClick={onMyApplicationsClick}
        onTestManagementClick={onTestManagementClick}
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
            <div className="bg-white rounded-xl shadow-sm p-8 relative">
              {/* Edit button for this section */}
              {!editingSections.header && (
                <button 
                  onClick={() => handleSectionEdit('header')}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Edit basic information"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}

              <div className="flex items-start space-x-6">
                {/* User Avatar */}
                <div className="relative">
                  {profileData.avatar_url || profileData.avatarUrl ? (
                    <img 
                      src={profileData.avatar_url || profileData.avatarUrl} 
                    alt="Profile" 
                      className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
                      onError={(e) => {
                        // Hide image completely if it fails to load
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-gray-100">
                      <span className="text-3xl font-bold text-white">
                        {profileData.full_name ? profileData.full_name.charAt(0).toUpperCase() : '?'}
                      </span>
                </div>
                  )}
                  
                  {editingSections.header && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Profile Information */}
                                      <div className="flex-1">
                  {/* Error/Success Messages */}
                  {saveError && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                      {saveError}
                    </div>
                  )}
                  {saveSuccess && (
                    <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                      {saveSuccess}
                    </div>
                  )}

                  {/* Full Name - Editable */}
                  {editingSections.header ? (
                    <input
                      type="text"
                      value={editedData.full_name || ''}
                      onChange={(e) => handleFieldChange('full_name', e.target.value)}
                      className="text-3xl font-bold text-gray-900 mb-3 border-b-2 border-blue-300 focus:border-blue-500 outline-none bg-transparent w-full rounded"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">{profileData.full_name || 'Name not provided'}</h2>
                  )}
                  
                  {/* Job Title - Editable */}
                  {editingSections.header ? (
                    <input
                      type="text"
                      value={editedData.current_job_title || editedData.candidate_profile?.current_job_title || ''}
                      onChange={(e) => handleFieldChange('current_job_title', e.target.value)}
                      className="text-gray-600 text-lg mb-3 border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none bg-transparent w-full"
                      placeholder="Enter your current job title"
                    />
                  ) : (
                    <p className="text-gray-600 text-lg mb-3">
                      {profileData.current_job_title || profileData.candidate_profile?.current_job_title || 'No headline provided'}
                    </p>
                  )}
                  
                  {/* Location - Editable */}
                  <div className="flex items-center mb-4">
                    <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    {editingSections.header ? (
                      <input
                        type="text"
                        value={editedData.location || editedData.address || editedData.candidate_profile?.address || editedData.candidate_profile?.city_name || ''}
                        onChange={(e) => handleFieldChange('location', e.target.value)}
                        className="text-gray-500 border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none bg-transparent flex-1"
                        placeholder="Enter your location"
                      />
                    ) : (
                      <span className="text-gray-500">
                        {profileData.location || profileData.address || profileData.candidate_profile?.city_name || profileData.candidate_profile?.address || 'Location not set'}
                      </span>
                    )}
                  </div>

                  {/* Experience Level */}
                  <div className="flex items-center mb-4">
                    <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {editingSections.header ? (
                      <select
                        value={editedData.experience_level || ''}
                        onChange={(e) => handleFieldChange('experience_level', e.target.value)}
                        className="text-gray-500 border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      >
                        <option value="">Select experience level</option>
                        <option value="FRESHER">Fresher</option>
                        <option value="JUNIOR">Junior</option>
                        <option value="SENIOR">Senior</option>
                        <option value="LEAD">Lead</option>
                        <option value="EXPERT">Expert</option>
                      </select>
                    ) : (
                      <span className="text-gray-500">
                        {profileData.experience_level ? 
                          profileData.experience_level.charAt(0) + profileData.experience_level.slice(1).toLowerCase() + ' Level' : 
                          'Experience level not set'}
                      </span>
                    )}
                  </div>

                  {/* Job Seeking Status Badge */}
                  <div className="mb-4">
                    {editingSections.header ? (
                      <select
                        value={editedData.job_seeking_status || editedData.candidate_profile?.job_seeking_status || ''}
                        onChange={(e) => handleFieldChange('job_seeking_status', e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                      >
                        <option value="">Select status</option>
                        <option value="ACTIVELY_SEEKING">Actively Seeking</option>
                        <option value="OPEN_TO_OPPORTUNITIES">Open to Opportunities</option>
                        <option value="NOT_SEEKING">Not Seeking</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                        (profileData.job_seeking_status || profileData.candidate_profile?.job_seeking_status) === 'ACTIVELY_SEEKING' || 
                        (profileData.job_seeking_status || profileData.candidate_profile?.job_seeking_status) === 'OPEN_TO_OPPORTUNITIES' ? 
                        'bg-green-100 text-green-700 border border-green-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                      }`}>
                        <span className={`w-2 h-2 rounded-full mr-2 ${
                          (profileData.job_seeking_status || profileData.candidate_profile?.job_seeking_status) === 'ACTIVELY_SEEKING' || 
                          (profileData.job_seeking_status || profileData.candidate_profile?.job_seeking_status) === 'OPEN_TO_OPPORTUNITIES' ? 
                          'bg-green-500' : 'bg-yellow-500'
                        }`}></span>
                        {(profileData.job_seeking_status || profileData.candidate_profile?.job_seeking_status) === 'ACTIVELY_SEEKING' ? 'ACTIVELY SEEKING' : 
                         (profileData.job_seeking_status || profileData.candidate_profile?.job_seeking_status) === 'OPEN_TO_OPPORTUNITIES' ? 'OPEN FOR OPPORTUNITIES' : 
                       'NOT SEEKING'}
                    </span>
                    )}
                    </div>
                    
                  {/* Avatar URL - In edit mode */}
                  {editingSections.header && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-3">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div className="flex-1">
                          <p className="text-sm text-gray-500 mb-1">Avatar URL</p>
                          <input
                            type="url"
                            value={editedData.avatar_url || ''}
                            onChange={(e) => handleFieldChange('avatar_url', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none"
                            placeholder="Enter image URL for your avatar"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Edit Controls */}
                  {editingSections.header && (
                    <div className="flex gap-3 mt-6">
                      <button 
                        onClick={() => handleSaveProfile('header')}
                        disabled={isSaving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isSaving ? 'Saving...' : 'Save'}
                      </button>
                      <button 
                        onClick={() => handleSectionCancel('header')}
                        disabled={isSaving}
                        className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Cancel
                    </button>
                  </div>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Suggestions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {suggestionsLoading ? (
                <div className="animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-16 bg-gray-100 rounded"></div>
                    ))}
                  </div>
                </div>
              ) : suggestionsError ? (
                <div className="text-center py-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-gray-600 mb-2">{suggestionsError}</p>
                  <button
                    onClick={refreshSuggestions}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Profile Suggestions</h3>
                      <p className="text-sm text-gray-600">Complete your profile to attract more employers</p>
                    </div>
                    {(() => {
                      const safeSuggestions = Array.isArray(suggestions) ? suggestions : [];
                      const activeSuggestions = safeSuggestions.filter(s => !dismissedSuggestions.has(s.id));
                      const completionPercentage = safeSuggestions.length > 0 
                        ? Math.round(((safeSuggestions.length - activeSuggestions.length) / safeSuggestions.length) * 100)
                        : 0;

                      return safeSuggestions.length > 0 && (
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">{completionPercentage}% Complete</div>
                          <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${completionPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {(() => {
                    const safeSuggestions = Array.isArray(suggestions) ? suggestions : [];
                    const activeSuggestions = safeSuggestions.filter(s => !dismissedSuggestions.has(s.id));

                    return activeSuggestions.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="mx-auto h-12 w-12 text-green-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm font-medium">Great job!</p>
                        <p className="text-xs text-gray-400 mt-1">Your profile looks complete</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activeSuggestions
                          .sort((a, b) => {
                            const priorityOrder = { high: 3, medium: 2, low: 1 };
                            return priorityOrder[b.priority] - priorityOrder[a.priority];
                          })
                          .map((suggestion) => (
                            <div
                              key={suggestion.id}
                              className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1">
                                  <div className="flex-shrink-0 mt-1">
                                    {getTypeIcon(suggestion.type)}
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className="text-sm font-medium text-gray-900">
                                        {suggestion.title}
                                      </h4>
                                      <div className="flex items-center gap-1">
                                        {getPriorityIcon(suggestion.priority)}
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(suggestion.priority)}`}>
                                          {suggestion.priority}
                                        </span>
                                      </div>
                                    </div>
                                    
                                    <p className="text-sm text-gray-600 mb-3">
                                      {suggestion.description}
                                    </p>
                                    
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleSuggestionAction(suggestion)}
                                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                                      >
                                        Take Action
                                      </button>
                                      <button
                                        onClick={() => handleDismissSuggestion(suggestion.id)}
                                        className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition-colors"
                                      >
                                        Dismiss
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => handleDismissSuggestion(suggestion.id)}
                                  className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                  title="Dismiss suggestion"
                                >
                                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    );
                  })()}

                  {(() => {
                    const safeSuggestions = Array.isArray(suggestions) ? suggestions : [];
                    const activeSuggestions = safeSuggestions.filter(s => !dismissedSuggestions.has(s.id));

                    return activeSuggestions.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <button
                          onClick={refreshSuggestions}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Refresh suggestions
                        </button>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>

            {/* About Me */}
            <div className="bg-white rounded-xl shadow-sm p-6 text-left relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">About Me</h3>
                {!editingSections.about && (
                  <button 
                    onClick={() => handleSectionEdit('about')}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="Edit about section"
                  >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                )}
              </div>
              
              {editingSections.about ? (
                <div>
                  <textarea
                    value={editedData.bio || ''}
                    onChange={(e) => handleFieldChange('bio', e.target.value)}
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    rows={5}
                    placeholder="Tell us about yourself, your experience, and what makes you unique..."
                  />
                  <div className="flex gap-3 mt-4">
                    <button 
                      onClick={() => handleSaveProfile('about')}
                      disabled={isSaving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button 
                      onClick={() => handleSectionCancel('about')}
                      disabled={isSaving}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
              <p className="text-gray-600 leading-relaxed">
                {profileData.bio || 'No about section provided. Click edit to add one.'}
              </p>
                </div>
              )}
            </div>

            {/* Skills Management */}
            <SkillManagement 
              userSkills={profileData.candidate_profile?.skills || []} 
              onSkillsUpdate={(skills) => {
                setProfileData((prev: any) => ({ 
                  ...prev, 
                  candidate_profile: {
                    ...prev.candidate_profile,
                    skills
                  }
                }));
              }}
            />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Personal Details */}
            <div className="bg-white rounded-xl shadow-sm p-6 text-left relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Personal Details</h3>
                {!editingSections.details && (
                  <button 
                    onClick={() => handleSectionEdit('details')}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title="Edit personal details"
                  >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                )}
              </div>
              
              <div className="space-y-4">
                {/* Date of Birth */}
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m5 0a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V9a2 2 0 012-2h12zM9 7h6" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Date of birth</p>
                    {editingSections.details ? (
                      <input
                        type="date"
                        value={editedData.date_of_birth?.split('T')[0] || editedData.candidate_profile?.date_of_birth?.split('T')[0] || ''}
                        onChange={(e) => handleFieldChange('date_of_birth', e.target.value)}
                        className="font-medium border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none bg-white w-full"
                      />
                    ) : (
                      <p className="font-medium">{(profileData.date_of_birth || profileData.candidate_profile?.date_of_birth)?.split('T')[0] || 'Not set'}</p>
                    )}
                  </div>
                </div>
                
                {/* Gender */}
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Gender</p>
                    {editingSections.details ? (
                      <select
                        value={editedData.gender || editedData.candidate_profile?.gender || ''}
                        onChange={(e) => handleFieldChange('gender', e.target.value)}
                        className="font-medium border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none w-full"
                      >
                        <option value="">Select gender</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                        <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                      </select>
                    ) : (
                      <p className="font-medium">
                        {(profileData.gender || profileData.candidate_profile?.gender)?.replace('_', ' ')?.toLowerCase()?.replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Not set'}
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Email (read-only) */}
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{profileData.email}</p>
                  </div>
                </div>
                
                {/* Phone */}
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Phone</p>
                    {editingSections.details ? (
                      <input
                        type="tel"
                        value={editedData.phone || ''}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        className="font-medium border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none w-full"
                        placeholder="Enter phone number"
                      />
                    ) : (
                    <p className="font-medium">{profileData.phone || 'Not set'}</p>
                    )}
                </div>
              </div>
            </div>

              {/* Edit Controls */}
              {editingSections.details && (
                <div className="flex gap-3 mt-6">
                  <button 
                    onClick={() => handleSaveProfile('details')}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    onClick={() => handleSectionCancel('details')}
                    disabled={isSaving}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancel
                </button>
              </div>
                )}
              </div>


          </div>
        </div>

        {/* Full Width Sections */}
        <div className="space-y-6 mt-8 text-left">
          {/* Work Experience */}
          <div className="bg-white rounded-xl shadow-sm p-6 relative">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Work Experience</h3>
              {!editingSections.experience && (
                <button 
                  onClick={() => handleSectionEdit('experience')}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Edit work experience"
                >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              )}
            </div>
            
            <div className="space-y-6">
              {profileData.current_job_title || profileData.candidate_profile?.current_job_title || editingSections.experience ? (
                <div className="flex space-x-4">
                  <div className="w-12 h-12 bg-[#007BFF] rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 6V8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    {/* Job Title */}
                    <div className="mb-2">
                      {editingSections.experience ? (
                        <input
                          type="text"
                          value={editedData.current_job_title || editedData.candidate_profile?.current_job_title || ''}
                          onChange={(e) => handleFieldChange('current_job_title', e.target.value)}
                          className="font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none w-full"
                          placeholder="Enter current job title"
                        />
                      ) : (
                        <h4 className="font-semibold text-gray-900">{profileData.current_job_title || profileData.candidate_profile?.current_job_title}</h4>
                      )}
                    </div>
                    
                    {/* Company */}
                    <div className="mb-2">
                      {editingSections.experience ? (
                        <input
                          type="text"
                          value={editedData.current_company || editedData.candidate_profile?.current_company || ''}
                          onChange={(e) => handleFieldChange('current_company', e.target.value)}
                          className="text-[#007BFF] font-medium border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none w-full"
                          placeholder="Company name"
                        />
                      ) : (
                        <p className="text-[#007BFF] font-medium">{profileData.current_company || profileData.candidate_profile?.current_company || 'Company'} • Current</p>
                      )}
                    </div>
                    
                    <p className="text-gray-500 text-sm mb-2">{profileData.location || profileData.address || profileData.candidate_profile?.city_name || profileData.candidate_profile?.address || 'Location not specified'}</p>
                    
                    {/* Years of Experience */}
                    <div>
                      {editingSections.experience ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={editedData.years_of_experience || editedData.candidate_profile?.years_experience || ''}
                            onChange={(e) => handleFieldChange('years_of_experience', parseInt(e.target.value) || 0)}
                            className="text-gray-600 border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 outline-none w-24"
                            placeholder="0"
                            min="0"
                            max="50"
                          />
                          <span className="text-gray-600">years of experience</span>
                        </div>
                      ) : (
                        <p className="text-gray-600">
                          {(profileData.years_of_experience || profileData.candidate_profile?.years_experience) ? 
                            `${profileData.years_of_experience || profileData.candidate_profile?.years_experience} years of experience` : 
                            'Experience information not provided'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No work experience added yet</p>
              )}
            </div>

            {/* Edit Controls */}
            {editingSections.experience && (
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => handleSaveProfile('experience')}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button 
                  onClick={() => handleSectionCancel('experience')}
                  disabled={isSaving}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Education */}
          <div className="bg-white rounded-xl shadow-sm p-6 relative">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Education</h3>
              {!editingSections.education && (
                <button 
                  onClick={() => handleSectionEdit('education')}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Edit education"
                >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              )}
            </div>
            
            <div className="space-y-6">
              {profileData.education_level || profileData.candidate_profile?.education_level || editingSections.education ? (
                <div className="flex space-x-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="mb-2">
                      {editingSections.education ? (
                        <select
                          value={editedData.education_level || editedData.candidate_profile?.education_level || ''}
                          onChange={(e) => handleFieldChange('education_level', e.target.value)}
                          className="font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none w-full"
                        >
                          <option value="">Select education level</option>
                          <option value="HIGH_SCHOOL">High School</option>
                          <option value="COLLEGE">College</option>
                          <option value="BACHELOR">Bachelor's Degree</option>
                          <option value="MASTER">Master's Degree</option>
                          <option value="PHD">PhD</option>
                        </select>
                      ) : (
                        <h4 className="font-semibold text-gray-900">
                          {(profileData.education_level || profileData.candidate_profile?.education_level)?.replace('_', ' ')?.toLowerCase()?.replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </h4>
                      )}
                    </div>
                    <p className="text-gray-600 font-medium">Education Level</p>
                    <p className="text-gray-500 text-sm">Highest level of education completed</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No education information added yet</p>
              )}
            </div>

            {/* Edit Controls */}
            {editingSections.education && (
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => handleSaveProfile('education')}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button 
                  onClick={() => handleSectionCancel('education')}
                  disabled={isSaving}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Skills */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {profileData.candidate_profile?.skills && profileData.candidate_profile.skills.length > 0 ? (
                profileData.candidate_profile.skills.map((skill: any, index: number) => (
                  <span key={index} className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-xl text-sm font-medium border border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-colors">
                    {typeof skill === 'string' ? skill : skill.skill_name}
                  </span>
                ))
              ) : (
                <p className="text-gray-500">No skills added yet</p>
              )}
            </div>
          </div>


                    </div>
      </div>
    </div>
  );
};

export default Profile; 