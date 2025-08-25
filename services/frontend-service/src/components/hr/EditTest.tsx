import React, { useState, useEffect } from 'react';
import { FiArrowLeft } from 'react-icons/fi';
import { useNavigate, useParams } from 'react-router-dom';
import TestFormBase, { TestFormData, Question } from './TestFormBase';
import testApi from '../../services/testApi';
import { handleApiError } from '../../utils/errorHandler';

const EditTest: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(true);
    const [initialData, setInitialData] = useState<Partial<TestFormData>>({});
    const [initialQuestions, setInitialQuestions] = useState<Question[]>([]);

    useEffect(() => {
        if (id) {
            loadTestData();
        }
    }, [id]);

    const loadTestData = async () => {
        try {
            setLoading(true);
            const response = await testApi.getTestById(id!, true);
            
            setInitialData({
                test_name: response.test_name || '',
                test_description: response.test_description || response.description || '',
                test_type: response.test_type || 'MULTIPLE_CHOICE',
                time_limit: response.time_limit || response.duration_minutes || 60,
                passing_score: response.passing_score || 70,
                is_active: response.is_active !== undefined ? response.is_active : true,
                job_id: response.job_id || ''
            });

            // Load questions if they exist
            if (response.questions && Array.isArray(response.questions)) {
                const formattedQuestions = response.questions.map((q: any, index: number) => ({
                    question_id: q.question_id,
                    question_text: q.question_text || '',
                    question_type: q.question_type || 'ESSAY',
                    options: q.options || [],
                    correct_answer: q.correct_answer || '',
                    points: q.points || 5,
                    time_limit_seconds: q.time_limit_seconds || 120,
                    explanation: q.explanation || '',
                    order_index: q.order_index || index + 1
                }));
                setInitialQuestions(formattedQuestions);
            }
        } catch (err: any) {
            handleApiError('Load Test Data', err, true);
            navigate('/hr/test-management');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTest = async (formData: TestFormData, questions: Question[]) => {
        const testData = {
            test_name: formData.test_name,
            test_description: formData.test_description,
            test_type: 'TECHNICAL' as const, // Default to TECHNICAL for now
            time_limit: Number(formData.time_limit),
            passing_score: Number(formData.passing_score),
            is_active: formData.is_active,
            job_id: formData.job_id,
            questions: questions.map((q, index) => ({
                question_id: q.question_id,
                question_text: q.question_text,
                question_type: q.question_type,
                options: q.question_type === 'MULTIPLE_CHOICE' ? q.options : [],
                correct_answer: q.correct_answer,
                points: q.points,
                time_limit_seconds: q.time_limit_seconds || 120,
                explanation: q.explanation || '',
                order_index: index + 1
            }))
        };

        await testApi.updateTest(id!, testData);
        alert('Test updated successfully!');
        navigate('/hr/test-management');
    };

    const handleCancel = () => {
        navigate('/hr/test-management');
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg text-gray-500">Loading test data...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/hr/test-management')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                >
                    <FiArrowLeft /> Back to Test Management
                </button>
                <h1 className="text-2xl font-bold text-gray-800">Edit Test</h1>
            </div>

            {/* Form */}
            <TestFormBase
                initialData={initialData}
                initialQuestions={initialQuestions}
                onSubmit={handleUpdateTest}
                onCancel={handleCancel}
                submitLabel="Save Changes"
                title="Edit Test"
                isModal={false}
            />
        </div>
    );
};

export default EditTest;