import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import adminApi from '../../services/adminApi';

const CandidateManagement: React.FC = () => {
  const [candidateProfile, setCandidateProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('profile');

  useEffect(() => {
    const fetchCandidateData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get candidate ID from URL params or use a default for demo
        const candidateId = window.location.pathname.split('/').pop() || 'demo-id';
        
        // Try to get user data from admin API
        const userData = await adminApi.getUserById(candidateId).catch(() => null);
        
        if (userData) {
          // Transform API data to component format
          setCandidateProfile({
            fullName: userData.data?.full_name || userData.data?.name || 'Unknown User',
            rating: 4.0, // Default rating
            position: userData.data?.position || 'Not specified',
            appliedJobs: {
              title: 'Product Development',
              department: 'Marketing',
              type: 'Full-Time',
              timeAgo: '2 days ago'
            },
            personalInfo: {
              gender: userData.data?.gender || 'Not specified',
              dateOfBirth: userData.data?.date_of_birth || 'Not specified',
              age: userData.data?.age || 'Not specified',
              language: userData.data?.languages || 'Not specified',
              address: userData.data?.address || 'Not specified',
              location: userData.data?.location || 'Not specified'
            },
            professionalInfo: {
              aboutMe: userData.data?.about_me || "No description provided",
              experience: userData.data?.experience || "No experience details provided",
              currentJob: {
                title: userData.data?.current_position || 'Not specified',
                years: userData.data?.experience_years || 'Not specified'
              },
              education: userData.data?.education || 'Not specified',
              skills: Array.isArray(userData.data?.skills) ? userData.data.skills : ['No skills listed']
            }
          });
        } else {
          // Fallback to mock data if API fails
          setCandidateProfile({
            fullName: 'Jerome Bell',
            rating: 4.0,
            position: 'Product Designer',
            appliedJobs: {
              title: 'Product Development',
              department: 'Marketing',
              type: 'Full-Time',
              timeAgo: '2 days ago'
            },
            personalInfo: {
              gender: 'Male',
              dateOfBirth: 'March 23, 1995',
              age: '26 y.o',
              language: 'English, French, Bahasa',
              address: '4517 Washington Ave.',
              location: 'Manchester, Kentucky 39495'
            },
            professionalInfo: {
              aboutMe: "I'm a product designer + filmmaker currently working remotely at Twitter from beautiful Manchester, United Kingdom. I'm passionate about designing digital products that have a positive impact on the world.",
              experience: "For 10 years, I've specialised in interface, experience & interaction design as well as working in user research and product strategy for product agencies, big tech companies & start-ups.",
              currentJob: {
                title: 'Product Designer',
                years: '4 Years'
              },
              education: 'Bachelors in Engineering',
              skills: ['Project Management', 'Copywriting', 'English']
            }
          });
        }
      } catch (err) {
        console.error('Error fetching candidate data:', err);
        setError('Failed to load candidate data');
      } finally {
        setLoading(false);
      }
    };

    fetchCandidateData();
  }, []);

  const tabs = [
    { id: 'profile', label: 'Applicant Profile' },
    { id: 'resume', label: 'Resume' },
    { id: 'hiring', label: 'Hiring Progress' },
    { id: 'interview', label: 'Interview Schedule' }
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600">Loading candidate data...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading candidate</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!candidateProfile) {
    return (
      <AdminLayout>
        <div className="p-8">
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No candidate found</h3>
            <p className="mt-1 text-sm text-gray-500">
              The requested candidate could not be found.
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button className="text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold">Account Details</h1>
          </div>
          <button className="text-blue-500 hover:text-blue-600 font-medium">
            Edit information
          </button>
        </div>

        <div className="bg-white rounded-lg shadow">
          {/* Profile Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start space-x-4">
              <img
                src="https://via.placeholder.com/100"
                alt={candidateProfile.fullName}
                className="w-24 h-24 rounded-full"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl font-bold">{candidateProfile.fullName}</h2>
                  <div className="flex items-center text-yellow-400">
                    <span className="text-lg">⭐</span>
                    <span className="ml-1">{candidateProfile.rating}</span>
                  </div>
                </div>
                <p className="text-gray-600">{candidateProfile.position}</p>
                <div className="mt-2">
                  <div className="text-sm text-gray-500">Applied Jobs</div>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="font-medium">{candidateProfile.appliedJobs.title}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">{candidateProfile.appliedJobs.department}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">{candidateProfile.appliedJobs.type}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-500">{candidateProfile.appliedJobs.timeAgo}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`px-6 py-3 text-sm font-medium ${
                    tab.id === 'profile'
                      ? 'text-blue-500 border-b-2 border-blue-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Profile Content */}
          <div className="p-6">
            <div className="grid grid-cols-2 gap-8">
              {/* Personal Info */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Personal Info</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-500">Full Name</label>
                    <p className="mt-1">{candidateProfile.fullName}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Gender</label>
                    <p className="mt-1">{candidateProfile.personalInfo.gender}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Date of Birth</label>
                    <p className="mt-1">{candidateProfile.personalInfo.dateOfBirth} ({candidateProfile.personalInfo.age})</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Language</label>
                    <p className="mt-1">{candidateProfile.personalInfo.language}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Address</label>
                    <p className="mt-1">{candidateProfile.personalInfo.address}</p>
                    <p>{candidateProfile.personalInfo.location}</p>
                  </div>
                </div>
              </div>

              {/* Professional Info */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Professional Info</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-500">About Me</label>
                    <p className="mt-1">{candidateProfile.professionalInfo.aboutMe}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Experience</label>
                    <p className="mt-1">{candidateProfile.professionalInfo.experience}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Current Job</label>
                    <div className="flex justify-between mt-1">
                      <p>{candidateProfile.professionalInfo.currentJob.title}</p>
                      <p className="text-gray-500">{candidateProfile.professionalInfo.currentJob.years}</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Highest Qualification Held</label>
                    <p className="mt-1">{candidateProfile.professionalInfo.education}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Skill set</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {candidateProfile.professionalInfo.skills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CandidateManagement; 