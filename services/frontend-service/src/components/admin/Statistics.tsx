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
    const trendsDropdownRef = useRef<HTMLDivElement>(null);
    
    // API data states
    const [loading, setLoading] = useState(true);
    const [chartsLoading, setChartsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statsData, setStatsData] = useState<any>(null);
    const [trendsPeriod, setTrendsPeriod] = useState<'7days' | '30days' | '1year'>('7days');
    const [isTrendsDropdownOpen, setIsTrendsDropdownOpen] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const fetchingRef = useRef(false);

    // Helper function to calculate date ranges based on current system time
    const getDateRange = (period: '7days' | '30days' | '1year') => {
        // Always calculate from current date in system (today)
        const endDate = new Date();
        // Set time to end of day to include full day data
        endDate.setHours(23, 59, 59, 999);
        
        const startDate = new Date();
        // Set time to start of day
        startDate.setHours(0, 0, 0, 0);
        
        switch (period) {
            case '7days':
                // Last 7 days including today (today + 6 previous days)
                startDate.setDate(endDate.getDate() - 6); // 6 days ago + today = 7 days
                break;
            case '30days':
                // Last 30 days including today (today + 29 previous days)
                startDate.setDate(endDate.getDate() - 29); // 29 days ago + today = 30 days
                break;
            case '1year':
                // Last 12 months including current month
                startDate.setFullYear(endDate.getFullYear() - 1);
                startDate.setDate(endDate.getDate() + 1); // Start from same day last year
                break;
        }
        
        console.log(`Date range for ${period}:`, {
            start: startDate.toLocaleDateString(),
            end: endDate.toLocaleDateString(),
            startISO: startDate.toISOString(),
            endISO: endDate.toISOString()
        });
        
        return {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            displayRange: {
                start: startDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                }),
                end: endDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                })
            }
        };
    };

    // Get display text for current time period
    const getTimePeriodDisplay = () => {
        const dateRange = getDateRange(trendsPeriod);
        return `${dateRange.displayRange.start} - ${dateRange.displayRange.end}`;
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
                setIsExportOpen(false);
            }
            // Close trends dropdown when clicking outside
            if (trendsDropdownRef.current && !trendsDropdownRef.current.contains(event.target as Node)) {
                setIsTrendsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Initial page load - fetch basic stats
    useEffect(() => {
        const fetchBasicStatistics = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Initial load with default 7 days period
                const dateRange = getDateRange('7days');
                
                const systemStats = await adminApi.getSystemStatistics({
                    start_date: dateRange.startDate,
                    end_date: dateRange.endDate,
                    period: '7days'
                });
                console.log('Initial Statistics API Response:', systemStats);
                
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
                setInitialLoad(false);
            }
        };

        fetchBasicStatistics();
    }, []); // Only run once on mount

    // Fetch chart data when period changes
    useEffect(() => {
        const fetchChartData = async () => {
            // Don't fetch if:
            // - No basic data loaded yet
            // - Still in initial load
            // - Already fetching to prevent multiple concurrent requests
            if (!statsData || initialLoad || fetchingRef.current) {
                console.log('Skipping chart fetch:', { 
                    hasStatsData: !!statsData, 
                    initialLoad, 
                    alreadyFetching: fetchingRef.current 
                });
                return;
            }
            
            try {
                fetchingRef.current = true;
                setChartsLoading(true);
                
                // Calculate date range based on selected period
                const dateRange = getDateRange(trendsPeriod);
                
                console.log(`Fetching chart data for ${trendsPeriod}...`);
                const chartStats = await adminApi.getSystemStatistics({
                    start_date: dateRange.startDate,
                    end_date: dateRange.endDate,
                    period: trendsPeriod
                });
                console.log(`Chart data for ${trendsPeriod}:`, chartStats);
                
                // Update only the chart-related data, keep user/company stats
                setStatsData((prevData: any) => ({
                    ...prevData,
                    registration_trends: chartStats.registration_trends,
                    period: trendsPeriod
                }));
            } catch (err: any) {
                console.error('Error fetching chart data:', err);
                // Don't show error for chart data, keep existing data
            } finally {
                setChartsLoading(false);
                fetchingRef.current = false;
            }
        };

        // Only run fetchChartData after initial load is complete
        if (!initialLoad) {
            console.log(`Period changed to ${trendsPeriod}, fetching chart data...`);
            fetchChartData();
        } else {
            console.log(`Period changed to ${trendsPeriod}, but still in initial load, skipping...`);
        }
    }, [trendsPeriod]); // Only run when period changes - removed statsData and initialLoad to prevent infinite loop

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
        // Generate labels based on selected time period
        const generateLabels = () => {
            const labels = [];
            const endDate = new Date();
            let periodsToShow = 7;
            
            switch (trendsPeriod) {
                case '7days':
                    periodsToShow = 7;
                    for (let i = periodsToShow - 1; i >= 0; i--) {
                        const date = new Date(endDate);
                        date.setDate(endDate.getDate() - i);
                        labels.push(`${date.getDate()} ${date.toLocaleDateString('en', { month: 'short' })}`);
                    }
                    break;
                case '30days':
                    periodsToShow = 30;
                    for (let i = periodsToShow - 1; i >= 0; i--) {
                        const date = new Date(endDate);
                        date.setDate(endDate.getDate() - i);
                        labels.push(`${date.getDate()} ${date.toLocaleDateString('en', { month: 'short' })}`);
                    }
                    break;
                case '1year':
                    periodsToShow = 12;
                    for (let i = periodsToShow - 1; i >= 0; i--) {
                        const date = new Date(endDate);
                        date.setMonth(endDate.getMonth() - i);
                        labels.push(`${date.toLocaleDateString('en', { month: 'short' })} ${date.getFullYear()}`);
                    }
                    break;
            }
            return labels;
        };

        // Generate sample data based on time period
        const generateSampleData = (length: number, baseValue: number, variance: number) => {
            return new Array(length).fill(0).map(() => 
                Math.floor(Math.random() * variance) + baseValue
            );
        };

        // Use API data directly - trust the backend to return correct data for the period
        const trendData = statsData?.registration_trends || [];
        let labels, totalRegistrations, candidateRegistrations;
        
        if (trendData.length > 0) {
            // Use API data directly - backend returns filtered data for the selected period
            console.log(`Using API data for ${trendsPeriod}:`, trendData);
            
            // Extract labels from API data (reverse for chronological order)
            const reversedData = [...trendData].reverse();
            
            labels = reversedData.map((item: any) => {
                const date = new Date(item.date);
                if (trendsPeriod === '1year') {
                    // For yearly data, backend returns YYYY-MM format
                    return `${date.toLocaleDateString('en', { month: 'short' })} ${date.getFullYear()}`;
                } else {
                    // For daily data, show day and month
                    return `${date.getDate()} ${date.toLocaleDateString('en', { month: 'short' })}`;
                }
            });
            
            // Process the data values (already reversed)
            totalRegistrations = reversedData.map((item: any) => item.registrations || 0);
            candidateRegistrations = reversedData.map((item: any) => item.candidate_registrations || 0);
            
        } else {
            // Fallback to sample data only if no API data available
            console.log(`No API data available, using sample data for ${trendsPeriod}`);
            labels = generateLabels();
            
            switch (trendsPeriod) {
                case '7days':
                    totalRegistrations = generateSampleData(7, 20, 30);
                    candidateRegistrations = generateSampleData(7, 15, 25);
                    break;
                case '30days':
                    totalRegistrations = generateSampleData(30, 15, 25);
                    candidateRegistrations = generateSampleData(30, 10, 20);
                    break;
                case '1year':
                    totalRegistrations = generateSampleData(12, 300, 200);
                    candidateRegistrations = generateSampleData(12, 250, 150);
                    break;
                default:
                    totalRegistrations = generateSampleData(7, 20, 30);
                    candidateRegistrations = generateSampleData(7, 15, 25);
            }
        }

        return {
            labels,
            datasets: [
                {
                    label: 'Total Registrations',
                    data: totalRegistrations,
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
                    data: candidateRegistrations,
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

    // Dynamic line chart options with auto-scaling Y-axis
    const getLineOptions = () => {
        // Calculate max value from current data for better scaling
        const currentData = getLineData();
        const allValues = currentData.datasets.flatMap(dataset => dataset.data);
        const maxValue = Math.max(...allValues);
        const suggestedMax = maxValue === 0 ? 100 : Math.ceil(maxValue * 1.2); // 20% padding above max value
        
        return {
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
                    suggestedMax: suggestedMax,
                }
            }
        };
    };

    // Dynamic doughnut chart options with API-based total
    const getDoughnutOptions = () => {
        // Calculate total from current data
        const currentData = getDoughnutData();
        const total = currentData.datasets[0].data.reduce((sum: number, value: number) => sum + value, 0);
        
        return {
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
                            const value = context.raw as number;
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                            return `${context.label}: ${value} (${percentage}%)`;
                        },
                    },
                },
            },
        };
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
                        <p className="text-gray-600">
                            Overall report on system performance
                            {!loading && (
                                <span className="ml-2 text-sm text-blue-600 font-medium">
                                    ({getTimePeriodDisplay()})
                                </span>
                            )}
                        </p>
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
                                <div key={card.title} className="bg-white p-6 rounded-lg border border-gray-200 flex justify-between items-start transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-blue-200 cursor-pointer">
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
                                    <div className={`p-2 rounded-lg ${card.iconBg} transition-transform hover:scale-110`}>{card.icon}</div>
                                </div>
                            ))}
                        </div>

                        {/* Line Chart */}
                        <div className="bg-white p-6 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center mb-4">
                                <div>
                                    <h3 className="font-semibold">Registration Trends</h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Data from {getTimePeriodDisplay()}
                                    </p>
                                </div>
                                <div className="relative" ref={trendsDropdownRef}>
                                    <button 
                                        onClick={() => setIsTrendsDropdownOpen(!isTrendsDropdownOpen)}
                                        className="flex items-center gap-2 text-sm px-3 py-1.5 border rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        {trendsPeriod === '7days' ? 'Last 7 days' : 
                                         trendsPeriod === '30days' ? 'Last month' : 'Last year'} 
                                        <FiChevronDown className={`transition-transform ${isTrendsDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {isTrendsDropdownOpen && (
                                        <div className="absolute right-0 top-full mt-1 w-32 bg-white border rounded-lg shadow-lg z-10">
                                            <button 
                                                onClick={() => { 
                                                    setTrendsPeriod('7days'); 
                                                    setIsTrendsDropdownOpen(false); 
                                                }}
                                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg ${trendsPeriod === '7days' ? 'bg-blue-50 text-blue-600' : ''}`}
                                            >
                                                Last 7 days
                                            </button>
                                            <button 
                                                onClick={() => { 
                                                    setTrendsPeriod('30days'); 
                                                    setIsTrendsDropdownOpen(false); 
                                                }}
                                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${trendsPeriod === '30days' ? 'bg-blue-50 text-blue-600' : ''}`}
                                            >
                                                Last month
                                            </button>
                                            <button 
                                                onClick={() => { 
                                                    setTrendsPeriod('1year'); 
                                                    setIsTrendsDropdownOpen(false); 
                                                }}
                                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 last:rounded-b-lg ${trendsPeriod === '1year' ? 'bg-blue-50 text-blue-600' : ''}`}
                                            >
                                                Last year
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {chartsLoading ? (
                                <div className="h-80 flex items-center justify-center">
                                    <div className="flex items-center space-x-2">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                        <span className="text-gray-500">Loading chart data...</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-80"><Line data={getLineData()} options={getLineOptions()} /></div>
                            )}
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
                                <Doughnut data={getDoughnutData()} options={getDoughnutOptions()} />
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