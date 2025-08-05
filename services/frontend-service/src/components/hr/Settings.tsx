import React, { useState } from 'react';
import { FiInstagram, FiTwitter, FiFacebook, FiLinkedin, FiYoutube, FiGrid, FiList } from 'react-icons/fi';

const OverviewSettings = ({ currentUser }: { currentUser?: any }) => (
    <div className="bg-white p-8 rounded-lg border">
        <h2 className="text-lg font-semibold mb-2">Basic Information</h2>
        <p className="text-gray-500 mb-6">This is company information that you can update anytime.</p>
        
        <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
            <div className="flex items-center gap-8">
                <div className="w-24 h-24 bg-gray-100 flex items-center justify-center rounded-lg">
                    <img src="/src/assets/Nomad.png" alt="Company Logo" className="h-16 w-16" />
                </div>
                <div className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <p className="text-gray-500">Click to replace or drag and drop</p>
                    <p className="text-xs text-gray-400">SVG, PNG, JPG or GIF (max. 400 x 400px)</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Details</label>
                <p className="text-xs text-gray-500">Introduce your company core info quickly to users by fill up company details.</p>
            </div>
            <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                <input type="text" id="companyName" defaultValue={currentUser?.company_name || "Nomad"} className="w-full border-gray-300 rounded-lg shadow-sm" />
            </div>
            <div></div>
             <div>
                <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input type="text" id="website" defaultValue={currentUser?.website || "https://www.nomad.com"} className="w-full border-gray-300 rounded-lg shadow-sm" />
            </div>
            <div></div>
            <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select id="location" className="w-full border-gray-300 rounded-lg shadow-sm">
                    <option>England</option>
                </select>
            </div>
             <div></div>
             <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="employee" className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                    <select id="employee" className="w-full border-gray-300 rounded-lg shadow-sm">
                        <option>1 - 50</option>
                    </select>
                 </div>
                 <div>
                    <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <select id="industry" className="w-full border-gray-300 rounded-lg shadow-sm">
                        <option>Technology</option>
                    </select>
                 </div>
             </div>
             <div></div>
             <div className="grid grid-cols-3 gap-4">
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date Founded</label>
                    <select id="date" className="w-full border-gray-300 rounded-lg shadow-sm"><option>31</option></select>
                </div>
                <div>
                    <label className="invisible block text-sm font-medium text-gray-700 mb-1">Month</label>
                    <select className="w-full border-gray-300 rounded-lg shadow-sm"><option>July</option></select>
                </div>
                <div>
                    <label className="invisible block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <select className="w-full border-gray-300 rounded-lg shadow-sm"><option>2021</option></select>
                </div>
             </div>
             <div></div>
             <div>
                <label htmlFor="techStack" className="block text-sm font-medium text-gray-700 mb-1">Tech Stack</label>
                <select id="techStack" className="w-full border-gray-300 rounded-lg shadow-sm">
                    <option>HTML 5, CSS 3, Javascript</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">About Company</label>
                <p className="text-xs text-gray-500">Brief description for your company. URLs are hyperlinked.</p>
            </div>
            <div>
                 <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea id="description" rows={5} className="w-full border-gray-300 rounded-lg shadow-sm" defaultValue="Nomad is part of the Information Technology industry. We believe travellers want to experience real life and meet local people. Nomad has 30 total employees across all of its locations and generates $1.50 million in sales."></textarea>
                <p className="text-xs text-gray-500 mt-1 text-right">0 / 500</p>
            </div>
        </div>
    </div>
);

const SocialLinksSettings = () => (
    <div className="bg-white p-8 rounded-lg border">
        <h2 className="text-lg font-semibold mb-2">Basic Information</h2>
        <p className="text-gray-500 mb-6">Add elsewhere links to your company profile. You can add only username without full https links.</p>
        <div className="space-y-4">
            <div>
                <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                <input type="text" id="instagram" defaultValue="https://www.instagram.com/nomad/" className="w-full border-gray-300 rounded-lg shadow-sm" />
            </div>
            <div>
                <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 mb-1">Twitter</label>
                <input type="text" id="twitter" defaultValue="https://twitter.com/nomad/" className="w-full border-gray-300 rounded-lg shadow-sm" />
            </div>
            <div>
                <label htmlFor="facebook" className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                <input type="text" id="facebook" defaultValue="https://web.facebook.com/nomad/" className="w-full border-gray-300 rounded-lg shadow-sm" />
            </div>
            <div>
                <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                <input type="text" id="linkedin" placeholder="Enter your LinkedIn address" className="w-full border-gray-300 rounded-lg shadow-sm" />
            </div>
            <div>
                <label htmlFor="youtube" className="block text-sm font-medium text-gray-700 mb-1">Youtube</label>
                <input type="text" id="youtube" placeholder="Enter your youtube address" className="w-full border-gray-300 rounded-lg shadow-sm" />
            </div>
        </div>
    </div>
);

const TeamSettings = () => {
    const teamMembers = [
        { name: 'Celestin Gardinier', role: 'CEO & Co-Founder' }, { name: 'Reynaud Colbert', role: 'Co-Founder' }, { name: 'Arienne Lyon', role: 'Managing Director' },
        { name: 'Bernard Alexander', role: 'Managing Director' }, { name: 'Christine Jhonson', role: 'Managing Director' }, { name: 'Aaron Morgan', role: 'Managing Director' },
    ];
    return (
        <div className="bg-white p-8 rounded-lg border">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-lg font-semibold">Basic Information</h2>
                    <p className="text-gray-500">Add team members of your company.</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="font-semibold">50 Members</span>
                    <button className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center">+ Add Members</button>
                    <div className="flex border rounded-lg">
                        <button className="p-2 border-r"><FiGrid /></button>
                        <button className="p-2 text-gray-400"><FiList /></button>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-6">
                {teamMembers.map((member, index) => (
                    <div key={index} className="border p-4 rounded-lg text-center shadow-sm">
                        <img src={`https://i.pravatar.cc/80?u=${index}`} alt={member.name} className="w-20 h-20 rounded-full mx-auto mb-4" />
                        <h3 className="font-semibold">{member.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">{member.role}</p>
                        <div className="flex justify-center gap-4 text-gray-400">
                            <FiInstagram />
                            <FiLinkedin />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


interface SettingsProps {
  currentUser?: any;
}

const Settings: React.FC<SettingsProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState('Overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'Overview':
        return <OverviewSettings currentUser={currentUser} />;
      case 'Social Links':
        return <SocialLinksSettings />;
      case 'Team':
        return <TeamSettings />;
      default:
        return <OverviewSettings currentUser={currentUser} />;
    }
  };

  return (
    <div className="text-left">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>
      <div className="flex border-b mb-6">
        <button onClick={() => setActiveTab('Overview')} className={`py-2 px-4 ${activeTab === 'Overview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Overview</button>
        <button onClick={() => setActiveTab('Social Links')} className={`py-2 px-4 ${activeTab === 'Social Links' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Social Links</button>
        <button onClick={() => setActiveTab('Team')} className={`py-2 px-4 ${activeTab === 'Team' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Team</button>
      </div>
      {renderContent()}
      <div className="flex justify-end mt-8">
        <button className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600">Save Changes</button>
      </div>
    </div>
  );
};

export default Settings; 