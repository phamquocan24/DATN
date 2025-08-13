import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiCheck, FiX, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import testApi from '../../services/testApi';

interface Question {
    id: string;
    question_text: string;
    question_type: string;
    options: string[];
    correct_answer: string;
    points: number;
}

interface TestResult {
    test_id: string;
    test_name: string;
    candidate_id: string;
    candidate_name: string;
    score: number;
    status: string;
    submitted_at: string;
    answers: Record<string, string>;
    questions: Question[];
}

const TestResultDetails: React.FC = () => {
    const navigate = useNavigate();
    const { id: testId, candidateId } = useParams<{ id: string; candidateId: string }>();
    const [searchParams] = useSearchParams();
    const [testResult, setTestResult] = useState<TestResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (testId && candidateId) {
            loadTestResult();
        }
    }, [testId, candidateId, searchParams]);

    const loadTestResult = async () => {
        try {
            setLoading(true);
            const applicationId = searchParams.get('application_id');
            const resultId = searchParams.get('result_id');
            
            // Call API with application_id if available
            const response = await testApi.getCandidateResult(testId!, candidateId!, applicationId || undefined);
            
            // Handle response data structure - API may return data in 'data' field
            const resultData = response.data || response;
            
            // Map backend data to frontend expected format
            const mappedResult = {
                ...resultData,
                test_id: resultData.test_id || testId,
                test_name: resultData.test_name || 'Test',
                candidate_id: resultData.candidate_id || candidateId,
                candidate_name: resultData.candidate_name || resultData.full_name || 'Unknown Candidate',
                score: resultData.percentage_score || resultData.score || 0,
                status: resultData.status || 'COMPLETED',
                submitted_at: resultData.completed_at || resultData.submitted_at || new Date().toISOString(),
                questions: resultData.questions || [],
                answers: resultData.answers || resultData.candidate_answers || {}
            };
            
            setTestResult(mappedResult);
        } catch (err) {
            setError('Failed to load test result details');
            console.error('Error loading test result:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="text-left">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg text-gray-500">Loading test result...</div>
                </div>
            </div>
        );
    }

    if (error || !testResult) {
        return (
            <div className="text-left">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="text-lg text-red-500 mb-4">{error || 'Test result not found'}</div>
                        <button 
                            onClick={() => navigate(-1)}
                            className="text-[#007BFF] hover:underline"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="text-left">
            <div className="flex items-center mb-6">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                    <FiArrowLeft className="w-6 h-6" />
                </button>
                <div className="ml-4">
                    <h2 className="text-2xl font-bold text-gray-800">{testResult.candidate_name}'s Test Result</h2>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>Score: <span className="font-semibold">{testResult.score}%</span></span>
                        <span>Status: <span className="font-semibold">{testResult.status}</span></span>
                        <span>Submitted: <span className="font-semibold">{formatDate(testResult.submitted_at)}</span></span>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg border shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold text-gray-700">{testResult.test_name} - Questions & Answers</h3>
                    <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-green-600">
                            <FiCheckCircle size={16} />
                            <span>Correct</span>
                        </div>
                        <div className="flex items-center gap-1 text-red-600">
                            <FiXCircle size={16} />
                            <span>Incorrect</span>
                        </div>
                    </div>
                </div>
                <div className="space-y-8">
                    {testResult.questions && testResult.questions.length > 0 ? testResult.questions.map((question, index) => {
                        const questionId = question.question_id || question.id;
                        const userAnswer = testResult.answers[questionId];
                        const isCorrect = userAnswer === question.correct_answer;
                        
                        return (
                            <div key={questionId} className="border rounded-lg p-6 bg-gray-50">
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="font-semibold text-gray-800 flex-1">
                                        {index + 1}. {question.question_text}
                                    </h4>
                                    <div className="flex items-center gap-3 ml-4">
                                        <span className={`px-3 py-1 text-sm font-semibold rounded-full flex items-center gap-1 ${
                                            isCorrect 
                                                ? 'bg-green-100 text-green-700' 
                                                : 'bg-red-100 text-red-700'
                                        }`}>
                                            {isCorrect ? (
                                                <>
                                                    <FiCheckCircle size={14} />
                                                    Correct
                                                </>
                                            ) : (
                                                <>
                                                    <FiXCircle size={14} />
                                                    Incorrect
                                                </>
                                            )}
                                        </span>
                                        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                            {question.points} pts
                                        </span>
                                    </div>
                                </div>
                                
                                {question.question_type === 'MULTIPLE_CHOICE' ? (
                                    <div className="space-y-3">
                                        {(question.options || []).map((option, optionIndex) => {
                                            const isCorrect = option === question.correct_answer;
                                            const isUserAnswer = option === userAnswer;
                                            const isIncorrectUserAnswer = isUserAnswer && !isCorrect;

                                            return (
                                                <div key={optionIndex} className={`flex items-center p-3 rounded-lg border ${
                                                    isCorrect ? 'bg-green-50 border-green-200' : 
                                                    isIncorrectUserAnswer ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
                                                }`}>
                                                    <span className="font-medium mr-3 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                                                        {String.fromCharCode(65 + optionIndex)}
                                                    </span>
                                                    <span className={`flex-1 font-medium ${
                                                        isCorrect ? 'text-green-700' : isIncorrectUserAnswer ? 'text-red-700' : 'text-gray-700'
                                                    }`}>{option}</span>
                                                    {isCorrect && (
                                                        <span className="ml-2 text-green-600 font-semibold flex items-center gap-1">
                                                            <FiCheckCircle size={16} />
                                                            Correct
                                                        </span>
                                                    )}
                                                    {isIncorrectUserAnswer && (
                                                        <span className="ml-2 text-red-600 font-semibold flex items-center gap-1">
                                                            <FiXCircle size={16} />
                                                            Your Answer
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="p-4 border rounded-lg bg-white">
                                            <p className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-2">
                                                {isCorrect ? (
                                                    <FiCheckCircle className="text-green-600" size={16} />
                                                ) : (
                                                    <FiXCircle className="text-red-600" size={16} />
                                                )}
                                                Candidate's Answer:
                                            </p>
                                            <p className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                                                {userAnswer || 'No answer provided'}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                            <p className="text-sm font-medium text-green-600 mb-2 flex items-center gap-2">
                                                <FiCheckCircle size={16} />
                                                Correct Answer:
                                            </p>
                                            <p className="text-green-700 font-medium">{question.correct_answer}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    }) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500">No questions found for this test result.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TestResultDetails; 