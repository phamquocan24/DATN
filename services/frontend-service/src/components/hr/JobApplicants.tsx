import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiSearch, FiMoreHorizontal, FiChevronLeft, FiChevronDown, FiUpload } from 'react-icons/fi';
import JobDetailsTab from './JobDetailsTab'; 
import AnalyticsTab from './AnalyticsTab'; 
import hrApi from '../../services/hrApi';

interface Applicant {
  id: number;
  application_id?: string;
  fullName: string;
  candidate_name?: string;
  candidate_email?: string;
  phone_number?: string;
  avatar: string;
  score: string;
  match_score?: number;
  hiringStage: 'In-review' | 'Shortlisted' | 'Declined' | 'Hired' | 'Interviewed';
  current_status?: string;
  appliedDate: string;
  applied_at?: string;
  jobRole: string;
  job_title?: string;
  education_level?: string;
  years_experience?: number;
  location?: string;
  resume_url?: string;
}

const mapStatusToHiringStage = (status: string): Applicant['hiringStage'] => {
  switch (status?.toUpperCase()) {
    case 'APPLIED':
    case 'SCREENING':
      return 'In-review';
    case 'ASSESSMENT':
      return 'Shortlisted';
    case 'REJECTED':
    case 'WITHDRAWN':
      return 'Declined';
    case 'INTERVIEW':
      return 'Interviewed';
    case 'HIRED':
    case 'OFFER':
      return 'Hired';
    default:
      return 'In-review';
  }
};

const getHiringStageClass = (stage: Applicant['hiringStage']) => {
  switch (stage) {
    case 'In-review': return 'bg-yellow-100 text-yellow-600 border border-yellow-200';
    case 'Shortlisted': return 'bg-blue-100 text-blue-600 border border-blue-200';
    case 'Declined': return 'bg-red-100 text-red-600 border border-red-200';
    case 'Hired': return 'bg-green-100 text-green-600 border border-green-200';
    case 'Interviewed': return 'bg-purple-100 text-purple-600 border border-purple-200';
    default: return 'bg-gray-100 text-gray-600';
  }
};

