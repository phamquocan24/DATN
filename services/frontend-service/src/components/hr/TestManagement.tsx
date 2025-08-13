import React, { useState, useEffect } from 'react';
import { FiFilter, FiChevronDown, FiSearch, FiPlus, FiEye, FiX } from 'react-icons/fi';
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
    const [selectedTest, setSelectedTest] = useState<Test | null>(null);
    const [isQuestionsModalOpen, setIsQuestionsModalOpen] = useState(false);

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
            
            // Map backend field names to frontend expected names
            const mappedTests = (response.data || response.tests || []).map((test: any) => ({
                ...test,
                id: test.test_id || test.id,
                test_description: test.description || test.test_description,
                time_limit: test.duration_minutes || test.time_limit,
                questions: [] // Initialize as empty array
            }));
            
            // Load questions count for each test in batches to avoid too many concurrent requests
            const batchSize = 3;
            const testsWithQuestions = [...mappedTests];
            
            for (let i = 0; i < testsWithQuestions.length; i += batchSize) {
                const batch = testsWithQuestions.slice(i, i + batchSize);
                
                await Promise.all(
                    batch.map(async (test, batchIndex) => {
                        try {
                            const testDetails = await testApi.getTestById(test.id, true);
                            const actualIndex = i + batchIndex;
                            testsWithQuestions[actualIndex] = {
                                ...test,
                                questions: testDetails.data?.questions || testDetails.questions || []
                            };
                        } catch (err) {
                            console.error(`Failed to load questions for test ${test.id}:`, err);
                            // Keep test with empty questions array if failed
                        }
                    })
                );
            }
            
            setTests(testsWithQuestions);
            setTotalTests(response.total || response.pagination?.total || testsWithQuestions.length);
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

    const handleViewQuestions = async (test: Test) => {
        try {
            // Load full test details with questions if not already loaded
            if (!test.questions || test.questions.length === 0) {
                const testDetails = await testApi.getTestById(test.id, true);
                const updatedTest = {
                    ...test,
                    questions: testDetails.data?.questions || testDetails.questions || []
                };
                setSelectedTest(updatedTest);
            } else {
                setSelectedTest(test);
            }
            setIsQuestionsModalOpen(true);
        } catch (err) {
            console.error('Failed to load test questions:', err);
            alert('Failed to load test questions. Please try again.');
        }
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
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); navigate(`/hr/test-management/${test.id}`)}} 
                                                className="text-[#007BFF] border border-[#007BFF] rounded-md px-3 py-1 hover:bg-blue-50 text-sm"
                                            >
                                                See Details
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleViewQuestions(test)}} 
                                                className="text-green-600 border border-green-600 rounded-md px-3 py-1 hover:bg-green-50 text-sm flex items-center gap-1"
                                            >
                                                <FiEye size={14} />
                                                Questions
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

            </div>

            <CreateTestModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onTestCreated={() => {
                    setIsCreateModalOpen(false);
                    loadTests(); // Reload tests after creating a new one
                }}
            />

            {/* Questions Modal */}
            {isQuestionsModalOpen && selectedTest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h3 className="text-xl font-semibold text-gray-800">
                                Questions - {selectedTest.test_name}
                            </h3>
                            <button 
                                onClick={() => setIsQuestionsModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto max-h-[70vh]">
                            {selectedTest.questions && selectedTest.questions.length > 0 ? (
                                <div className="space-y-6">
                                    {selectedTest.questions.map((question: any, index: number) => (
                                        <div key={question.question_id || question.id || index} className="border rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <h4 className="font-semibold text-gray-800 flex-1">
                                                    {index + 1}. {question.question_text}
                                                </h4>
                                                <div className="flex items-center gap-2 ml-4">
                                                    <span className="text-sm text-gray-500">
                                                        {question.question_type || 'MULTIPLE_CHOICE'}
                                                    </span>
                                                    <span className="text-sm font-medium text-blue-600">
                                                        {question.points || 1} pts
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            {question.question_type === 'MULTIPLE_CHOICE' && question.options ? (
                                                <div className="space-y-2">
                                                    <p className="text-sm font-medium text-gray-600 mb-2">Options:</p>
                                                    {question.options.map((option: string, optionIndex: number) => (
                                                        <div 
                                                            key={optionIndex} 
                                                            className={`p-2 rounded border ${
                                                                option === question.correct_answer 
                                                                    ? 'bg-green-50 border-green-200 text-green-700' 
                                                                    : 'bg-gray-50 border-gray-200'
                                                            }`}
                                                        >
                                                            <span className="font-medium mr-2">
                                                                {String.fromCharCode(65 + optionIndex)}.
                                                            </span>
                                                            {option}
                                                            {option === question.correct_answer && (
                                                                <span className="ml-2 text-green-600 font-medium">✓ Correct</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <p className="text-sm font-medium text-gray-600">Correct Answer:</p>
                                                    <div className="p-2 bg-green-50 border border-green-200 rounded text-green-700">
                                                        {question.correct_answer || 'No answer provided'}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">No questions found for this test.</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex justify-end p-6 border-t bg-gray-50">
                            <button
                                onClick={() => setIsQuestionsModalOpen(false)}
                                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestManagement; 