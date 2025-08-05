import React, { useState, useRef, useEffect } from 'react';
import { FiSearch, FiFilter, FiMoreHorizontal, FiChevronDown } from 'react-icons/fi';
import AdminLayout from './AdminLayout';

import BellIcon from '../../assets/bell-outlined.png';
import NotificationPanel from './NotificationPanelAdmin';
import SchemeIcon from '../../assets/scheme.png';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [notifOpen, setNotifOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalJobs, setTotalJobs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date picker state from Dashboard
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const openDatePicker = () => {
    // For browsers that support showPicker()
    dateInputRef.current?.showPicker?.();
    // Fallback for other browsers
    dateInputRef.current?.click();
  };

  // Fetch jobs data
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError(null);
        const apiResult = await adminApi.getAllJobs({ page: currentPage, limit: itemsPerPage });
        const jobsData = apiResult?.data || [];
        const paginationInfo = apiResult?.pagination;
        setTotalPages(paginationInfo?.totalPages || 1);
        setTotalJobs(paginationInfo?.total || jobsData.length);
        
        // Transform API data to match component interface
        const formattedJobs = jobsData.map((job: any) => ({
          id: job.id || job._id,
          role: job.title || job.role,
          status: job.status || 'Pending',
          datePosted: new Date(job.createdAt || job.datePosted).toLocaleDateString('en-GB', { 
            day: 'numeric', 
            month: 'short', 
            year: 'numeric' 
          }),
          jobType: job.type || job.jobType || 'Fulltime',
          applicants: job.applicationsCount || job.applicants || 0,
          needs: { 
            current: job.filledPositions || 0, 
            total: job.openPositions || job.positions || 1 
          }
        }));
        
        setJobs(formattedJobs);
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError('Failed to load jobs data');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [currentPage, itemsPerPage]);

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setSelectedTab('details');
  };

  const handleBackToList = () => {
    setSelectedJob(null);
    setSelectedTab('jobs');
  };

  const handleApproveJob = async (jobId: number) => {
    try {
      await adminApi.approveJob(jobId.toString());
      // Update local state
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job.id === jobId ? { ...job, status: 'Approve' } : job
        )
      );
    } catch (err) {
      console.error('Error approving job:', err);
      alert('Failed to approve job');
    }
  };

  const handleRejectJob = async (jobId: number) => {
    try {
      await adminApi.rejectJob(jobId.toString());
      // Update local state
      setJobs(prevJobs => 
        prevJobs.map(job => 
          job.id === jobId ? { ...job, status: 'Spam' } : job
        )
      );
    } catch (err) {
      console.error('Error rejecting job:', err);
      alert('Failed to reject job');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approve': return 'border-green-500 text-green-500 bg-green-50';
      case 'flag': return 'border-blue-500 text-blue-500 bg-blue-50';
      case 'spam': return 'border-red-500 text-red-500 bg-red-50';
      case 'pending': return 'border-yellow-500 text-yellow-500 bg-yellow-50';
      default: return 'border-gray-500 text-gray-500 bg-gray-50';
    }
  };

  const getJobTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'fulltime': return 'border-blue-500 text-blue-500 bg-blue-50';
      case 'contract': return 'border-orange-500 text-orange-500 bg-orange-50';
      case 'remote': return 'border-yellow-500 text-yellow-500 bg-yellow-50';
      case 'parttime': return 'border-green-500 text-green-500 bg-green-50';
      case 'internship': return 'border-purple-500 text-purple-500 bg-purple-50';
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
              {hasUnread && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />}
            </button>
            <button className="text-white flex items-center px-4 py-2 rounded-lg text-sm font-medium bg-[#007BFF]">
              <span className="mr-2 text-lg leading-none">+</span>
              Add new job
            </button>
            <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} position="header" onMarkAllAsRead={() => setHasUnread(false)} />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-6"></div>

        {selectedTab === 'details' && selectedJob ? (
          <JobDetails onBack={handleBackToList} />
        ) : (
          <>
            {/* Sub-header for List View */}
            <div className="flex justify-between items-center mb-6">
                <div className="text-left">
                    <h1 className="text-2xl font-semibold text-gray-800">Job Listings</h1>
                    <p className="text-gray-600">Here is your jobs listing status from July 19 - July 25.</p>
                </div>
                <div className="relative">
                    <input
                        ref={dateInputRef}
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div 
                        className="flex items-center pl-4 pr-10 py-2 w-48 text-left text-gray-700 border rounded-md bg-white select-none cursor-pointer" 
                        onClick={openDatePicker}
                    >
                        <span>{new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(new Date(selectedDate).getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { day: 'numeric' })}</span>
                        <img src={SchemeIcon} alt="calendar" onClick={openDatePicker} className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 cursor-pointer" />
                    </div>
                </div>
            </div>

            {/* Tabs, Table, and Pagination for List View */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-8">
                <button className={`py-4 px-1 border-b-2 font-medium text-sm ${selectedTab === 'jobs' ? 'border-[#007BFF] text-[#007BFF]' : 'border-transparent text-gray-500 hover:text-gray-700'}`} onClick={() => setSelectedTab('jobs')}>Jobs</button>
              </nav>
            </div>
            <div className="bg-white rounded-lg border border-gray-200">
              {/* Table content and pagination */}
              <div className="p-6">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                  <div className="text-lg font-semibold text-gray-800 text-left">Total Jobs: {totalJobs}</div>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" placeholder="Search roles, job type" className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300" />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg">
                      <FiFilter />
                      <span>Filter</span>
                    </button>
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
                      <th className="pb-4 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
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
                          {job.status.toLowerCase() === 'pending' ? (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApproveJob(job.id);
                                }}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRejectJob(job.id);
                                }}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <button className="text-gray-400 hover:text-gray-600"><FiMoreHorizontal /></button>
                          )}
                        </td>
                      </tr>
                    ))}
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
    </AdminLayout>
  );
};

export default JobListings; 