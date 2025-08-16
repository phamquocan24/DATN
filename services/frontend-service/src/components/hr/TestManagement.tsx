import React, { useState, useEffect } from 'react';
import { FiFilter, FiChevronDown, FiSearch, FiPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import calendarIcon from '../../assets/scheme.png';
import testApi from '../../services/testApi';
import CreateTestModal from './CreateTestModal';

interface Test {
    id: string;
    test_name: string;
    test_description: string;
    test_type: string;
    time_limit: number; // in minutes
    passing_score: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    job_id: string;
    questions: any[];
}

interface TestStats {
    newCandidatesToTests: number;
    activeTests: number;
    avgCompletion: number;
}

const TestManagement: React.FC = () => {
    const navigate = useNavigate();
    const [tests, setTests] = useState<Test[]>([]);
    const [stats, setStats] = useState<TestStats>({
        newCandidatesToTests: 0,
        activeTests: 0,
        avgCompletion: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalTests, setTotalTests] = useState(0);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Load tests when component mounts or page/search changes
    useEffect(() => {
        loadTests();
    }, [currentPage, searchTerm]);

    // Update stats when tests data changes
    useEffect(() => {
        if (tests.length > 0) {
            loadStats();
        }
    }, [tests]);

    const loadTests = async () => {
        try {
            setLoading(true);
            const response = await testApi.getAllTests({
                page: currentPage,
                limit: 10,
                search: searchTerm || undefined,
            });
            
            setTests(response.data || response.tests || []);
            setTotalTests(response.total || response.data?.length || 0);
        } catch (err) {
            setError('Failed to load tests');
            console.error('Error loading tests:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            // Calculate stats from loaded tests data
            const activeTestsCount = tests.filter(t => t.is_active).length;
            
            // Get completion statistics from test results
            let totalCandidates = 0;
            let completedTests = 0;
            
            // Fetch test results for each test to calculate statistics
            const statsPromises = tests.map(async (test) => {
                try {
                    const results = await testApi.getTestResults(test.id, { limit: 100 });
                    const testCandidates = results.data || results.results || [];
                    totalCandidates += testCandidates.length;
                    completedTests += testCandidates.filter((c: any) => c.status === 'COMPLETED').length;
                } catch (err) {
                    console.error(`Error loading stats for test ${test.id}:`, err);
                }
            });
            
            await Promise.all(statsPromises);
            
            const avgCompletion = totalCandidates > 0 ? Math.round((completedTests / totalCandidates) * 100) : 0;
            
            setStats({
                newCandidatesToTests: totalCandidates,
                activeTests: activeTestsCount,
                avgCompletion: avgCompletion
            });
        } catch (err) {
            console.error('Error loading stats:', err);
            // Fallback to basic stats if API calls fail
            setStats({
                newCandidatesToTests: 0,
                activeTests: tests.filter(t => t.is_active).length,
                avgCompletion: 0
            });
        }
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset to first page when searching
    };

    const formatDuration = (timeInMinutes: number): string => {
        if (timeInMinutes >= 60) {
            const hours = Math.floor(timeInMinutes / 60);
            const minutes = timeInMinutes % 60;
            return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
        }
        return `${timeInMinutes}m`;
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading && tests.length === 0) {
        return (
            <div className="p-0 text-left">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg text-gray-500">Loading tests...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-0 text-left">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold">Good morning, Maria</h1>
                    <p className="text-gray-500">Here is your job listings statistic report from July 19 - July 25.</p>
                </div>
                <div className="flex items-center border rounded-md px-3 py-2 cursor-pointer">
                    <span>Jul 19 - Jul 25</span>
                    <img src={calendarIcon} alt="calendar" className="ml-2 w-4 h-4" />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="p-6 rounded-lg text-white bg-yellow-400 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer">
                    <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-bold shrink-0">{stats.newCandidatesToTests}</p>
                        <p>Total test candidates</p>
                    </div>
                </div>
                <div className="p-6 rounded-lg text-white bg-green-400 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer">
                        <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-bold shrink-0">{stats.activeTests}</p>
                        <p>Active tests</p>
                    </div>
                        </div>
                <div className="p-6 rounded-lg text-white bg-[#007BFF] transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer">
                    <div className="flex items-baseline gap-2">
                        <p className="text-4xl font-bold shrink-0">{stats.avgCompletion}%</p>
                        <p>Avg. Completion</p>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Total Tests : {totalTests}</h2>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#007BFF] text-white rounded-lg hover:bg-blue-600"
                    >
                        <FiPlus />
                        <span>Create Test</span>
                    </button>
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search Tests" 
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-full pl-10 pr-4 py-2 border rounded-lg" 
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                        <FiFilter className="text-gray-600" />
                        <span>Filter</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg border">
                <table className="w-full">
                    <thead>
                        <tr className="border-b text-sm text-gray-500 text-left">
                            <th className="px-4 py-3 font-medium">Test Title <FiChevronDown className="inline ml-1"/></th>
                            <th className="px-4 py-3 font-medium">Duration <FiChevronDown className="inline ml-1"/></th>
                            <th className="px-4 py-3 font-medium">Questions <FiChevronDown className="inline ml-1"/></th>
                            <th className="px-4 py-3 font-medium">Test Status <FiChevronDown className="inline ml-1"/></th>
                            <th className="px-4 py-3 font-medium">Date Posted <FiChevronDown className="inline ml-1"/></th>
                            <th className="px-4 py-3 font-medium">Date Due <FiChevronDown className="inline ml-1"/></th>
                            <th className="px-4 py-3 font-medium">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {error ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-red-500">
                                    {error}
                                    <br />
                                    <button 
                                        onClick={loadTests}
                                        className="mt-2 text-[#007BFF] hover:underline"
                                    >
                                        Try again
                                    </button>
                                </td>
                            </tr>
                        ) : tests.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                                    {loading ? 'Loading tests...' : 'No tests found'}
                                </td>
                            </tr>
                        ) : (
                            tests.map(test => (
                                <tr key={test.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/hr/test-management/${test.id}`)}>
                                    <td className="px-4 py-4 font-medium">{test.test_name}</td>
                                    <td className="px-4 py-4">{formatDuration(test.time_limit)}</td>
                                    <td className="px-4 py-4">{test.questions?.length || 0} questions</td>
                                    <td className="px-4 py-4">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${test.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                            {test.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">{formatDate(test.created_at)}</td>
                                    <td className="px-4 py-4">{formatDate(test.updated_at)}</td>
                                    <td className="px-4 py-4">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); navigate(`/hr/test-management/${test.id}`)}} 
                                            className="text-[#007BFF] border border-[#007BFF] rounded-md px-3 py-1 hover:bg-blue-50"
                                        >
                                            See Details
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                 <div className="text-center py-4">
                    <button className="text-[#007BFF]">View All</button>
                </div>
            </div>

            <CreateTestModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onTestCreated={() => {
                    setIsCreateModalOpen(false);
                    loadTests(); // Reload tests after creating a new one
                }}
            />
        </div>
    );
};

export default TestManagement; 