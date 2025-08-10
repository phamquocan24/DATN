import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiCheck, FiX } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
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
    const [testResult, setTestResult] = useState<TestResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (testId && candidateId) {
            loadTestResult();
        }
    }, [testId, candidateId]);

    const loadTestResult = async () => {
        try {
            setLoading(true);
            const response = await testApi.getCandidateResult(testId!, candidateId!);
            setTestResult(response);
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
                <h3 className="text-xl font-semibold mb-6 text-gray-700">{testResult.test_name} - Questions & Answers</h3>
                <div className="space-y-8">
                    {testResult.questions?.map((question, index) => {
                        const userAnswer = testResult.answers[question.id];
                        const isCorrect = userAnswer === question.correct_answer;
                        
                        return (
                            <div key={question.id} className="border-b pb-6 last:border-b-0">
                                <div className="flex justify-between items-start mb-4">
                                    <p className="font-semibold text-gray-800 flex-1">
                                        {index + 1}. {question.question_text}
                                    </p>
                                    <div className="flex items-center gap-2 ml-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded ${
                                            isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                            {isCorrect ? 'Correct' : 'Incorrect'}
                                        </span>
                                        <span className="text-sm text-gray-500">{question.points} pts</span>
                                    </div>
                                </div>
                                
                                {question.question_type === 'MULTIPLE_CHOICE' ? (
                                    <div className="space-y-3">
                                        {question.options.map((option, optionIndex) => {
                                            const isCorrect = option === question.correct_answer;
                                            const isUserAnswer = option === userAnswer;
                                            const isIncorrectUserAnswer = isUserAnswer && !isCorrect;

                                            return (
                                                <div key={optionIndex} className={`flex items-center p-3 rounded-lg ${
                                                    isCorrect ? 'bg-green-50 border border-green-200' : 
                                                    isIncorrectUserAnswer ? 'bg-red-50 border border-red-200' : 'border'
                                                }`}>
                                                    <span className={`font-medium ${
                                                        isCorrect ? 'text-green-700' : isIncorrectUserAnswer ? 'text-red-700' : 'text-gray-700'
                                                    }`}>{option}</span>
                                                    {isCorrect && <FiCheck className="ml-auto text-green-600" />}
                                                    {isIncorrectUserAnswer && <FiX className="ml-auto text-red-600" />}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="p-3 border rounded-lg">
                                            <p className="text-sm text-gray-600 mb-2">Candidate's Answer:</p>
                                            <p className="text-gray-800">{userAnswer || 'No answer provided'}</p>
                                        </div>
                                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <p className="text-sm text-green-600 mb-2">Correct Answer:</p>
                                            <p className="text-green-700">{question.correct_answer}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default TestResultDetails; 