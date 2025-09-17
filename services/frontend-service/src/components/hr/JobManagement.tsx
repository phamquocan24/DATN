import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMoreVertical, FiChevronDown, FiSearch, FiEdit, FiTrash2, FiPause, FiPlay, FiEye, FiX } from 'react-icons/fi';
import calendarIcon from '../../assets/scheme.png';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../common/Toast';
import { TableLoadingSkeleton } from '../common/LoadingStates';
import hrApi from '../../services/hrApi';
import { getCompanyId } from '../../services/tokenUtils';

interface Job {
  job_id: string;
  title: string;
  status: string;
  created_at: string;
  application_deadline: string;
  employment_type: string;
  applications_count?: number;
  open_positions?: number;
  // Legacy fields for UI compatibility
  id?: number;
  role?: string;
  datePosted?: string;
  dueDate?: string;
  jobType?: string;
  applicants?: number;
  needs?: string;
}

const JobManagement: React.FC = () => {
  const { toastState, showToast, hideToast } = useToast();
  const [jobsPerPage, setJobsPerPage] = useState(10);
  const [isPageSelectOpen, setIsPageSelectOpen] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');

  const pageOptions = [10, 20, 30];
  const pageSelectRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('2021-07-25');
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        // Get current user's company ID
        const companyId = getCompanyId();
        
        // Debug logging
        // Loading jobs for company
        
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        // Checking authentication credentials
        
        if (token) {
          try {
            // Decode token manually to see what's inside
            const parts = token.split('.');
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              // Token decoded successfully
            }
          } catch (e) {
            // Token decoding failed
          }
        }
        
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            // User data parsed successfully
          } catch (e) {
            // User data parsing failed
          }
        }
        
        if (!companyId) {
          const errorMessage = 'No company assigned. Please contact administrator to assign you to a company.';
          setError(errorMessage);
          showToast(errorMessage, 'error');
          setIsLoading(false);
          return;
        }

        // Use the business service endpoint to get jobs by company
        // Fetching jobs from API
        const response = await hrApi.getJobsByCompany(companyId, {
          page: 1,
          limit: 100,
          orderBy: 'created_at',
          direction: 'DESC'
        });
        
        // Jobs data received successfully
        const jobsArray = response?.data || response || [];
        
        // Transform API data to component format
        const transformedJobs = jobsArray.map((job: any) => ({
          job_id: job.job_id || job.id,
          title: job.title,
          status: job.status,
          created_at: job.created_at,
          application_deadline: job.application_deadline,
          employment_type: job.employment_type,
          applications_count: job.applications_count || 0,
          open_positions: job.open_positions || 1,
          // Legacy fields for UI compatibility
          id: parseInt(job.job_id || job.id) || Math.random(),
          role: job.title,
          datePosted: new Date(job.created_at).toLocaleDateString() || 'N/A',
          dueDate: new Date(job.application_deadline).toLocaleDateString() || 'N/A',
          jobType: job.employment_type === 'FULL_TIME' ? 'Fulltime' : 
                   job.employment_type === 'PART_TIME' ? 'Part-time' :
                   job.employment_type === 'CONTRACT' ? 'Contract' :
                   job.employment_type === 'INTERNSHIP' ? 'Internship' :
                   job.employment_type === 'FREELANCE' ? 'Freelance' : 'Other',
          applicants: job.applications_count || 0,
          needs: `${job.applications_count || 0}/${job.open_positions || 1}`
        }));
        
        setJobs(transformedJobs);
        setFilteredJobs(transformedJobs);
        
        // Show a helpful message if user has no company ID
        if (!companyId && transformedJobs.length === 0) {
          setError('No jobs found. You may need to create or join a company first to see company jobs.');
        } else {
          setError(null);
        }
      } catch (err: any) {
        console.error('Error fetching jobs:', err);
        setError(err?.response?.data?.message || 'Failed to load company jobs.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Handle search functionality
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredJobs(jobs);
    } else {
      const filtered = jobs.filter(job => 
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.employment_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.status?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredJobs(filtered);
    }
    setCurrentPage(1); // Reset to first page when searching
  }, [searchTerm, jobs]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pageSelectRef.current && !pageSelectRef.current.contains(event.target as Node)) {
        setIsPageSelectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [pageSelectRef]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const startIndex = (currentPage - 1) * jobsPerPage;
  const endIndex = startIndex + jobsPerPage;
  const currentJobs = filteredJobs.slice(startIndex, endIndex);

  const generatePageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
      pages.push(i);
    }
    return pages;
  };

  // Handle job deletion
  const handleDeleteJob = async () => {
    if (!selectedJob) return;
    
    try {
      await hrApi.deleteJob(selectedJob.job_id);
      
      // Remove job from local state
      setJobs(prev => prev.filter(job => job.job_id !== selectedJob.job_id));
      setFilteredJobs(prev => prev.filter(job => job.job_id !== selectedJob.job_id));
      
      // Close modal and reset state
      setDeleteModalOpen(false);
      setSelectedJob(null);
      setDeleteReason('');
    } catch (err: any) {
      showToast('Failed to delete job. Please try again.', 'error');
      setError('Failed to delete job');
    }
  };

  // Handle status update
  const handleUpdateStatus = async () => {
    if (!selectedJob || !newStatus) return;
    
    try {
      await hrApi.updateJobStatus(selectedJob.job_id, newStatus, statusReason);
      
      // Update job status in local state
      setJobs(prev => prev.map(job => 
        job.job_id === selectedJob.job_id 
          ? { ...job, status: newStatus }
          : job
      ));
      setFilteredJobs(prev => prev.map(job => 
        job.job_id === selectedJob.job_id 
          ? { ...job, status: newStatus }
          : job
      ));
      
      // Close modal and reset state
      setStatusModalOpen(false);
      setSelectedJob(null);
      setNewStatus('');
      setStatusReason('');
    } catch (err: any) {
      showToast('Failed to update job status. Please try again.', 'error');
      setError('Failed to update job status');
    }
  };

  // Handle dropdown actions
  const handleDropdownAction = (action: string, job: Job) => {
    setSelectedJob(job);
    setOpenDropdownId(null);
    
    switch (action) {
      case 'edit':
        navigate(`/hr/job-management/${job.job_id}`);
        break;
      case 'delete':
        setDeleteModalOpen(true);
        break;
      case 'status':
        setNewStatus(job.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE');
        setStatusModalOpen(true);
        break;
      case 'view':
        navigate(`/hr/job-management/${job.job_id}`);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!event.target || !(event.target as Element).closest('[data-dropdown]')) {
        setOpenDropdownId(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <div className="p-0 bg-white text-left">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Job Listing</h1>
          <p className="text-gray-600">
            {getCompanyId() 
              ? `Here are all jobs posted by your company.`
              : `Here are jobs you have posted. (Note: Company profile setup recommended)`
            }
          </p>
        </div>
        <div className="relative">
          <input ref={dateInputRef} type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="absolute opacity-0 w-full h-full cursor-pointer" />
          <div className="flex items-center border rounded-md px-3 py-2 cursor-pointer" onClick={() => dateInputRef.current?.click()}>
            <span>Jul 19 - Jul 25</span>
            <img src={calendarIcon} alt="calendar" className="ml-2 w-4 h-4" />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-left">Total Jobs: {filteredJobs.length}</h2>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search jobs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-64"
            />
          </div>
        </div>
        <div className="border-t border-gray-200" />
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 text-sm text-left">
              <th className="px-4 py-3 font-bold text-black">
                <div className="flex items-center gap-1">Roles <FiChevronDown /></div>
              </th>
              <th className="px-4 py-3 font-bold text-black">
                <div className="flex items-center gap-1">Status <FiChevronDown /></div>
              </th>
              <th className="px-4 py-3 font-bold text-black">
                <div className="flex items-center gap-1">Date Posted <FiChevronDown /></div>
              </th>
              <th className="px-4 py-3 font-bold text-black">
                <div className="flex items-center gap-1">Due Date <FiChevronDown /></div>
              </th>
              <th className="px-4 py-3 font-bold text-black">
                <div className="flex items-center gap-1">Job Type <FiChevronDown /></div>
              </th>
              <th className="px-4 py-3 font-bold text-black">
                <div className="flex items-center gap-1">Applicants <FiChevronDown /></div>
              </th>
              <th className="px-4 py-3 font-bold text-black">Needs</th>
              <th className="px-4 py-3 font-bold text-black"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableLoadingSkeleton columns={['Role', 'Job Type', 'Applications', 'Date Posted', 'Expiry Date', 'Status', 'Needs', 'Actions']} rowCount={10} />
            ) : error ? (
              <tr><td colSpan={8} className="text-center p-4 text-red-500">{error}</td></tr>
            ) : currentJobs.map((job) => (
              <tr key={job.job_id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/hr/job-management/${job.job_id}`)}>
                <td className="px-4 py-4 font-medium">{job.role}</td>
                <td className="px-4 py-4">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    job.status === 'ACTIVE' || job.status === 'PUBLISHED' || job.status === 'Live' ? 'bg-green-100 text-green-600' : 
                    job.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-600' :
                    job.status === 'PAUSED' ? 'bg-orange-100 text-orange-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {job.status === 'ACTIVE' || job.status === 'PUBLISHED' ? 'Live' : 
                     job.status === 'DRAFT' ? 'Draft' :
                     job.status === 'PAUSED' ? 'Paused' :
                     job.status === 'CLOSED' ? 'Closed' : job.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-gray-700">{job.datePosted}</td>
                <td className="px-4 py-4 text-gray-700">{job.dueDate}</td>
                <td className="px-4 py-4">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  job.jobType === 'Fulltime' ? 'bg-blue-100 text-blue-600' : 
                  job.jobType === 'Part-time' ? 'bg-purple-100 text-purple-600' :
                  job.jobType === 'Contract' ? 'bg-green-100 text-green-600' :
                  job.jobType === 'Internship' ? 'bg-indigo-100 text-indigo-600' :
                  job.jobType === 'Freelance' ? 'bg-yellow-100 text-yellow-600' :
                  'bg-gray-100 text-gray-600'
                }`}>{job.jobType}</span>
                </td>
                <td className="px-4 py-4 text-gray-700">{job.applicants}</td>
                <td className="px-4 py-4 text-gray-700">{job.needs}</td>
                <td className="px-4 py-4 text-right">
                  <div className="relative" data-dropdown>
                    <button 
                      className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-md" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenDropdownId(openDropdownId === job.job_id ? null : job.job_id);
                      }}
                    >
                      <FiMoreVertical />
                    </button>
                    
                    {openDropdownId === job.job_id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                        <div className="py-2">
                          <button
                            onClick={() => handleDropdownAction('view', job)}
                            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <FiEye className="w-4 h-4" />
                            View Details
                          </button>
                          <button
                            onClick={() => handleDropdownAction('edit', job)}
                            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <FiEdit className="w-4 h-4" />
                            Edit Job
                          </button>
                          <button
                            onClick={() => handleDropdownAction('status', job)}
                            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            {job.status === 'ACTIVE' ? (
                              <>
                                <FiPause className="w-4 h-4" />
                                Pause Job
                              </>
                            ) : (
                              <>
                                <FiPlay className="w-4 h-4" />
                                Activate Job
                              </>
                            )}
                          </button>
                          <div className="border-t border-gray-100 my-1"></div>
                          <button
                            onClick={() => handleDropdownAction('delete', job)}
                            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <FiTrash2 className="w-4 h-4" />
                            Delete Job
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="px-4 py-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">View</span>
            <div ref={pageSelectRef} className="relative inline-block">
              <button
                onClick={() => setIsPageSelectOpen(!isPageSelectOpen)}
                className="flex items-center justify-between w-16 border border-gray-300 rounded px-2 py-1 bg-white"
              >
                <span>{jobsPerPage}</span>
                <FiChevronDown className="text-gray-500" />
              </button>
              {isPageSelectOpen && (
                <div className="absolute bottom-full mb-1 w-16 bg-white border rounded-md shadow-lg z-10">
                  {pageOptions.map((option) => (
                    <div
                      key={option}
                      onClick={() => { setJobsPerPage(option); setIsPageSelectOpen(false); }}
                      className="px-2 py-1 text-center cursor-pointer hover:bg-[#007BFF] hover:text-white"
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span className="text-gray-600 whitespace-nowrap">Jobs per page</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="min-w-[32px] h-8 px-2 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &lt;
            </button>
            {generatePageNumbers().map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`min-w-[32px] h-8 px-2 flex items-center justify-center rounded ${
                  currentPage === pageNum
                    ? 'bg-[#007BFF] text-white'
                    : 'border border-[#007BFF] text-[#007BFF] hover:bg-blue-50'
                }`}
              >
                {pageNum}
              </button>
            ))}
            {totalPages > 5 && (
              <span className="text-gray-500">...</span>
            )}
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="min-w-[32px] h-8 px-2 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* Delete Job Modal */}
      {deleteModalOpen && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Delete Job</h3>
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedJob(null);
                  setDeleteReason('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete "{selectedJob.title}"? This action cannot be undone.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for deletion (optional)
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                rows={3}
                placeholder="Enter reason for deleting this job..."
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedJob(null);
                  setDeleteReason('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteJob}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete Job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {statusModalOpen && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Update Job Status</h3>
              <button
                onClick={() => {
                  setStatusModalOpen(false);
                  setSelectedJob(null);
                  setNewStatus('');
                  setStatusReason('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select Status</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="CLOSED">Closed</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for status change (optional)
              </label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                rows={3}
                placeholder="Enter reason for status change..."
              />
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setStatusModalOpen(false);
                  setSelectedJob(null);
                  setNewStatus('');
                  setStatusReason('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={!newStatus}
                className="px-4 py-2 bg-[#007BFF] text-white rounded-lg hover:bg-[#0056b3] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    
    {/* Toast Notification */}
    <Toast toastState={toastState} onClose={hideToast} />
    </div>
  );
};

export default JobManagement; 