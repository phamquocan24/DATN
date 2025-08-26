import React, { useState, useEffect, useCallback } from 'react';
import { FiX, FiPlus, FiTrash2, FiZap } from 'react-icons/fi';
import testApi from '../../services/testApi';
import hrApi from '../../services/hrApi';
import { getCompanyId } from '../../services/tokenUtils';
import { handleApiError } from '../../utils/errorHandler';

export interface Question {
    question_id?: string;
    question_text: string;
    question_type: 'MULTIPLE_CHOICE' | 'ESSAY' | 'TRUE_FALSE';
    options: string[];
    correct_answer: string;
    points: number;
    time_limit_seconds?: number;
    explanation?: string;
    order_index?: number;
}

export interface TestFormData {
    job_id: string;
    test_name: string;
    test_description: string;
    test_type: 'MULTIPLE_CHOICE' | 'ESSAY' | 'MIXED';
    time_limit: number;
    passing_score: number;
    is_active: boolean;
}

interface Job {
    job_id: string;
    title: string;
    company?: {
        name: string;
    };
    company_name?: string;
}

interface TestFormBaseProps {
    initialData?: Partial<TestFormData>;
    initialQuestions?: Question[];
    onSubmit: (formData: TestFormData, questions: Question[]) => Promise<void>;
    onCancel: () => void;
    submitLabel: string;
    title: string;
    isModal?: boolean;
}

