import React, { useState, useEffect } from 'react';
import { FiExternalLink, FiArrowLeft, FiShare2 } from 'react-icons/fi';
import companyLogo from '../../assets/Nomad.png';
import { TbFlame } from "react-icons/tb";
import { PiUsersThree } from "react-icons/pi";
import { IoLocationOutline } from "react-icons/io5";
import { BsBuildings } from "react-icons/bs";
import { Footer } from './Footer';
import api from '../../services/api';
import candidateApi from '../../services/candidateApi';


interface CompanyProfileProps {
  companyId?: string;
  onBack?: () => void;
  onNavigateToCompanies?: () => void;
  onJobClick?: (jobId: string) => void;
}


export const CompanyProfile: React.FC<CompanyProfileProps> = ({ companyId, onBack, onNavigateToCompanies, onJobClick }) => {
    console.log('CompanyProfile received companyId:', companyId);
    
    const [isFollowing, setIsFollowing] = useState(false);
    const [companyDetails, setCompanyDetails] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [showShareToast, setShowShareToast] = useState(false);
    const [companyJobs, setCompanyJobs] = useState<any[]>([]);
    const [jobsLoading, setJobsLoading] = useState(false);

  useEffect(() => {
    if (!companyId) return;

    const fetchCompanyProfile = async () => {
      try {
        // Use the correct API endpoint to get company by ID
        const response = await api.get(`/api/v1/companies/${companyId}`);
        if (response.data.success && response.data.data && response.data.data.company) {
          setCompanyDetails(response.data.data.company);
          setError(null);
        } else {
          setError('Company not found.');
        }
      } catch (err: any) {
        setError('Failed to load company profile.');
        console.error('Error fetching company profile:', err);
      }
    };

    const fetchCompanyJobs = async () => {
      try {
        setJobsLoading(true);
        // Use candidateApi to get jobs by company
        const response = await candidateApi.getCompanyJobs(companyId, { 
          limit: 10 
        });
        
        console.log('Company jobs response:', response);
        
        // Handle different response structures
        const jobsArray = Array.isArray(response) 
          ? response 
          : (response?.data || response?.jobs || []);
          
        // Filter for active jobs only
        const activeJobs = jobsArray.filter((job: any) => 
          job.status === 'ACTIVE' || job.status === 'active'
        );
        
        setCompanyJobs(activeJobs);
      } catch (err: any) {
        console.error('Error fetching company jobs:', err);
        setCompanyJobs([]);
      } finally {
        setJobsLoading(false);
      }
    };

    fetchCompanyProfile();
    fetchCompanyJobs();
  }, [companyId]);

  const handleBackToCompanies = () => {
    if (onNavigateToCompanies) {
      onNavigateToCompanies();
    } else if (onBack) {
      onBack();
    } else {
      // Fallback - redirect to companies page
      window.location.href = '/candidate/companies';
    }
  };

  const handleJobDetailsClick = (jobId: string) => {
    if (onJobClick) {
      onJobClick(jobId);
    } else {
      // Fallback - redirect to job details page
      window.location.href = `/candidate/job-details/${jobId}`;
    }
  };

  const handleShareClick = async () => {
    try {
        // Generate the shareable link  
        const shareUrl = `${window.location.origin}/candidate/company-profile/${companyId}`;
        console.log('Sharing company with URL:', shareUrl);
        
        // Try to use the modern Web Share API first (mobile-friendly)
        if (navigator.share) {
            console.log('Using Web Share API');
            await navigator.share({
                title: `${companyDetails?.company_name || 'Company'} Profile`,
                text: `Check out this company profile: ${companyDetails?.company_name || 'Company'}`,
                url: shareUrl
            });
        } else {
            console.log('Using Clipboard API fallback');
            // Fallback to clipboard API
            await navigator.clipboard.writeText(shareUrl);
            
            // Show success feedback
            setShowShareToast(true);
            setTimeout(() => setShowShareToast(false), 3000);
        }
    } catch (error) {
        console.error('Error sharing company:', error);
        
        // Ultimate fallback - try to copy to clipboard manually
        try {
            const textArea = document.createElement('textarea');
            textArea.value = `${window.location.origin}/candidate/company-profile/${companyId}`;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            setShowShareToast(true);
            setTimeout(() => setShowShareToast(false), 3000);
        } catch (fallbackError) {
            console.error('Fallback copy failed:', fallbackError);
            alert('Unable to copy link. Please manually copy this URL: ' + `${window.location.origin}/candidate/company-profile/${companyId}`);
        }
    }
  };

  // Display error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <div className="text-red-500 text-xl mb-4">❌ {error}</div>
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-[#007BFF] text-white rounded-lg hover:bg-[#0056b3] transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Display not found state
  if (!companyDetails) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <div className="text-gray-500 text-xl mb-4">🏢 Company not found</div>
        <button 
          onClick={onBack}
          className="px-4 py-2 bg-[#007BFF] text-white rounded-lg hover:bg-[#0056b3] transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{fontFamily:'ABeeZee, sans-serif'}}>
      {/* Main content with left and right margin */}
      <div className="mx-4 lg:mx-8">
        <div className="flex items-center justify-between mb-6">
            <button onClick={handleBackToCompanies} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium">
                <FiArrowLeft className="w-5 h-5" /> Back to companies
            </button>
        </div>
        {/* Header panel */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-8 bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div className="relative">
          <img 
            src={companyDetails.logo_url || companyLogo} 
            alt={companyDetails.company_name} 
            className="w-24 h-24 object-contain" 
            onError={(e) => {
              e.currentTarget.src = companyLogo;
            }}
          />
        </div>
        <div className="flex-1 text-left">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-semibold text-gray-900 mb-1" style={{fontFamily:'ABeeZee, sans-serif'}}>
                      {companyDetails.company_name}
                    </h2>
                    {companyDetails.website && (
                      <a 
                        href={companyDetails.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#007BFF] text-sm hover:underline mb-4 block"
                      >
                        {companyDetails.website}
                      </a>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleShareClick}
                        className="p-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                        title="Share this company profile"
                    >
                        <FiShare2 className="w-5 h-5 text-gray-600"/>
                    </button>
              <button 
                onClick={() => setIsFollowing(!isFollowing)}
                        className={`px-4 py-2 rounded-md font-medium transition-colors text-sm ${
                  isFollowing 
                    ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                    : 'bg-[#007BFF] text-white hover:bg-[#0056b3]'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            </div>
                </div>

          {/* Metrics */}
          <div className="flex items-center justify-between text-sm mt-6">
            {[
              { 
                icon: <TbFlame />, 
                label: "Founded", 
                value: companyDetails.founded_year ? companyDetails.founded_year.toString() : "N/A" 
              },
              { 
                icon: <PiUsersThree />, 
                label: "Employees", 
                value: companyDetails.company_size || "N/A" 
              },
              { 
                icon: <IoLocationOutline />, 
                label: "Location", 
                value: `${companyDetails.district_name || ''} ${companyDetails.city_name || ''}`.trim() || "N/A" 
              },
              { 
                icon: <BsBuildings />, 
                label: "Industry", 
                value: companyDetails.industry || "N/A" 
              }
            ].map((metric, index) => (
              <div key={index} className="flex items-center gap-3">
                  <div className="border border-gray-200 rounded-full p-2 text-[#007BFF]">
                      {React.cloneElement(metric.icon, { className: 'w-5 h-5' })}
              </div>
                  <div>
                      <p className="text-gray-500 text-sm">{metric.label}</p>
                      <p className="text-gray-800">{metric.value}</p>
                </div>
              </div>
            ))}
                </div>
              </div>
            </div>

      {/* Company Profile + Tech Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Company Profile */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6 text-left">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Company Profile</h3>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {companyDetails.description || "No description provided."}
          </p>
        </div>

        {/* Company Stats */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Company Stats</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Jobs</span>
              <span className="font-semibold text-gray-900">{companyDetails.total_jobs || '0'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Active Jobs</span>
              <span className="font-semibold text-green-600">{companyDetails.active_jobs || '0'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Recruiters</span>
              <span className="font-semibold text-gray-900">{companyDetails.total_recruiters || '0'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Status</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                companyDetails.company_status === 'ACTIVE' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {companyDetails.company_status || 'UNKNOWN'}
              </span>
            </div>
            {companyDetails.is_verified && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Verified</span>
                <span className="text-green-600">✓ Verified</span>
              </div>
            )}
          </div>
        </div>
              </div>

      {/* Contact Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-6 text-left">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Contact</h3>
          </div>
        <div className="space-y-3 text-sm">
          {companyDetails.website && (
            <a 
              href={companyDetails.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <FiExternalLink className="text-[#007BFF]" />
              <span>Website</span>
              <span className="text-gray-500 ml-auto">{companyDetails.website}</span>
            </a>
          )}
          
          {companyDetails.address && (
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              <IoLocationOutline className="text-gray-500" />
              <span>Address</span>
              <span className="text-gray-600 ml-auto">
                {companyDetails.address}
                {companyDetails.district_name && `, ${companyDetails.district_name}`}
                {companyDetails.city_name && `, ${companyDetails.city_name}`}
              </span>
            </div>
          )}
          
          {companyDetails.tax_code && (
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
              <BsBuildings className="text-gray-500" />
              <span>Tax Code</span>
              <span className="text-gray-600 ml-auto">{companyDetails.tax_code}</span>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Company Jobs */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Open Positions at {companyDetails.company_name}
          </h3>
          <span className="text-sm text-gray-500">
            {companyJobs.length} active positions
          </span>
        </div>
        
        {jobsLoading ? (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading job positions...</p>
          </div>
        ) : companyJobs.length > 0 ? (
          <div className="space-y-4">
            {companyJobs.map((job: any) => (
              <div key={job.job_id || job.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-1">{job.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <IoLocationOutline className="w-4 h-4" />
                        {job.city || job.location || 'Remote'}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                        {job.employment_type || job.type || 'Full-time'}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        {job.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    {job.salary_min && job.salary_max && (
                      <div className="text-lg font-semibold text-gray-900">
                        ${job.salary_min?.toLocaleString()} - ${job.salary_max?.toLocaleString()}
                      </div>
                    )}
                    <div className="text-sm text-gray-500">
                      Posted {new Date(job.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                {job.description && (
                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                    {job.description.length > 150 
                      ? `${job.description.substring(0, 150)}...` 
                      : job.description}
                  </p>
                )}
                
                {job.skills && Array.isArray(job.skills) && job.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {job.skills.slice(0, 4).map((skill: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {skill}
                      </span>
                    ))}
                    {job.skills.length > 4 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                        +{job.skills.length - 4} more
                      </span>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{job.applications_count || 0} applicants</span>
                    {job.view_count && <span>{job.view_count} views</span>}
                  </div>
                  <button 
                    onClick={() => handleJobDetailsClick(job.job_id || job.id)}
                    className="px-4 py-2 bg-[#007BFF] text-white rounded-lg hover:bg-[#0056b3] transition-colors text-sm font-medium"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">💼</div>
            <p>No active job positions at the moment</p>
            <p className="text-sm">Check back later for new opportunities!</p>
          </div>
        )}
      </div>

        {/* Share Toast Notification */}
        {showShareToast && (
            <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 transform transition-all duration-300 ease-out animate-bounce">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Company profile link copied to clipboard!
            </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default CompanyProfile; 