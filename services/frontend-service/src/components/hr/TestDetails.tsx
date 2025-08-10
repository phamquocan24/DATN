import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiEdit, FiUser, FiBarChart2, FiCheckCircle, FiClock, FiTrash2, FiUserPlus, FiX } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import testApi from '../../services/testApi';

interface TestDetails {
    id: string;
    test_name: string;
    test_description: string;
    test_type: string;
    time_limit: number;
    passing_score: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    job_id: string;
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [assignLoading, setAssignLoading] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignForm, setAssignForm] = useState({
        candidate_id: '',
        application_id: ''
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
            setTest(response);
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

    const handleDeleteTest = async () => {
        if (!test || !window.confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
            return;
        }

        try {
            setDeleteLoading(true);
            await testApi.deleteTest(test.id);
            navigate('/hr/test-management');
        } catch (err) {
            alert('Failed to delete test. You may not have permission to delete this test.');
            console.error('Error deleting test:', err);
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleAssignTest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!test || !assignForm.candidate_id || !assignForm.application_id) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            setAssignLoading(true);
            await testApi.assignTest(test.id, assignForm);
            setShowAssignModal(false);
            setAssignForm({ candidate_id: '', application_id: '' });
            loadTestResults(); // Reload test results
            alert('Test assigned successfully!');
        } catch (err) {
            alert('Failed to assign test. Please try again.');
            console.error('Error assigning test:', err);
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
                        onClick={() => setShowAssignModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                    >
                        <FiUserPlus /> Assign Test
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-[#007BFF] text-[#007BFF] rounded-lg text-sm font-medium hover:bg-blue-50">
                        <FiEdit /> Edit Test
                    </button>
                    <button 
                        onClick={handleDeleteTest}
                        disabled={deleteLoading}
                        className="flex items-center gap-2 px-4 py-2 border border-red-500 text-red-500 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50"
                    >
                        <FiTrash2 /> {deleteLoading ? 'Deleting...' : 'Delete'}
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
                            <p className="font-semibold text-gray-800">{formatDuration(test.time_limit)}</p>
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
                    <p className="text-gray-600">{test.test_description || 'No description provided for this test.'}</p>
                </div>
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Candidate ID *
                                </label>
                                <input
                                    type="text"
                                    value={assignForm.candidate_id}
                                    onChange={(e) => setAssignForm(prev => ({ ...prev, candidate_id: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    placeholder="Enter candidate ID"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Application ID *
                                </label>
                                <input
                                    type="text"
                                    value={assignForm.application_id}
                                    onChange={(e) => setAssignForm(prev => ({ ...prev, application_id: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    placeholder="Enter application ID"
                                />
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