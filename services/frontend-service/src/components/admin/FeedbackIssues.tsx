import React, { useState, useRef, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import { FiSearch, FiFilter, FiChevronDown, FiMoreHorizontal, FiBold, FiItalic, FiLink, FiX, FiSmile, FiList } from 'react-icons/fi';
import AvatarImg from '../../assets/Avatar17.png';
import BellIcon from '../../assets/bell-outlined.png';
import NotificationPanel from './NotificationPanelAdmin';
import SchemeIcon from '../../assets/scheme.png';
import adminApi from '../../services/adminApi';
import AdminHeaderDropdown from './AdminHeaderDropdown';

interface FeedbackItem {
  id: number;
  time: string;
  status: 'Pending' | 'Resolved';
  contents: string;
  user: 'HR' | 'Candidate';
  type: 'Issue' | 'Feedback';
}

interface FeedbackIssuesProps {
  currentUser?: any;
}

const FeedbackIssues: React.FC<FeedbackIssuesProps> = ({ currentUser }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [notifOpen, setNotifOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(true);
    const [selectedDate, setSelectedDate] = useState('2023-07-19');
    const dateInputRef = useRef<HTMLInputElement | null>(null);
    const [isPageSelectOpen, setIsPageSelectOpen] = useState(false);
    const pageSelectRef = useRef<HTMLDivElement>(null);
    const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
    
    // API data states
    const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch feedback data
    useEffect(() => {
        const fetchFeedbackData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const feedbackData = await adminApi.getAllFeedback();
                
                if (Array.isArray(feedbackData)) {
                    // Transform API data to component format
                    const transformedFeedback = feedbackData.map((item: any, index: number) => ({
                        id: item.id || index + 1,
                        time: item.created_at ? new Date(item.created_at).toLocaleString() : '15:50PM 2025-06-08',
                        status: item.status === 'resolved' ? 'Resolved' as const : 'Pending' as const,
                        contents: item.content || item.message || 'No content',
                        user: item.user_type === 'hr' ? 'HR' as const : 'Candidate' as const,
                        type: item.type === 'feedback' ? 'Feedback' as const : 'Issue' as const
                    }));
                    setFeedbacks(transformedFeedback);
                } else {
                    // Fallback to mock data if API fails or returns unexpected format
                    setFeedbacks([
                        { id: 1, time: '15:50PM 2025-06-08', status: 'Pending', contents: 'Login error', user: 'HR', type: 'Issue' },
                        { id: 2, time: '15:50PM 2025-06-08', status: 'Resolved', contents: 'User-friendly and easy to use', user: 'Candidate', type: 'Feedback' },
                        { id: 3, time: '15:50PM 2025-06-08', status: 'Resolved', contents: 'Too many operational processes', user: 'Candidate', type: 'Issue' },
                        { id: 4, time: '15:50PM 2025-06-08', status: 'Resolved', contents: 'Difficult to use', user: 'HR', type: 'Issue' },
                        { id: 5, time: '15:50PM 2025-06-08', status: 'Pending', contents: 'Convenient', user: 'Candidate', type: 'Feedback' },
                        { id: 6, time: '15:50PM 2025-06-08', status: 'Pending', contents: 'User-friendly', user: 'Candidate', type: 'Feedback' },
                        { id: 7, time: '15:50PM 2025-06-08', status: 'Pending', contents: 'Easy to use', user: 'HR', type: 'Issue' },
                    ]);
                }
            } catch (err) {
                console.error('Error fetching feedback data:', err);
                setError('Failed to load feedback data');
                // Fallback to mock data on error
                setFeedbacks([
                    { id: 1, time: '15:50PM 2025-06-08', status: 'Pending', contents: 'Login error', user: 'HR', type: 'Issue' },
                    { id: 2, time: '15:50PM 2025-06-08', status: 'Resolved', contents: 'User-friendly and easy to use', user: 'Candidate', type: 'Feedback' },
                    { id: 3, time: '15:50PM 2025-06-08', status: 'Resolved', contents: 'Too many operational processes', user: 'Candidate', type: 'Issue' },
                    { id: 4, time: '15:50PM 2025-06-08', status: 'Resolved', contents: 'Difficult to use', user: 'HR', type: 'Issue' },
                    { id: 5, time: '15:50PM 2025-06-08', status: 'Pending', contents: 'Convenient', user: 'Candidate', type: 'Feedback' },
                    { id: 6, time: '15:50PM 2025-06-08', status: 'Pending', contents: 'User-friendly', user: 'Candidate', type: 'Feedback' },
                    { id: 7, time: '15:50PM 2025-06-08', status: 'Pending', contents: 'Easy to use', user: 'HR', type: 'Issue' },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchFeedbackData();
    }, []);

    const openDatePicker = () => {
        dateInputRef.current?.showPicker?.();
        dateInputRef.current?.click();
    };
    
    const getStatusColor = (status: 'Pending' | 'Resolved') => status === 'Resolved' ? 'border-green-400 bg-green-50 text-green-700' : 'border-yellow-400 bg-yellow-50 text-yellow-700';
    const getUserColor = (user: 'HR' | 'Candidate') => user === 'HR' ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-red-400 bg-red-50 text-red-700';
    
    const pageOptions = [10, 20, 30];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pageSelectRef.current && !pageSelectRef.current.contains(event.target as Node)) {
                setIsPageSelectOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <AdminLayout>
            <div className="p-8 bg-white text-left">
                <div className="flex items-center justify-between mb-6">
                    <AdminHeaderDropdown currentUser={currentUser} />
                    <div className="flex items-center space-x-6 relative">
                        <button onClick={() => setNotifOpen(!notifOpen)} className="relative focus:outline-none"><img src={BellIcon} alt="Notifications" className="w-5 h-5" />{hasUnread && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />}</button>
                        <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} position="header" onMarkAllAsRead={() => setHasUnread(false)} />
                    </div>
                </div>
                <div className="border-t border-gray-200 mb-6"></div>
                <div className="flex justify-between items-center mb-6">
                    <div><h1 className="text-2xl font-semibold text-gray-800">Feedback & Issues</h1><p className="text-gray-600">Here is your feedbacks status from July 19 - July 25.</p></div>
                    <div className="relative">
                        <input ref={dateInputRef} type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <div className="flex items-center pl-4 pr-10 py-2 w-48 text-left text-gray-700 border rounded-md bg-white select-none cursor-pointer" onClick={openDatePicker}>
                            <span>{new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(new Date(selectedDate).getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { day: 'numeric' })}</span>
                            <img src={SchemeIcon} alt="calendar" onClick={openDatePicker} className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 cursor-pointer" />
                        </div>
                    </div>
                </div>
                <div className="mb-6 border-b border-gray-200"><nav className="flex space-x-8"><button className="py-4 px-1 border-b-2 font-medium text-sm border-[#007BFF] text-[#007BFF]">Feedbacks</button></nav></div>
                <div className="bg-white rounded-lg border border-gray-200">
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                            <div className="text-lg font-semibold text-gray-800">Total Feedbacks: {feedbacks.length}</div>
                            <div className="flex items-center space-x-4">
                                <div className="relative"><FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder="Search users, contents" className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg" /></div>
                                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg"><FiFilter /><span>Filter</span></button>
                            </div>
                        </div>
                        <table className="w-full text-left">
                            <thead><tr className="text-gray-500 text-sm">{['Time', 'Status', 'Contents', 'User', 'Type'].map(h => <th key={h} className="pb-4 font-medium">{h} <FiChevronDown className="inline-block" /></th>)}<th className="pb-4"></th></tr></thead>
                            <tbody>{feedbacks.map((f) => (<tr key={f.id} className="border-t border-gray-100 hover:bg-blue-50 cursor-pointer" onClick={() => setSelectedFeedback(f)}><td className="py-4 text-gray-500">{f.time}</td><td className="py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(f.status)}`}>{f.status}</span></td><td className="py-4 font-medium">{f.contents}</td><td className="py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium border ${getUserColor(f.user)}`}>{f.user}</span></td><td className="py-4">{f.type}</td><td className="py-4 text-right"><button className="text-gray-400 hover:text-gray-600"><FiMoreHorizontal /></button></td></tr>))}</tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-600">View</span>
                            <div ref={pageSelectRef} className="relative inline-block">
                                <button onClick={() => setIsPageSelectOpen(!isPageSelectOpen)} className="flex items-center justify-between w-16 border rounded px-2 py-0.5"><><span>{itemsPerPage}</span><FiChevronDown className="text-gray-500" /></></button>
                                {isPageSelectOpen && <div className="absolute bottom-full mb-1 w-16 bg-white border rounded shadow-lg z-10">{pageOptions.map(o => <div key={o} onClick={() => { setItemsPerPage(o); setIsPageSelectOpen(false); }} className="px-2 py-1 text-center cursor-pointer hover:bg-[#007BFF] hover:text-white">{o}</div>)}</div>}
                            </div>
                            <span className="text-gray-600 whitespace-nowrap">Feedbacks per page</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="min-w-[32px] h-8 px-2 flex items-center justify-center border rounded hover:bg-gray-50">&lt;</button>
                            {[1, 2, 3].map(p => <button key={p} className={`w-8 h-8 rounded ${currentPage === p ? 'bg-[#007BFF] text-white' : 'text-[#007BFF] hover:bg-blue-50'}`} onClick={() => setCurrentPage(p)}>{p}</button>)}
                            <button className="min-w-[32px] h-8 px-2 flex items-center justify-center border rounded hover:bg-gray-50">&gt;</button>
                        </div>
                    </div>
                </div>
            </div>
            {selectedFeedback && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-8 m-4">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                                <img src={AvatarImg} alt="Jerome Bell" className="w-12 h-12 rounded-full" />
                                <div className="text-left">
                                    <h3 className="font-semibold text-lg">Jerome Bell</h3>
                                    <p className="text-sm text-gray-500">Candidate • Feedback • {selectedFeedback.time}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedFeedback(null)} className="p-1 rounded-full hover:bg-gray-200"><FiX size={20} /></button>
                        </div>
                        <p className="text-gray-800 pb-6 mb-6 border-b text-left">{selectedFeedback.contents}</p>
                        <div className="space-y-2 text-left">
                            <label className="font-medium text-gray-700">Response</label>
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <textarea rows={5} placeholder="Add a cover letter or anything else you want to share" className="w-full p-3 focus:outline-none resize-none border-0"></textarea>
                                <div className="p-2 border-t border-gray-200">
                                    <div className="flex items-center gap-4 text-gray-500">
                                        <FiSmile className="cursor-pointer hover:text-gray-800" />
                                        <FiBold className="cursor-pointer hover:text-gray-800" />
                                        <FiItalic className="cursor-pointer hover:text-gray-800" />
                                        <FiList className="cursor-pointer hover:text-gray-800" />
                                        <FiLink className="cursor-pointer hover:text-gray-800" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-sm text-gray-500"><p>Maximum 500 characters</p><p>0/500</p></div>
                        </div>
                        <button className="w-full mt-6 py-2.5 bg-[#007BFF] text-white rounded-lg font-semibold hover:bg-blue-600">Submit</button>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default FeedbackIssues; 