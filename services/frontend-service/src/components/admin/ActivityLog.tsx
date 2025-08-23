import React, { useState, useRef, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { FiSearch, FiChevronDown } from 'react-icons/fi';
import { useNotifications } from '../../hooks/useNotifications';

import BellIcon from '../../assets/bell-outlined.png';
import NotificationPanel from './NotificationPanelAdmin';

import { ActivityLogDetails } from './';
import adminApi from '../../services/adminApi';
import AdminHeaderDropdown from './AdminHeaderDropdown';

interface Log {
  log_id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values: any;
  new_values: any;
  ip_address: string;
  user_agent: string;
  session_id: string;
  success: boolean;
  error_message?: string;
  created_at: string;
  user: {
    full_name: string;
    email: string;
    role: string;
  };
  
  // Computed fields for display
  id?: number;
  time?: string;
  fullName?: string;
  userRole?: 'HR' | 'Candidate' | 'Admin' | 'System';
  details?: string;
  actions?: string;
  ip?: string;
  location?: string;
}

interface ActivityLogProps {
  currentUser?: any;
}

// Helper functions
const mapUserRole = (role: string): 'HR' | 'Candidate' | 'Admin' | 'System' => {
    if (!role) return 'System';
    const normalizedRole = role.toLowerCase();
    if (normalizedRole === 'admin') return 'Admin';
    if (normalizedRole === 'hr' || normalizedRole === 'recruiter') return 'HR';
    if (normalizedRole === 'candidate') return 'Candidate';
    return 'System';
};

const formatLogDetails = (log: any): string => {
    if (!log.action) return 'System activity';
    
    const action = log.action.toLowerCase();
    const entityType = log.entity_type || 'item';
    
    switch (action) {
        case 'create':
            return `Created new ${entityType}`;
        case 'update':
            return `Updated ${entityType}`;
        case 'delete':
            return `Deleted ${entityType}`;
        case 'login':
            return 'User logged in';
        case 'logout':
            return 'User logged out';
        case 'register':
            return 'User registered';
        case 'deactivate':
            return `Deactivated ${entityType}`;
        case 'activate':
            return `Activated ${entityType}`;
        default:
            return `${action.charAt(0).toUpperCase() + action.slice(1)} ${entityType}`;
    }
};

const getLogLevel = (log: any): string => {
    if (log.level) return log.level;
    
    // Map level based on success status and action type
    if (log.success === false || log.error_message) return 'error';
    
    const action = log.action?.toLowerCase() || '';
    if (action.includes('delete') || action.includes('deactivate') || action.includes('remove')) return 'warn';
    if (action.includes('logout') || action.includes('view') || action.includes('read')) return 'debug';
    if (action.includes('login') || action.includes('create') || action.includes('register') || action.includes('activate')) return 'info';
    return 'info';
};

const ActivityLog: React.FC<ActivityLogProps> = ({ currentUser }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [notifOpen, setNotifOpen] = useState(false);
    const { unreadCount, markAllAsRead } = useNotifications();
    const [selectedDate, setSelectedDate] = useState('2023-07-19');

    const [isPageSelectOpen, setIsPageSelectOpen] = useState(false);
    const [isLevelFilterOpen, setIsLevelFilterOpen] = useState(false);
    const pageSelectRef = useRef<HTMLDivElement>(null);
    const levelFilterRef = useRef<HTMLDivElement>(null);
    const [selectedLog, setSelectedLog] = useState<Log | null>(null);
    
    // API data states
    const [logs, setLogs] = useState<Log[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [levelFilter, setLevelFilter] = useState<string>('all');
    const [endDate, setEndDate] = useState<string>('');
    const [totalLogs, setTotalLogs] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 500); // 500ms delay

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Reset to first page when debounced search changes (except for initial load)
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    
    useEffect(() => {
        if (!isInitialLoad && currentPage !== 1) {
            resetToFirstPage();
        }
        setIsInitialLoad(false);
    }, [debouncedSearchQuery]);

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
                
                if (debouncedSearchQuery.trim()) {
                    params.search = debouncedSearchQuery;
                }
                
                console.log('Fetching logs with params:', params); // Debug log
                const apiResponse = await adminApi.getLogs(params);
                console.log('Logs API Response:', apiResponse); // Debug log
                
                // Handle different response formats
                let logsData = [];
                let paginationInfo = {
                    total: 0,
                    totalPages: 1,
                    page: currentPage,
                    limit: itemsPerPage
                };
                
                if (apiResponse && apiResponse.logs) {
                    // Structure: { logs: [], pagination: {...} }
                    logsData = apiResponse.logs || [];
                    paginationInfo = {
                        total: apiResponse.pagination?.total || 0,
                        totalPages: apiResponse.pagination?.totalPages || 1,
                        page: apiResponse.pagination?.page || currentPage,
                        limit: apiResponse.pagination?.limit || itemsPerPage
                    };
                } else if (apiResponse && Array.isArray(apiResponse)) {
                    // Direct array response
                    logsData = apiResponse;
                    paginationInfo.total = logsData.length;
                } else if (apiResponse && apiResponse.data) {
                    // Nested structure: { data: { logs: [], pagination: {...} } }
                    logsData = apiResponse.data.logs || [];
                    paginationInfo = {
                        total: apiResponse.data.pagination?.total || 0,
                        totalPages: apiResponse.data.pagination?.totalPages || 1,
                        page: apiResponse.data.pagination?.page || currentPage,
                        limit: apiResponse.data.pagination?.limit || itemsPerPage
                    };
                }
                
                console.log('Parsed logs data:', logsData);
                console.log('Pagination info:', paginationInfo);
                
                // Update pagination states
                setTotalLogs(paginationInfo.total);
                setTotalPages(paginationInfo.totalPages);
                
                // Ensure logsData is an array
                if (!Array.isArray(logsData)) {
                    console.error('Logs data is not an array:', logsData);
                    setError('Invalid logs data format received.');
                    setLogs([]);
                    setTotalLogs(0);
                    setTotalPages(1);
                    return;
                }
                
                // Transform API data to match component interface
                const transformedLogs = logsData.map((log: any, index: number) => {
                    // Create a log object with both original and computed fields
                    const transformedLog: Log = {
                        // Original database fields
                        log_id: log.log_id,
                        user_id: log.user_id,
                        action: log.action,
                        entity_type: log.entity_type,
                        entity_id: log.entity_id,
                        old_values: log.old_values,
                        new_values: log.new_values,
                        ip_address: log.ip_address,
                        user_agent: log.user_agent,
                        session_id: log.session_id,
                        success: log.success,
                        error_message: log.error_message,
                        created_at: log.created_at,
                        user: log.user || { full_name: 'System', email: '', role: 'SYSTEM' },
                        
                        // Computed fields for display
                        id: parseInt(log.log_id?.substr(-6), 16) || index + 1,
                        time: log.created_at ? new Date(log.created_at).toLocaleString('en-GB', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                        }) : '15:50PM 2025-06-08',
                        fullName: log.user?.full_name || 'System',
                        userRole: mapUserRole(log.user?.role),
                        details: formatLogDetails(log),
                        actions: log.action || 'Unknown',
                        ip: log.ip_address || '192.168.1.1',
                        location: 'Unknown' // audit_logs doesn't store location
                    };
                    
                    return transformedLog;
                });
                
                console.log('Transformed logs:', transformedLogs); // Debug log
                setLogs(transformedLogs);
                
            } catch (err) {
                console.error('Error fetching logs:', err);
                setError('Failed to load activity logs.');
                // No fallback mock data - show empty state instead
                setLogs([]);
                setTotalLogs(0);
                setTotalPages(1);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [currentPage, itemsPerPage, levelFilter, selectedDate, endDate, debouncedSearchQuery]);

    // Handle click outside to close dropdowns
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pageSelectRef.current && !pageSelectRef.current.contains(event.target as Node)) {
                setIsPageSelectOpen(false);
            }
            if (levelFilterRef.current && !levelFilterRef.current.contains(event.target as Node)) {
                setIsLevelFilterOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    // Helper functions
    
    const pageOptions = [10, 20, 50, 100];

    // Reset to page 1 when filters change (except for page change itself)
    const resetToFirstPage = () => {
        if (currentPage !== 1) {
            setCurrentPage(1);
        }
    };

    // Handle filter changes
    const handleLevelFilterChange = (newLevel: string) => {
        setLevelFilter(newLevel);
        resetToFirstPage();
    };

    const handleSearchChange = (newQuery: string) => {
        setSearchQuery(newQuery);
        // Don't reset page immediately - let debounce handle it
    };

    const handleDateChange = (type: 'start' | 'end', newDate: string) => {
        if (type === 'start') {
            setSelectedDate(newDate);
        } else {
            setEndDate(newDate);
        }
        resetToFirstPage();
    };

    const handleItemsPerPageChange = (newLimit: number) => {
        setItemsPerPage(newLimit);
        resetToFirstPage();
    };

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
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 text-red-500 text-xs font-bold">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>
                        <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} position="header" onMarkAllAsRead={markAllAsRead} />
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
                                        onChange={(e) => handleDateChange('start', e.target.value)} 
                                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-xs text-gray-500 mb-1">End Date</label>
                                    <input 
                                        type="date" 
                                        value={endDate} 
                                        onChange={(e) => handleDateChange('end', e.target.value)} 
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
                                    <div className="text-lg font-semibold text-gray-800">Total Logs: {totalLogs}</div>
                                    <div className="flex items-center space-x-4">
                                        <div className="relative">
                                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input 
                                                type="text" 
                                                placeholder="Search users, actions" 
                                                value={searchQuery}
                                                onChange={(e) => handleSearchChange(e.target.value)}
                                                className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300" 
                                            />
                                        </div>
                                        <div ref={levelFilterRef} className="relative inline-block">
                                            <button 
                                                onClick={() => setIsLevelFilterOpen(!isLevelFilterOpen)} 
                                                className="flex items-center justify-between w-32 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-[#007BFF]"
                                            >
                                                <span className="text-left">
                                                    {levelFilter === 'all' ? 'All Levels' : 
                                                     levelFilter === 'error' ? 'Error' :
                                                     levelFilter === 'warn' ? 'Warning' :
                                                     levelFilter === 'info' ? 'Info' : 'Debug'}
                                                </span>
                                                <FiChevronDown className="text-gray-500" />
                                            </button>
                                            {isLevelFilterOpen && (
                                                <div className="absolute top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                                    <div 
                                                        onClick={() => { handleLevelFilterChange('all'); setIsLevelFilterOpen(false); }} 
                                                        className="px-3 py-2 text-left cursor-pointer hover:bg-[#007BFF] hover:text-white rounded-t-lg"
                                                    >
                                                        All Levels
                                                    </div>
                                                    <div 
                                                        onClick={() => { handleLevelFilterChange('error'); setIsLevelFilterOpen(false); }} 
                                                        className="px-3 py-2 text-left cursor-pointer hover:bg-[#007BFF] hover:text-white"
                                                    >
                                                        Error
                                                    </div>
                                                    <div 
                                                        onClick={() => { handleLevelFilterChange('warn'); setIsLevelFilterOpen(false); }} 
                                                        className="px-3 py-2 text-left cursor-pointer hover:bg-[#007BFF] hover:text-white"
                                                    >
                                                        Warning
                                                    </div>
                                                    <div 
                                                        onClick={() => { handleLevelFilterChange('info'); setIsLevelFilterOpen(false); }} 
                                                        className="px-3 py-2 text-left cursor-pointer hover:bg-[#007BFF] hover:text-white"
                                                    >
                                                        Info
                                                    </div>
                                                    <div 
                                                        onClick={() => { handleLevelFilterChange('debug'); setIsLevelFilterOpen(false); }} 
                                                        className="px-3 py-2 text-left cursor-pointer hover:bg-[#007BFF] hover:text-white rounded-b-lg"
                                                    >
                                                        Debug
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-black text-sm">
                                            {['Time', 'Full name', 'User', 'Level', 'Details', 'Actions', 'IP', 'Location'].map(header => (
                                                <th key={header} className="pb-4 font-semibold">{header} <FiChevronDown className="inline-block" /></th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan={8} className="text-center py-8">Loading activity logs...</td></tr>
                                        ) : error ? (
                                            <tr><td colSpan={8} className="text-center py-8 text-red-500">{error}</td></tr>
                                        ) : logs.length === 0 ? (
                                            <tr><td colSpan={8} className="text-center py-8 text-gray-500">No logs found</td></tr>
                                        ) : logs.map((log) => (
                                            <tr key={log.log_id || log.id} className="border-t border-gray-100 hover:bg-blue-50 cursor-pointer" onClick={() => setSelectedLog(log)}>
                                                <td className="py-4 text-gray-500">{log.time}</td>
                                                <td className="py-4 font-medium">{log.fullName || log.user?.full_name}</td>
                                                <td className="py-4"><span className={`px-3 py-1 rounded-full text-sm border ${getUserTypeColor(log.userRole || mapUserRole(log.user?.role))}`}>{log.userRole || mapUserRole(log.user?.role)}</span></td>
                                                <td className="py-4"><span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(getLogLevel(log))}`}>{getLogLevel(log).toUpperCase()}</span></td>
                                                <td className="py-4">{log.details || formatLogDetails(log)}</td>
                                                <td className="py-4"><span className={`px-3 py-1 rounded-full text-sm border ${getActionColor(log.actions || log.action)}`}>{log.actions || log.action}</span></td>
                                                <td className="py-4">{log.ip || log.ip_address}</td>
                                                <td className="py-4">{log.location || 'Unknown'}</td>
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
                                                    <div key={option} onClick={() => { handleItemsPerPageChange(option); setIsPageSelectOpen(false); }} className="px-2 py-0.5 text-center cursor-pointer hover:bg-[#007BFF] hover:text-white">{option}</div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-gray-600 whitespace-nowrap">Logs per page</span>
                                </div>
                                {totalPages > 1 && (
                                <div className="flex items-center gap-2">
                                    <button 
                                        className="min-w-[32px] h-8 px-2 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        &lt;
                                    </button>
                                    
                                    {/* Dynamic pagination */}
                                    {(() => {
                                        const pages = [];
                                        const maxVisiblePages = 5;
                                        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
                                        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
                                        
                                        // Adjust start page if we're near the end
                                        if (endPage - startPage + 1 < maxVisiblePages) {
                                            startPage = Math.max(1, endPage - maxVisiblePages + 1);
                                        }
                                        
                                        // Add first page and ellipsis if needed
                                        if (startPage > 1) {
                                            pages.push(
                                                <button key={1} className={`min-w-[32px] h-8 px-2 flex items-center justify-center rounded ${currentPage === 1 ? 'bg-[#007BFF] text-white' : 'border border-transparent text-[#007BFF] hover:bg-blue-50'}`} onClick={() => setCurrentPage(1)}>1</button>
                                            );
                                            if (startPage > 2) {
                                                pages.push(<span key="ellipsis-start" className="px-2">...</span>);
                                            }
                                        }
                                        
                                        // Add visible pages
                                        for (let page = startPage; page <= endPage; page++) {
                                            pages.push(
                                                <button key={page} className={`min-w-[32px] h-8 px-2 flex items-center justify-center rounded ${currentPage === page ? 'bg-[#007BFF] text-white' : 'border border-transparent text-[#007BFF] hover:bg-blue-50'}`} onClick={() => setCurrentPage(page)}>{page}</button>
                                            );
                                        }
                                        
                                        // Add ellipsis and last page if needed
                                        if (endPage < totalPages) {
                                            if (endPage < totalPages - 1) {
                                                pages.push(<span key="ellipsis-end" className="px-2">...</span>);
                                            }
                                            pages.push(
                                                <button key={totalPages} className={`min-w-[32px] h-8 px-2 flex items-center justify-center rounded ${currentPage === totalPages ? 'bg-[#007BFF] text-white' : 'border border-transparent text-[#007BFF] hover:bg-blue-50'}`} onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>
                                            );
                                        }
                                        
                                        return pages;
                                    })()}
                                    
                                    <button 
                                        className="min-w-[32px] h-8 px-2 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        &gt;
                                    </button>
                                </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </AdminLayout>
    );
};

export default ActivityLog; 