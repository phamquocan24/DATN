import React, { useState, useRef, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { FiSearch, FiChevronDown } from 'react-icons/fi';
 
import BellIcon from '../../assets/bell-outlined.png';
import NotificationPanel from './NotificationPanelAdmin';

import QuestionDetails from './QuestionDetails'; // Import the new component
import adminApi from '../../services/adminApi';
import AdminHeaderDropdown from './AdminHeaderDropdown';

interface TestItem {
  id: string;
  test_id: string;
  job_id: string;
  test_name: string;
  test_description: string;
  time_limit: number;
  passing_score: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  title: string; // job title
  company_id: string;
  company_name: string;
}

interface QuestionManagementProps {
  currentUser?: any;
}

const QuestionManagement: React.FC<QuestionManagementProps> = ({ currentUser }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  const [selectedTest, setSelectedTest] = useState<TestItem | null>(null);
  
  // API data states
  const [tests, setTests] = useState<TestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');



  
  const [isPageSelectOpen, setIsPageSelectOpen] = useState(false);
  const pageOptions = [10, 20, 30];
  const pageSelectRef = useRef<HTMLDivElement>(null);


  // Fetch tests data
  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: any = {
          page: currentPage,
          limit: itemsPerPage
        };

        if (searchQuery.trim()) {
          params.search = searchQuery;
        }

        if (statusFilter !== 'all') {
          params.is_active = statusFilter === 'active';
        }

        const response = await adminApi.getAllTestsAdmin(params);
        
        if (response.success) {
          const testsData = response.data || [];  // API trả về data trực tiếp là array
          const paginationInfo = response.pagination;  // pagination ở level root
          
          setTests(testsData);
          setTotalQuestions(paginationInfo?.total || 0);
          setTotalPages(paginationInfo?.totalPages || 1);
        } else {
          setError(response.message || 'Failed to load tests');
          setTests([]);
        }
      } catch (err: any) {
        console.error('Error fetching tests:', err);
        setError('Failed to load tests. Please try again.');
        setTests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [currentPage, itemsPerPage, searchQuery, statusFilter]);

  const handleTestClick = (test: TestItem) => {
    setSelectedTest(test);
  };

  const handleBackToList = () => {
    setSelectedTest(null);
  };

  const handleDelete = async (testId: string) => {
    if (window.confirm('Are you sure you want to delete this test?')) {
      try {
        await adminApi.deleteTest(testId);
        // Refresh the list
        const response = await adminApi.getAllTestsAdmin({ page: currentPage, limit: itemsPerPage });
        if (response.success) {
          setTests(response.data || []);
          setTotalQuestions(response.pagination?.total || 0);
        }
      } catch (error) {
        console.error('Error deleting test:', error);
        setError('Failed to delete test');
      }
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'border-green-400 bg-green-50 text-green-700' : 'border-red-400 bg-red-50 text-red-700';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Active' : 'Inactive';
  };


  return (
    <AdminLayout>
      <div className="p-8 bg-white text-left">
                <div className="flex items-center justify-between mb-6">
            <AdminHeaderDropdown currentUser={currentUser} />
            <div className="flex items-center space-x-6 relative">
                <button onClick={() => setNotifOpen(!notifOpen)} className="relative focus:outline-none">
                    <img src={BellIcon} alt="Notifications" className="w-5 h-5" />
                    {hasUnread && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />}
                </button>
                <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} position="header" onMarkAllAsRead={() => setHasUnread(false)} />
            </div>
        </div>
        <div className="border-t border-gray-200 mb-6"></div>

        {selectedTest ? (
          <QuestionDetails test={selectedTest} onBack={handleBackToList} />
        ) : (
          <>
            {/* Header */}
            <div className="mb-6">
              <div className="text-left">
                <h1 className="text-2xl font-semibold text-gray-800">Test Management</h1>
                <p className="text-gray-600">Manage tests and their questions for job positions.</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
              <nav className="flex space-x-8">
                <button className="py-4 px-1 border-b-2 font-medium text-sm border-[#007BFF] text-[#007BFF]">
                  Tests
                </button>
              </nav>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                  <div className="text-lg font-semibold text-gray-800 text-left">Total Tests: {totalQuestions}</div>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Search test names, descriptions" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300" 
                      />
                    </div>

                  </div>
                </div>

                <table className="w-full text-left">
                  <thead>
                    <tr className="text-black text-sm">
                      {['Test Name', 'Job Title', 'Company', 'T.Limit', 'P.Score', 'Status', 'Created', 'Actions'].map(header => (
                        <th key={header} className="pb-4 font-semibold">
                          {header} <FiChevronDown className="inline-block" />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={8} className="text-center py-8">Loading tests...</td></tr>
                    ) : error ? (
                      <tr><td colSpan={8} className="text-center py-8 text-red-500">{error}</td></tr>
                    ) : tests.length === 0 ? (
                      <tr><td colSpan={8} className="text-center py-8 text-gray-500">No tests found</td></tr>
                    ) : tests.map((test) => (
                      <tr 
                        key={test.id} 
                        className="border-t border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => handleTestClick(test)}
                      >
                        <td className="py-4 font-medium">{test.test_name}</td>
                        <td className="py-4 text-gray-700">{test.title || 'N/A'}</td>
                        <td className="py-4 text-gray-700">{test.company_name || 'N/A'}</td>
                        <td className="py-4 text-gray-700">{test.time_limit} mins</td>
                        <td className="py-4 text-gray-700">{test.passing_score}%</td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(test.is_active)}`}>
                            {getStatusText(test.is_active)}
                          </span>
                        </td>
                        <td className="py-4 text-gray-500">{new Date(test.created_at).toLocaleDateString()}</td>
                        <td className="py-4 text-left">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(test.test_id);
                            }}
                            className="px-3 py-1 rounded-full text-sm border border-red-400 bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                          >
                            Delete
                          </button>
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
                  <span className="text-gray-600 whitespace-nowrap">Questions per page</span>
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

export default QuestionManagement; 