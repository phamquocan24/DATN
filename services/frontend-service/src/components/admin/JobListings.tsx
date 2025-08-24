import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { FiSearch, FiChevronDown, FiMoreVertical, FiTrash2 } from 'react-icons/fi';
import AdminLayout from './AdminLayout';

import BellIcon from '../../assets/bell-outlined.png';
import NotificationPanel from './NotificationPanelAdmin';

import JobDetails from './JobDetails'; // Import the new component
import adminApi from '../../services/adminApi';
import AdminHeaderDropdown from './AdminHeaderDropdown';

interface Job {
  id: number;
  role: string;
  status: string;
  datePosted: string;
  jobType: string;
  applicants: number;
  needs: { current: number; total: number };
}

interface JobListingsProps {
  currentUser?: any;
}

const JobListings: React.FC<JobListingsProps> = ({ currentUser }) => {
  const [selectedTab, setSelectedTab] = useState('jobs');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobViewType, setJobViewType] = useState<'all' | 'pending' | 'active' | 'rejected'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [notifOpen, setNotifOpen] = useState(false);
  // Use notifications hook
  const { unreadCount, markAllAsRead } = useNotifications();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  // Dropdown states
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Delete confirmation modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);




  // Fetch jobs data
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        let apiResult;
        
        // Determine which API to call based on jobViewType
        switch (jobViewType) {
          case 'pending':
            apiResult = await adminApi.getPendingJobs({ page: currentPage, limit: itemsPerPage });
            break;
          case 'all':
          default:
            apiResult = await adminApi.getAllJobs({ page: currentPage, limit: itemsPerPage });
            break;
        }
        
        console.log('JobListings API response:', apiResult);
        
        const jobsData = apiResult?.data || [];
        const paginationInfo = apiResult?.pagination;
        setTotalPages(paginationInfo?.totalPages || 1);
        setTotalJobs(paginationInfo?.total || jobsData.length);
        
        // Transform API data to match component interface (no fallbacks)
        const formattedJobs = jobsData.map((job: any) => ({
          id: job.job_id,
          role: job.title,
          status: job.status,
          datePosted: new Date(job.created_at).toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
          }),
          jobType: job.employment_type,
          applicants: job.application_count,
          needs: { 
            current: job.application_count, 
            total: job.max_applications
          },
          company: job.company_name
        }));
        
        setJobs(formattedJobs);
      } catch (err: any) {
        console.error('Error fetching jobs:', err);
        console.error('Error response:', err.response?.data);
        console.error('Error status:', err.response?.status);
        console.error('Failed to load jobs data', err);
        
        // Set empty state if there's an error
        setJobs([]);
        setTotalJobs(0);
        setTotalPages(1);
        
        // Show user-friendly error with more details
        const errorMessage = err.response?.data?.message || err.message || 'Unknown error';
        const errorStatus = err.response?.status || 'No status';
        alert(`Failed to load jobs (${errorStatus}): ${errorMessage}`);
      }
    };

    fetchJobs();
  }, [currentPage, itemsPerPage, jobViewType]);

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setSelectedTab('details');
  };

  const handleBackToList = () => {
    setSelectedJob(null);
    setSelectedTab('jobs');
  };

  // Callback to refresh job list when job is updated in details
  const handleJobUpdate = () => {
    // Reset to first page and refetch
    setCurrentPage(1);
    // The useEffect will automatically refetch due to dependency array
  };

  const handleDeleteJob = (job: Job) => {
    setJobToDelete(job);
    setShowDeleteModal(true);
    setOpenDropdownId(null);
  };

  const handleConfirmDelete = async () => {
    if (!jobToDelete) return;
    
    try {
      setIsDeleting(true);
      await adminApi.deleteJob(jobToDelete.id.toString());
      
      // Update local state
      setJobs(prevJobs => prevJobs.filter(job => job.id !== jobToDelete.id));
      setTotalJobs(prev => prev - 1);
      
      setShowDeleteModal(false);
      setJobToDelete(null);
    } catch (err: any) {
      console.error('Error deleting job:', err);
      // Show error in modal instead of alert
      setShowDeleteModal(false);
      setJobToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

      

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE': 
      case 'PUBLISHED': return 'border-green-500 text-green-500 bg-green-50';
      case 'PENDING': return 'border-yellow-500 text-yellow-500 bg-yellow-50';
      case 'REJECTED': return 'border-red-500 text-red-500 bg-red-50';
      case 'DRAFT': return 'border-gray-500 text-gray-500 bg-gray-50';
      case 'PAUSED': return 'border-orange-500 text-orange-500 bg-orange-50';
      case 'CLOSED': return 'border-purple-500 text-purple-500 bg-purple-50';
      // Legacy status support
      case 'APPROVE': return 'border-green-500 text-green-500 bg-green-50';
      case 'FLAG': return 'border-blue-500 text-blue-500 bg-blue-50';
      case 'SPAM': return 'border-red-500 text-red-500 bg-red-50';
      default: return 'border-gray-500 text-gray-500 bg-gray-50';
    }
  };

  const getJobTypeColor = (type: string) => {
    if (!type) return 'border-gray-500 text-gray-500 bg-gray-50';
    
    switch (type.toUpperCase()) {
      case 'FULL_TIME': return 'border-blue-500 text-blue-500 bg-blue-50';
      case 'PART_TIME': return 'border-green-500 text-green-500 bg-green-50';
      case 'CONTRACT': return 'border-orange-500 text-orange-500 bg-orange-50';
      case 'INTERNSHIP': return 'border-purple-500 text-purple-500 bg-purple-50';
      case 'FREELANCE': return 'border-pink-500 text-pink-500 bg-pink-50';
      default: return 'border-gray-500 text-gray-500 bg-gray-50';
    }
  };

  // State for custom dropdown
  const [isPageSelectOpen, setIsPageSelectOpen] = useState(false);
  const pageOptions = [10, 20, 30];
  const pageSelectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pageSelectRef.current && !pageSelectRef.current.contains(event.target as Node)) {
        setIsPageSelectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [pageSelectRef]);

  return (
    <AdminLayout>
      <div className="p-8 bg-white">
        {/* Top Admin Bar - Always visible */}
        <div className="flex items-center justify-between mb-6">
          {/* User Info */}
          <AdminHeaderDropdown currentUser={currentUser} />

          <div className="flex items-center space-x-6 relative">
            <button onClick={() => setNotifOpen(!notifOpen)} className="relative focus:outline-none">
              <img src={BellIcon} alt="Notifications" className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 text-red-500 text-xs font-bold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <button className="text-white flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-[#007BFF]">
              <span className="mr-2 text-lg leading-none">+</span>
              Add new job
            </button>
            <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} position="header" onMarkAllAsRead={markAllAsRead} />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-6"></div>

                  {selectedTab === 'details' && selectedJob ? (
            <JobDetails onBack={handleBackToList} jobId={selectedJob.id.toString()} onJobUpdate={handleJobUpdate} />
          ) : (
          <>
            {/* Sub-header for List View */}
            <div className="flex justify-between items-center mb-6">
                <div className="text-left">
                    <h1 className="text-2xl font-semibold text-gray-800">Job Listings</h1>
                    <p className="text-gray-600">Manage and monitor all job postings in the system.</p>
                </div>

            </div>

            {/* Tabs, Table, and Pagination for List View */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-8">
                <button 
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${jobViewType === 'all' ? 'border-[#007BFF] text-[#007BFF]' : 'border-transparent text-gray-500 hover:text-gray-700'}`} 
                  onClick={() => {setJobViewType('all'); setCurrentPage(1);}}
                >
                  All Jobs
                </button>
                <button 
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${jobViewType === 'pending' ? 'border-[#007BFF] text-[#007BFF]' : 'border-transparent text-gray-500 hover:text-gray-700'}`} 
                  onClick={() => {setJobViewType('pending'); setCurrentPage(1);}}
                >
                  Pending Approval
                </button>
              </nav>
            </div>
            <div className="bg-white rounded-lg border border-gray-200">
              {/* Table content and pagination */}
              <div className="p-6">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                  <div className="text-lg font-semibold text-gray-800 text-left">Total Jobs: {totalJobs}</div>
                  <div className="flex items-center">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" placeholder="Search roles, job type" className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300" />
                    </div>
                  </div>
                </div>

                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-500 text-sm">
                      {['Roles', 'Status', 'Date Posted', 'Job type', 'Applicants', 'Needs'].map(header => (
                        <th key={header} className="pb-4 font-medium">
                          {header} <FiChevronDown className="inline-block" />
                        </th>
                      ))}

                    </tr>
                  </thead>
                  <tbody>
                    {jobs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-500">
                          <div className="flex flex-col items-center justify-center">
                            <p className="text-lg font-medium mb-2">No jobs found</p>
                            <p className="text-sm">
                              {jobViewType === 'pending' 
                                ? 'No jobs are currently pending approval.' 
                                : 'No jobs have been posted yet.'
                              }
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      jobs.map((job) => (
                        <tr 
                          key={job.id} 
                          className="border-t border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                          onClick={() => handleJobClick(job)}
                        >
                        <td className="py-4 font-medium">{job.role}</td>
                        <td className="py-4"><span className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(job.status)}`}>{job.status}</span></td>
                        <td className="py-4 text-gray-500">{job.datePosted}</td>
                        <td className="py-4"><span className={`px-3 py-1 rounded-full text-sm border ${getJobTypeColor(job.jobType)}`}>{job.jobType}</span></td>
                        <td className="py-4">{job.applicants.toLocaleString()}</td>
                        <td className="py-4"><span className="text-gray-500">{job.needs.current} / {job.needs.total}</span></td>
                        <td className="py-4 text-right">
                          <div className="relative" ref={openDropdownId === job.id ? dropdownRef : null}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDropdownId(openDropdownId === job.id ? null : job.id);
                              }}
                              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                              <FiMoreVertical className="w-4 h-4 text-gray-500" />
                            </button>
                            
                            {/* Dropdown Menu */}
                            {openDropdownId === job.id && (
                              <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteJob(job);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-lg"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                  Delete Job
                                </button>
                              </div>
                            )}
                          </div>
                        </td>

                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">View</span>
                  <div ref={pageSelectRef} className="relative inline-block">
                    <button onClick={() => setIsPageSelectOpen(!isPageSelectOpen)} className="flex items-center justify-between w-16 border border-gray-300 rounded px-2 py-0.5 bg-white focus:outline-none focus:border-[#007BFF]">
                      <span>{itemsPerPage}</span>
                      <FiChevronDown className="text-gray-500" />
                    </button>
                    {isPageSelectOpen && (
                      <div className="absolute bottom-full mb-1 w-16 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                        {pageOptions.map((option) => (
                          <div key={option} onClick={() => { setItemsPerPage(option); setCurrentPage(1); setIsPageSelectOpen(false); }} className="px-2 py-0.5 text-center cursor-pointer hover:bg-[#007BFF] hover:text-white">{option}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-gray-600 whitespace-nowrap">Jobs per page</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={`min-w-[32px] h-8 px-2 flex items-center justify-center border rounded ${currentPage === 1 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 hover:bg-gray-50'}`}
                  >
                    &lt;
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      className={`min-w-[32px] h-8 px-2 flex items-center justify-center rounded ${
                        currentPage === page
                          ? 'bg-[#007BFF] text-white'
                          : 'border border-transparent text-[#007BFF] hover:bg-blue-50'
                      }`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={`min-w-[32px] h-8 px-2 flex items-center justify-center border rounded ${currentPage === totalPages ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 hover:bg-gray-50'}`}
                  >
                    &gt;
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && jobToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 text-red-600">Confirm Delete</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete the job "<strong>{jobToDelete.role}</strong>"? 
              This action cannot be undone.
            </p>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setJobToDelete(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <FiTrash2 className="w-4 h-4" />
                    Delete Job
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default JobListings; 