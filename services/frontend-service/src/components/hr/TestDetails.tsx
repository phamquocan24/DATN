import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiEdit, FiUser, FiBarChart2, FiCheckCircle, FiClock, FiUserPlus, FiX } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import testApi from '../../services/testApi';
import { hrApi } from '../../services/hrApi';
import { handleApiError } from '../../utils/errorHandler';

interface TestDetails {
    test_id: string;
    id?: string; // Keep for backward compatibility
    test_name: string;
    test_description?: string;
    description?: string; // Alternative field name
    test_type: string;
    time_limit?: number;
    duration_minutes?: number; // Alternative field name
    passing_score: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    job_id: string;
    job_title?: string;
    company_name?: string;
    questions: any[];
}

interface CandidateResult {
    id: string;
    candidate_id: string;
    candidate_name: string;
    score: number;
    status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
    submitted_at: string;
    avatar?: string;
}

const TestDetails: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [test, setTest] = useState<TestDetails | null>(null);
    const [candidates, setCandidates] = useState<CandidateResult[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [assignLoading, setAssignLoading] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignForm, setAssignForm] = useState({
        candidate_id: '',
        application_id: '',
        selectedApplication: null as any
    });

    useEffect(() => {
        if (id) {
            loadTestDetails();
            loadTestResults();
        }
    }, [id]);

    const loadTestDetails = async () => {
        try {
            setLoading(true);
            const response = await testApi.getTestById(id!, true); // Include answers for HR
            console.log('Test API Response:', response);
            const testData = response.data || response;
            console.log('Test data time_limit:', testData.time_limit);
            console.log('Test data duration_minutes:', testData.duration_minutes);
            console.log('Test data test_description:', testData.test_description);
            console.log('Test data description:', testData.description);
            console.log('Full test data:', testData);
            setTest(testData);
        } catch (err) {
            setError('Failed to load test details');
            console.error('Error loading test details:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadTestResults = async () => {
        try {
            const response = await testApi.getTestResults(id!, {
                page: 1,
                limit: 100
            });
            setCandidates(response.data || response.results || []);
        } catch (err) {
            console.error('Error loading test results:', err);
        }
    };

    const loadApplications = async () => {
        try {
            const response = await hrApi.getApplications({
                page: 1,
                limit: 100, // Get enough applications for dropdown
                orderBy: 'submitted_at',
                direction: 'DESC'
            });
            setApplications(response.data || []);
        } catch (err) {
            console.error('Error loading applications:', err);
        }
    };

    const handleAssignTest = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Enhanced validation
        if (!test) {
            alert('Test information not available');
            return;
        }
        
        if (!assignForm.selectedApplication) {
            alert('Please select an application');
            return;
        }

        try {
            setAssignLoading(true);
            await testApi.assignTest(test.id || test.test_id, {
                candidate_id: assignForm.selectedApplication.candidate_id,
                application_id: assignForm.selectedApplication.application_id
            });
            setShowAssignModal(false);
            setAssignForm({ candidate_id: '', application_id: '', selectedApplication: null });
            loadTestResults(); // Reload test results
            alert('Test assigned successfully!');
        } catch (err: any) {
            handleApiError('Test Assignment', err, true);
        } finally {
            setAssignLoading(false);
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return 'bg-green-100 text-green-600';
            case 'IN_PROGRESS':
                return 'bg-blue-100 text-blue-600';
            case 'ASSIGNED':
                return 'bg-yellow-100 text-yellow-600';
            case 'EXPIRED':
                return 'bg-red-100 text-red-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    if (loading) {
        return (
            <div className="text-left">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg text-gray-500">Loading test details...</div>
                </div>
            </div>
        );
    }

    if (error || !test) {
        return (
            <div className="text-left">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="text-lg text-red-500 mb-4">{error || 'Test not found'}</div>
                        <button 
                            onClick={() => navigate('/hr/test-management')}
                            className="text-[#007BFF] hover:underline"
                        >
                            Back to Test Management
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="text-left">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                        <FiArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">{test.test_name}</h2>
                        <p className="text-sm text-gray-500">
                            Status: <span className={`font-semibold ${test.is_active ? 'text-green-500' : 'text-red-500'}`}>
                                {test.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => {
                            setShowAssignModal(true);
                            loadApplications();
                        }}
                        className="flex items-center gap-2 px-4 py-2 border border-green-600 text-green-600 rounded-lg text-sm font-medium hover:bg-green-50"
                    >
                        <FiUserPlus /> Assign Test
                    </button>
                    <button 
                        onClick={() => navigate(`/hr/test-management/${id}/edit`)}
                        className="flex items-center gap-2 px-4 py-2 border border-[#007BFF] text-[#007BFF] rounded-lg text-sm font-medium hover:bg-blue-50"
                    >
                        <FiEdit /> Edit Test
                    </button>

                </div>
            </div>

            <div className="bg-white p-6 rounded-lg border shadow-sm mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Test Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                    <div className="flex items-center gap-3">
                        <FiClock className="w-5 h-5 text-gray-400" />
                        <div>
                            <p className="text-gray-500">Duration</p>
                            <p className="font-semibold text-gray-800">{formatDuration(test.time_limit || test.duration_minutes || 60)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <FiCheckCircle className="w-5 h-5 text-gray-400" />
                        <div>
                            <p className="text-gray-500">Questions</p>
                            <p className="font-semibold text-gray-800">{test.questions?.length || 0} questions</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <FiBarChart2 className="w-5 h-5 text-gray-400" />
                        <div>
                            <p className="text-gray-500">Passing Score</p>
                            <p className="font-semibold text-gray-800">{test.passing_score}%</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <FiUser className="w-5 h-5 text-gray-400" />
                        <div>
                            <p className="text-gray-500">Test Type</p>
                            <p className="font-semibold text-gray-800">{test.test_type}</p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm mt-4">
                    <div>
                        <p className="text-gray-500">Date Created: <span className="font-medium text-gray-800">{formatDate(test.created_at)}</span></p>
                    </div>
                    <div>
                        <p className="text-gray-500">Last Updated: <span className="font-medium text-gray-800">{formatDate(test.updated_at)}</span></p>
                    </div>
                </div>
                <hr className="my-6" />
                <div>
                    <h4 className="text-lg font-semibold mb-2 text-gray-700">Description</h4>
                    <p className="text-gray-600">{test.test_description || test.description || 'No description provided for this test.'}</p>
                </div>
            </div>

            {/* Test Questions Section */}
            <div className="bg-white p-6 rounded-lg border shadow-sm mt-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Test Questions ({test.questions?.length || 0})</h3>
                {test.questions && test.questions.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 space-y-6 pr-2">
                        {test.questions.map((question: any, index: number) => (
                            <div key={question.question_id || index} className="border-l-4 border-blue-500 pl-4 py-2">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-medium text-gray-800">
                                        Question {index + 1} ({question.question_type}) - {question.points || 5} points
                                    </h4>
                                </div>
                                <p className="text-gray-700 mb-3">{question.question_text}</p>
                                
                                {/* Multiple Choice Options */}
                                {question.question_type === 'MULTIPLE_CHOICE' && question.options && (
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600 mb-2">Options:</p>
                                        <div className="space-y-1">
                                            {question.options.map((option: any, optIndex: number) => (
                                                <div key={option.option_id || optIndex} className="flex items-center">
                                                    <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs mr-2 ${
                                                        option.is_correct 
                                                        ? 'bg-green-100 border-green-500 text-green-700' 
                                                        : 'bg-gray-100 border-gray-300 text-gray-600'
                                                    }`}>
                                                        {String.fromCharCode(65 + optIndex)}
                                                    </span>
                                                    <span className={option.is_correct ? 'font-medium text-green-700' : 'text-gray-700'}>
                                                        {option.option_text}
                                                    </span>
                                                    {option.is_correct && (
                                                        <span className="ml-2 text-green-600 text-sm">✓ Correct</span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Essay Questions */}
                                {question.question_type === 'ESSAY' && (
                                    <div className="ml-4">
                                        <p className="text-sm text-gray-600 italic">Essay question - No predefined answer</p>
                                    </div>
                                )}

                                {/* Show correct answer for non-multiple choice */}
                                {question.question_type !== 'MULTIPLE_CHOICE' && question.correct_answer && (
                                    <div className="ml-4 mt-2">
                                        <p className="text-sm font-medium text-gray-600">Expected Answer:</p>
                                        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{question.correct_answer}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-8">No questions have been added to this test yet.</p>
                )}
            </div>

             <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">Candidates Results</h3>
                 <div className="bg-white rounded-lg border shadow-sm">
                    <table className="w-full">
                        <thead>
                             <tr className="border-b text-sm text-gray-500 text-left bg-gray-50">
                                <th className="px-6 py-3 font-medium">Candidate</th>
                                <th className="px-6 py-3 font-medium">Score</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium">Date Taken</th>
                                <th className="px-6 py-3 font-medium">Action</th>
                            </tr>
                        </thead>
                         <tbody className="divide-y divide-gray-200">
                            {candidates.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        No candidates have taken this test yet.
                                    </td>
                                </tr>
                            ) : (
                                candidates.map(candidate => (
                                    <tr key={candidate.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <img 
                                                    src={candidate.avatar || `https://i.pravatar.cc/40?u=${candidate.candidate_id}`} 
                                                    alt={candidate.candidate_name} 
                                                    className="w-8 h-8 rounded-full" 
                                                />
                                                <span className="font-medium text-gray-800">{candidate.candidate_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium">
                                            {candidate.status === 'COMPLETED' ? `${candidate.score}%` : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(candidate.status)}`}>
                                                {candidate.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {candidate.submitted_at ? formatDate(candidate.submitted_at) : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {candidate.status === 'COMPLETED' ? (
                                                <button 
                                                    onClick={() => navigate(`results/${candidate.candidate_id}`)} 
                                                    className="text-[#007BFF] border border-[#007BFF] rounded-md px-3 py-1 hover:bg-blue-50"
                                                >
                                                    View Answers
                                                </button>
                                            ) : (
                                                <span className="text-gray-400">Not available</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Assign Test Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h3 className="text-lg font-semibold text-gray-800">Assign Test to Candidate</h3>
                            <button 
                                onClick={() => setShowAssignModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleAssignTest} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    <span className="text-black">Select Application</span>
                                    <span className="text-red-500 ml-1">*</span>
                                </label>
                                <select
                                    value={assignForm.selectedApplication?.application_id || ''}
                                    onChange={(e) => {
                                        const selected = applications.find(app => app.application_id === e.target.value);
                                        setAssignForm(prev => ({ 
                                            ...prev, 
                                            selectedApplication: selected || null,
                                            candidate_id: selected?.candidate_id || '',
                                            application_id: selected?.application_id || ''
                                        }));
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Select an application...</option>
                                    {applications.map((app) => (
                                        <option key={app.application_id} value={app.application_id}>
                                            {app.first_name} {app.last_name} - {app.job_title} ({new Date(app.submitted_at).toLocaleDateString()})
                                        </option>
                                    ))}
                                </select>
                                {assignForm.selectedApplication && (
                                    <div className="mt-2 p-3 bg-gray-50 rounded-md">
                                        <p className="text-sm text-gray-600">
                                            <strong>Candidate:</strong> {assignForm.selectedApplication.first_name} {assignForm.selectedApplication.last_name}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            <strong>Email:</strong> {assignForm.selectedApplication.email}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            <strong>Job:</strong> {assignForm.selectedApplication.job_title}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            <strong>Status:</strong> {assignForm.selectedApplication.current_status}
                                        </p>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex justify-end gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAssignModal(false)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={assignLoading}
                                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                                >
                                    {assignLoading ? 'Assigning...' : 'Assign Test'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestDetails; 