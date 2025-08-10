import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiFilter, FiMoreHorizontal, FiChevronDown } from 'react-icons/fi';

interface Applicant {
  id: number;
  fullName: string;
  score: number;
  hiringStage: 'In-review' | 'Shortlisted' | 'Declined' | 'Hired' | 'Interviewed';
  appliedDate: string;
  jobRole: string;
  avatar: string;
}

const JobApplications = () => {
  const [viewMode, setViewMode] = useState<'pipeline' | 'table'>('table');
  const navigate = useNavigate();
  
  const [applicantsPerPage, setApplicantsPerPage] = useState(10);
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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [pageSelectRef]);
  
  const applicants: Applicant[] = [
    { id: 1, fullName: 'Jake Gyll', score: 90, hiringStage: 'In-review', appliedDate: '13 July, 2021', jobRole: 'Designer', avatar: `https://i.pravatar.cc/40?u=1` },
    { id: 2, fullName: 'Guy Hawkins', score: 70, hiringStage: 'In-review', appliedDate: '13 July, 2021', jobRole: 'JavaScript Dev', avatar: `https://i.pravatar.cc/40?u=2` },
    { id: 3, fullName: 'Cyndy Lillibridge', score: 65, hiringStage: 'Shortlisted', appliedDate: '12 July, 2021', jobRole: 'Golang Dev', avatar: `https://i.pravatar.cc/40?u=3` },
    { id: 4, fullName: 'Rodolfo Goode', score: 40, hiringStage: 'Declined', appliedDate: '11 July, 2021', jobRole: 'NET Dev', avatar: `https://i.pravatar.cc/40?u=4` },
    { id: 5, fullName: 'Leif Floyd', score: 88, hiringStage: 'Hired', appliedDate: '11 July, 2021', jobRole: 'Graphic Design', avatar: `https://i.pravatar.cc/40?u=5` },
    { id: 6, fullName: 'Jenny Wilson', score: 66, hiringStage: 'Hired', appliedDate: '9 July, 2021', jobRole: 'Designer', avatar: `https://i.pravatar.cc/40?u=6` },
    { id: 7, fullName: 'Jerome Bell', score: 78, hiringStage: 'Interviewed', appliedDate: '5 July, 2021', jobRole: 'Designer', avatar: `https://i.pravatar.cc/40?u=7` },
    { id: 8, fullName: 'Eleanor Pena', score: 20, hiringStage: 'Declined', appliedDate: '5 July, 2021', jobRole: 'Designer', avatar: `https://i.pravatar.cc/40?u=8` },
    { id: 9, fullName: 'Darrell Steward', score: 90, hiringStage: 'Shortlisted', appliedDate: '3 July, 2021', jobRole: 'Designer', avatar: `https://i.pravatar.cc/40?u=9` },
    { id: 10, fullName: 'Floyd Miles', score: 77, hiringStage: 'Interviewed', appliedDate: '1 July, 2021', jobRole: 'Designer', avatar: `https://i.pravatar.cc/40?u=10` },
  ];

  const getStageStyle = (stage: string) => {
    switch (stage) {
      case 'In-review': return 'bg-yellow-100 text-yellow-600 border border-yellow-200';
      case 'Shortlisted': return 'bg-blue-100 text-blue-600 border border-blue-200';
      case 'Declined': return 'bg-red-100 text-red-600 border border-red-200';
      case 'Hired': return 'bg-green-100 text-green-600 border border-green-200';
      case 'Interviewed': return 'bg-purple-100 text-purple-600 border border-purple-200';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="p-0 bg-white">
      {/* Controls (Total Applicants + Search / Filter / Toggle) */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-medium text-gray-900 whitespace-nowrap">Total Applicants : {applicants.length}</h1>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search Applicants" className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
          </div>
          <button className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 whitespace-nowrap">
            <FiFilter className="text-gray-600" />
            <span>Filter</span>
          </button>
          <div className="flex bg-gray-100 p-1 rounded-full">
            <button 
              className={`px-4 py-1.5 rounded-full text-sm font-semibold ${viewMode === 'pipeline' ? 'bg-white text-[#007BFF] shadow-sm' : 'text-gray-600'}`}
              onClick={() => setViewMode('pipeline')}
            >
              Pipeline View
            </button>
            <button 
              className={`px-4 py-1.5 rounded-full text-sm font-semibold ${viewMode === 'table' ? 'bg-white text-[#007BFF] shadow-sm' : 'text-gray-600'}`}
              onClick={() => setViewMode('table')}
            >
              Table View
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 text-sm text-gray-500">
              <th className="w-6 p-4 text-left"><input type="checkbox" className="rounded border-gray-300" /></th>
              <th className="px-4 py-3 text-left font-medium">Full Name <FiChevronDown className="inline-block ml-1" /></th>
              <th className="px-4 py-3 text-left font-medium">Score <FiChevronDown className="inline-block ml-1" /></th>
              <th className="px-4 py-3 text-left font-medium">Hiring Stage <FiChevronDown className="inline-block ml-1" /></th>
              <th className="px-4 py-3 text-left font-medium">Applied Date <FiChevronDown className="inline-block ml-1" /></th>
              <th className="px-4 py-3 text-left font-medium">Job Role <FiChevronDown className="inline-block ml-1" /></th>
              <th className="px-4 py-3 text-left font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {applicants.map((applicant) => (
              <tr key={applicant.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/hr/job-applications/${applicant.id}`)}>
                <td className="p-4"><input type="checkbox" className="rounded border-gray-300" onClick={(e) => e.stopPropagation()} /></td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-3">
                    <img src={applicant.avatar} alt={applicant.fullName} className="w-8 h-8 rounded-full" />
                    <span className="font-medium text-gray-800">{applicant.fullName}</span>
                  </div>
                </td>
                <td className="px-6 py-2 text-gray-700 text-left">{applicant.score}%</td>
                <td className="px-4 py-2 text-left">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStageStyle(applicant.hiringStage)}`}>
                    {applicant.hiringStage}
                  </span>
                </td>
                <td className="px-6 py-2 text-gray-700 text-left">{applicant.appliedDate}</td>
                <td className="px-4 py-2 text-gray-700 text-left">{applicant.jobRole}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 text-sm border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50" onClick={(e) => {e.stopPropagation(); navigate(`/hr/job-applications/${applicant.id}`)}}>
                      See Application
                    </button>
                    <button className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-md" onClick={(e) => e.stopPropagation()}>
                      <FiMoreHorizontal />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination */}
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
                      onClick={() => { setApplicantsPerPage(option); setIsPageSelectOpen(false); }}
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

export default JobApplications; 