const TestFormBase: React.FC<TestFormBaseProps> = ({
    initialData = {},
    initialQuestions = [],
    onSubmit,
    onCancel,
    submitLabel,
    title,
    isModal = false
}) => {
    const [loading, setLoading] = useState(false);
    const [loadingJobs, setLoadingJobs] = useState(false);
    const [generatingQuestions, setGeneratingQuestions] = useState(false);
    const [jobs, setJobs] = useState<Job[]>([]);



    const [formData, setFormData] = useState<TestFormData>(() => ({
        job_id: initialData?.job_id || '',
        test_name: initialData?.test_name || '',
        test_description: initialData?.test_description || '',
        test_type: initialData?.test_type || 'MULTIPLE_CHOICE' as const,
        time_limit: initialData?.time_limit || 60,
        passing_score: initialData?.passing_score || 70,
        is_active: initialData?.is_active !== undefined ? initialData.is_active : true
    }));
    const [questions, setQuestions] = useState<Question[]>(() => 
        initialQuestions && Array.isArray(initialQuestions) ? [...initialQuestions] : []
    );
    const [currentQuestion, setCurrentQuestion] = useState<Question>({
        question_text: '',
        question_type: 'MULTIPLE_CHOICE',
        options: ['', '', '', ''],
        correct_answer: '',
        points: 5
    });

    // Memoize loadJobs function to prevent re-creation on every render
    const loadJobs = useCallback(async () => {
        try {
            setLoadingJobs(true);
            
            // Get company ID from user token
            const companyId = getCompanyId();
            if (!companyId) {
                throw new Error('No company ID found. Please contact administrator.');
            }
            
            const response = await hrApi.getJobsByCompany(companyId);
            const jobsArray = response?.data || response?.jobs || (Array.isArray(response) ? response : []);
            setJobs(jobsArray);
        } catch (error) {
            console.error('Error loading jobs:', error);
            setJobs([]);
        } finally {
            setLoadingJobs(false);
        }
    }, []);

    useEffect(() => {
        loadJobs();
    }, [loadJobs]);

    // Update form data when initialData changes (only if different)
    useEffect(() => {
        const newFormData = {
            job_id: initialData?.job_id || '',
            test_name: initialData?.test_name || '',
            test_description: initialData?.test_description || '',
            test_type: initialData?.test_type || 'MULTIPLE_CHOICE' as const,
            time_limit: initialData?.time_limit || 60,
            passing_score: initialData?.passing_score || 70,
            is_active: initialData?.is_active !== undefined ? initialData.is_active : true
        };
        
        // Only update if data actually changed
        setFormData(prevData => {
            if (JSON.stringify(prevData) !== JSON.stringify(newFormData)) {
                return newFormData;
            }
            return prevData;
        });
    }, [
        initialData?.job_id,
        initialData?.test_name,
        initialData?.test_description,
        initialData?.test_type,
        initialData?.time_limit,
        initialData?.passing_score,
        initialData?.is_active
    ]);

    // Update questions when initialQuestions changes (only if different and has data)
    useEffect(() => {
        if (initialQuestions && Array.isArray(initialQuestions) && initialQuestions.length > 0) {
            console.log('useEffect: initialQuestions changed with data:', initialQuestions);
            setQuestions(prevQuestions => {
                const questionsString = JSON.stringify(prevQuestions);
                const newQuestionsString = JSON.stringify(initialQuestions);
                
                if (questionsString !== newQuestionsString) {
                    console.log('useEffect: Updating questions from initialQuestions');
                    return [...initialQuestions];
                }
                console.log('useEffect: No change, keeping existing questions');
                return prevQuestions;
            });
        } else {
            console.log('useEffect: initialQuestions is empty or undefined, skipping update');
        }
    }, [initialQuestions]);



    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    }, []);

    const handleQuestionChange = useCallback((field: keyof Question, value: any) => {
        setCurrentQuestion(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleOptionChange = useCallback((index: number, value: string) => {
        setCurrentQuestion(prev => {
            const newOptions = [...prev.options];
            newOptions[index] = value;
            return { ...prev, options: newOptions };
        });
    }, []);

    const addQuestion = useCallback(() => {
        if (!currentQuestion.question_text.trim()) {
            alert('Please enter a question text');
            return;
        }

        if (currentQuestion.question_type === 'MULTIPLE_CHOICE') {
            const filledOptions = currentQuestion.options.filter(opt => opt.trim() !== '');
            if (filledOptions.length < 2) {
                alert('Please provide at least 2 options for multiple choice questions');
                return;
            }
            if (!currentQuestion.correct_answer.trim()) {
                alert('Please select the correct answer');
                return;
            }
        }

        setQuestions(prev => [...prev, { ...currentQuestion }]);
        setCurrentQuestion({
            question_text: '',
            question_type: 'MULTIPLE_CHOICE',
            options: ['', '', '', ''],
            correct_answer: '',
            points: 5
        });
    }, [currentQuestion]);

    const removeQuestion = useCallback((index: number) => {
        setQuestions(prev => prev.filter((_, i) => i !== index));
    }, []);

    const editQuestion = useCallback((index: number) => {
        setQuestions(prev => {
            setCurrentQuestion(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    }, []);

    const generateAIQuestions = useCallback(async () => {
        if (!formData.job_id) {
            alert('Please select a job first to generate AI questions');
            return;
        }

        if (generatingQuestions) {
            console.log('Already generating questions, skipping...');
            return;
        }

        try {
            setGeneratingQuestions(true);
            const result = await testApi.generateInterviewQuestions({
                job_id: formData.job_id
            });

            console.log('AI Generation Result:', result);
            console.log('Questions saved:', result?.questions_saved);

            if (result && result.questions_saved && Array.isArray(result.questions_saved)) {
                const aiQuestions: Question[] = result.questions_saved.map((q: any) => ({
                    question_text: q.question_text || 'Generated question',
                    question_type: 'ESSAY' as const,
                    options: [],
                    correct_answer: '',
                    points: 5
                }));

                if (aiQuestions.length > 0) {
                    console.log('Setting AI questions:', aiQuestions);
                    console.log('Current questions before:', questions);
                    setQuestions(prev => {
                        const newQuestions = [...prev, ...aiQuestions];
                        console.log('New questions after:', newQuestions);
                        return newQuestions;
                    });
                    alert(`Generated ${aiQuestions.length} AI questions successfully!`);
                } else {
                    throw new Error('No valid questions received from AI service');
                }
            } else {
                console.warn('Unexpected AI response format:', result);
                throw new Error('Invalid response format from AI service');
            }
        } catch (err: any) {
            handleApiError('Generate AI Questions', err, true);
        } finally {
            setGeneratingQuestions(false);
        }
    }, [formData.job_id, generatingQuestions]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.job_id) {
            alert('Please select a job');
            return;
        }

        if (!formData.test_name.trim()) {
            alert('Please enter test name');
            return;
        }

        if (!formData.test_description.trim()) {
            alert('Please enter test description');
            return;
        }

        try {
            setLoading(true);
            await onSubmit(formData, questions);
        } catch (err: any) {
            handleApiError('Submit Test', err, true);
        } finally {
            setLoading(false);
        }
    }, [formData, questions, onSubmit]);

    const handleClose = useCallback(() => {
        // Reset form
        setFormData({
            job_id: '',
            test_name: '',
            test_description: '',
            test_type: 'MULTIPLE_CHOICE',
            time_limit: 60,
            passing_score: 70,
            is_active: true
        });
        setQuestions([]);
        setCurrentQuestion({
            question_text: '',
            question_type: 'MULTIPLE_CHOICE',
            options: ['', '', '', ''],
            correct_answer: '',
            points: 5
        });
        onCancel();
    }, [onCancel]);

    const containerClass = isModal 
        ? "bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col text-left"
        : "bg-white rounded-lg border shadow-sm text-left";

    const headerClass = isModal
        ? "flex justify-between items-center p-6 border-b bg-white rounded-t-lg flex-shrink-0"
        : "flex justify-between items-center mb-6";

    const contentClass = isModal
        ? "flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        : "";

    const formClass = isModal ? "p-6 space-y-6" : "p-6 space-y-6";

    const footerClass = isModal
        ? "flex justify-end gap-4 border-t p-6 bg-white rounded-b-lg flex-shrink-0 mb-4 pr-4"
        : "flex justify-end gap-4 border-t pt-6 mb-4 pr-4";

    return (
        <div className={containerClass}>
            {/* Header - only show for modal */}
            {isModal && (
                <div className={headerClass}>
                    <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
                    <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <FiX className="w-6 h-6" />
                    </button>
                </div>
            )}

            {/* Scrollable Content */}
            <div className={contentClass}>
                <form id="test-form" onSubmit={handleSubmit} className={formClass}>
                    {/* Basic Test Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-black mb-2">
                                Select Job <span className="text-red-500">*</span>
                            </label>
                            {loadingJobs ? (
                                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                                    Loading jobs...
                                </div>
                            ) : (
                                <select
                                    name="job_id"
                                    value={formData.job_id}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Select a job</option>
                                    {jobs.map((job) => (
                                        <option key={job.job_id} value={job.job_id}>
                                            {job.title} - {job.company?.name || job.company_name || 'Company'}
                                        </option>
                                    ))}
                                </select>
                            )}
                            {!loadingJobs && jobs.length === 0 && (
                                <p className="text-sm text-gray-500 mt-1">
                                    No jobs available. Please create a job first.
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-black mb-2">
                                Test Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="test_name"
                                value={formData.test_name}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                    </div>

                    <div>
                                                <label className="block text-sm font-medium text-black mb-2">
                             Test Description <span className="text-red-500">*</span>
                         </label>
                         <textarea
                             name="test_description"
                             value={formData.test_description}
                             onChange={handleInputChange}
                             rows={3}
                             required
                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                             placeholder="Enter test description..."
                         />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-black mb-2">
                                Test Type
                            </label>
                            <select
                                name="test_type"
                                value={formData.test_type}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                                <option value="ESSAY">Essay</option>
                                <option value="MIXED">Mixed</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-black mb-2">
                                Time Limit (minutes)
                            </label>
                            <input
                                type="number"
                                name="time_limit"
                                value={formData.time_limit}
                                onChange={handleInputChange}
                                min="1"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-black mb-2">
                                Passing Score (%)
                            </label>
                            <input
                                type="number"
                                name="passing_score"
                                value={formData.passing_score}
                                onChange={handleInputChange}
                                min="0"
                                max="100"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="is_active"
                            checked={formData.is_active}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-black">
                            Test is active
                        </label>
                    </div>

                    {/* Questions Section */}
                    <div className="border-t pt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-800">
                                Questions ({questions.length})
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={generateAIQuestions}
                                    disabled={generatingQuestions || !formData.job_id}
                                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={!formData.job_id ? 'Please select a job first' : 'Generate questions using AI'}
                                >
                                    <FiZap /> {generatingQuestions ? 'Generating...' : 'AI Generate'}
                                </button>
                            </div>
                        </div>

                        {/* Add New Question Form */}
                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                            <h4 className="font-medium text-gray-700 mb-4">Add New Question</h4>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-black mb-2">Question Text</label>
                                    <textarea
                                        value={currentQuestion.question_text}
                                        onChange={(e) => handleQuestionChange('question_text', e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter your question here..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-black mb-2">Question Type</label>
                                        <select
                                            value={currentQuestion.question_type}
                                            onChange={(e) => handleQuestionChange('question_type', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                                            <option value="ESSAY">Essay</option>
                                            <option value="TRUE_FALSE">True/False</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-black mb-2">Points</label>
                                        <input
                                            type="number"
                                            value={currentQuestion.points}
                                            onChange={(e) => handleQuestionChange('points', Number(e.target.value))}
                                            min="1"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {currentQuestion.question_type === 'MULTIPLE_CHOICE' && (
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-black">Options:</label>
                                        {currentQuestion.options.map((option, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    placeholder={`Option ${index + 1}`}
                                                    value={option}
                                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                />
                                                <input
                                                    type="radio"
                                                    name="correct_answer"
                                                    checked={currentQuestion.correct_answer === option}
                                                    onChange={() => handleQuestionChange('correct_answer', option)}
                                                    className="w-4 h-4 text-blue-600"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {currentQuestion.question_type === 'ESSAY' && (
                                    <div>
                                        <label className="block text-sm font-medium text-black mb-2">Sample Answer:</label>
                                        <textarea
                                            placeholder="Enter the expected answer or key points"
                                            value={currentQuestion.correct_answer}
                                            onChange={(e) => handleQuestionChange('correct_answer', e.target.value)}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={addQuestion}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-green-700"
                                >
                                    <FiPlus /> Add Question
                                </button>
                            </div>
                        </div>

                        {/* Questions List */}
                        {questions.length > 0 && (
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-700">Added Questions</h4>
                                {questions.map((question, index) => (
                                    <div key={index} className="border rounded-lg p-4 bg-white">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-medium text-gray-700">
                                                Question {index + 1} ({question.question_type}) - {question.points} points
                                            </span>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => editQuestion(index)}
                                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeQuestion(index)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    <FiTrash2 />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-gray-600 text-sm">{question.question_text}</p>
                                        {question.question_type === 'MULTIPLE_CHOICE' && (
                                            <div className="mt-2">
                                                <p className="text-xs text-gray-500">Options:</p>
                                                <ul className="text-xs text-gray-600 ml-4">
                                                    {question.options.filter(opt => opt.trim()).map((option, optIndex) => (
                                                        <li key={optIndex} className={option === question.correct_answer ? 'font-bold text-green-600' : ''}>
                                                            {option} {option === question.correct_answer && '✓'}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </form>
            </div>

            {/* Fixed Footer */}
            <div className={footerClass}>
                <button
                    type="button"
                    onClick={handleClose}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    form="test-form"
                    disabled={loading || loadingJobs || jobs.length === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={jobs.length === 0 ? 'No jobs available to create test for' : ''}
                >
                    {loading ? 'Processing...' : submitLabel}
                </button>
            </div>
        </div>
    );
};

export default TestFormBase;
