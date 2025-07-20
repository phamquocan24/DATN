import React from 'react';

const CompanyProfile: React.FC = () => {
    return (
        <div className="bg-gray-50 min-h-screen p-8">
            <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-md">
                <div className="flex items-center space-x-6 mb-8">
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-3xl font-bold text-gray-500">C</span>
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold">Company Name</h1>
                        <p className="text-gray-600">IT Services and IT Consulting</p>
                        <a href="https://www.company.com" target="_blank" rel="noopener noreferrer" className="text-[#007BFF] hover:underline">www.company.com</a>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4">About Company</h2>
                    <p className="text-gray-700 leading-relaxed">
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed doo eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                    </p>
                </div>

                 <div className="mt-8">
                    <button className="bg-[#007BFF] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#0056b3] transition-colors">
                        Edit Profile
                    </button>
                </div>

            </div>
        </div>
    );
};

export default CompanyProfile; 