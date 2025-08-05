import React, { useState, useRef, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { FiSearch, FiFilter, FiChevronDown, FiMoreHorizontal } from 'react-icons/fi';

import BellIcon from '../../assets/bell-outlined.png';
import NotificationPanel from './NotificationPanelAdmin';

import { ActivityLogDetails } from './';
import adminApi from '../../services/adminApi';
import AdminHeaderDropdown from './AdminHeaderDropdown';

interface Log {
  id: number;
  time: string;
  fullName: string;
  user: 'HR' | 'Candidate' | 'Admin';
  details: string;
  actions: string;
  ip: string;
  location: string;
  level?: string;
  message?: string;
  metadata?: any;
}

interface ActivityLogProps {
  currentUser?: any;
}

const ActivityLog: React.FC<ActivityLogProps> = ({ currentUser }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [notifOpen, setNotifOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(true);
    const [selectedDate, setSelectedDate] = useState('2023-07-19');

    const [isPageSelectOpen, setIsPageSelectOpen] = useState(false);
    const pageSelectRef = useRef<HTMLDivElement>(null);
    const [selectedLog, setSelectedLog] = useState<Log | null>(null);
    
    // API data states
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [levelFilter, setLevelFilter] = useState<string>('all');
    const [endDate, setEndDate] = useState<string>('');



    // Fetch logs data
    useEffect(() => {
        const fetchLogs = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const params: any = {
                    page: currentPage,
                    limit: itemsPerPage
                };
                
                if (levelFilter !== 'all') {
                    params.level = levelFilter;
                }
                
                if (selectedDate) {
                    params.start_date = selectedDate;
                }
                
                if (endDate) {
                    params.end_date = endDate;
                }
                
                console.log('Fetching logs with params:', params); // Debug log
                const logsResponse = await adminApi.getLogs(params);
                console.log('Logs API Response:', logsResponse); // Debug log
                
                let logsData = logsResponse;
                // Handle nested structure if exists
                if (logsResponse && logsResponse.logs) {
                    logsData = logsResponse.logs;
                } else if (logsResponse && Array.isArray(logsResponse)) {
                    logsData = logsResponse;
                }
                
                // Ensure logsData is an array
                if (!Array.isArray(logsData)) {
                    console.error('Logs data is not an array:', logsData);
                    setError('Invalid logs data format received.');
                    setLogs([]);
                    return;
                }
                
                // Transform API data to match component interface
                const transformedLogs = logsData.map((log: any, index: number) => ({
                    id: log.id || index + 1,
                    time: log.timestamp ? new Date(log.timestamp).toLocaleString('en-GB', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    }) : '15:50PM 2025-06-08',
                    fullName: log.user_name || log.userName || log.metadata?.user_name || 'System User',
                    user: determineUserType(log),
                    details: log.message || log.action || log.details || 'System activity',
                    actions: extractAction(log.message || log.action || ''),
                    ip: log.ip_address || log.ip || log.metadata?.ip || '192.168.1.1',
                    location: log.location || log.metadata?.location || 'Unknown',
                    level: log.level || 'info',
                    message: log.message,
                    metadata: log.metadata
                }));
                
                console.log('Transformed logs:', transformedLogs); // Debug log
                setLogs(transformedLogs);
                
            } catch (err) {
                console.error('Error fetching logs:', err);
                setError('Failed to load activity logs.');
                // Fallback to mock data on error
                setLogs([
                    { id: 1, time: '15:50PM 2025-06-08', fullName: 'Jerome Bell', user: 'HR', details: 'Create question set', actions: 'Create Q&A', ip: '192.168.1.1', location: 'Hanoi' },
                    { id: 2, time: '15:50PM 2025-06-08', fullName: 'Jerome Bell', user: 'Candidate', details: 'Submit CV for application', actions: 'Apply', ip: '192.168.1.1', location: 'Da Nang' },
                    { id: 3, time: '15:50PM 2025-06-08', fullName: 'Jerome Bell', user: 'Candidate', details: 'Take mini-test', actions: 'Test', ip: '192.168.1.1', location: 'HCM' },
                    { id: 4, time: '15:50PM 2025-06-08', fullName: 'Jerome Bell', user: 'Candidate', details: 'Edit profile', actions: 'Edit', ip: '192.168.1.1', location: 'Hue' },
                    { id: 5, time: '15:50PM 2025-06-08', fullName: 'Jerome Bell', user: 'Admin', details: 'Login', actions: 'Login', ip: '192.168.1.1', location: 'Lao Cai' },
                    { id: 6, time: '15:50PM 2025-06-08', fullName: 'Jerome Bell', user: 'HR', details: 'Post new job', actions: 'Post job', ip: '192.168.1.1', location: 'Hung Yen' },
                    { id: 7, time: '15:50PM 2025-06-08', fullName: 'Jerome Bell', user: 'Admin', details: 'Export data', actions: 'Export', ip: '192.168.1.1', location: 'Thai Binh' },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [currentPage, itemsPerPage, levelFilter, selectedDate, endDate]);
    
    // Helper functions
    const determineUserType = (log: any): 'HR' | 'Candidate' | 'Admin' => {
        if (log.user_role || log.userRole || log.metadata?.user_role) {
            const role = (log.user_role || log.userRole || log.metadata?.user_role).toLowerCase();
            if (role === 'admin') return 'Admin';
            if (role === 'recruiter' || role === 'hr') return 'HR';
            return 'Candidate';
        }
        
        // Fallback based on message content
        const message = (log.message || '').toLowerCase();
        if (message.includes('admin') || message.includes('system')) return 'Admin';
        if (message.includes('job') || message.includes('recruit')) return 'HR';
        return 'Candidate';
    };
    
    const extractAction = (message: string): string => {
        const lowerMessage = message.toLowerCase();
        if (lowerMessage.includes('login')) return 'Login';
        if (lowerMessage.includes('logout')) return 'Logout';
        if (lowerMessage.includes('create')) return 'Create';
        if (lowerMessage.includes('update') || lowerMessage.includes('edit')) return 'Edit';
        if (lowerMessage.includes('delete')) return 'Delete';
        if (lowerMessage.includes('apply')) return 'Apply';
        if (lowerMessage.includes('test')) return 'Test';
        if (lowerMessage.includes('export')) return 'Export';
        return 'Activity';
    };
    
    const pageOptions = [10, 20, 50, 100];

    const getUserTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'hr': return 'border-blue-400 bg-blue-50 text-blue-700';
            case 'candidate': return 'border-green-400 bg-green-50 text-green-700';
            case 'admin': return 'border-red-400 bg-red-50 text-red-700';
            default: return 'border-gray-400 bg-gray-50 text-gray-700';
        }
    };
    
    const getActionColor = (action: string) => {
        switch (action.toLowerCase()) {
            case 'create q&a': return 'border-purple-400 bg-purple-50 text-purple-700';
            case 'apply': return 'border-orange-400 bg-orange-50 text-orange-700';
            case 'test': return 'border-yellow-400 bg-yellow-50 text-yellow-700';
            case 'edit': return 'border-teal-400 bg-teal-50 text-teal-700';
            case 'login': return 'border-cyan-400 bg-cyan-50 text-cyan-700';
            case 'post job': return 'border-blue-400 bg-blue-50 text-blue-700';
            case 'export': return 'border-indigo-400 bg-indigo-50 text-indigo-700';
            default: return 'border-gray-400 bg-gray-50 text-gray-700';
        }
    };

    const getLevelColor = (level: string) => {
        switch (level.toLowerCase()) {
            case 'error': return 'bg-red-100 text-red-800';
            case 'warn': 
            case 'warning': return 'bg-yellow-100 text-yellow-800';
            case 'info': return 'bg-blue-100 text-blue-800';
            case 'debug': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AdminLayout>
            <div className="p-8 bg-white text-left">
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
                
                {selectedLog ? (
                    <ActivityLogDetails log={selectedLog} onBack={() => setSelectedLog(null)} />
                ) : (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <div className="text-left">
                                <h1 className="text-2xl font-semibold text-gray-800">Activity Log</h1>
                                <p className="text-gray-600">Here is your activity logs from July 19 - July 25.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex flex-col">
                                    <label className="text-xs text-gray-500 mb-1">Start Date</label>
                                    <input 
                                        type="date" 
                                        value={selectedDate} 
                                        onChange={(e) => setSelectedDate(e.target.value)} 
                                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-xs text-gray-500 mb-1">End Date</label>
                                    <input 
                                        type="date" 
                                        value={endDate} 
                                        onChange={(e) => setEndDate(e.target.value)} 
                                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mb-6 border-b border-gray-200">
                            <nav className="flex space-x-8">
                                <button className="py-4 px-1 border-b-2 font-medium text-sm border-[#007BFF] text-[#007BFF]">Logs</button>
                            </nav>
                        </div>

                        <div className="bg-white rounded-lg border border-gray-200">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                                    <div className="text-lg font-semibold text-gray-800">Total Logs: {logs.length}</div>
                                    <div className="flex items-center space-x-4">
                                        <div className="relative">
                                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input type="text" placeholder="Search users, actions" className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300" />
                                        </div>
                                        <select 
                                            value={levelFilter} 
                                            onChange={(e) => setLevelFilter(e.target.value)}
                                            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300"
                                        >
                                            <option value="all">All Levels</option>
                                            <option value="error">Error</option>
                                            <option value="warn">Warning</option>
                                            <option value="info">Info</option>
                                            <option value="debug">Debug</option>
                                        </select>
                                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg">
                                            <FiFilter /><span>Filter</span>
                                        </button>
                                    </div>
                                </div>

                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-gray-500 text-sm">
                                            {['Time', 'Full name', 'User', 'Level', 'Details', 'Actions', 'IP', 'Location'].map(header => (
                                                <th key={header} className="pb-4 font-medium">{header} <FiChevronDown className="inline-block" /></th>
                                            ))}
                                            <th className="pb-4 font-medium"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan={9} className="text-center py-8">Loading activity logs...</td></tr>
                                        ) : error ? (
                                            <tr><td colSpan={9} className="text-center py-8 text-red-500">{error}</td></tr>
                                        ) : logs.length === 0 ? (
                                            <tr><td colSpan={9} className="text-center py-8 text-gray-500">No logs found</td></tr>
                                        ) : logs.map((log) => (
                                            <tr key={log.id} className="border-t border-gray-100 hover:bg-blue-50 cursor-pointer" onClick={() => setSelectedLog(log)}>
                                                <td className="py-4 text-gray-500">{log.time}</td>
                                                <td className="py-4 font-medium">{log.fullName}</td>
                                                <td className="py-4"><span className={`px-3 py-1 rounded-full text-sm border ${getUserTypeColor(log.user)}`}>{log.user}</span></td>
                                                <td className="py-4"><span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(log.level || 'info')}`}>{(log.level || 'info').toUpperCase()}</span></td>
                                                <td className="py-4">{log.details}</td>
                                                <td className="py-4"><span className={`px-3 py-1 rounded-full text-sm border ${getActionColor(log.actions)}`}>{log.actions}</span></td>
                                                <td className="py-4">{log.ip}</td>
                                                <td className="py-4">{log.location}</td>
                                                <td className="py-4 text-right"><button className="text-gray-400 hover:text-gray-600"><FiMoreHorizontal /></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-600">View</span>
                                    <div ref={pageSelectRef} className="relative inline-block">
                                        <button onClick={() => setIsPageSelectOpen(!isPageSelectOpen)} className="flex items-center justify-between w-16 border border-gray-300 rounded px-2 py-0.5 bg-white focus:outline-none focus:border-[#007BFF]">
                                            <span>{itemsPerPage}</span><FiChevronDown className="text-gray-500" />
                                        </button>
                                        {isPageSelectOpen && (
                                            <div className="absolute bottom-full mb-1 w-16 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                                                {pageOptions.map((option) => (
                                                    <div key={option} onClick={() => { setItemsPerPage(option); setIsPageSelectOpen(false); }} className="px-2 py-0.5 text-center cursor-pointer hover:bg-[#007BFF] hover:text-white">{option}</div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-gray-600 whitespace-nowrap">Logs per page</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="min-w-[32px] h-8 px-2 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50">&lt;</button>
                                    {[1, 2, 3].map(page => (
                                        <button key={page} className={`min-w-[32px] h-8 px-2 flex items-center justify-center rounded ${currentPage === page ? 'bg-[#007BFF] text-white' : 'border border-transparent text-[#007BFF] hover:bg-blue-50'}`} onClick={() => setCurrentPage(page)}>{page}</button>
                                    ))}
                                    <button className="min-w-[32px] h-8 px-2 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50">&gt;</button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
};

export default ActivityLog; 