import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiFilter, FiMoreHorizontal, FiChevronDown } from 'react-icons/fi';
import calendarIcon from '../../assets/scheme.png';
import hrApi from '../../services/hrApi';

interface Job {
  job_id: string;
  title: string;
  status: string;
  created_at: string;
  application_deadline: string;
  employment_type: string;
  application_count?: number; // Backend returns application_count
  max_applications?: number; // Backend returns max_applications
  // Legacy fields for UI compatibility
  id?: number;
  role?: string;
  datePosted?: string;
  dueDate?: string;
  jobType?: string;
  applicants?: number;
  needs?: string;
  statusDisplay?: string;
}

const JobManagement: React.FC = () => {
  const [jobsPerPage, setJobsPerPage] = useState(10);
  const [isPageSelectOpen, setIsPageSelectOpen] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    employment_type: '',
    work_type: '',
    status: ''
  });

  const pageOptions = [10, 20, 30];
  const pageSelectRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('2021-07-25');
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      setIsLoading(true);
      try {
        // Prepare filters for API call
        const apiFilters = {
          limit: jobsPerPage,
          page: 1,
          ...Object.fromEntries(
            Object.entries(filters).filter(([, value]) => value !== '')
          )
        };
        
        const response = await hrApi.getMyJobs(apiFilters);
        const jobsArray = response?.data || response || [];
        
        // Transform API data to component format
        const transformedJobs = jobsArray.map((job: any) => {
          console.log('Raw job data from API:', job); // Debug log
          
          // Format dates safely
          const formatDate = (dateString: string) => {
            if (!dateString) return 'N/A';
            try {
              return new Date(dateString).toLocaleDateString();
            } catch {
              return 'N/A';
            }
          };

          // Map employment type to display format
          const getJobTypeDisplay = (empType: string) => {
            switch (empType) {
              case 'FULL_TIME': return 'Fulltime';
              case 'PART_TIME': return 'Part-time';
              case 'CONTRACT': return 'Contract';
              case 'INTERNSHIP': return 'Internship';
              case 'FREELANCE': return 'Freelance';
              default: return empType || 'N/A';
            }
          };

          // Map status from backend to display format
          const getStatusDisplay = (status: string) => {
            switch (status) {
              case 'ACTIVE': return 'Live';
              case 'PENDING': return 'Pending';
              case 'PAUSED': return 'Paused';
              case 'CLOSED': return 'Closed';
              case 'DRAFT': return 'Draft';
              default: return status || 'Unknown';
            }
          };

          return {
            job_id: job.job_id,
            title: job.title,
            status: job.status,
            created_at: job.created_at,
            application_deadline: job.application_deadline,
            employment_type: job.employment_type,
            application_count: job.application_count || 0, // Backend returns application_count, not applications_count
            max_applications: job.max_applications || 1, // Backend returns max_applications, not open_positions
            // Legacy fields for UI compatibility
            id: parseInt(job.job_id?.replace(/-/g, '').slice(0, 8), 16) || Math.random(),
            role: job.title,
            datePosted: formatDate(job.created_at),
            dueDate: formatDate(job.application_deadline),
            jobType: getJobTypeDisplay(job.employment_type),
            applicants: job.application_count || 0,
            needs: `${job.application_count || 0}/${job.max_applications || 1}`,
            // Add status display mapping
            statusDisplay: getStatusDisplay(job.status)
          };
        });
        
        setJobs(transformedJobs);
        setError(null);
      } catch (err) {
        setError('Failed to load your jobs.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJobs();
  }, [filters, jobsPerPage]);


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
  
  return (
    <div className="p-0 bg-white text-left">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Job Listing</h1>
          <p className="text-gray-600">Here is your jobs listing status from July 19 - July 25.</p>
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
          <h2 className="text-lg font-semibold text-left">Job List</h2>
          <button className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50">
            <FiFilter className="text-gray-600" />
            <span>Filters</span>
          </button>
        </div>
        <div className="border-t border-gray-200" />
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 text-sm text-gray-500 text-left">
              <th className="px-4 py-3 font-medium">
                <div className="flex items-center gap-1">Roles <FiChevronDown /></div>
              </th>
              <th className="px-4 py-3 font-medium">
                <div className="flex items-center gap-1">Status <FiChevronDown /></div>
              </th>
              <th className="px-4 py-3 font-medium">
                <div className="flex items-center gap-1">Date Posted <FiChevronDown /></div>
              </th>
              <th className="px-4 py-3 font-medium">
                <div className="flex items-center gap-1">Due Date <FiChevronDown /></div>
              </th>
              <th className="px-4 py-3 font-medium">
                <div className="flex items-center gap-1">Job Type <FiChevronDown /></div>
              </th>
              <th className="px-4 py-3 font-medium">
                <div className="flex items-center gap-1">Applicants <FiChevronDown /></div>
              </th>
              <th className="px-4 py-3 font-medium">Needs</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={8} className="text-center p-4">Loading jobs...</td></tr>
            ) : error ? (
              <tr><td colSpan={8} className="text-center p-4 text-red-500">{error}</td></tr>
            ) : jobs.map((job) => (
              <tr key={job.job_id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/hr/job-management/${job.job_id}`)}>
                <td className="px-4 py-4 font-medium">{job.role}</td>
                <td className="px-4 py-4">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    job.statusDisplay === 'Live' || job.statusDisplay === 'Active' ? 'bg-green-100 text-green-600' :
                    job.statusDisplay === 'Pending' ? 'bg-yellow-100 text-yellow-600' :
                    job.statusDisplay === 'Paused' ? 'bg-blue-100 text-blue-600' :
                    job.statusDisplay === 'Draft' ? 'bg-gray-100 text-gray-600' :
                    'bg-red-100 text-red-600'
                  }`}>{job.statusDisplay}</span>
                </td>
                <td className="px-4 py-4 text-gray-700">{job.datePosted}</td>
                <td className="px-4 py-4 text-gray-700">{job.dueDate}</td>
                <td className="px-4 py-4">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${job.jobType === 'Fulltime' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'}`}>{job.jobType}</span>
                </td>
                <td className="px-4 py-4 text-gray-700">{job.applicants}</td>
                <td className="px-4 py-4 text-gray-700">{job.needs}</td>
                <td className="px-4 py-4 text-right">
                  <button className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-md" onClick={(e) => e.stopPropagation()}>
                    <FiMoreHorizontal />
                  </button>
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
            <span className="text-gray-600 whitespace-nowrap">Applicants per page</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="min-w-[32px] h-8 px-2 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50">&lt;</button>
            <button className="min-w-[32px] h-8 px-2 flex items-center justify-center bg-[#007BFF] text-white rounded">1</button>
            <button className="min-w-[32px] h-8 px-2 flex items-center justify-center border border-[#007BFF] text-[#007BFF] rounded hover:bg-blue-50">2</button>
            <button className="min-w-[32px] h-8 px-2 flex items-center justify-center border border-[#007BFF] text-[#007BFF] rounded hover:bg-blue-50">3</button>
            <button className="min-w-[32px] h-8 px-2 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50">&gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobManagement; 