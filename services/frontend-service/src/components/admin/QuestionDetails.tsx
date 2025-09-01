import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiEdit, FiPlus, FiTrash2 } from 'react-icons/fi';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../common/Toast';
import adminApi from '../../services/adminApi';




const QuestionDetails: React.FC<{ test: any, onBack: () => void }> = ({ test, onBack }) => {
    const { toastState, showToast, hideToast } = useToast();
    const [testDetails, setTestDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState<any>({
        test_name: '',
        test_description: '',
        test_type: '',
        time_limit: null,
        passing_score: null,
        is_active: true,
        questions: []
    });
    const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
    const [editQuestionData, setEditQuestionData] = useState<any>(null);

    useEffect(() => {
        const fetchTestDetails = async () => {
            try {
                setLoading(true);
                const response = await adminApi.getTestDetails(test.test_id, true);
                console.log('Test Details API Response:', response);
                
                if (response.success) {
                    console.log('Test Details Data:', response.data);
                    console.log('Questions:', response.data?.questions);
                    setTestDetails(response.data);
                    
                    // Initialize edit form with API data
                    setEditFormData({
                        test_name: response.data?.test_name,
                        test_description: response.data?.test_description || response.data?.description,
                        test_type: response.data?.test_type,
                        time_limit: response.data?.time_limit || response.data?.duration_minutes,
                        passing_score: parseFloat(response.data?.passing_score),
                        is_active: response.data?.is_active,
                        questions: response.data?.questions
                    });
                } else {
                    console.error('API returned error:', response.message);
                    setError(response.message || 'Failed to load test details');
                }
            } catch (err) {
                console.error('Error fetching test details:', err);
                setError('Failed to load test details');
            } finally {
                setLoading(false);
            }
        };

        if (test.test_id) {
            fetchTestDetails();
        }
    }, [test.test_id]);

    const handleEditSave = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Transform questions to match API format
            const transformedQuestions = editFormData.questions.map((q: any) => ({
                question_text: q.question_text,
                question_type: q.question_type || 'MULTIPLE_CHOICE',
                options: q.options ? q.options.map((opt: any) => 
                    typeof opt === 'string' ? opt : opt.option_text
                ) : [],
                correct_answer: String(q.correct_answer || ''),
                points: q.points || 1
            }));
            
            const updateData = {
                test_name: editFormData.test_name,
                test_description: editFormData.test_description,
                test_type: editFormData.test_type,
                time_limit: editFormData.time_limit,
                passing_score: editFormData.passing_score,
                is_active: editFormData.is_active,
                questions: transformedQuestions
            };
            
            // Updating test with validated data
            const response = await adminApi.updateTest(test.test_id, updateData);
            // Update response received
            
            if (response.success) {
                showToast('Test updated successfully!', 'success');
                // Refresh test details after update
                const updatedResponse = await adminApi.getTestDetails(test.test_id, true);
                if (updatedResponse.success) {
                    setTestDetails(updatedResponse.data);
                    // Update form data with fresh data
                    setEditFormData({
                        test_name: updatedResponse.data?.test_name,
                        test_description: updatedResponse.data?.test_description || updatedResponse.data?.description,
                        test_type: updatedResponse.data?.test_type,
                        time_limit: updatedResponse.data?.time_limit || updatedResponse.data?.duration_minutes,
                        passing_score: parseFloat(updatedResponse.data?.passing_score),
                        is_active: updatedResponse.data?.is_active,
                        questions: updatedResponse.data?.questions
                    });
                }
                setIsEditing(false);
            } else {
                const errorMessage = response.message || 'Failed to update test';
                setError(errorMessage);
                showToast(errorMessage, 'error');
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || 'Failed to update test. Please try again.';
            setError(errorMessage);
            showToast(errorMessage, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditCancel = () => {
        // Reset form to current test data
        if (testDetails) {
            setEditFormData({
                test_name: testDetails.test_name,
                test_description: testDetails.test_description || testDetails.description,
                test_type: testDetails.test_type,
                time_limit: testDetails.time_limit || testDetails.duration_minutes,
                passing_score: parseFloat(testDetails.passing_score),
                is_active: testDetails.is_active,
                questions: testDetails.questions
            });
        }
        setIsEditing(false);
        setError(null);
    };

    const handleEditQuestion = (question: any) => {
        setEditingQuestionId(question.question_id);
        
        // Ensure we have proper options format
        let formattedOptions = [];
        if (question.options && question.options.length > 0) {
            formattedOptions = question.options.map((opt: any) => 
                typeof opt === 'string' ? opt : opt.option_text
            );
        } else if ((question.question_type === 'MULTIPLE_CHOICE' || question.question_type === 'SINGLE_CHOICE') && formattedOptions.length === 0) {
            // Add default options for multiple choice
            formattedOptions = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
        } else if (question.question_type === 'TRUE_FALSE') {
            formattedOptions = ['True', 'False'];
        }
        
        setEditQuestionData({
            question_text: question.question_text,
            question_type: question.question_type,
            points: question.points,
            options: formattedOptions,
            correct_answer: question.correct_answer
        });
    };

    const handleSaveQuestion = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Update question in editFormData
            const updatedQuestions = editFormData.questions.map((q: any) => 
                q.question_id === editingQuestionId ? {
                    ...q,
                    question_text: editQuestionData.question_text,
                    question_type: editQuestionData.question_type,
                    points: editQuestionData.points,
                    options: editQuestionData.options,
                    correct_answer: editQuestionData.correct_answer
                } : q
            );
            
            setEditFormData({
                ...editFormData,
                questions: updatedQuestions
            });
            
            // Update testDetails for immediate UI refresh
            const updatedTestDetails = {
                ...testDetails,
                questions: updatedQuestions
            };
            setTestDetails(updatedTestDetails);
            
            setEditingQuestionId(null);
            setEditQuestionData(null);
        } catch (err) {
            console.error('Error saving question:', err);
            setError('Failed to save question');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEditQuestion = () => {
        setEditingQuestionId(null);
        setEditQuestionData(null);
    };

    const handleQuestionTypeChange = (newType: string) => {
        let newOptions = [];
        let newCorrectAnswer = '';
        
        if (newType === 'MULTIPLE_CHOICE' || newType === 'SINGLE_CHOICE') {
            newOptions = editQuestionData.options.length > 0 ? editQuestionData.options : ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
            newCorrectAnswer = newOptions[0];
        } else if (newType === 'TRUE_FALSE') {
            newOptions = ['True', 'False'];
            newCorrectAnswer = 'True';
        } else if (newType === 'ESSAY' || newType === 'CODE') {
            newOptions = [];
            newCorrectAnswer = editQuestionData.correct_answer || '';
        }
        
        setEditQuestionData({
            ...editQuestionData,
            question_type: newType,
            options: newOptions,
            correct_answer: newCorrectAnswer
        });
    };

    const handleAddOption = () => {
        const newOptions = [...editQuestionData.options, `Option ${editQuestionData.options.length + 1}`];
        setEditQuestionData({
            ...editQuestionData,
            options: newOptions
        });
    };

    const handleRemoveOption = (index: number) => {
        if (editQuestionData.options.length <= 2) return; // Minimum 2 options
        
        const removedOption = editQuestionData.options[index];
        const newOptions = editQuestionData.options.filter((_: any, i: number) => i !== index);
        
        // Update correct answer if it was the removed option
        let newCorrectAnswer = editQuestionData.correct_answer;
        if (newCorrectAnswer === removedOption) {
            newCorrectAnswer = newOptions[0] || '';
        }
        
        setEditQuestionData({
            ...editQuestionData,
            options: newOptions,
            correct_answer: newCorrectAnswer
        });
    };

    const handleUpdateOption = (index: number, newText: string) => {
        const oldText = editQuestionData.options[index];
        const newOptions = [...editQuestionData.options];
        newOptions[index] = newText;
        
        // Update correct answer if it was pointing to the old text
        let newCorrectAnswer = editQuestionData.correct_answer;
        if (newCorrectAnswer === oldText) {
            newCorrectAnswer = newText;
        }
        
        setEditQuestionData({
            ...editQuestionData,
            options: newOptions,
            correct_answer: newCorrectAnswer
        });
    };

    if (loading) {
        return <div className="text-center py-8">Loading test details...</div>;
    }

    if (error) {
        return <div className="text-center py-8 text-red-500">{error}</div>;
    }

    const questionsData = testDetails?.questions || [];

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
                        <FiArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">{test.test_name}</h2>
                        <p className="text-sm text-gray-500">Test for {test.title || 'Unknown Position'} - {test.company_name || 'Unknown Company'}</p>
                    </div>
                </div>
                {!isEditing ? (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-[#007BFF] text-[#007BFF] rounded-lg text-sm font-medium hover:bg-blue-50"
                    >
                    <FiEdit />
                        Edit Test
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button 
                            onClick={handleEditCancel}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleEditSave}
                            className="px-4 py-2 bg-[#007BFF] text-white rounded-lg text-sm font-medium hover:bg-blue-600"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                </button>
                    </div>
                )}
            </div>

            {/* Edit Form */}
            {isEditing && (
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit Test Details</h3>
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
                            <input
                                type="text"
                                value={editFormData.test_name}
                                onChange={(e) => setEditFormData({...editFormData, test_name: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007BFF] focus:border-[#007BFF]"
                                placeholder="Enter test name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Test Type</label>
                            <select
                                value={editFormData.test_type}
                                onChange={(e) => setEditFormData({...editFormData, test_type: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007BFF] focus:border-[#007BFF]"
                            >
                                <option value="MULTIPLE_CHOICE">Multiple Choice Test</option>
                                <option value="TRUE_FALSE">True/False Test</option>
                                <option value="ESSAY">Essay Test</option>
                                <option value="CODE">Coding Test</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time Limit (minutes)</label>
                            <input
                                type="number"
                                value={editFormData.time_limit}
                                onChange={(e) => setEditFormData({...editFormData, time_limit: parseInt(e.target.value) || null})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007BFF] focus:border-[#007BFF]"
                                min="1"
                                max="480"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Passing Score (%)</label>
                            <input
                                type="number"
                                value={editFormData.passing_score}
                                onChange={(e) => setEditFormData({...editFormData, passing_score: parseFloat(e.target.value) || null})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007BFF] focus:border-[#007BFF]"
                                min="0"
                                max="100"
                                step="0.1"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={editFormData.is_active ? 'active' : 'inactive'}
                                onChange={(e) => setEditFormData({...editFormData, is_active: e.target.value === 'active'})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007BFF] focus:border-[#007BFF]"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Questions</label>
                            <input
                                type="text"
                                value={editFormData.questions?.length || 0}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                value={editFormData.test_description}
                                onChange={(e) => setEditFormData({...editFormData, test_description: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007BFF] focus:border-[#007BFF]"
                                rows={3}
                                placeholder="Test description..."
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Questions List */}
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800">Total Questions: {questionsData.length}</h3>
                        <div className="text-sm text-gray-600">
                            <p>Time Limit: {test?.time_limit || testDetails?.time_limit || testDetails?.duration_minutes || 'N/A'} minutes</p>
                            <p>Passing Score: {testDetails?.passing_score ? parseFloat(testDetails.passing_score).toFixed(1) : 'N/A'}%</p>
                        </div>
                    </div>
                    
                    {questionsData.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No questions found for this test</div>
                    ) : (
                    <ul className="space-y-4">
                            {questionsData.map((question: any, index: number) => (
                                <li key={question.question_id || index} className="p-4 border rounded-lg flex justify-between items-start hover:bg-gray-50 transition-colors">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-800 mb-2">{index + 1}. {question.question_text}</p>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-sm text-white px-2 py-0.5 rounded-full bg-blue-400">
                                                {question.question_type || 'Multiple Choice'}
                                            </span>
                                            <span className="text-sm text-gray-600">Points: {question.points || 1}</span>
                                        </div>
                                        {question.options && question.options.length > 0 && (
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-600 mb-1">Options:</p>
                                                <ul className="list-disc list-inside text-sm text-gray-700">
                                                    {question.options.map((option: any, optIndex: number) => {
                                                        // Handle both string array and object array formats
                                                        const optionText = typeof option === 'string' ? option : option.option_text;
                                                        const isCorrect = typeof option === 'string' 
                                                            ? optionText === question.correct_answer 
                                                            : option.is_correct;
                                                        
                                                        return (
                                                            <li key={optIndex} className={isCorrect ? 'text-green-600 font-medium' : ''}>
                                                                {optionText} {isCorrect && '(Correct)'}
                                                            </li>
                                                        );
                                                    })}
                                                </ul>
                                            </div>
                                        )}
                                </div>
                                                                     {isEditing && (
                                         <div className="flex items-center gap-2 ml-4">
                                             <button 
                                                 onClick={() => handleEditQuestion(question)}
                                                 className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                                 title="Edit question"
                                             >
                                                 <FiEdit className="w-4 h-4" />
                                </button>
                                         </div>
                                     )}
                            </li>
                        ))}
                    </ul>
                    )}
                                </div>
             </div>

             {/* Edit Question Modal */}
             {editingQuestionId && editQuestionData && (
                 <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                     <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-90vh overflow-y-auto">
                         <h3 className="text-lg font-semibold text-gray-800 mb-4">Edit Question</h3>
                         {error && (
                             <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                 {error}
                             </div>
                         )}
                         
                         <div className="space-y-4">
                             <div>
                                 <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                                 <textarea
                                     value={editQuestionData.question_text}
                                     onChange={(e) => setEditQuestionData({...editQuestionData, question_text: e.target.value})}
                                     className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007BFF] focus:border-[#007BFF]"
                                     rows={3}
                                     placeholder="Enter question text"
                                 />
                             </div>
                             
                             <div className="grid grid-cols-2 gap-4">
                                 <div>
                                     <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                                     <select
                                         value={editQuestionData.question_type}
                                         onChange={(e) => handleQuestionTypeChange(e.target.value)}
                                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007BFF] focus:border-[#007BFF]"
                                     >
                                                                                 <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                                        <option value="SINGLE_CHOICE">Single Choice</option>
                                        <option value="TRUE_FALSE">True/False</option>
                                        <option value="ESSAY">Essay</option>
                                        <option value="CODE">Coding</option>
                                     </select>
                                 </div>
                                 <div>
                                     <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                                     <input
                                         type="number"
                                         value={editQuestionData.points}
                                         onChange={(e) => setEditQuestionData({...editQuestionData, points: parseInt(e.target.value) || 1})}
                                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007BFF] focus:border-[#007BFF]"
                                         min="1"
                                         max="100"
                                     />
                                 </div>
                             </div>

                             {(editQuestionData.question_type === 'MULTIPLE_CHOICE' || editQuestionData.question_type === 'SINGLE_CHOICE' || editQuestionData.question_type === 'TRUE_FALSE') && (
                                 <div>
                                     <div className="flex justify-between items-center mb-2">
                                         <label className="block text-sm font-medium text-gray-700">Options</label>
                                         {(editQuestionData.question_type === 'MULTIPLE_CHOICE' || editQuestionData.question_type === 'SINGLE_CHOICE') && (
                                             <button
                                                 type="button"
                                                 onClick={handleAddOption}
                                                 className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
                                             >
                                                 <FiPlus className="w-3 h-3" />
                                                 Add Option
                                             </button>
                                         )}
                                     </div>
                                     <div className="space-y-2">
                                         {editQuestionData.options.map((optionText: string, index: number) => {
                                             const isCorrect = optionText === editQuestionData.correct_answer;
                                             
                                             return (
                                                 <div key={index} className="flex items-center gap-2">
                                                     <input
                                                         type="radio"
                                                         name="correct_answer"
                                                         checked={isCorrect}
                                                         onChange={() => setEditQuestionData({
                                                             ...editQuestionData, 
                                                             correct_answer: optionText
                                                         })}
                                                         className="text-[#007BFF] focus:ring-[#007BFF]"
                                                     />
                                                     <input
                                                         type="text"
                                                         value={optionText}
                                                         onChange={(e) => handleUpdateOption(index, e.target.value)}
                                                         className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007BFF] focus:border-[#007BFF]"
                                                         placeholder={`Option ${index + 1}`}
                                                     />
                                                     {(editQuestionData.question_type === 'MULTIPLE_CHOICE' || editQuestionData.question_type === 'SINGLE_CHOICE') && editQuestionData.options.length > 2 && (
                                                         <button
                                                             type="button"
                                                             onClick={() => handleRemoveOption(index)}
                                                             className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                             title="Remove option"
                                                         >
                                                             <FiTrash2 className="w-4 h-4" />
                                                         </button>
                                                     )}
                                                 </div>
                                             );
                                         })}
                                     </div>
                                     {(editQuestionData.question_type === 'MULTIPLE_CHOICE' || editQuestionData.question_type === 'SINGLE_CHOICE') && (
                                         <p className="text-xs text-gray-500 mt-1">
                                             Click the radio button to select the correct answer. Minimum 2 options required.
                                         </p>
                                     )}
                                 </div>
                             )}

                             {editQuestionData.question_type === 'ESSAY' && (
                                 <div>
                                     <label className="block text-sm font-medium text-gray-700 mb-1">Expected Answer / Grading Criteria</label>
                                     <textarea
                                         value={editQuestionData.correct_answer}
                                         onChange={(e) => setEditQuestionData({...editQuestionData, correct_answer: e.target.value})}
                                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007BFF] focus:border-[#007BFF]"
                                         rows={4}
                                         placeholder="Enter expected answer, key points, or grading criteria for this essay question..."
                                     />
                                     <p className="text-xs text-gray-500 mt-1">
                                         Provide guidance for manual grading. This will help reviewers evaluate candidate responses consistently.
                                     </p>
                                 </div>
                             )}

                             {editQuestionData.question_type === 'CODE' && (
                                 <div>
                                     <label className="block text-sm font-medium text-gray-700 mb-1">Expected Solution / Test Cases</label>
                                     <textarea
                                         value={editQuestionData.correct_answer}
                                         onChange={(e) => setEditQuestionData({...editQuestionData, correct_answer: e.target.value})}
                                         className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#007BFF] focus:border-[#007BFF]"
                                         rows={6}
                                         placeholder="Enter expected solution, test cases, or evaluation criteria for this coding question..."
                                     />
                                     <p className="text-xs text-gray-500 mt-1">
                                         Provide expected solution, test cases, or criteria for evaluating the code. Include edge cases and performance considerations if relevant.
                                     </p>
                                 </div>
                             )}
                         </div>

                         <div className="flex justify-end gap-2 mt-6">
                             <button 
                                 onClick={handleCancelEditQuestion}
                                 className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
                             >
                                 Cancel
                             </button>
                             <button 
                                 onClick={handleSaveQuestion}
                                 className="px-4 py-2 bg-[#007BFF] text-white rounded-lg text-sm font-medium hover:bg-blue-600"
                                 disabled={loading}
                             >
                                 {loading ? 'Saving...' : 'Save Question'}
                             </button>
                         </div>
                </div>
            </div>
             )}
        
        {/* Toast Notification */}
        <Toast toastState={toastState} onClose={hideToast} />
        </>
    );
};

export default QuestionDetails; 