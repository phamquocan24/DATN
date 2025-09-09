import React, { useState, useEffect } from 'react';

import DashboardSidebar from './DashboardSidebar';
import SkillManagement from './SkillManagement';
import candidateApi from '../../services/candidateApi';

interface Suggestion {
  category: string;
  field: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

// User profile data structure based on database schema
interface UserProfileData {
  // Users table fields
  user_id: string;
  email: string;
  phone?: string;
  full_name: string;
  role: 'CANDIDATE' | 'RECRUITER' | 'ADMIN';
  auth_provider?: string;
  is_active: boolean;
  created_at: string;
  
  // User profile table fields  
  profile_image_url?: string;
  bio?: string;
  website_url?: string;
  languages?: string[];
  profile_completed?: boolean;
  account_status?: string;
  last_login_at?: string;
  
  // Compatibility fields
  avatar_url?: string;
  avatarUrl?: string;
  current_job_title?: string;
  current_company?: string;
  education_level?: 'HIGH_SCHOOL' | 'COLLEGE' | 'BACHELOR' | 'MASTER' | 'PHD';
  years_of_experience?: number;
  
  // Candidate profile nested object
  candidate_profile?: {
    profile_id: string;
    user_id: string;
    date_of_birth?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
    address?: string;
    city_id?: string;
    city_name?: string;
    district_id?: string;
    district_name?: string;
    education_level?: 'HIGH_SCHOOL' | 'COLLEGE' | 'BACHELOR' | 'MASTER' | 'PHD';
    years_experience?: number;
    current_job_title?: string;
    current_company?: string;
    current_salary?: number;
    expected_salary?: number;
    currency?: string;
    notice_period_days?: number;
    willing_to_relocate?: boolean;
    remote_work_preference?: 'ONSITE' | 'REMOTE' | 'HYBRID' | 'FLEXIBLE';
    primary_cv_id?: string;
    profile_completion_percentage?: number;
    job_seeking_status?: string;
    skills?: Array<{
      skill_id: string; // Added skill_id from backend
      skill_name: string;
      category: string;
      proficiency_level: string;
      years_experience: number;
      is_primary: boolean;
    }>;
    skill_count?: number;
    cv_count?: number;
  };
  
  // CV extracted data for detailed display
  cv_education?: Array<{
    school: string;
    degree: string;
    field: string;
    start_date: string;
    end_date: string;
    gpa?: string;
  }>;
  
