import React from 'react';
import { FiArrowLeft, FiCheck, FiX } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const TestResultDetails: React.FC = () => {
    const navigate = useNavigate();

    const questions = [
        {
            question: "1. Which of the following is a primary goal of social media marketing?",
            options: [
                "A. To increase website traffic",
                "B. To build a community and engage with the audience",
                "C. To directly sell products",
                "D. All of the above"
            ],
            userAnswer: "D",
            correctAnswer: "D"
        },
        {
            question: "2. What is a key performance indicator (KPI) for measuring social media engagement?",
            options: [
                "A. Number of followers",
                "B. Likes, comments, and shares",
                "C. Website bounce rate",
                "D. Ad spend"
            ],
            userAnswer: "A",
            correctAnswer: "B"
        }
    ];

    return (
        <div className="text-left">
            <div className="flex items-center mb-6">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                    <FiArrowLeft className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-gray-800 ml-4">John Doe's Test Result</h2>
            </div>

            <div className="bg-white p-6 rounded-lg border shadow-sm">
                <h3 className="text-xl font-semibold mb-6 text-gray-700">Social Media Assistant Test - Questions & Answers</h3>
                <div className="space-y-8">
                    {questions.map((q, index) => (
                        <div key={index} className="border-b pb-6 last:border-b-0">
                            <p className="font-semibold mb-4 text-gray-800">{q.question}</p>
                            <div className="space-y-3">
                                {q.options.map(option => {
                                    const isCorrect = option.startsWith(q.correctAnswer);
                                    const isUserAnswer = option.startsWith(q.userAnswer);
                                    const isIncorrectUserAnswer = isUserAnswer && !isCorrect;

                                    return (
                                        <div key={option} className={`flex items-center p-3 rounded-lg ${
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
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TestResultDetails; 