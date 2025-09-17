import React, { useState, useRef, useEffect } from 'react';
import { FiEye, FiBriefcase, FiChevronDown, FiUpload, FiMenu } from 'react-icons/fi';
import { Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler, TooltipItem } from 'chart.js';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../common/Toast';
import { StatsCardsSkeleton } from '../common/LoadingStates';
import AvatarImg from '../../assets/Avatar17.png';
import BellIcon from '../../assets/bell-outlined.png';
import HrNotificationPanel from './HrNotificationPanel';
import HrLayout from './HrLayout';
import hrApi from '../../services/hrApi';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

const AnalyticsTab: React.FC = () => {
    const { toastState, showToast, hideToast } = useToast();
    const [notifOpen, setNotifOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(true);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);
    
    // Loading and error states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // API data states
    const [analyticsData, setAnalyticsData] = useState({
        totalViews: 0,
        totalApplied: 0,
        viewsChange: 0,
        appliedChange: 0,
        hiredStageData: {
            inReview: 0,
            interview: 0,
            miniTest: 0,
            hired: 0
        },
        weeklyViewsData: [] as number[]
    });

    // Fetch analytics data from API
    useEffect(() => {
        const fetchAnalyticsData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch job statistics
                const jobStatsResponse = await hrApi.getJobStatistics();
                const jobStats = jobStatsResponse?.data || jobStatsResponse || {};

                // Fetch application statistics
                const appStatsResponse = await hrApi.getApplicationStatistics();
                const appStats = appStatsResponse?.data || appStatsResponse || {};

                // Process the data
                setAnalyticsData({
                    totalViews: jobStats.total_views || jobStats.job_views || 0,
                    totalApplied: appStats.total_applications || jobStats.total_applications || 0,
                    viewsChange: jobStats.views_weekly_change || 6.4,
                    appliedChange: appStats.weekly_change || -0.4,
                    hiredStageData: {
                        inReview: appStats.applications_by_status?.PENDING || appStats.pending || 243,
                        interview: appStats.applications_by_status?.SHORTLISTED || appStats.shortlisted || 135,
                        miniTest: appStats.applications_by_status?.REVIEWING || appStats.approved || 108,
                        hired: appStats.applications_by_status?.HIRED || appStats.hired || 54
                    },
                    weeklyViewsData: jobStats.weekly_views || [350, 50, 450, 150, 500, 300, 600]
                });

            } catch (err: any) {
                const errorMessage = 'Failed to load analytics data';
                setError(errorMessage);
                showToast(errorMessage, 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalyticsData();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
                setIsExportOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Dynamic stats cards with API data
    const statsCards = [
        { 
            title: "Total Views", 
            value: analyticsData.totalViews.toLocaleString(), 
            change: `${Math.abs(analyticsData.viewsChange)}%`, 
            changeType: analyticsData.viewsChange >= 0 ? "increase" : "decrease", 
            icon: <FiEye className="text-yellow-500" />, 
            iconBg: "bg-yellow-100" 
        },
        { 
            title: "Total Applied", 
            value: analyticsData.totalApplied.toLocaleString(), 
            change: `${Math.abs(analyticsData.appliedChange)}%`, 
            changeType: analyticsData.appliedChange >= 0 ? "increase" : "decrease", 
            icon: <FiBriefcase className="text-blue-500" />, 
            iconBg: "bg-blue-100" 
        }
    ];

    // Dynamic doughnut chart data with API data
    const doughnutData = {
        labels: ['In Review', 'Interview', 'Mini-test', 'Hired'],
        datasets: [{
            data: [
                analyticsData.hiredStageData.inReview,
                analyticsData.hiredStageData.interview,
                analyticsData.hiredStageData.miniTest,
                analyticsData.hiredStageData.hired
            ],
            backgroundColor: ['#FFB836', '#4D7DFF', '#A78BFA', '#2ED47A'],
            borderWidth: 0,
            cutout: '75%',
        }],
    };
    
    // Dynamic line chart data with API data
    const lineData = {
        labels: ['19 Jul', '20 Jul', '21 Jul', '22 Jul', '23 Jul', '24 Jul', '25 Jul'],
        datasets: [{
            label: 'Views',
            data: analyticsData.weeklyViewsData.length > 0 ? analyticsData.weeklyViewsData : [350, 50, 450, 150, 500, 300, 600],
            fill: false,
            borderColor: '#2ED47A',
            tension: 0.4,
            pointBackgroundColor: 'transparent',
            pointBorderColor: 'transparent',
            pointHoverBackgroundColor: '#2ED47A',
            pointHoverBorderColor: '#fff',
        }]
    };

    // Dynamic line chart options with API data
    const lineOptions = {
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            y: {
                beginAtZero: true,
                max: Math.max(...analyticsData.weeklyViewsData, 1000),
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
                backgroundColor: '#2D3748',
                bodyColor: '#FFF',
                titleColor: '#FFF',
                callbacks: {
                    title: () => '',
                    label: (context: TooltipItem<'doughnut'>) => {
                        return `${context.raw}`;
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

    // Loading state
    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <StatsCardsSkeleton cardCount={2} />
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
                        <div className="h-80 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                </div>
                <div className="space-y-8">
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                        <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
                        <div className="h-48 w-48 mx-auto bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                </div>
            </div>
        );
    }

    // Error state with retry
    if (error) {
        const handleRetry = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch job statistics
                const jobStatsResponse = await hrApi.getJobStatistics();
                const jobStats = jobStatsResponse?.data || jobStatsResponse || {};

                // Fetch application statistics
                const appStatsResponse = await hrApi.getApplicationStatistics();
                const appStats = appStatsResponse?.data || appStatsResponse || {};

                // Process the data
                setAnalyticsData({
                    totalViews: jobStats.total_views || jobStats.job_views || 0,
                    totalApplied: appStats.total_applications || jobStats.total_applications || 0,
                    viewsChange: jobStats.views_weekly_change || 6.4,
                    appliedChange: appStats.weekly_change || -0.4,
                    hiredStageData: {
                        inReview: appStats.applications_by_status?.PENDING || appStats.pending || 243,
                        interview: appStats.applications_by_status?.SHORTLISTED || appStats.shortlisted || 135,
                        miniTest: appStats.applications_by_status?.REVIEWING || appStats.approved || 108,
                        hired: appStats.applications_by_status?.HIRED || appStats.hired || 54
                    },
                    weeklyViewsData: jobStats.weekly_views || [350, 50, 450, 150, 500, 300, 600]
                });

            } catch (err: any) {
                const errorMessage = 'Failed to load analytics data';
                setError(errorMessage);
                showToast(errorMessage, 'error');
            } finally {
                setLoading(false);
            }
        };
        
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="text-red-500 mb-4">{error}</div>
                <button 
                    onClick={handleRetry} 
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Stat Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {statsCards.map(card => (
                            <div key={card.title} className="bg-white p-6 rounded-lg border border-gray-200 flex justify-between items-start text-left">
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
                            <h3 className="font-semibold">Job Listing View stats</h3>
                            <button className="flex items-center gap-2 text-sm px-3 py-1.5 border rounded-lg">
                                <FiMenu /> Last 7 days
                            </button>
                        </div>
                        <div className="h-80"><Line data={lineData} options={lineOptions as any} /></div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                    {/* Doughnut Chart */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold">Hired Stage</h3>
                        </div>
                        <div className="relative h-48 w-48 mx-auto">
                            <Doughnut data={doughnutData} options={doughnutOptions as any} />
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                            {doughnutData.labels.map((label, i) => (
                                <div key={label} className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: doughnutData.datasets[0].backgroundColor[i]}}></span>
                                    <span>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Visitors by Country */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200 text-left">
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
            
            {/* Toast Notification */}
            <Toast toastState={toastState} onClose={hideToast} />
        </>
    );
};

export default AnalyticsTab; 