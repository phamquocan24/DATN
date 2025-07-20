import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../../assets/Logo.png';
import DashboardIcon from '../../assets/dashboard.png';
import JobsIcon from '../../assets/jd.png';
import ApplicantsIcon from '../../assets/document.png';
import CompanyIcon from '../../assets/company.png';
import SettingsIcon from '../../assets/settings.png';
import LogoutIcon from '../../assets/log.png';

interface HrDashboardSidebarProps {
  activeTab: string;
}

const HrDashboardSidebar: React.FC<HrDashboardSidebarProps> = ({ activeTab }) => {
    const navigate = useNavigate();

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon, path: '/hr/dashboard' },
        { id: 'job-management', label: 'Job Management', icon: JobsIcon, path: '/hr/job-management' },
        { id: 'job-applications', label: 'Job Applications', icon: ApplicantsIcon, path: '/hr/job-applications' },
        { id: 'company-profile', label: 'Company Profile', icon: CompanyIcon, path: '/hr/company-profile' },
    ];

    const bottomItems = [
        { id: 'settings', label: 'Settings', icon: SettingsIcon, path: '/hr/settings' },
        { id: 'logout', label: 'Logout', icon: LogoutIcon, path: '/hr/login' },
    ]

    const handleNavigate = (path: string) => {
        if (path.includes('login')) {
            // Add any logout logic here
            console.log('Logging out');
        }
        navigate(path);
    }

    return (
        <div className="w-64 bg-white min-h-screen flex flex-col border-r">
            <div className="p-4 border-b">
                <img src={Logo} alt="Logo" className="h-8" />
            </div>
            <div className="flex-grow p-4">
                <button 
                    onClick={() => navigate('/hr/post-job')}
                    className="w-full bg-[#007BFF] text-white py-2.5 rounded-lg font-semibold hover:bg-[#0056b3] transition-colors mb-4"
                >
                    Post a New Job
                </button>
                <nav>
                    <ul>
                        {menuItems.map(item => (
                            <li key={item.id}>
                                <a
                                    href="#"
                                    onClick={(e) => { e.preventDefault(); handleNavigate(item.path); }}
                                    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                                        activeTab === item.id ? 'bg-blue-100 text-[#007BFF]' : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    <img src={item.icon} alt={item.label} className="w-5 h-5" />
                                    <span>{item.label}</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
            <div className="p-4 border-t">
                 <ul>
                    {bottomItems.map(item => (
                        <li key={item.id}>
                            <a
                                href="#"
                                onClick={(e) => { e.preventDefault(); handleNavigate(item.path); }}
                                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                                    activeTab === item.id ? 'bg-blue-100 text-[#007BFF]' : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                <img src={item.icon} alt={item.label} className="w-5 h-5" />
                                <span>{item.label}</span>
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default HrDashboardSidebar; 