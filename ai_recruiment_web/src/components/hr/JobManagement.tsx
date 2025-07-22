import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiFilter, FiMoreHorizontal, FiChevronDown } from 'react-icons/fi';
import calendarIcon from '../../assets/scheme.png';

interface Job {
  id: number;
  role: string;
  status: 'Live' | 'Closed';
  datePosted: string;
  dueDate: string;
  jobType: 'Fulltime' | 'Freelance';
  applicants: number;
  needs: string;
}

const JobManagement: React.FC = () => {
  const [jobsPerPage, setJobsPerPage] = useState(10);
  const [isPageSelectOpen, setIsPageSelectOpen] = useState(false);
  const pageOptions = [10, 20, 30];
  const pageSelectRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('2021-07-25');
  const dateInputRef = useRef<HTMLInputElement>(null);

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
  
  const jobs: Job[] = [
    { id: 1, role: 'Social Media Assistant', status: 'Live', datePosted: '20 May 2020', dueDate: '24 May 2020', jobType: 'Fulltime', applicants: 19, needs: '4 / 11' },
    { id: 2, role: 'Senior Designer', status: 'Live', datePosted: '16 May 2020', dueDate: '24 May 2020', jobType: 'Fulltime', applicants: 1234, needs: '0 / 20' },
    { id: 3, role: 'Visual Designer', status: 'Live', datePosted: '15 May 2020', dueDate: '24 May 2020', jobType: 'Freelance', applicants: 2435, needs: '1 / 5' },
    { id: 4, role: 'Data Sience', status: 'Closed', datePosted: '13 May 2020', dueDate: '24 May 2020', jobType: 'Freelance', applicants: 6234, needs: '10 / 10' },
    { id: 5, role: 'Kotlin Developer', status: 'Closed', datePosted: '12 May 2020', dueDate: '24 May 2020', jobType: 'Fulltime', applicants: 12, needs: '20 / 20' },
    { id: 6, role: 'React Developer', status: 'Closed', datePosted: '11 May 2020', dueDate: '24 May 2020', jobType: 'Fulltime', applicants: 14, needs: '10 / 10' },
    { id: 7, role: 'Kotlin Developer', status: 'Closed', datePosted: '12 May 2020', dueDate: '24 May 2020', jobType: 'Fulltime', applicants: 12, needs: '20 / 20' },
  ];

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
            {jobs.map((job) => (
              <tr key={job.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/hr/job-management/${job.id}`)}>
                <td className="px-4 py-4 font-medium">{job.role}</td>
                <td className="px-4 py-4">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${job.status === 'Live' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{job.status}</span>
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