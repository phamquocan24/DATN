import React, { useState, useRef, useEffect } from 'react';
import { FiEye, FiBriefcase, FiChevronDown, FiUpload, FiMenu } from 'react-icons/fi';
import { Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler, TooltipItem } from 'chart.js';
import AvatarImg from '../../assets/Avatar17.png';
import BellIcon from '../../assets/bell-outlined.png';
import HrNotificationPanel from './HrNotificationPanel';
import HrLayout from './HrLayout';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

const AnalyticsTab: React.FC = () => {
    const [notifOpen, setNotifOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(true);
    const [isExportOpen, setIsExportOpen] = useState(false);
    const exportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportRef.current && !exportRef.current.contains(event.target as Node)) {
                setIsExportOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const statsCards = [
        { title: "Total Jobs", value: "23,564", change: "6.4%", changeType: "increase", icon: <FiEye className="text-yellow-500" />, iconBg: "bg-yellow-100" },
        { title: "Total Applied", value: "132", change: "0.4%", changeType: "decrease", icon: <FiBriefcase className="text-blue-500" />, iconBg: "bg-blue-100" }
    ];

    const doughnutData = {
        labels: ['In Review', 'Interview', 'Mini-test', 'Hired'],
        datasets: [{
            data: [243, 135, 108, 54],
            backgroundColor: ['#FFB836', '#4D7DFF', '#A78BFA', '#2ED47A'],
            borderWidth: 0,
            cutout: '75%',
        }],
    };
    
    const lineData = {
        labels: ['19 Jul', '20 Jul', '21 Jul', '22 Jul', '23 Jul', '24 Jul', '25 Jul'],
        datasets: [{
            label: 'Views',
            data: [350, 50, 450, 150, 500, 300, 600],
            fill: false,
            borderColor: '#2ED47A',
            tension: 0.4,
            pointBackgroundColor: 'transparent',
            pointBorderColor: 'transparent',
            pointHoverBackgroundColor: '#2ED47A',
            pointHoverBorderColor: '#fff',
        }]
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

    return (
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
    );
};

export default AnalyticsTab; 