  cv_experience?: Array<{
    company: string;
    position: string;
    start_date: string;
    end_date: string;
    description: string;
  }>;
}

interface ProfileProps {
  onHomeClick?: () => void;
  onDashboardClick?: () => void;
  onMyApplicationsClick?: () => void;
  onTestManagementClick?: () => void;
  onSettingsClick?: () => void;
  onHelpCenterClick?: () => void;
}

const Profile: React.FC<ProfileProps> = ({ 
  onHomeClick, 
  onDashboardClick, 
  onMyApplicationsClick, 
  onTestManagementClick, 
  onSettingsClick,
  onHelpCenterClick
}) => {
  const [activeTab, setActiveTab] = useState('public-profile');
  const [profileData, setProfileData] = useState<Partial<UserProfileData>>({});
  const [error, setError] = useState<string | null>(null);
  
  // Section-specific edit mode states
  const [editingSections, setEditingSections] = useState<{ [key: string]: boolean }>({});
  const [editedData, setEditedData] = useState<Partial<UserProfileData>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profileResponse = await candidateApi.getProfile();
        
        if (profileResponse?.success && profileResponse?.data) {
          const userData = profileResponse.data as UserProfileData;
          setProfileData(userData);
          setEditedData(userData);
          setError(null);
        } else {
          setError('Bạn cần đăng nhập để xem profile.');
        }
      } catch (err: any) {
        if (err.response?.status === 401) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else {
          setError('Không thể tải dữ liệu profile.');
        }
      }
    };

    const fetchSuggestions = async () => {
      try {
        setSuggestionsError(null);
        const response = await candidateApi.getProfileSuggestions();
        
        
        
        if (response && response.success && response.data) {
          setSuggestions(response.data.suggestions || []);
          setCompletionPercentage(response.data.completion_percentage || 0);
        } else {
          setSuggestions([]);
          setCompletionPercentage(0);
        }
      } catch (err: any) {
  
        setSuggestions([]);
        setCompletionPercentage(0);
        if (err.response?.status === 401) {
          setSuggestionsError('Please log in to view profile suggestions.');
        } else {
          setSuggestionsError('Unable to load suggestions at this time.');
        }
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

  const getTypeIcon = (category: string) => {
    switch (category) {
      case 'basic':
        return (
          <svg className="h-5 w-5 text-[#007bff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      case 'contact':
        return (
          <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        );
      case 'salary':
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

  const handleSuggestionAction = (_suggestion: Suggestion) => {
    // Handle suggestion action here
  };

  const handleDismissSuggestion = (suggestionField: string) => {
    setDismissedSuggestions(prev => new Set([...prev, suggestionField]));
  };

  const refreshSuggestions = async () => {
    try {
      setSuggestionsError(null);
      const response = await candidateApi.getProfileSuggestions();
      
      if (response && response.success && response.data) {
        setSuggestions(response.data.suggestions || []);
        setCompletionPercentage(response.data.completion_percentage || 0);
      } else {
        setSuggestions([]);
        setCompletionPercentage(0);
      }
    } catch (err: any) {

      setSuggestions([]);
      setCompletionPercentage(0);
      if (err.response?.status === 401) {
        setSuggestionsError('Please log in to view profile suggestions.');
      } else {
        setSuggestionsError('Unable to load suggestions at this time.');
      }
    }
  };

  // Section-specific edit functions
  const handleSectionEdit = (sectionName: string) => {
    setEditingSections(prev => ({ ...prev, [sectionName]: true }));
    // Only copy relevant data for the section being edited to avoid unintended changes
    let sectionData = {};
    switch (sectionName) {
      case 'header':
        sectionData = {
          full_name: profileData.full_name,
          current_job_title: profileData.current_job_title || profileData.candidate_profile?.current_job_title,
          profile_image_url: profileData.profile_image_url,
          avatar_url: profileData.avatar_url
        };
        break;
      case 'about':
        sectionData = {
          bio: profileData.bio
        };
        break;
      case 'experience':
        sectionData = {
          current_job_title: profileData.current_job_title || profileData.candidate_profile?.current_job_title,
          current_company: profileData.current_company || profileData.candidate_profile?.current_company,
          years_of_experience: profileData.years_of_experience || profileData.candidate_profile?.years_experience
        };
        break;
      case 'education':
        sectionData = {
          education_level: profileData.education_level || profileData.candidate_profile?.education_level
        };
        break;
      case 'personal':
        sectionData = {
          email: profileData.email,
          phone: profileData.phone,
          website_url: profileData.website_url,
          languages: profileData.languages,
          candidate_profile: {
            ...profileData.candidate_profile,
            date_of_birth: profileData.candidate_profile?.date_of_birth,
            gender: profileData.candidate_profile?.gender,
            address: profileData.candidate_profile?.address
          }
        };
        break;
      case 'salary':
        sectionData = {
          candidate_profile: {
            ...profileData.candidate_profile,
            current_salary: profileData.candidate_profile?.current_salary,
            expected_salary: profileData.candidate_profile?.expected_salary,
            currency: profileData.candidate_profile?.currency,
            remote_work_preference: profileData.candidate_profile?.remote_work_preference,
            years_experience: profileData.candidate_profile?.years_experience
          }
        };
        break;
      default:
        sectionData = { ...profileData };
    }
    setEditedData((prev: any) => ({ ...prev, ...sectionData }));
    setSaveError(null);
    setSaveSuccess(null);
  };

  const handleSectionCancel = (sectionName: string) => {
    setEditingSections(prev => ({ ...prev, [sectionName]: false }));
    // Reset only the fields for the cancelled section to original values
    let sectionData = {};
    switch (sectionName) {
      case 'header':
        sectionData = {
          full_name: profileData.full_name,
          current_job_title: profileData.current_job_title || profileData.candidate_profile?.current_job_title,
          profile_image_url: profileData.profile_image_url,
          avatar_url: profileData.avatar_url
        };
        break;
      case 'about':
        sectionData = {
          bio: profileData.bio
        };
        break;
      case 'experience':
        sectionData = {
          current_job_title: profileData.current_job_title || profileData.candidate_profile?.current_job_title,
          current_company: profileData.current_company || profileData.candidate_profile?.current_company,
          years_of_experience: profileData.years_of_experience || profileData.candidate_profile?.years_experience
        };
        break;
      case 'education':
        sectionData = {
          education_level: profileData.education_level || profileData.candidate_profile?.education_level
        };
        break;
      case 'personal':
        sectionData = {
          email: profileData.email,
          phone: profileData.phone,
          website_url: profileData.website_url,
          languages: profileData.languages,
          candidate_profile: {
            ...profileData.candidate_profile,
            date_of_birth: profileData.candidate_profile?.date_of_birth,
            gender: profileData.candidate_profile?.gender,
            address: profileData.candidate_profile?.address
          }
        };
        break;
      case 'salary':
        sectionData = {
          candidate_profile: {
            ...profileData.candidate_profile,
            current_salary: profileData.candidate_profile?.current_salary,
            expected_salary: profileData.candidate_profile?.expected_salary,
            currency: profileData.candidate_profile?.currency,
            remote_work_preference: profileData.candidate_profile?.remote_work_preference,
            years_experience: profileData.candidate_profile?.years_experience
          }
        };
        break;
      default:
        sectionData = { ...profileData };
    }
    setEditedData((prev: any) => ({ ...prev, ...sectionData }));
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

      const updateData: any = {};
      
      // Build updateData based on the specific section being saved
      if (sectionName) {
        switch (sectionName) {
          case 'header':
      if (editedData.full_name !== undefined) updateData.full_name = editedData.full_name;
            if (editedData.current_job_title !== undefined) updateData.current_job_title = editedData.current_job_title;
            if (editedData.profile_image_url !== undefined) updateData.profile_image_url = editedData.profile_image_url;
            if (editedData.avatar_url !== undefined) updateData.profile_image_url = editedData.avatar_url;
            break;
          case 'about':
      if (editedData.bio !== undefined) updateData.bio = editedData.bio;
            break;
          case 'experience':
      if (editedData.current_job_title !== undefined) updateData.current_job_title = editedData.current_job_title;
      if (editedData.current_company !== undefined) updateData.current_company = editedData.current_company;
            if (editedData.years_of_experience !== undefined) updateData.years_experience = editedData.years_of_experience;
            break;
          case 'education':
      if (editedData.education_level !== undefined) updateData.education_level = editedData.education_level;
            break;
          case 'personal':
            if (editedData.email !== undefined) updateData.email = editedData.email;
            if (editedData.phone !== undefined) updateData.phone = editedData.phone;
            if (editedData.website_url !== undefined) updateData.website_url = editedData.website_url;
            if (editedData.languages !== undefined) updateData.languages = editedData.languages;
      if (editedData.candidate_profile) {
        if (editedData.candidate_profile.date_of_birth !== undefined) updateData.date_of_birth = editedData.candidate_profile.date_of_birth;
        if (editedData.candidate_profile.gender !== undefined) updateData.gender = editedData.candidate_profile.gender;
        if (editedData.candidate_profile.address !== undefined) updateData.address = editedData.candidate_profile.address;
            }
            break;
          case 'salary':
            if (editedData.candidate_profile) {
              if (editedData.candidate_profile.current_salary !== undefined) updateData.current_salary = editedData.candidate_profile.current_salary;
              if (editedData.candidate_profile.expected_salary !== undefined) updateData.expected_salary = editedData.candidate_profile.expected_salary;
              if (editedData.candidate_profile.currency !== undefined) updateData.currency = editedData.candidate_profile.currency;
              if (editedData.candidate_profile.remote_work_preference !== undefined) updateData.remote_work_preference = editedData.candidate_profile.remote_work_preference;
              if (editedData.candidate_profile.years_experience !== undefined) updateData.years_experience = editedData.candidate_profile.years_experience;
            }
            break;
        }
      } else {
        // Fallback: if no specific section, send all available data (legacy behavior)
        if (editedData.full_name !== undefined) updateData.full_name = editedData.full_name;
        if (editedData.phone !== undefined) updateData.phone = editedData.phone;
        if (editedData.bio !== undefined) updateData.bio = editedData.bio;
        if (editedData.profile_image_url !== undefined) updateData.profile_image_url = editedData.profile_image_url;
        if (editedData.avatar_url !== undefined) updateData.profile_image_url = editedData.avatar_url;
        if (editedData.website_url !== undefined) updateData.website_url = editedData.website_url;
        if (editedData.languages !== undefined) updateData.languages = editedData.languages;
        if (editedData.candidate_profile) {
          if (editedData.candidate_profile.date_of_birth !== undefined) updateData.date_of_birth = editedData.candidate_profile.date_of_birth;
          if (editedData.candidate_profile.gender !== undefined) updateData.gender = editedData.candidate_profile.gender;
          if (editedData.candidate_profile.address !== undefined) updateData.address = editedData.candidate_profile.address;
        if (editedData.candidate_profile.education_level !== undefined) updateData.education_level = editedData.candidate_profile.education_level;
        if (editedData.candidate_profile.years_experience !== undefined) updateData.years_experience = editedData.candidate_profile.years_experience;
        if (editedData.candidate_profile.current_job_title !== undefined) updateData.current_job_title = editedData.candidate_profile.current_job_title;
        if (editedData.candidate_profile.current_company !== undefined) updateData.current_company = editedData.candidate_profile.current_company;
        if (editedData.candidate_profile.current_salary !== undefined) updateData.current_salary = editedData.candidate_profile.current_salary;
        if (editedData.candidate_profile.expected_salary !== undefined) updateData.expected_salary = editedData.candidate_profile.expected_salary;
          if (editedData.candidate_profile.currency !== undefined) updateData.currency = editedData.candidate_profile.currency;
        if (editedData.candidate_profile.remote_work_preference !== undefined) updateData.remote_work_preference = editedData.candidate_profile.remote_work_preference;
        }
      }

      const response = await candidateApi.updateProfile(updateData);

      if (response.success) {
        // Merge the response data with existing profile data
        setProfileData((prev: any) => ({ ...prev, ...response.data }));
        setEditedData((prev: any) => ({ ...prev, ...response.data }));
        
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

      setSaveError(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };




  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <DashboardSidebar 
        activeTab={activeTab}
        isCollapsed={false}
        onToggleSidebar={() => {}}
        onDashboardClick={onDashboardClick}
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
            className="px-4 py-2 text-[#007bff] hover:text-white font-medium border border-[#007bff] rounded-lg hover:bg-[#007bff] transition-colors"
          >
            Back to homepage
          </button>
        </div>

        {/* Error notification - non-blocking */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 relative text-left">
              {/* Edit button for this section */}
              {!editingSections.header && (
                <button 
                  onClick={() => handleSectionEdit('header')}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-[#007bff] hover:bg-blue-50 rounded-full transition-colors"
                  title="Edit basic information"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}

              <div className="flex items-start space-x-6 text-left">
                {/* User Avatar */}
                <div className="relative">
                   {profileData.profile_image_url || profileData.avatar_url || profileData.avatarUrl ? (
                    <img 
                       src={profileData.profile_image_url || profileData.avatar_url || profileData.avatarUrl} 
                    alt="Profile" 
                      className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#007bff] to-purple-600 flex items-center justify-center border-4 border-gray-100">
                      <span className="text-3xl font-bold text-white">
                        {profileData.full_name ? profileData.full_name.charAt(0).toUpperCase() : '?'}
                      </span>
                </div>
                  )}
                  
                  {editingSections.header && (
                     <>
                                             <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              // Create FormData for file upload
                              const formData = new FormData();
                              formData.append('avatar', file);
                              
                              // Upload file to server
                              const uploadResponse = await candidateApi.uploadAvatar(formData);
                              
                              if (uploadResponse.success && uploadResponse.data?.avatar_url) {
                                // Use the server-returned URL
                                handleFieldChange('profile_image_url', uploadResponse.data.avatar_url);
                              }
                            } catch (error) {
                              console.error('Failed to upload avatar:', error);
                              setError('Failed to upload avatar. Please try again.');
                            }
                          }
                        }}
                        className="hidden"
                        id="avatar-upload"
                      />
                       <label
                         htmlFor="avatar-upload"
                         className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                       >
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                       </label>
                     </>
                  )}
                </div>
                
                {/* Profile Information */}
                <div className="flex-1 text-left">
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
                      className="text-3xl font-bold text-gray-900 mb-3 border-b-2 border-[#007bff] focus:border-[#007bff] outline-none bg-transparent w-full rounded"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <h2 className="text-3xl font-bold text-gray-900 mb-3 text-left">{profileData.full_name || 'Name not provided'}</h2>
                  )}
                  
                  {/* Job Title - Editable */}
                  {editingSections.header ? (
                    <input
                      type="text"
                      value={editedData.current_job_title || editedData.candidate_profile?.current_job_title || ''}
                      onChange={(e) => handleFieldChange('current_job_title', e.target.value)}
                      className="text-gray-600 text-lg mb-3 border border-gray-300 rounded-lg px-3 py-2 focus:border-[#007bff] outline-none bg-transparent w-full"
                      placeholder="Enter your current job title"
                    />
                  ) : (
                    <p className="text-gray-600 text-lg mb-3 text-left">
                      {profileData.current_job_title || profileData.candidate_profile?.current_job_title || 'No headline provided'}
                    </p>
                  )}
                  
                                     

                  
                    
                  

                  {/* Edit Controls */}
                  {editingSections.header && (
                    <div className="flex gap-3 mt-6">
                      <button 
                        onClick={() => handleSaveProfile('header')}
                        disabled={isSaving}
                        className="px-4 py-2 bg-[#007bff] text-white rounded-lg font-medium hover:bg-[#0056b3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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



            {/* About Me */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">About Me</h3>
                {!editingSections.about && (
                  <button 
                    onClick={() => handleSectionEdit('about')}
                    className="p-2 text-gray-400 hover:text-[#007bff] hover:bg-blue-50 rounded-full transition-colors"
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
                    className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#007bff] focus:border-[#007bff] outline-none resize-none"
                    rows={5}
                    placeholder="Tell us about yourself, your experience, and what makes you unique..."
                  />
                  <div className="flex gap-3 mt-4">
                    <button 
                      onClick={() => handleSaveProfile('about')}
                      disabled={isSaving}
                      className="px-4 py-2 bg-[#007bff] text-white rounded-lg font-medium hover:bg-[#0056b3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

          {/* Work Experience */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left relative">
              <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Work Experience</h3>
              {!editingSections.experience && (
                <button 
                  onClick={() => handleSectionEdit('experience')}
                  className="p-2 text-gray-400 hover:text-[#007bff] hover:bg-blue-50 rounded-full transition-colors"
                  title="Edit work experience"
                >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              )}
            </div>
            
            <div className="space-y-6">
              {/* Display detailed work experience from CV if available */}
              {profileData.cv_experience && profileData.cv_experience.length > 0 ? (
                <div className="space-y-4">
                  {profileData.cv_experience.map((exp, index) => (
                    <div key={index} className="flex space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 rounded-xl bg-[#007bff] flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6" fill="white" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{exp.position}</h4>
                        <p className="text-[#007bff] font-medium mb-2">{exp.company}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          {exp.start_date && exp.end_date && (
                            <span>{exp.start_date} - {exp.end_date}</span>
                          )}
                          {index === 0 && (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Current</span>
                          )}
                        </div>
                        {exp.description && (
                          <p className="text-gray-700 text-sm leading-relaxed">{exp.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  {/* Summary */}
                  <div className="flex items-center justify-center pt-4 border-t border-gray-200">
                    <p className="text-gray-600 text-sm">
                      {profileData.candidate_profile?.years_experience || profileData.cv_experience.length} years of experience
                    </p>
                  </div>
                </div>
              ) : profileData.current_job_title || profileData.candidate_profile?.current_job_title || editingSections.experience ? (
                <div className="flex space-x-4">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#007bff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
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
                          className="font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:border-[#007bff] outline-none w-full"
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
                          className="text-[#007bff] font-medium border border-gray-300 rounded-lg px-3 py-2 focus:border-[#007bff] outline-none w-full"
                          placeholder="Company name"
                        />
                      ) : (
                        <p className="text-[#007bff] font-medium">{profileData.current_company || profileData.candidate_profile?.current_company || 'Company'} • Current</p>
                      )}
                    </div>
                    
                    {/* Years of Experience */}
                    <div>
                      {editingSections.experience ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="number"
                            value={editedData.years_of_experience || editedData.candidate_profile?.years_experience || ''}
                            onChange={(e) => handleFieldChange('years_of_experience', parseInt(e.target.value) || 0)}
                            className="text-gray-600 border border-gray-300 rounded-lg px-3 py-2 focus:border-[#007bff] outline-none w-24"
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
                  className="px-4 py-2 bg-[#007bff] text-white rounded-lg font-medium hover:bg-[#0056b3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
             <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left relative">
               <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Education</h3>
              {!editingSections.education && (
                <button 
                  onClick={() => handleSectionEdit('education')}
                  className="p-2 text-gray-400 hover:text-[#007bff] hover:bg-blue-50 rounded-full transition-colors"
                  title="Edit education"
                >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              )}
            </div>
            
            <div className="space-y-6">
              {/* Display detailed education from CV if available */}
              {profileData.cv_education && profileData.cv_education.length > 0 ? (
                <div className="space-y-4">
                  {profileData.cv_education.map((edu, index) => (
                    <div key={index} className="flex space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-12 h-12 rounded-xl bg-[#007bff] flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6" fill="white" viewBox="0 0 24 24">
                          <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">
                          {edu.degree} {edu.field && `in ${edu.field}`}
                        </h4>
                        <p className="text-[#007bff] font-medium mb-1">{edu.school}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          {edu.start_date && edu.end_date && (
                            <span>{edu.start_date} - {edu.end_date}</span>
                          )}
                          {edu.gpa && (
                            <span>GPA: {edu.gpa}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : profileData.education_level || profileData.candidate_profile?.education_level || editingSections.education ? (
                <div className="flex space-x-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="#007bff" viewBox="0 0 24 24">
                      <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="mb-2">
                      {editingSections.education ? (
                        <select
                          value={editedData.education_level || editedData.candidate_profile?.education_level || ''}
                          onChange={(e) => handleFieldChange('education_level', e.target.value)}
                          className="font-semibold text-gray-900 border border-gray-300 rounded-lg px-3 py-2 focus:border-[#007bff] focus:ring-1 focus:ring-[#007bff] outline-none w-full"
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
                  className="px-4 py-2 bg-[#007bff] text-white rounded-lg font-medium hover:bg-[#0056b3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

             {/* Skills Management */}
             <SkillManagement 
               userSkills={(profileData.candidate_profile?.skills || [])
                 .filter(skill => skill && skill.skill_name) // Filter out invalid skills
                 .map((skill) => ({
                   id: skill.skill_id || `skill-${skill.skill_name}`,
                   skill_name: skill.skill_name,
                   proficiency_level: skill.proficiency_level as 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert'
                 }))} 
               onSkillsUpdate={() => {
                 // Refresh profile data after skill update
                 const fetchProfile = async () => {
                   try {
                     const profileResponse = await candidateApi.getProfile();
                     if (profileResponse?.success && profileResponse?.data) {
                       const userData = profileResponse.data as UserProfileData;
                       setProfileData(userData);
                       setEditedData(userData);
                     }
                   } catch (error) {
                     console.error('Failed to refresh profile after skill update:', error);
                   }
                 };
                 fetchProfile();
               }}
             />

          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Personal Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-left">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                <div className="flex gap-2">
                  {/* Debug CV Data Button - Only show in development */}
                  {process.env.NODE_ENV === 'development' && (
                    <button
                      onClick={() => {
                        console.log('=== CV DATA DEBUG ===');
                        console.log('Current User ID:', profileData.user_id);
                        console.log('CV Education:', profileData.cv_education);
                        console.log('CV Experience:', profileData.cv_experience);
                        console.log('Full Profile Data:', profileData);
                        alert(`User: ${profileData.full_name} (${profileData.user_id})\nCV Education: ${profileData.cv_education ? 'HAS DATA' : 'NULL'}\nCV Experience: ${profileData.cv_experience ? 'HAS DATA' : 'NULL'}`);
                      }}
                      className="px-3 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full hover:bg-yellow-200 transition-colors"
                      title="Debug CV Data"
                    >
                      Debug CV
                    </button>
                  )}
                  {!editingSections.personal && (
                  <button 
                      onClick={() => handleSectionEdit('personal')}
                    className="p-2 text-gray-400 hover:text-[#007bff] hover:bg-blue-50 rounded-full transition-colors"
                      title="Edit personal information"
                  >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                )}
                </div>
            </div>
            
              <div className="space-y-4">
                {/* Email */}
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Email</p>
                    {editingSections.personal ? (
                      <input
                        type="email"
                        value={editedData.email || ''}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        className="font-medium border border-gray-300 rounded-lg px-3 py-2 focus:border-[#007bff] outline-none bg-white w-full"
                        placeholder="Enter your email"
                      />
                    ) : (
                      <p className="font-medium">{profileData.email || 'Not provided'}</p>
                    )}
                </div>
                </div>

                {/* Phone */}
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                <div className="flex-1">
                    <p className="text-sm text-gray-500">Phone</p>
                    {editingSections.personal ? (
                      <input
                        type="tel"
                        value={editedData.phone || ''}
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                        className="font-medium border border-gray-300 rounded-lg px-3 py-2 focus:border-[#007bff] outline-none w-full"
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <p className="font-medium">{profileData.phone || 'Not provided'}</p>
                    )}
                    </div>
                </div>

                                 {/* Date of Birth */}
                 <div className="flex items-center space-x-3">
                   <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                     <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4M8 7h8M6 21h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2zM7 11h.01M11 11h.01M15 11h.01M7 15h.01M11 15h.01M15 15h.01" />
                   </svg>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    {editingSections.personal ? (
                      <input
                        type="date"
                        value={editedData.candidate_profile?.date_of_birth || ''}
                        onChange={(e) => handleFieldChange('candidate_profile', e.target.value, 'date_of_birth')}
                        className="font-medium border border-gray-300 rounded-lg px-3 py-2 focus:border-[#007bff] outline-none bg-white w-full"
                      />
                    ) : (
                      <p className="font-medium">
                        {profileData.candidate_profile?.date_of_birth ? 
                          new Date(profileData.candidate_profile.date_of_birth).toLocaleDateString() : 
                          'Not provided'}
                    </p>
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
                    {editingSections.personal ? (
                    <select
                        value={editedData.candidate_profile?.gender || ''}
                        onChange={(e) => handleFieldChange('candidate_profile', e.target.value, 'gender')}
                        className="font-medium border border-gray-300 rounded-lg px-3 py-2 focus:border-[#007bff] focus:ring-1 focus:ring-[#007bff] outline-none w-full"
                      >
                        <option value="">Select gender</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                        <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                    </select>
                  ) : (
                      <p className="font-medium">
                        {profileData.candidate_profile?.gender ? 
                          profileData.candidate_profile.gender.charAt(0) + profileData.candidate_profile.gender.slice(1).toLowerCase().replace('_', ' ') : 
                          'Not provided'}
                    </p>
                  )}
                </div>
              </div>

                {/* Address */}
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Address</p>
                    {editingSections.personal ? (
                      <input
                        type="text"
                        value={editedData.candidate_profile?.address || ''}
                        onChange={(e) => handleFieldChange('candidate_profile', e.target.value, 'address')}
                        className="font-medium border border-gray-300 rounded-lg px-3 py-2 focus:border-[#007bff] outline-none w-full"
                        placeholder="Enter your address"
                      />
                    ) : (
                      <p className="font-medium">{profileData.candidate_profile?.address || 'Not provided'}</p>
                    )}
                    </div>
                </div>

                                 {/* Website */}
                 <div className="flex items-center space-x-3">
                   <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                <div className="flex-1">
                    <p className="text-sm text-gray-500">Website</p>
                    {editingSections.personal ? (
                      <input
                        type="url"
                        value={editedData.website_url || ''}
                        onChange={(e) => handleFieldChange('website_url', e.target.value)}
                        className="font-medium border border-gray-300 rounded-lg px-3 py-2 focus:border-[#007bff] outline-none w-full"
                        placeholder="https://your-website.com"
                      />
                    ) : (
                      <p className="font-medium">
                        {profileData.website_url ? 
                          <a href={profileData.website_url} target="_blank" rel="noopener noreferrer" className="text-[#007bff] hover:underline">
                            {profileData.website_url}
                          </a> : 
                          'Not provided'}
                      </p>
                    )}
                    </div>
                </div>

                {/* Languages */}
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">Languages</p>
                    {editingSections.personal ? (
                      <input
                        type="text"
                        value={editedData.languages?.join(', ') || ''}
                        onChange={(e) => handleFieldChange('languages', e.target.value.split(',').map(lang => lang.trim()))}
                        className="font-medium border border-gray-300 rounded-lg px-3 py-2 focus:border-[#007bff] outline-none w-full"
                        placeholder="English, Vietnamese, Japanese"
                      />
                    ) : (
                      <p className="font-medium">
                        {(() => {
                          const languages = profileData.languages;
                          if (!languages) return 'Not provided';
                          
                          // Handle array format
                          if (Array.isArray(languages)) {
                            if (languages.length === 0) return 'Not provided';
                            
                            // Check if it's array of JSON strings (legacy format from database)
                            if (typeof languages[0] === 'string' && languages[0].startsWith('{')) {
                              try {
                                const parsedLanguages = languages.map(langStr => JSON.parse(langStr));
                                return parsedLanguages.map(lang => 
                                  `${lang.language} (${lang.proficiency || 'Intermediate'})`
                                ).join(', ');
                              } catch (e) {
                                console.error('Error parsing language strings:', e);
                                return languages.join(', ');
                              }
                            }
                            
                            // Check if it's array of objects with language/proficiency
                            if (typeof languages[0] === 'object' && languages[0] && 'language' in languages[0]) {
                              return languages.map((lang: any) => `${lang.language} (${lang.proficiency || 'Intermediate'})`).join(', ');
                            }
                            
                            // Handle plain string array
                            return languages.join(', ');
                          }
                          
                          // Handle string format (in case it's JSON string)
                          if (typeof languages === 'string') {
                            try {
                              const parsed = JSON.parse(languages);
                              if (Array.isArray(parsed)) {
                                return parsed.map(lang => 
                                  typeof lang === 'object' ? `${lang.language} (${lang.proficiency || 'Intermediate'})` : lang
                                ).join(', ');
                              }
                            } catch (e) {
                              return languages;
                            }
                          }
                          
                          return 'Not provided';
                        })()}
                    </p>
                  )}
                  </div>
                </div>
              </div>

              {/* Edit Controls */}
              {editingSections.personal && (
                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button 
                    onClick={() => handleSaveProfile('personal')}
                    disabled={isSaving}
                    className="px-4 py-2 bg-[#007bff] text-white rounded-lg font-medium hover:bg-[#0056b3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button 
                    onClick={() => handleSectionCancel('personal')}
                    disabled={isSaving}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                             )}
             </div>

             {/* Salary & Work Preferences */}
             <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-left">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-semibold text-gray-900">Salary & Work Preferences</h3>
                 {!editingSections.salary && (
                   <button 
                     onClick={() => handleSectionEdit('salary')}
                     className="p-2 text-gray-400 hover:text-[#007bff] hover:bg-blue-50 rounded-full transition-colors"
                     title="Edit salary and work preferences"
                   >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                 </button>
                 )}
                </div>
               
               <div className="space-y-4">
                 {/* Current Salary */}
                 <div className="flex items-center space-x-3">
                   <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                <div className="flex-1">
                     <p className="text-sm text-gray-500">Current Salary</p>
                     {editingSections.salary ? (
                       <div className="flex">
                      <input
                        type="number"
                           value={editedData.candidate_profile?.current_salary || ''}
                           onChange={(e) => handleFieldChange('candidate_profile', parseFloat(e.target.value) || 0, 'current_salary')}
                           className="font-medium border border-gray-300 rounded-l-lg px-3 py-2 focus:border-[#007bff] outline-none bg-white flex-1"
                           placeholder="0"
                         />
                         <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-sm text-gray-600 font-medium">
                           {editedData.candidate_profile?.currency || profileData.candidate_profile?.currency || 'VND'}
                         </span>
                    </div>
                  ) : (
                       <p className="font-medium">
                         {profileData.candidate_profile?.current_salary ? 
                           `${profileData.candidate_profile.current_salary.toLocaleString()} ${profileData.candidate_profile?.currency || 'VND'}` : 
                           'Not provided'}
                    </p>
                  )}
                </div>
              </div>

                                  {/* Expected Salary */}
                 <div className="flex items-center space-x-3">
                   <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                   <div className="flex-1">
                     <p className="text-sm text-gray-500">Expected Salary</p>
                     {editingSections.salary ? (
                       <div className="flex">
                         <input
                           type="number"
                           value={editedData.candidate_profile?.expected_salary || ''}
                           onChange={(e) => handleFieldChange('candidate_profile', parseFloat(e.target.value) || 0, 'expected_salary')}
                           className="font-medium border border-gray-300 rounded-l-lg px-3 py-2 focus:border-[#007bff] outline-none bg-white flex-1"
                           placeholder="0"
                         />
                         <span className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-sm text-gray-600 font-medium">
                           {editedData.candidate_profile?.currency || profileData.candidate_profile?.currency || 'VND'}
                         </span>
                </div>
                     ) : (
                       <p className="font-medium">
                         {profileData.candidate_profile?.expected_salary ? 
                           `${profileData.candidate_profile.expected_salary.toLocaleString()} ${profileData.candidate_profile?.currency || 'VND'}` : 
                           'Not provided'}
                       </p>
                     )}
                   </div>
                 </div>

                 {/* Currency */}
                 <div className="flex items-center space-x-3">
                   <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                <div className="flex-1">
                     <p className="text-sm text-gray-500">Currency</p>
                     {editingSections.salary ? (
                    <select
                         value={editedData.candidate_profile?.currency || 'VND'}
                         onChange={(e) => handleFieldChange('candidate_profile', e.target.value, 'currency')}
                         className="font-medium border border-gray-300 rounded-lg px-3 py-2 focus:border-[#007bff] focus:ring-1 focus:ring-[#007bff] outline-none w-full"
                       >
                         <option value="VND">VND</option>
                         <option value="USD">USD</option>
                         <option value="EUR">EUR</option>
                       </select>
                     ) : (
                       <p className="font-medium">{profileData.candidate_profile?.currency || 'VND'}</p>
                     )}
                   </div>
                 </div>

                 {/* Remote Work Preference */}
                 <div className="flex items-center space-x-3">
                   <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                   </svg>
                   <div className="flex-1">
                     <p className="text-sm text-gray-500">Work Preference</p>
                     {editingSections.salary ? (
                       <select
                         value={editedData.candidate_profile?.remote_work_preference || ''}
                         onChange={(e) => handleFieldChange('candidate_profile', e.target.value, 'remote_work_preference')}
                         className="font-medium border border-gray-300 rounded-lg px-3 py-2 focus:border-[#007bff] focus:ring-1 focus:ring-[#007bff] outline-none w-full"
                    >
                      <option value="">Select preference</option>
                         <option value="ONSITE">Onsite</option>
                         <option value="REMOTE">Remote</option>
                         <option value="HYBRID">Hybrid</option>
                         <option value="FLEXIBLE">Flexible</option>
                    </select>
                  ) : (
                       <p className="font-medium">
                         {profileData.candidate_profile?.remote_work_preference ? 
                           profileData.candidate_profile.remote_work_preference.charAt(0) + profileData.candidate_profile.remote_work_preference.slice(1).toLowerCase() : 
                           'Not specified'}
                       </p>
                     )}
                   </div>
                 </div>

                 {/* Years of Experience */}
                 <div className="flex items-center space-x-3">
                   <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                     <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                   <div className="flex-1">
                     <p className="text-sm text-gray-500">Years of Experience</p>
                     {editingSections.salary ? (
                       <input
                         type="number"
                         value={editedData.candidate_profile?.years_experience || ''}
                         onChange={(e) => handleFieldChange('candidate_profile', parseInt(e.target.value) || 0, 'years_experience')}
                         className="font-medium border border-gray-300 rounded-lg px-3 py-2 focus:border-[#007bff] outline-none w-full"
                         placeholder="0"
                         min="0"
                         max="50"
                       />
                     ) : (
                       <p className="font-medium">
                         {profileData.candidate_profile?.years_experience ? 
                           `${profileData.candidate_profile.years_experience} years` : 
                           'Not specified'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Edit Controls */}
               {editingSections.salary && (
                 <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                <button 
                     onClick={() => handleSaveProfile('salary')}
                  disabled={isSaving}
                  className="px-4 py-2 bg-[#007bff] text-white rounded-lg font-medium hover:bg-[#0056b3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button 
                     onClick={() => handleSectionCancel('salary')}
                  disabled={isSaving}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

             {/* Profile Suggestions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6 text-left">

              {suggestionsError ? (
                <div className="text-left py-4">
                  <div className="flex items-center gap-3 mb-3">
                    <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">{suggestionsError}</p>
                      <button
                        onClick={refreshSuggestions}
                        className="text-[#007bff] hover:text-[#0056b3] text-sm font-medium"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">Profile Suggestions</h3>
                      <p className="text-sm text-gray-600">Complete your profile to attract more employers</p>
                    </div>
                    {suggestions.length > 0 && (
                      <div className="flex flex-col items-end ml-4">
                        <div className="text-sm font-medium text-gray-900 mb-1">Complete {completionPercentage}%</div>
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-[#007bff] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${completionPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {(() => {
                    const activeSuggestions = suggestions.filter(s => !dismissedSuggestions.has(s.field));

                    return activeSuggestions.length === 0 ? (
                      <div className="text-left py-8 text-gray-500">
                        <div className="flex items-center gap-3 mb-2">
                          <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-gray-900">Great job!</p>
                            <p className="text-xs text-gray-400">Your profile looks complete</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-40 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        {activeSuggestions
                          .sort((a, b) => {
                            const priorityOrder = { high: 3, medium: 2, low: 1 };
                            return priorityOrder[b.priority] - priorityOrder[a.priority];
                          })
                          .map((suggestion, index) => (
                            <div
                              key={suggestion.field + index}
                              className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1">
                                  <div className="flex-shrink-0 mt-1">
                                    {getTypeIcon(suggestion.category)}
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
                                        className="px-3 py-1 bg-[#007bff] text-white text-xs rounded-lg hover:bg-[#0056b3] transition-colors"
                                      >
                                        Take Action
                                      </button>
                                      <button
                                        onClick={() => handleDismissSuggestion(suggestion.field)}
                                        className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition-colors"
                                      >
                                        Dismiss
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                
                                <button
                                  onClick={() => handleDismissSuggestion(suggestion.field)}
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

                  {suggestions.filter(s => !dismissedSuggestions.has(s.field)).length > 0 && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <button
                        onClick={refreshSuggestions}
                        className="text-sm text-[#007bff] hover:text-[#0056b3] font-medium"
                      >
                        Refresh suggestions
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

          </div>
                    </div>
      </div>
    </div>
  );
};

export default Profile; 