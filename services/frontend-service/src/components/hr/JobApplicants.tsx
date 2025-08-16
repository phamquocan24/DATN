import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiSearch, FiFilter, FiMoreHorizontal, FiChevronLeft, FiChevronDown, FiUpload } from 'react-icons/fi';
import JobDetailsTab from './JobDetailsTab'; 
import AnalyticsTab from './AnalyticsTab'; 
import api from '../../services/api';

interface Applicant {
  id: number;
  fullName: string;
  avatar: string;
  score: string;
  hiringStage: 'In-review' | 'Shortlisted' | 'Declined' | 'Hired' | 'Interviewed';
  appliedDate: string;
  jobRole: string;
}

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
  const [viewMode, setViewMode] = useState<'pipeline' | 'table'>('table');
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

  useEffect(() => {
    const fetchApplicants = async () => {
      if (!jobId) return;
      setIsLoading(true);
      try {
        const response = await api.get(`/applications/job/${jobId}`);
        setApplicants(response.data.data);
        setError(null);
      } catch (err) {
        setError('Failed to load applicants.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchApplicants();
  }, [jobId]);

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

  const renderContent = () => {
    switch (activeTab) {
      case 'Applicants':
        return (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-gray-200">
              <h1 className="text-lg font-medium text-gray-900 whitespace-nowrap">Total Applicants: {applicants.length}</h1>
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

            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 text-sm text-gray-500 text-left">
                  <th className="w-6 p-4 text-left"><input type="checkbox" className="rounded border-gray-300" /></th>
                  <th className="px-4 py-3 font-medium">Full Name <FiChevronDown className="inline-block ml-1" /></th>
                  <th className="px-4 py-3 font-medium">Score <FiChevronDown className="inline-block ml-1" /></th>
                  <th className="px-4 py-3 font-medium">Hiring Stage <FiChevronDown className="inline-block ml-1" /></th>
                  <th className="px-4 py-3 font-medium">Applied Date <FiChevronDown className="inline-block ml-1" /></th>
                  <th className="px-4 py-3 font-medium">Job Role <FiChevronDown className="inline-block ml-1" /></th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7} className="text-center p-4">Loading applicants...</td></tr>
                ) : error ? (
                  <tr><td colSpan={7} className="text-center p-4 text-red-500">{error}</td></tr>
                ) : applicants.map((applicant) => (
                  <tr key={applicant.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`/hr/job-applications/${applicant.id}`)}>
                    <td className="p-4"><input type="checkbox" className="rounded border-gray-300" onClick={(e) => e.stopPropagation()} /></td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        <img src={applicant.avatar} alt={applicant.fullName} className="w-8 h-8 rounded-full" />
                        <span className="font-medium text-gray-800">{applicant.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-2 text-gray-700 text-left">{applicant.score}</td>
                    <td className="px-4 py-2 text-left">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getHiringStageClass(applicant.hiringStage)}`}>
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
          <span className="text-2xl font-semibold text-gray-800 ml-2">Social Media Assistant</span>
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