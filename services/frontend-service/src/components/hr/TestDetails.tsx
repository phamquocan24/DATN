import React from 'react';
import { FiArrowLeft, FiEdit, FiUser, FiBarChart2, FiCheckCircle, FiClock } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const TestDetails: React.FC = () => {
    const navigate = useNavigate();

    const candidates = [
        { name: 'John Doe', score: '85%', status: 'Passed', date: '13 July, 2021', avatar: 'https://i.pravatar.cc/40?u=1' },
        { name: 'Jane Smith', score: '65%', status: 'Failed', date: '13 July, 2021', avatar: 'https://i.pravatar.cc/40?u=2' },
    ];

    return (
        <div className="text-left">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full">
                        <FiArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Social Media Assistant Test</h2>
                        <p className="text-sm text-gray-500">Status: <span className="text-green-500 font-semibold">Opening</span></p>
                    </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-[#007BFF] text-[#007BFF] rounded-lg text-sm font-medium hover:bg-blue-50">
                    <FiEdit /> Edit Test
                </button>
            </div>

            <div className="bg-white p-6 rounded-lg border shadow-sm mb-8">
                <h3 className="text-xl font-semibold mb-4 text-gray-700">Test Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                    <div className="flex items-center gap-3">
                        <FiClock className="w-5 h-5 text-gray-400" />
                        <div>
                            <p className="text-gray-500">Duration</p>
                            <p className="font-semibold text-gray-800">1 hour</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <FiCheckCircle className="w-5 h-5 text-gray-400" />
                        <div>
                            <p className="text-gray-500">Questions</p>
                            <p className="font-semibold text-gray-800">60 sentences</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                         <p className="text-gray-500">Date Posted: <span className="font-medium text-gray-800">12 July, 2021</span></p>
                    </div>
                     <div className="flex items-center gap-3">
                         <p className="text-gray-500">Date Due: <span className="font-medium text-gray-800">12 July, 2021</span></p>
                    </div>
                </div>
                <hr className="my-6" />
                <div>
                    <h4 className="text-lg font-semibold mb-2 text-gray-700">Description</h4>
                    <p className="text-gray-600">This is a test to assess the candidate's ability in social media management, content creation, and community engagement. It consists of multiple-choice questions and a short-answer section.</p>
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
                            {candidates.map(candidate => (
                                <tr key={candidate.name} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img src={candidate.avatar} alt={candidate.name} className="w-8 h-8 rounded-full" />
                                            <span className="font-medium text-gray-800">{candidate.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium">{candidate.score}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${candidate.status === 'Passed' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{candidate.status}</span>
                                    </td>
                                    <td className="px-6 py-4">{candidate.date}</td>
                                    <td className="px-6 py-4"><button onClick={() => navigate(`results/${candidate.name.replace(/\s+/g, '-').toLowerCase()}`)} className="text-[#007BFF] border border-[#007BFF] rounded-md px-3 py-1 hover:bg-blue-50">View Answers</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TestDetails; 