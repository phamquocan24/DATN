import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PostNewJob: React.FC = () => {
    const [step, setStep] = useState(1);

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const renderStep = () => {
        switch (step) {
            case 1:
                return <Step1 nextStep={nextStep} />;
            case 2:
                return <Step2 nextStep={nextStep} prevStep={prevStep} />;
            case 3:
                return <Step3 prevStep={prevStep} />;
            default:
                return <Step1 nextStep={nextStep} />;
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-2">Post a New Job</h1>
                <p className="text-gray-600 mb-8">Fill out the details below to post a new job opportunity.</p>
                {renderStep()}
            </div>
        </div>
    );
};

const Step2: React.FC<{ nextStep: () => void, prevStep: () => void }> = ({ nextStep, prevStep }) => {
    return (
        <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-6">Step 2: Job Details</h2>
            <form className="space-y-6">
                <div>
                    <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-1">Job Description</label>
                    <textarea id="jobDescription" rows={6} placeholder="Describe the responsibilities and duties of the job." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007BFF]"></textarea>
                </div>
                <div>
                    <label htmlFor="jobRequirements" className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
                    <textarea id="jobRequirements" rows={6} placeholder="List the required skills, qualifications, and experience." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007BFF]"></textarea>
                </div>

                <div className="flex justify-between pt-4">
                     <button type="button" onClick={prevStep} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                        Previous Step
                    </button>
                    <button type="button" onClick={nextStep} className="bg-[#007BFF] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#0056b3] transition-colors">
                        Next Step
                    </button>
                </div>
            </form>
        </div>
    );
};


const Step1: React.FC<{ nextStep: () => void }> = ({ nextStep }) => {
    return (
        <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-6">Step 1: Job Information</h2>
            <form className="space-y-6">
                <div>
                    <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                    <input type="text" id="jobTitle" placeholder="e.g. Software Engineer" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007BFF]" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="jobType" className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                        <select id="jobType" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007BFF]">
                            <option>Full-time</option>
                            <option>Part-time</option>
                            <option>Contract</option>
                            <option>Internship</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="workplaceType" className="block text-sm font-medium text-gray-700 mb-1">Workplace Type</label>
                        <select id="workplaceType" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007BFF]">
                            <option>On-site</option>
                            <option>Hybrid</option>
                            <option>Remote</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label htmlFor="jobLocation" className="block text-sm font-medium text-gray-700 mb-1">Job Location</label>
                    <input type="text" id="jobLocation" placeholder="e.g. San Francisco, CA" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007BFF]" />
                </div>
                
                <div>
                    <label htmlFor="jobCategory" className="block text-sm font-medium text-gray-700 mb-1">Job Category</label>
                    <input type="text" id="jobCategory" placeholder="e.g. Technology" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007BFF]" />
                </div>

                <div className="flex justify-end pt-4">
                    <button type="button" onClick={nextStep} className="bg-[#007BFF] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#0056b3] transition-colors">
                        Next Step
                    </button>
                </div>
            </form>
        </div>
    );
};

const Step3: React.FC<{ prevStep: () => void }> = ({ prevStep }) => {
    const navigate = useNavigate();

    const handlePostJob = () => {
        // Logic to post the job
        console.log("Job posted!");
        navigate('/hr/job-management');
    };

    return (
        <div className="bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-6">Step 3: Salary & Confirmation</h2>
            <form className="space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="salaryFrom" className="block text-sm font-medium text-gray-700 mb-1">Salary Range (From)</label>
                        <input type="number" id="salaryFrom" placeholder="e.g. 50000" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007BFF]" />

                    </div>
                    <div>
                        <label htmlFor="salaryTo" className="block text-sm font-medium text-gray-700 mb-1">Salary Range (To)</label>
                        <input type="number" id="salaryTo" placeholder="e.g. 70000" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007BFF]" />
                    </div>
                </div>

                <div className="flex justify-between pt-4">
                     <button type="button" onClick={prevStep} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors">
                        Previous Step
                    </button>
                    <button type="button" onClick={handlePostJob} className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors">
                        Post Job
                    </button>
                </div>
            </form>
        </div>
    );
};


export default PostNewJob; 