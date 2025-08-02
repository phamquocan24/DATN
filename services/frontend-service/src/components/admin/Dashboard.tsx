import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';
import AvatarImg from '../../assets/Avatar17.png';
import BellIcon from '../../assets/bell-outlined.png';
import NotificationPanel from './NotificationPanelAdmin';
import User1Icon from '../../assets/user1.png';
import User2Icon from '../../assets/user2.png';
import GlassIcon from '../../assets/glass.png';
import FBIcon from '../../assets/f&b.png';
import SchemeIcon from '../../assets/scheme.png';
import adminApi from '../../services/adminApi';

// Hook for count-up animation
const useCountUp = (target: number, duration = 1000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start: number | null = null;

    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };

    requestAnimationFrame(step);
  }, [target, duration]);

  return count.toLocaleString();
};

// Small component for animated number display
const AnimatedNumber: React.FC<{ value: number; className?: string }> = ({ value, className }) => {
  const count = useCountUp(value);
  return <span className={className}>{count}</span>;
};

// Statistic card component
const StatCard: React.FC<{ label: string; value: number; color: string; onClick?: () => void }> = ({ label, value, color, onClick }) => (
  <div onClick={onClick} className={`${color} p-6 rounded-lg text-white flex justify-between items-center transition transform hover:scale-105 hover:brightness-110 cursor-pointer`}>
    <div className="flex items-center">
      <AnimatedNumber value={value} className="text-5xl font-semibold mr-4" />
      <p className="text-lg font-medium" style={{ fontFamily: 'ABeeZee, sans-serif' }}>{label}</p>
    </div>
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
  </div>
);

