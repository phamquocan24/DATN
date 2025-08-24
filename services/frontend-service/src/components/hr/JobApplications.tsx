import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiMoreHorizontal, FiChevronDown } from 'react-icons/fi';
import hrApi from '../../services/hrApi';

interface Applicant {
  application_id: string;
  fullName: string;
  score: number;
  hiringStage: 'SUBMITTED' | 'REVIEWING' | 'SHORTLISTED' | 'INTERVIEWED' | 'OFFERED' | 'HIRED' | 'REJECTED' | 'WITHDRAWN';
  appliedDate: string;
  jobRole: string;
  avatar: string;
  candidate_name: string;
  candidate_email: string;
  phone_number: string;
  current_status: string;
  match_score: number;
  submitted_at: string;
  job_title: string;
}

const JobApplications = () => {
  const navigate = useNavigate();
  
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [applicantsPerPage, setApplicantsPerPage] = useState(10);
  const [isPageSelectOpen, setIsPageSelectOpen] = useState(false);
  const pageOptions = [10, 20, 30];
  const pageSelectRef = useRef<HTMLDivElement>(null);

  // Fetch applications data
  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await hrApi.getApplications({
        search: searchTerm || undefined,
        page: currentPage,
        limit: applicantsPerPage,
        orderBy: 'submitted_at',
        direction: 'DESC'
      });
      
      if (response.success && response.data) {
        const transformedApplicants: Applicant[] = response.data.map((app: any) => ({
          application_id: app.application_id,
          fullName: app.candidate_name || 'Unknown',
          score: app.match_score ? Math.round(app.match_score) : 0,
          hiringStage: app.current_status || 'SUBMITTED',
          appliedDate: new Date(app.submitted_at).toLocaleDateString('en-US', { 
            year: 'numeric', month: 'short', day: 'numeric' 
          }),
          jobRole: app.job_title || 'Job Position',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(app.candidate_name || 'User')}&background=random`,
          candidate_name: app.candidate_name,
          candidate_email: app.candidate_email,
          phone_number: app.phone_number,
          current_status: app.current_status,
          match_score: app.match_score,
          submitted_at: app.submitted_at,
          job_title: app.job_title
        }));
        
        setApplicants(transformedApplicants);
        setTotalCount(response.pagination?.total || transformedApplicants.length);
      } else {
        setError('Failed to load applications');
      }
    } catch (err: any) {
      console.error('Error fetching applications:', err);
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

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

  // Fetch applications on component mount and when search/page changes
  useEffect(() => {
    fetchApplications();
  }, [currentPage, applicantsPerPage, searchTerm]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      } else {
        fetchApplications();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const getStageStyle = (stage: string) => {
    switch (stage) {
      case 'SUBMITTED': return 'bg-gray-100 text-gray-600 border border-gray-200';
      case 'REVIEWING': return 'bg-yellow-100 text-yellow-600 border border-yellow-200';
      case 'SHORTLISTED': return 'bg-blue-100 text-blue-600 border border-blue-200';
      case 'INTERVIEWED': return 'bg-purple-100 text-purple-600 border border-purple-200';
      case 'OFFERED': return 'bg-indigo-100 text-indigo-600 border border-indigo-200';
      case 'HIRED': return 'bg-green-100 text-green-600 border border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-600 border border-red-200';
      case 'WITHDRAWN': return 'bg-orange-100 text-orange-600 border border-orange-200';
      default: return 'bg-gray-100 text-gray-600 border border-gray-200';
    }
  };

  const getStageLabel = (stage: string) => {
    switch (stage) {
      case 'SUBMITTED': return 'Applied';
      case 'REVIEWING': return 'In Review';
      case 'SHORTLISTED': return 'Shortlisted';
      case 'INTERVIEWED': return 'Interviewed';
      case 'OFFERED': return 'Offered';
      case 'HIRED': return 'Hired';
      case 'REJECTED': return 'Rejected';
      case 'WITHDRAWN': return 'Withdrawn';
      default: return stage;
    }
  };

  return (
    <div className="p-0 bg-white">
      {/* Controls (Total Applicants + Search) */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-medium text-gray-900 whitespace-nowrap">Total Applicants : {totalCount}</h1>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search applicants" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" 
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 text-sm">
              <th className="px-4 py-3 text-left font-semibold text-black">Full Name <FiChevronDown className="inline-block ml-1" /></th>
              <th className="px-4 py-3 text-left font-semibold text-black">Score <FiChevronDown className="inline-block ml-1" /></th>
              <th className="px-4 py-3 text-left font-semibold text-black">Hiring Stage <FiChevronDown className="inline-block ml-1" /></th>
              <th className="px-4 py-3 text-left font-semibold text-black">Applied Date <FiChevronDown className="inline-block ml-1" /></th>
              <th className="px-4 py-3 text-left font-semibold text-black">Job Role <FiChevronDown className="inline-block ml-1" /></th>
              <th className="px-4 py-3 text-left font-semibold text-black">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Loading applications...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-red-500">
                  {error}
                </td>
              </tr>
            ) : applicants.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No applications found
                </td>
              </tr>
            ) : (
              applicants.map((applicant) => (
                <tr key={applicant.application_id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/hr/applicant-detail/${applicant.application_id}`)}>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <img src={applicant.avatar} alt={applicant.fullName} className="w-8 h-8 rounded-full" />
                      <span className="font-medium text-gray-800">{applicant.fullName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-2 text-gray-700 text-left">{applicant.score}%</td>
                  <td className="px-4 py-2 text-left">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStageStyle(applicant.hiringStage)}`}>
                      {getStageLabel(applicant.hiringStage)}
                    </span>
                  </td>
                  <td className="px-6 py-2 text-gray-700 text-left">{applicant.appliedDate}</td>
                  <td className="px-4 py-2 text-gray-700 text-left">{applicant.jobRole}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <button 
                        className="px-3 py-1 text-sm border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50" 
                        onClick={(e) => {
                          e.stopPropagation(); 
                          navigate(`/hr/applicant-detail/${applicant.application_id}`)
                        }}
                      >
                        See Application
                      </button>
                      <button className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-md" onClick={(e) => e.stopPropagation()}>
                        <FiMoreHorizontal />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
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