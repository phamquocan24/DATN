import React, { useState, useRef, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { FiEye, FiBriefcase, FiChevronDown, FiUpload } from 'react-icons/fi';
import { Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler, TooltipItem } from 'chart.js';
import AvatarImg from '../../assets/Avatar17.png';
import BellIcon from '../../assets/bell-outlined.png';
import NotificationPanel from './NotificationPanelAdmin';
import adminApi from '../../services/adminApi';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

const Statistics: React.FC = () => {
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
                
                const [systemStats, jobStats, appStats] = await Promise.all([
                    adminApi.getSystemStatistics(),
                    adminApi.getJobStats().catch(() => null), // Optional endpoint
                    adminApi.getApplicationStats().catch(() => null) // Optional endpoint
                ]);
                
                setStatsData({
                    system: systemStats,
                    jobs: jobStats,
                    applications: appStats
                });
            } catch (err) {
                console.error('Error fetching statistics:', err);
                setError('Failed to load statistics data');
            } finally {
                setLoading(false);
            }
        };

        fetchStatistics();
    }, []);

    // Dynamic stats cards based on API data
    const statsCards = [
        { 
            title: "Total Jobs", 
            value: loading ? "..." : (statsData?.jobs?.total_jobs || statsData?.system?.data?.jobs?.total_jobs || "0"), 
            change: "6.4%", 
            changeType: "increase", 
            icon: <FiEye className="text-yellow-500" />, 
            iconBg: "bg-yellow-100" 
        },
        { 
            title: "Total Applied", 
            value: loading ? "..." : (statsData?.applications?.total_applications || statsData?.system?.data?.applications?.total_applications || "0"), 
            change: "0.4%", 
            changeType: "decrease", 
            icon: <FiBriefcase className="text-blue-500" />, 
            iconBg: "bg-blue-100" 
        }
    ];

    // Dynamic doughnut chart data
    const getDoughnutData = () => {
        if (loading || !statsData) {
            return {
                labels: ['Approved', 'Flag', 'Pending', 'Spam'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: ['#FFB836', '#4D7DFF', '#2ED47A', '#FF6B6B'],
                    borderWidth: 0,
                    cutout: '75%',
                }],
            };
        }

        const systemData = statsData?.system?.data;
        return {
            labels: ['Approved', 'Flag', 'Pending', 'Spam'],
            datasets: [{
                data: [
                    systemData?.jobs?.approved_jobs || 48,
                    systemData?.jobs?.flagged_jobs || 23,
                    systemData?.jobs?.pending_jobs || 24,
                    systemData?.jobs?.spam_jobs || 5
                ],
                backgroundColor: ['#FFB836', '#4D7DFF', '#2ED47A', '#FF6B6B'],
                borderWidth: 0,
                cutout: '75%',
            }],
        };
    };
    
    // Dynamic line chart data
    const getLineData = () => {
        if (loading || !statsData) {
            return {
                labels: ['19 Jul', '20 Jul', '21 Jul', '22 Jul', '23 Jul', '24 Jul', '25 Jul'],
                datasets: [{
                    label: 'CVs',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    fill: false,
                    borderColor: '#2ED47A',
                    tension: 0.4,
                    borderWidth: 2,
                    pointBackgroundColor: '#FFFFFF',
                    pointBorderColor: '#2ED47A',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                }],
            };
        }

        const trendData = statsData?.system?.data?.registration_trends || [];
        const labels = trendData.map((item: any) => {
            const date = new Date(item.date);
            return `${date.getDate()} ${date.toLocaleDateString('en', { month: 'short' })}`;
        });
        const cvData = trendData.map((item: any) => item.registrations || 0);

        return {
            labels: labels.length > 0 ? labels : ['19 Jul', '20 Jul', '21 Jul', '22 Jul', '23 Jul', '24 Jul', '25 Jul'],
            datasets: [{
                label: 'CVs',
                data: cvData.length > 0 ? cvData : [350, 50, 450, 150, 500, 300, 600],
                fill: false,
                borderColor: '#2ED47A',
                tension: 0.4,
                borderWidth: 2,
                pointBackgroundColor: '#FFFFFF',
                pointBorderColor: '#2ED47A',
                pointBorderWidth: 2,
                pointRadius: 4,
            }],
        };
    };

    const lineOptions = {
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
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

    const visitors = [
        { country: 'USA', code: 'us', visitors: '3,240' },
        { country: 'France', code: 'fr', visitors: '3,188' },
        { country: 'Italy', code: 'it', visitors: '2,938' },
        { country: 'Germany', code: 'de', visitors: '2,624' },
        { country: 'Japan', code: 'jp', visitors: '2,414' },
        { country: 'Netherlands', code: 'nl', visitors: '1,916' },
    ];

    return (
        <AdminLayout>
            <div className="p-8 bg-white text-left">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <img src={AvatarImg} alt="Avatar" className="w-10 h-10 rounded-full" />
                        <div className="text-left">
                          <p className="text-sm font-semibold text-gray-800">Maria Kelly</p>
                          <p className="text-xs text-gray-500">MariaKelly@email.com</p>
                        </div>
                        <FiChevronDown className="h-4 w-4 text-gray-500" />
                    </div>
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
                                <h3 className="font-semibold">CV Submissions by Day</h3>
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
                                <h3 className="font-semibold">Post Status Ratio</h3>
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
                                        <span className="font-medium">{getDoughnutData().datasets[0].data[i]}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Visitors by Country */}
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                            <h3 className="font-semibold mb-4">Visitors by country</h3>
                            <div className="space-y-3">
                                {visitors.map(v => (
                                    <div key={v.country} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-3">
                                            <img src={`https://flagcdn.com/w20/${v.code}.png`} width="20" alt={v.country} />
                                            <p>{v.country}</p>
                                        </div>
                                        <p className="font-medium">{v.visitors}</p>
                                    </div>
                                ))}
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