const Dashboard: React.FC = () => {
  // State for API data
  const [stats, setStats] = useState([
    { label: 'New Jobs to Review', value: 0, color: 'bg-blue-500', path: '/admin/job-listings' },
    { label: 'Violated Accounts', value: 0, color: 'bg-orange-500', path: '/admin/accounts' },
    { label: 'New Feedback', value: 0, color: 'bg-green-500', path: '/admin/feedback' },
  ]);

  const [jobStatsData, setJobStatsData] = useState([
    { day: 'Mon', approved: 0, pending: 0, spam: 0 },
    { day: 'Tue', approved: 0, pending: 0, spam: 0 },
    { day: 'Wed', approved: 0, pending: 0, spam: 0 },
    { day: 'Thu', approved: 0, pending: 0, spam: 0 },
    { day: 'Fri', approved: 0, pending: 0, spam: 0 },
    { day: 'Sat', approved: 0, pending: 0, spam: 0 },
    { day: 'Sun', approved: 0, pending: 0, spam: 0 },
  ]);

  const [updates, setUpdates] = useState([
    { title: 'New Employer', applied: 0, capacity: 0, icon: User1Icon, path: '/admin/accounts' },
    { title: 'New Candidate', applied: 0, capacity: 0, icon: User2Icon, path: '/admin/accounts' },
    { title: 'New Spam Post', applied: 0, capacity: 0, icon: GlassIcon, path: '/admin/job-listings' },
    { title: 'New Feedback & Issues', applied: 0, capacity: 0, icon: FBIcon, path: '/admin/feedback' },
  ]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Date picker state
  const [selectedDate, setSelectedDate] = useState('2023-07-19');
  const dateInputRef = useRef<HTMLInputElement | null>(null);

  const openDatePicker = () => {
    dateInputRef.current?.showPicker?.();
    dateInputRef.current?.click();
  };

  // Animated counters for Job Views & Applied
  const jobViewsCount = useCountUp(2342);
  const jobAppliedCount = useCountUp(654);

  const navigate = useNavigate();

  // Tab state for chart filtering
  const [selectedTab, setSelectedTab] = useState<'overview' | 'approved' | 'pending' | 'spam'>('overview');

  // Animation flag to trigger initial bar growth
  const [animateBars, setAnimateBars] = useState(false); // for main chart only
  const [animateProgress, setAnimateProgress] = useState(false); // for applicants summary

  // Notification logic
  const [notifOpen, setNotifOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch system statistics
        const systemStats = await adminApi.getSystemStatistics();
        const pendingJobs = await adminApi.getPendingJobs();
        const userStats = await adminApi.getUserStatistics();
        const _applicationStats = await adminApi.getApplicationStats();

        // Update stats
        setStats([
          { label: 'New Jobs to Review', value: pendingJobs?.length || 0, color: 'bg-blue-500', path: '/admin/job-listings' },
          { label: 'Violated Accounts', value: systemStats?.violatedAccounts || 0, color: 'bg-orange-500', path: '/admin/accounts' },
          { label: 'New Feedback', value: systemStats?.newFeedback || 0, color: 'bg-green-500', path: '/admin/feedback' },
        ]);

        // Update job stats data (you may need to process this based on your API response)
        if (systemStats?.jobStats) {
          setJobStatsData(systemStats.jobStats);
        }

        // Update recent updates
        setUpdates([
          { title: 'New Employer', applied: userStats?.newEmployers || 0, capacity: 100, icon: User1Icon, path: '/admin/accounts' },
          { title: 'New Candidate', applied: userStats?.newCandidates || 0, capacity: 100, icon: User2Icon, path: '/admin/accounts' },
          { title: 'New Spam Post', applied: systemStats?.spamPosts || 0, capacity: 50, icon: GlassIcon, path: '/admin/job-listings' },
          { title: 'New Feedback & Issues', applied: systemStats?.newFeedback || 0, capacity: 20, icon: FBIcon, path: '/admin/feedback' },
        ]);

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const toggleNotif = () => setNotifOpen((prev) => !prev);

  useEffect(() => {
    // Start animations after mount
    const timer = setTimeout(() => {
      setAnimateBars(true);
      setAnimateProgress(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (selectedTab !== 'overview') {
      // Re-trigger only main chart animation
      setAnimateBars(false);
      const timer = setTimeout(() => setAnimateBars(true), 50);
      return () => clearTimeout(timer);
    }
    // overview: do nothing
  }, [selectedTab]);

  // Helper to get segments per day based on selected tab
  const getSegments = (data: typeof jobStatsData[number]) => {
    switch (selectedTab) {
      case 'approved':
        return [{ height: data.approved, color: '#5cc858' }];
      case 'pending':
        return [{ height: data.pending, color: '#ffb836' }];
      case 'spam':
        return [{ height: data.spam, color: '#ff6666' }];
      default:
        return [
          { height: data.approved, color: '#5cc858' },
          { height: data.pending, color: '#ffb836' },
          { height: data.spam, color: '#ff6666' },
        ];
    }
  };

  const statusLabels: Record<string, string> = {
    approved: 'Approved',
    pending: 'Pending',
    spam: 'Spam',
  };

  return (
    <AdminLayout>
      <main className="p-4 sm:p-6 lg:p-8 bg-white" style={{ fontFamily: 'ABeeZee, sans-serif' }}>
        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 bg-red-500 text-white px-4 py-2 rounded text-sm hover:bg-red-600"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && (
        <div>
        {/* Top Admin Bar */}
        <div className="flex items-center justify-between mb-6">
          {/* User Info */}
          <div className="flex items-center space-x-3">
            <img src={AvatarImg} alt="Avatar" className="w-10 h-10 rounded-full" />
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800">Maria Kelly</p>
              <p className="text-xs text-gray-500">MariaKelly@email.com</p>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
            </svg>
          </div>

          {/* Right actions */}
          <div className="flex items-center space-x-6 relative">
            {/* Notification */}
            <button onClick={toggleNotif} className="relative focus:outline-none">
              <img src={BellIcon} alt="Notifications" className="w-5 h-5" />
              {hasUnread && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />}
            </button>

            {/* Add account button */}
            <button className="text-white flex items-center px-4 py-2 rounded-lg text-sm font-medium" style={{backgroundColor:'#007BFF'}}>
              <span className="mr-2 text-lg leading-none">+</span>
              Add account
            </button>

            {/* Notification Panel */}
            <NotificationPanel
              isOpen={notifOpen}
              onClose={() => setNotifOpen(false)}
              position="header"
              onMarkAllAsRead={() => setHasUnread(false)}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 mb-6"></div>

        {/* Header (greeting) */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-left text-2xl font-normal text-gray-800" style={{ fontFamily: 'ABeeZee, sans-serif' }}>
              Good morning, Maria
            </h1>
            <p className="text-left text-gray-500 font-medium" style={{ fontFamily: 'ABeeZee, sans-serif' }}>
              Here is your job listings statistic report from July 19 - July 25.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="relative">
              {/* Hidden date input */}
              <input
                ref={dateInputRef}
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              {/* Display */}
              <span className="pl-4 pr-10 py-2 inline-block w-48 text-left text-gray-700 border rounded-md bg-white select-none cursor-pointer" onClick={openDatePicker}>
                {new Date(selectedDate).toLocaleDateString('en-US')}
              </span>
              {/* Scheme icon clickable */}
              <img src={SchemeIcon} alt="scheme" onClick={openDatePicker} className="absolute right-4 top-2.5 w-4 h-4 cursor-pointer" />
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((s, i) => (
            <StatCard key={i} label={s.label} value={s.value} color={s.color} onClick={() => navigate(s.path)} />
          ))}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Job Statistics */}
          <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-left text-xl font-normal text-gray-800" style={{fontFamily: 'ABeeZee, sans-serif'}}>Job statistics</h2>
                <p className="text-left text-sm text-gray-500">Showing Jobstatistic Jul 19-25</p>
              </div>
              {/* Pill Tab */}
              <div className="flex space-x-1 bg-indigo-50 p-1 rounded-full">
                <button className="px-4 py-1.5 text-sm font-semibold text-blue-600 bg-white rounded-full shadow-sm">Week</button>
                <button className="px-4 py-1.5 text-sm font-semibold text-gray-600">Month</button>
                <button className="px-4 py-1.5 text-sm font-semibold text-gray-600">Year</button>
              </div>
            </div>
            
            <div className="flex space-x-8 border-b mb-6">
                {[
                  { key: 'overview', label: 'Overview' },
                  { key: 'approved', label: 'Approved' },
                  { key: 'pending', label: 'Pending' },
                  { key: 'spam', label: 'Spam' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedTab(tab.key as any)}
                    className={`py-2 text-base font-semibold focus:outline-none transition-colors ${
                      selectedTab === tab.key ? 'text-gray-800 border-b-2 border-blue-600' : 'text-gray-500'
                    }`}
                  >
                    {tab.label}
                  </button>
          ))}
        </div>

            {/* Chart */}
            <div className="flex flex-col lg:flex-row">
              {/* Bar chart & legend */}
              <div className="flex-1">
                <div className="flex h-64 items-end justify-between space-x-4">
                  {jobStatsData.map((data) => (
                    <div key={data.day} className="flex-1 flex flex-col items-center group">
                       {/* Bar & tooltip wrapper */}
                       <div className="relative w-12">
                         {/* Tooltip */}
                         <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
                           <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
                             {(() => {
                               const segs = getSegments(data);
                               if (selectedTab === 'overview') {
                                 return (
                                   <>
                                     <div className="flex items-center space-x-2"><span className="w-2 h-2 bg-green-400 inline-block rounded-sm"></span><span>{statusLabels.approved}: {data.approved}</span></div>
                                     <div className="flex items-center space-x-2"><span className="w-2 h-2 bg-yellow-400 inline-block rounded-sm"></span><span>{statusLabels.pending}: {data.pending}</span></div>
                                     <div className="flex items-center space-x-2"><span className="w-2 h-2 bg-red-400 inline-block rounded-sm"></span><span>{statusLabels.spam}: {data.spam}</span></div>
                                   </>
                                 );
                               } else {
                                 const label = statusLabels[selectedTab];
                                 return <span>{label}: {segs[0].height}</span>;
                               }
                             })()}
                           </div>
                         </div>
                         {/* Bar container with overflow for rounded corners */}
                         <div className="flex flex-col-reverse rounded-md overflow-hidden transition-transform transform hover:scale-105 hover:brightness-110">
                           {getSegments(data).map((seg, idx) => (
                             <div
                               key={idx}
                               style={{
                                 height: `${animateBars ? seg.height : 0}px`,
                                 backgroundColor: seg.color,
                                 transition: 'height 0.5s ease',
                               }}
                               className="w-full"
                             />
                           ))}
                         </div>
                       </div>
                      <p className="mt-2 text-sm text-gray-500">{data.day}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-start space-x-6 mt-4">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-sm bg-green-400 mr-2"></div>
                    <span className="text-sm text-gray-600">{statusLabels.approved}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-sm bg-yellow-400 mr-2"></div>
                    <span className="text-sm text-gray-600">{statusLabels.pending}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-sm bg-red-400 mr-2"></div>
                    <span className="text-sm text-gray-600">{statusLabels.spam}</span>
              </div>
                </div>
              </div>

              {/* Job Views & Applied summary boxes */}
              <div className="w-full lg:w-56 mt-6 lg:mt-0 lg:ml-8 space-y-6">
                {/* Job Views */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-left">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Job Views</h3>
                  <p className="text-3xl font-semibold text-gray-800">{jobViewsCount}</p>
                  <p className="text-sm text-green-600 flex items-center">
                    This Week
                    <span className="ml-1">6.4%</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 ml-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                  </p>
                </div>

                {/* Job Applied */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 text-left">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Job Applied</h3>
                  <p className="text-3xl font-semibold text-gray-800">{jobAppliedCount}</p>
                  <p className="text-sm text-red-600 flex items-center">
                    This Week
                    <span className="ml-1">0.5%</span>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 ml-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Summaries */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-left text-xl font-normal text-gray-800 mb-4" style={{fontFamily: 'ABeeZee, sans-serif'}}>Job Open</h2>
              <div className="flex items-baseline">
                <AnimatedNumber value={12} className="text-7xl font-semibold text-gray-800" />
                <p className="text-xl text-gray-500 ml-4">Jobs Opened</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h2 className="text-left text-xl font-normal text-gray-800 mb-4" style={{fontFamily: 'ABeeZee, sans-serif'}}>Applicants Summary</h2>
              <div className="flex items-baseline">
                <AnimatedNumber value={67} className="text-7xl font-semibold text-gray-800" />
                <p className="text-xl text-gray-500 ml-4">Applicants</p>
              </div>
              {/* Animated progress bar */}
              <div className="flex w-full h-4 rounded-full overflow-hidden my-4">
                  {[
                    { value: 45, color: '#7b61ff' },
                    { value: 22, color: '#56cdad' },
                    { value: 28, color: '#26a4ff' },
                    { value: 30, color: '#ffb836' },
                    { value: 10, color: '#ff6550' },
                  ].map((seg, idx) => {
                    const percent = (seg.value / 135) * 100; // total = 135
                    return <div key={idx} style={{ width: animateProgress ? `${percent}%` : 0, backgroundColor: seg.color, transition: 'width 0.8s ease' }} />;
                  })}
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600">
                  {[
                    { label: 'Full Time', value: 45, color: '#7b61ff' },
                    { label: 'Internship', value: 30, color: '#ffb836' },
                    { label: 'Part-Time', value: 22, color: '#56cdad' },
                    { label: 'Contract', value: 10, color: '#ff6550' },
                    { label: 'Remote', value: 28, color: '#26a4ff' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center">
                      <div className="w-3 h-3 rounded-sm mr-2" style={{ backgroundColor: item.color }}></div>
                      <span>{item.label} : <AnimatedNumber value={item.value} /></span>
                </div>
              ))}
              </div>
            </div>
          </div>
        </div>

        {/* Updates Section */}
        <div className="mt-8 bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-normal text-gray-800" style={{fontFamily: 'ABeeZee, sans-serif'}}>Updates</h2>
            <button className="font-semibold flex items-center" style={{color:'#007BFF'}}>
              View All
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {updates.map((update, index) => (
              <div key={index} onClick={() => navigate(update.path)} className="border rounded-lg p-4 transition transform hover:-translate-y-1 hover:shadow-md cursor-pointer text-left flex flex-col">
                 <div className="flex justify-between items-center mb-4">
                    {/* Placeholder icon */}
                    <img src={update.icon} alt="icon" className="w-10 h-10 object-contain" />
                    <button className="text-xs font-semibold px-3 py-1 rounded-full" style={{ color: '#56CDAD', backgroundColor: '#E4F5F1' }}>View details</button>
                  </div>
                <h3 className="font-semibold text-lg text-gray-800 mb-1" style={{ fontFamily: 'ABeeZee, sans-serif' }}>{update.title}</h3>
                <div className="text-sm text-gray-500 mb-3">
                  <span className="font-medium text-black">{update.applied} applied</span> of {update.capacity} capacity
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-auto">
                  <div
                    className="h-1.5 rounded-full"
                    style={{ backgroundColor: '#56CDAD', width: `${(update.applied / update.capacity) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
        )}
      </main>
    </AdminLayout>
  );
};

export default Dashboard; 