const JobApplicants: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Applicants');
  const { id: jobId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  
  const [applicantsPerPage, setApplicantsPerPage] = useState(10);
  const [isPageSelectOpen, setIsPageSelectOpen] = useState(false);
  const pageOptions = [10, 20, 30];
  const pageSelectRef = useRef<HTMLDivElement>(null);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalApplicants, setTotalApplicants] = useState(0);
  const [jobTitle, setJobTitle] = useState('Loading...');
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch job details to get job title
  const fetchJobDetails = async () => {
    if (!jobId) return;
    try {
      const response = await hrApi.getJobById(jobId);
      const jobData = response.data || response;
      setJobTitle(jobData.title || 'Job Details');
    } catch (err) {
      console.error('Failed to load job details:', err);
      setJobTitle('Job Details');
    }
  };

  // Fetch applicants with pagination
  const fetchApplicants = async () => {
    if (!jobId) return;
    setIsLoading(true);
    try {
      const response = await hrApi.getApplicationsByJobId(jobId, {
        page: currentPage,
        limit: applicantsPerPage,
        status: searchTerm ? undefined : undefined // Add search later if needed
      });
      
      const data = response.data || response;
      const rawApplicants = data.applications || data || [];
      
      // Transform raw data to match our interface
      const transformedApplicants = rawApplicants.map((app: any) => ({
        id: app.application_id || app.id,
        application_id: app.application_id,
        fullName: app.candidate_name || app.full_name || 'Unknown',
        candidate_name: app.candidate_name,
        candidate_email: app.candidate_email || app.email,
        phone_number: app.phone_number,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(app.candidate_name || 'User')}&background=random`,
        score: app.match_score ? `${app.match_score}%` : '0%',
        match_score: app.match_score,
        hiringStage: mapStatusToHiringStage(app.current_status || app.status),
        current_status: app.current_status || app.status,
        appliedDate: new Date(app.applied_at || app.created_at).toLocaleDateString(),
        applied_at: app.applied_at || app.created_at,
        jobRole: app.job_title || 'Position',
        job_title: app.job_title,
        education_level: app.education_level,
        years_experience: app.years_experience,
        location: app.location,
        resume_url: app.resume_url
      }));
      
      setApplicants(transformedApplicants);
      setTotalApplicants(data.total || rawApplicants.length || 0);
      setTotalPages(data.totalPages || Math.ceil((data.total || 0) / applicantsPerPage));
      setError(null);
    } catch (err) {
      setError('Failed to load applicants.');
      console.error(err);
      setApplicants([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  useEffect(() => {
    fetchApplicants();
  }, [jobId, currentPage, applicantsPerPage]);

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle search
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (pageSelectRef.current && !pageSelectRef.current.contains(event.target as Node)) {
            setIsPageSelectOpen(false);
        }
        if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
            setIsExportOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle accept/reject actions
  const handleAcceptApplicant = async (applicantId: number) => {
    try {
      console.log('Accepting applicant:', applicantId);
      // Use INTERVIEW status instead of shortlist since SHORTLISTED is not valid
      await hrApi.updateApplicationStatus(applicantId.toString(), 'INTERVIEW', 'Candidate accepted for next stage');
      
      // Refresh applicants list
      fetchApplicants();
      setOpenDropdown(null);
    } catch (error) {
      console.error('Failed to accept applicant:', error);
    }
  };

  const handleRejectApplicant = async (applicantId: number) => {
    try {
      console.log('Rejecting applicant:', applicantId);
      // Call reject API
      await hrApi.rejectCandidate(applicantId.toString(), 'Candidate rejected');
      
      // Refresh applicants list
      fetchApplicants();
      setOpenDropdown(null);
    } catch (error) {
      console.error('Failed to reject applicant:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Applicants':
        return (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="flex items-center justify-between gap-4 p-4 border-b border-gray-200">
              <h1 className="text-lg font-semibold text-gray-900">Total Applicants: {totalApplicants}</h1>
              <div className="relative w-64">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search Applicants" 
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" 
                />
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-sm text-left">
                  <th className="px-4 py-3 font-bold text-black">Full Name <FiChevronDown className="inline-block ml-1" /></th>
                  <th className="px-4 py-3 font-bold text-black">Contact <FiChevronDown className="inline-block ml-1" /></th>
                  <th className="px-4 py-3 font-bold text-black">Experience <FiChevronDown className="inline-block ml-1" /></th>
                  <th className="px-4 py-3 font-bold text-black">Score <FiChevronDown className="inline-block ml-1" /></th>
                  <th className="px-4 py-3 font-bold text-black">Hiring Stage <FiChevronDown className="inline-block ml-1" /></th>
                  <th className="px-4 py-3 font-bold text-black">Applied Date <FiChevronDown className="inline-block ml-1" /></th>
                  <th className="px-4 py-3 font-bold text-black">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="text-center p-4">Loading applicants...</td></tr>
                ) : error ? (
                  <tr><td colSpan={7} className="text-center p-4 text-red-500">{error}</td></tr>
                ) : applicants.map((applicant) => (
                  <tr key={applicant.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/hr/job-applications/${applicant.id}`)}>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        <img src={applicant.avatar} alt={applicant.fullName} className="w-8 h-8 rounded-full" />
                        <div>
                          <span className="font-medium text-gray-800 block">{applicant.fullName}</span>
                          {applicant.location && (
                            <span className="text-xs text-gray-500">{applicant.location}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-left">
                      <div className="text-sm">
                        {applicant.candidate_email && (
                          <div className="text-gray-700">{applicant.candidate_email}</div>
                        )}
                        {applicant.phone_number && (
                          <div className="text-gray-500 text-xs">{applicant.phone_number}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-left">
                      <div className="text-sm">
                        {applicant.years_experience && (
                          <div className="text-gray-700">{applicant.years_experience} years</div>
                        )}
                        {applicant.education_level && (
                          <div className="text-gray-500 text-xs">{applicant.education_level}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-gray-700 text-left">{applicant.score}</td>
                    <td className="px-4 py-2 text-left">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getHiringStageClass(applicant.hiringStage)}`}>
                        {applicant.hiringStage}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-700 text-left">{applicant.appliedDate}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <button className="px-3 py-1 text-sm border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50" onClick={(e) => {e.stopPropagation(); navigate(`/hr/job-applications/${applicant.id}`)}}>
                          See Application
                        </button>
                        <div className="relative" ref={openDropdown === applicant.id ? dropdownRef : undefined}>
                          <button 
                            className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-md transform rotate-90" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdown(openDropdown === applicant.id ? null : applicant.id);
                            }}
                          >
                            <FiMoreHorizontal />
                          </button>
                          
                          {openDropdown === applicant.id && (
                            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAcceptApplicant(applicant.id);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50 rounded-t-lg"
                              >
                                Accept
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRejectApplicant(applicant.id);
                                }}
                                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">View</span>
                <div ref={pageSelectRef} className="relative inline-block">
                  <button
                    onClick={() => setIsPageSelectOpen(!isPageSelectOpen)}
                    className="flex items-center justify-between w-16 border border-gray-300 rounded px-2 py-1 bg-white"
                  >
                    <span>{applicantsPerPage}</span>
                    <FiChevronDown className="text-gray-500" />
                  </button>
                  {isPageSelectOpen && (
                    <div className="absolute bottom-full mb-1 w-16 bg-white border rounded-md shadow-lg z-10">
                      {pageOptions.map((option) => (
                        <div
                          key={option}
                          onClick={() => { 
                            setApplicantsPerPage(option); 
                            setIsPageSelectOpen(false);
                            setCurrentPage(1); // Reset to first page
                          }}
                          className="px-2 py-1 text-center cursor-pointer hover:bg-[#007BFF] hover:text-white"
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-gray-600 whitespace-nowrap">Applicants per page</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="min-w-[32px] h-8 px-2 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  &lt;
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button 
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`min-w-[32px] h-8 px-2 flex items-center justify-center rounded ${
                        currentPage === pageNum
                          ? 'bg-[#007BFF] text-white'
                          : 'border border-[#007BFF] text-[#007BFF] hover:bg-blue-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && (
                  <span className="text-gray-500">...</span>
                )}
                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="min-w-[32px] h-8 px-2 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  &gt;
                </button>
              </div>
            </div>
          </div>
        );
      case 'Job Details':
        return <JobDetailsTab />;
      case 'Analytics':
        return <AnalyticsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="p-0 bg-white">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-700">
          <FiChevronLeft className="w-6 h-6" />
          <span className="text-2xl font-semibold text-gray-800 ml-2">{jobTitle}</span>
        </button>
        {activeTab === 'Analytics' && (
          <div ref={exportRef} className="relative">
              <button
                  onClick={() => setIsExportOpen(!isExportOpen)}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                  <FiUpload size={16} /> Export <FiChevronDown size={16} />
              </button>
              {isExportOpen && (
                  <div className="absolute right-0 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10">
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#007BFF]">PDF</a>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#007BFF]">CSV</a>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#007BFF]">PNG</a>
                      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#007BFF]">Word</a>
                  </div>
              )}
          </div>
        )}
      </div>

      <div className="flex border-b mb-4">
        <button
          onClick={() => setActiveTab('Applicants')}
          className={`py-2 px-4 ${activeTab === 'Applicants' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        >
          Applicants
        </button>
        <button
          onClick={() => setActiveTab('Job Details')}
          className={`py-2 px-4 ${activeTab === 'Job Details' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        >
          Job Details
        </button>
        <button
          onClick={() => setActiveTab('Analytics')}
          className={`py-2 px-4 ${activeTab === 'Analytics' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
        >
          Analytics
        </button>
      </div>

      {renderContent()}
    </div>
  );
};

export default JobApplicants; 