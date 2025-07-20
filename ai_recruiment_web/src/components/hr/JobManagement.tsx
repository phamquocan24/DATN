import React from 'react';
import { useNavigate } from 'react-router-dom';

const JobManagement: React.FC = () => {
    const navigate = useNavigate();

    const jobs = [
        { id: 1, title: 'Software Engineer', location: 'San Francisco, CA', status: 'Active', applicants: 25 },
        { id: 2, title: 'Product Manager', location: 'New York, NY', status: 'Inactive', applicants: 10 },
        { id: 3, title: 'UX/UI Designer', location: 'Austin, TX', status: 'Active', applicants: 15 },
    ];

    return (
        <div className="bg-gray-50 min-h-screen p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold">Job Management</h1>
                    <button 
                        onClick={() => navigate('/hr/post-job')}
                        className="bg-[#007BFF] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#0056b3] transition-colors"
                    >
                        Post a New Job
                    </button>
                </div>
                
                <div className="bg-white p-8 rounded-lg shadow-md">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b">
                                    <th className="py-4 px-2">Job Title</th>
                                    <th className="py-4 px-2">Location</th>
                                    <th className="py-4 px-2">Status</th>
                                    <th className="py-4 px-2">Applicants</th>
                                    <th className="py-4 px-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobs.map(job => (
                                    <tr key={job.id} className="border-b hover:bg-gray-50">
                                        <td className="py-4 px-2">{job.title}</td>
                                        <td className="py-4 px-2">{job.location}</td>
                                        <td className="py-4 px-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${job.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {job.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-2">{job.applicants}</td>
                                        <td className="py-4 px-2">
                                            <div className="flex space-x-2">
                                                <button className="text-blue-600 hover:underline">View</button>
                                                <button className="text-yellow-600 hover:underline">Edit</button>
                                                <button className="text-red-600 hover:underline">Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobManagement; 