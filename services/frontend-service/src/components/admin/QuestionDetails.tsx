import React from 'react';
import { FiArrowLeft, FiMoreHorizontal, FiEdit } from 'react-icons/fi';

// Assuming QuestionItem is defined in a shared types file or passed in a similar shape
interface QuestionItem {
    id: number;
    position: string;
    createdBy: 'HR';
    fullName: string;
    contents: string;
    status: 'Opening' | 'Closed';
    created: string;
    due: string;
}

interface Question {
    id: number;
    text: string;
    type: string;
    options?: string[];
}

const questions: Question[] = [
    { id: 1, text: "What is your greatest strength?", type: "Open-ended" },
    { id: 2, text: "Describe a challenging situation you've faced at work.", type: "Behavioral" },
    { id: 3, text: "Which of these is a JavaScript framework?", type: "Multiple Choice", options: ["React", "Laravel", "Django", "Rails"] },
    { id: 4, text: "What are your salary expectations?", type: "Open-ended" },
    { id: 5, text: "Why do you want to work for this company?", type: "Motivational" }
];


const QuestionDetails: React.FC<{ questionSet: QuestionItem, onBack: () => void }> = ({ questionSet, onBack }) => {
    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
                        <FiArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">{questionSet.position} Questions</h2>
                        <p className="text-sm text-gray-500">List of questions for the {questionSet.position} role.</p>
                    </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-[#007BFF] text-[#007BFF] rounded-lg text-sm font-medium hover:bg-blue-50">
                    <FiEdit />
                    Edit Questions
                </button>
            </div>

            {/* Questions List */}
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800">Total Questions: {questions.length}</h3>
                    </div>
                    
                    <ul className="space-y-4">
                        {questions.map((question, index) => (
                            <li key={question.id} className="p-4 border rounded-lg flex justify-between items-center hover:bg-gray-50 transition-colors">
                                <div>
                                    <p className="font-medium text-gray-800">{index + 1}. {question.text}</p>
                                    <span className="text-sm text-white px-2 py-0.5 rounded-full bg-blue-400">{question.type}</span>
                                </div>
                                <button className="text-gray-400 hover:text-gray-600">
                                    <FiMoreHorizontal />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
    );
};

export default QuestionDetails; 