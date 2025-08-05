import React, { useState, useRef, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { FiEye, FiBriefcase, FiChevronDown, FiUpload } from 'react-icons/fi';
import { Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler, TooltipItem } from 'chart.js';

import BellIcon from '../../assets/bell-outlined.png';
import NotificationPanel from './NotificationPanelAdmin';
import adminApi from '../../services/adminApi';
import AdminHeaderDropdown from './AdminHeaderDropdown';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

interface StatisticsProps {
  currentUser?: any;
}

const Statistics: React.FC<StatisticsProps> = ({ currentUser }) => {
    const [notifOpen, setNotifOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(true);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);
    
    // API data states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statsData, setStatsData] = useState<any>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
                setIsExportOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch statistics data
    useEffect(() => {
        const fetchStatistics = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const systemStats = await adminApi.getSystemStatistics();
                console.log('Statistics API Response:', systemStats);
                
                setStatsData(systemStats);
            } catch (err: any) {
                console.error('Error fetching statistics:', err);
                
                // Check if it's a backend database error
                if (err?.response?.data?.error?.includes('column "is_active" does not exist')) {
                    console.warn('Backend database schema issue detected. Using fallback data.');
                    // Set fallback data for development
                    setStatsData({
                        users: {
                            total_users: 0,
                            active_users: 0,
                            candidates: 0,
                            recruiters: 0,
                            hr_users: 0,
                            admins: 0
                        },
                        companies: {
                            total_companies: 0,
                            active_companies: 0
                        },
                        registration_trends: [],
                        recent_activities: []
                    });
                    setError('Statistics API has database schema issues. Please check backend configuration.');
                } else {
                    setError(`Failed to load statistics data: ${err?.response?.data?.error || err.message}`);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchStatistics();
    }, []);

    // Dynamic stats cards based on API data
    const statsCards = [
        { 
            title: "Total Users", 
            value: loading ? "..." : (statsData?.users?.total_users || "0"), 
            change: "6.4%", 
            changeType: "increase", 
            icon: <FiEye className="text-blue-500" />, 
            iconBg: "bg-blue-100" 
        },
        { 
            title: "Active Users", 
            value: loading ? "..." : (statsData?.users?.active_users || "0"), 
            change: "2.1%", 
            changeType: "increase", 
            icon: <FiBriefcase className="text-green-500" />, 
            iconBg: "bg-green-100" 
        },
        { 
            title: "Total Companies", 
            value: loading ? "..." : (statsData?.companies?.total_companies || "0"), 
            change: "1.2%", 
            changeType: "increase", 
            icon: <FiBriefcase className="text-yellow-500" />, 
            iconBg: "bg-yellow-100" 
        },
        { 
            title: "Active Companies", 
            value: loading ? "..." : (statsData?.companies?.active_companies || "0"), 
            change: "0.8%", 
            changeType: "increase", 
            icon: <FiEye className="text-purple-500" />, 
            iconBg: "bg-purple-100" 
        }
    ];

    // Dynamic doughnut chart data - User Role Distribution
    const getDoughnutData = () => {
        if (loading || !statsData) {
            return {
                labels: ['Candidates', 'Recruiters', 'HR Users', 'Admins'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: ['#4D7DFF', '#FFB836', '#2ED47A', '#FF6B6B'],
                    borderWidth: 0,
                    cutout: '75%',
                }],
            };
        }

        const userData = statsData?.users;
        return {
            labels: ['Candidates', 'Recruiters', 'HR Users', 'Admins'],
            datasets: [{
                data: [
                    userData?.candidates || 0,
                    userData?.recruiters || 0,
                    userData?.hr_users || 0,
                    userData?.admins || 0
                ],
                backgroundColor: ['#FFB836', '#4D7DFF', '#2ED47A', '#FF6B6B'],
                borderWidth: 0,
                cutout: '75%',
            }],
        };
    };
    
    // Dynamic line chart data - Registration Trends
    const getLineData = () => {
        if (loading || !statsData) {
            return {
                labels: ['19 Jul', '20 Jul', '21 Jul', '22 Jul', '23 Jul', '24 Jul', '25 Jul'],
                datasets: [
                    {
                        label: 'Total Registrations',
                        data: [0, 0, 0, 0, 0, 0, 0],
                        fill: false,
                        borderColor: '#2ED47A',
                        tension: 0.4,
                        borderWidth: 2,
                        pointBackgroundColor: '#FFFFFF',
                        pointBorderColor: '#2ED47A',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                    },
                    {
                        label: 'Candidates',
                        data: [0, 0, 0, 0, 0, 0, 0],
                        fill: false,
                        borderColor: '#4D7DFF',
                        tension: 0.4,
                        borderWidth: 2,
                        pointBackgroundColor: '#FFFFFF',
                        pointBorderColor: '#4D7DFF',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                    }
                ],
            };
        }

        const trendData = statsData?.registration_trends || [];
        const labels = trendData.map((item: any) => {
            const date = new Date(item.date);
            return `${date.getDate()} ${date.toLocaleDateString('en', { month: 'short' })}`;
        });
        const totalRegistrations = trendData.map((item: any) => item.registrations || 0);
        const candidateRegistrations = trendData.map((item: any) => item.candidate_registrations || 0);

        return {
            labels: labels.length > 0 ? labels : ['19 Jul', '20 Jul', '21 Jul', '22 Jul', '23 Jul', '24 Jul', '25 Jul'],
            datasets: [
                {
                    label: 'Total Registrations',
                    data: totalRegistrations.length > 0 ? totalRegistrations : [25, 30, 45, 35, 50, 40, 60],
                    fill: false,
                    borderColor: '#2ED47A',
                    tension: 0.4,
                    borderWidth: 2,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: '#2ED47A',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                },
                {
                    label: 'Candidates',
                    data: candidateRegistrations.length > 0 ? candidateRegistrations : [20, 25, 35, 28, 40, 32, 48],
                    fill: false,
                    borderColor: '#4D7DFF',
                    tension: 0.4,
                    borderWidth: 2,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: '#4D7DFF',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                }
            ],
        };
    };

    const lineOptions = {
        maintainAspectRatio: false,
        plugins: {
            legend: { 
                display: true,
                position: 'top' as const,
                labels: {
                    usePointStyle: true,
                    padding: 20
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: 1000,
            }
        }
    };

    const doughnutOptions = {
        cutout: '75%',
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                enabled: true,
                callbacks: {
                    label: (context: TooltipItem<'doughnut'>) => {
                        const total = 243;
                        const percentage = context.raw as number;
                        const value = Math.round((percentage / 100) * total);
                        return `${context.label}: ${value}`;
                    },
                },
            },
        },
    };



    return (
        <AdminLayout>
            <div className="p-8 bg-white text-left">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <AdminHeaderDropdown currentUser={currentUser} />
                    <div className="flex items-center space-x-6 relative">
                        <button onClick={() => setNotifOpen(!notifOpen)} className="relative focus:outline-none">
                            <img src={BellIcon} alt="Notifications" className="w-5 h-5" />
                            {hasUnread && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />}
                        </button>
                        <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} position="header" onMarkAllAsRead={() => setHasUnread(false)} />
                    </div>
                </div>

                <div className="border-t border-gray-200 mb-6"></div>

                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold">Statistics</h1>
                        <p className="text-gray-600">Overall report on system performance</p>
                    </div>
                    <div ref={exportRef} className="relative">
                        <button
                            onClick={() => setIsExportOpen(!isExportOpen)}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                            <FiUpload size={16} /> Export <FiChevronDown size={16} />
                        </button>
                        {isExportOpen && (
                            <div className="absolute right-0 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#007BFF]">PDF</a>
                                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#007BFF]">CSV</a>
                                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#007BFF]">PNG</a>
                                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-[#007BFF]">Word</a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <span className="ml-2 text-gray-600">Loading statistics...</span>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Error loading statistics</h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>{error}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                {!loading && !error && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Stat Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {statsCards.map(card => (
                                <div key={card.title} className="bg-white p-6 rounded-lg border border-gray-200 flex justify-between items-start">
                                    <div>
                                        <p className="text-gray-500 mb-2">{card.title}</p>
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-3xl font-bold">{card.value}</p>
                                            <div className={`flex items-center text-sm font-medium ${card.changeType === 'increase' ? 'text-green-500' : 'text-red-500'}`}>
                                                <span>{card.change}</span>
                                                <span>{card.changeType === 'increase' ? '▲' : '▼'}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">vs last day</p>
                                    </div>
                                    <div className={`p-2 rounded-lg ${card.iconBg}`}>{card.icon}</div>
                                </div>
                            ))}
                        </div>

                        {/* Line Chart */}
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold">Registration Trends</h3>
                                <button className="flex items-center gap-2 text-sm px-3 py-1.5 border rounded-lg">Last 7 days <FiChevronDown /></button>
                            </div>
                            <div className="h-80"><Line data={getLineData()} options={lineOptions} /></div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-8">
                        {/* Doughnut Chart */}
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                             <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold">User Role Distribution</h3>
                            </div>
                            <div className="relative h-48 w-48 mx-auto">
                                <Doughnut data={getDoughnutData()} options={doughnutOptions} />
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                {getDoughnutData().labels.map((label, i) => (
                                    <div key={label} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: getDoughnutData().datasets[0].backgroundColor[i]}}></span>
                                            <span>{label}</span>
                                        </div>
                                        <span className="font-medium">{getDoughnutData().datasets[0].data[i]}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Activities */}
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                            <h3 className="font-semibold mb-4">Recent Activities</h3>
                            <div className="space-y-3">
                                {(statsData?.recent_activities || []).length > 0 ? (
                                    statsData.recent_activities.slice(0, 5).map((activity: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                                                    activity.role === 'CANDIDATE' ? 'bg-blue-100 text-blue-600' :
                                                    activity.role === 'RECRUITER' ? 'bg-yellow-100 text-yellow-600' :
                                                    activity.role === 'ADMIN' ? 'bg-red-100 text-red-600' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {activity.user_name?.charAt(0) || activity.email?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{activity.user_name || 'Unknown User'}</p>
                                                    <p className="text-gray-500 text-xs">
                                                        {activity.activity_type === 'user_registration' ? 'New Registration' : activity.activity_type}
                                                        {activity.role && ` • ${activity.role.toLowerCase()}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className="text-gray-500 text-xs">
                                                {new Date(activity.activity_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-4 text-gray-500">
                                        <p>No recent activities</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default Statistics; 