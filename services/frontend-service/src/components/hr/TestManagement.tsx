import React from 'react';
import { FiFilter, FiChevronDown, FiSearch } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import calendarIcon from '../../assets/scheme.png';

interface Test {
    id: number;
    title: string;
    duration: string;
    questions: string;
    status: 'Opening' | 'Closed';
    datePosted: string;
    dueDate: string;
}

const TestManagement: React.FC = () => {
    const navigate = useNavigate();
    const stats = [
        { value: 76, label: "New candidates to tests", color: "bg-yellow-400" },
        { value: 3, label: "Active tests", color: "bg-green-400" },
        { value: "78%", label: "Avg. Completion", color: "bg-[#007BFF]" }
    ];

    const tests: Test[] = [
        { id: 1, title: 'Social Media Assistant', duration: '1 hours', questions: '60 sentences', status: 'Opening', datePosted: '12 July, 2021', dueDate: '12 July, 2021' },
        { id: 2, title: 'Senior Designer', duration: '50 minites', questions: '60 sentences', status: 'Closed', datePosted: '12 July, 2021', dueDate: '12 July, 2021' },
        { id: 3, title: 'Visual Designer', duration: '10 minites', questions: '60 sentences', status: 'Opening', datePosted: '12 July, 2021', dueDate: '12 July, 2021' },
        { id: 4, title: 'Data Sience', duration: '30 minites', questions: '60 sentences', status: 'Closed', datePosted: '12 July, 2021', dueDate: '12 July, 2021' },
        { id: 5, title: 'Kotlin Developer', duration: '40 minites', questions: '60 sentences', status: 'Opening', datePosted: '12 July, 2021', dueDate: '12 July, 2021' },
        { id: 6, title: 'React Developer', duration: '2 hours', questions: '60 sentences', status: 'Opening', datePosted: '12 July, 2021', dueDate: '12 July, 2021' },
    ];

    return (
        <div className="p-0 text-left">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold">Good morning, Maria</h1>
                    <p className="text-gray-500">Here is your job listings statistic report from July 19 - July 25.</p>
                </div>
                <div className="flex items-center border rounded-md px-3 py-2 cursor-pointer">
                    <span>Jul 19 - Jul 25</span>
                    <img src={calendarIcon} alt="calendar" className="ml-2 w-4 h-4" />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-8">
                {stats.map((stat, index) => (
                    <div key={index} className={`p-6 rounded-lg text-white ${stat.color} transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer`}>
                        <div className="flex items-baseline gap-2">
                            <p className="text-4xl font-bold shrink-0">{stat.value}</p>
                            <p>{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Total Tests : 19</h2>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" placeholder="Search Tests" className="w-full pl-10 pr-4 py-2 border rounded-lg" />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                        <FiFilter className="text-gray-600" />
                        <span>Filter</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg border">
                <table className="w-full">
                    <thead>
                        <tr className="border-b text-sm text-gray-500 text-left">
                            <th className="px-4 py-3 font-medium">Test Title <FiChevronDown className="inline ml-1"/></th>
                            <th className="px-4 py-3 font-medium">Duration <FiChevronDown className="inline ml-1"/></th>
                            <th className="px-4 py-3 font-medium">Questions <FiChevronDown className="inline ml-1"/></th>
                            <th className="px-4 py-3 font-medium">Test Status <FiChevronDown className="inline ml-1"/></th>
                            <th className="px-4 py-3 font-medium">Date Posted <FiChevronDown className="inline ml-1"/></th>
                            <th className="px-4 py-3 font-medium">Date Due <FiChevronDown className="inline ml-1"/></th>
                            <th className="px-4 py-3 font-medium">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tests.map(test => (
                            <tr key={test.id} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/hr/test-management/${test.id}`)}>
                                <td className="px-4 py-4 font-medium">{test.title}</td>
                                <td className="px-4 py-4">{test.duration}</td>
                                <td className="px-4 py-4">{test.questions}</td>
                                <td className="px-4 py-4">
                                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${test.status === 'Opening' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>{test.status}</span>
                                </td>
                                <td className="px-4 py-4">{test.datePosted}</td>
                                <td className="px-4 py-4">{test.dueDate}</td>
                                <td className="px-4 py-4">
                                    <button onClick={(e) => { e.stopPropagation(); navigate(`/hr/test-management/${test.id}`)}} className="text-[#007BFF] border border-[#007BFF] rounded-md px-3 py-1 hover:bg-blue-50">See Details</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 <div className="text-center py-4">
                    <button className="text-[#007BFF]">View All</button>
                </div>
            </div>
        </div>
    );
};

export default TestManagement; 