import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import bellIcon from '../../assets/bell-outlined.png';
import nomadIcon from '../../assets/Nomad.png';
import calendarIcon from '../../assets/scheme.png';
import user1Icon from '../../assets/user1.png';
import user2Icon from '../../assets/user2.png';
import glassIcon from '../../assets/glass.png';
import fbIcon from '../../assets/f&b.png';
import { HrNotificationPanel } from '.';
import Avatar17 from '../../assets/Avatar17.png';
import nomadLogo from '../../assets/Nomad.png';
import dropboxLogo from '../../assets/work2.png';
import terraformLogo from '../../assets/work3.png';
import classpassLogo from '../../assets/work4.png';
import hrApi from '../../services/hrApi';


// Custom hook for count-up animation
const useCountUp = (target: number, duration = 1000) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return count.toLocaleString();
};

// Animated number component
const AnimatedNumber: React.FC<{ value: number; className?: string }> = ({ value, className }) => {
  const count = useCountUp(value);
  return <span className={className}>{count}</span>;
};

// StatCard component
const StatCard: React.FC<{ label: string; value: number; color: string; onClick?: () => void }> = ({ label, value, color, onClick }) => (
  <div onClick={onClick} className={`${color} p-6 rounded-lg text-white flex justify-between items-center transition transform hover:scale-105 hover:brightness-110 cursor-pointer`}>
    <div className="flex items-center">
      <AnimatedNumber value={value} className="text-5xl font-semibold mr-4" />
      <p className="text-lg font-medium" style={{ fontFamily: 'ABeeZee, sans-serif' }}>{label}</p>
    </div>
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
  </div>
);

interface HrDashboardProps {
  notifOpen: boolean;
  hasUnread: boolean;
  toggleNotif: () => void;
  setHasUnread: (value: boolean) => void;
  setNotifOpen: (value: boolean) => void;
}

const HrDashboard: React.FC<HrDashboardProps> = ({ notifOpen, hasUnread, toggleNotif, setHasUnread, setNotifOpen }) => {
  // Use destructured props to avoid unused warnings
  console.log('Dashboard props:', { notifOpen, hasUnread, toggleNotif, setHasUnread, setNotifOpen });
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [animateProgress, setAnimateProgress] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'view' | 'applied'>('overview');
  const [animateBars, setAnimateBars] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Use these variables in JSX conditionally  
  if (loading) console.log('Dashboard loading...');
  if (error) console.log('Dashboard error:', error);
  const [dashboardData, setDashboardData] = useState({
    stats: [
      { label: 'Review new candidates', value: 0, color: 'bg-blue-500', path: '#' },
      { label: 'Schedule for today', value: 0, color: 'bg-green-500', path: '#' },
      { label: 'Messages received', value: 0, color: 'bg-cyan-500', path: '#' },
    ],
    applicants: [],
    jobUpdates: [],
    jobStatsData: [
      { day: 'Mon', view: 0, applied: 0 },
      { day: 'Tue', view: 0, applied: 0 },
      { day: 'Wed', view: 0, applied: 0 },
      { day: 'Thu', view: 0, applied: 0 },
      { day: 'Fri', view: 0, applied: 0 },
      { day: 'Sat', view: 0, applied: 0 },
      { day: 'Sun', view: 0, applied: 0 },
    ]
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateProgress(true);
      setAnimateBars(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (selectedTab !== 'overview') {
      setAnimateBars(false);
      const timer = setTimeout(() => setAnimateBars(true), 50);
      return () => clearTimeout(timer);
    }
  }, [selectedTab]);

  const jobViewsCount = useCountUp(2342);
  const jobAppliedCount = useCountUp(654);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Make API calls with individual error handling
        let applicationStats = null;
        let myJobs = null;

        try {
          applicationStats = await hrApi.getApplicationStats();
          console.log('Application Stats Response:', applicationStats);
        } catch (appErr) {
          console.error('Error fetching application stats:', appErr);
          applicationStats = { pendingReview: 0, scheduledToday: 0, messagesReceived: 0 };
        }

        try {
          myJobs = await hrApi.getMyJobs();
          console.log('My Jobs Response:', myJobs);
        } catch (jobsErr) {
          console.error('Error fetching jobs:', jobsErr);
          myJobs = { data: [] };
        }

        // Extract jobs array from API response - handle multiple possible structures
        const jobsArray = myJobs?.data || myJobs?.jobs || (Array.isArray(myJobs) ? myJobs : []);
        console.log('Extracted jobs array:', jobsArray);
        
        setDashboardData(prevData => ({
          ...prevData,
          stats: [
            { label: 'Review new candidates', value: applicationStats?.pendingReview || 0, color: 'bg-blue-500', path: '#' },
            { label: 'Schedule for today', value: applicationStats?.scheduledToday || 0, color: 'bg-green-500', path: '#' },
            { label: 'Messages received', value: applicationStats?.messagesReceived || 0, color: 'bg-cyan-500', path: '#' },
          ],
          jobUpdates: Array.isArray(jobsArray) ? jobsArray.slice(0, 4).map((job: any) => ({
            logo: nomadLogo,
            title: job.title || job.test_name || 'Job Title',
            company: job.company?.name || job.company_name || 'Your Company',
            location: job.city || job.location || 'Location',
            tags: Array.isArray(job.skills) ? job.skills.slice(0, 2) : ['Business'],
            applied: job.applications_count || job.applicationsCount || 0,
            capacity: job.open_positions || job.openPositions || 1,
            type: job.employment_type || job.type || 'Full-Time'
          })) : []
        }));

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
        
        // Set fallback data structure when API fails
        setDashboardData(prevData => ({
          ...prevData,
          stats: [
            { label: 'Review new candidates', value: 0, color: 'bg-blue-500', path: '#' },
            { label: 'Schedule for today', value: 0, color: 'bg-green-500', path: '#' },
            { label: 'Messages received', value: 0, color: 'bg-cyan-500', path: '#' },
          ],
          jobUpdates: []
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats = dashboardData.stats;
  const hrJobStatsData = dashboardData.jobStatsData;

  const getSegments = (data: typeof hrJobStatsData[number]) => {
    switch (selectedTab) {
      case 'view':
        return [{ height: data.view, color: '#ffb836', label: 'Job View' }];
      case 'applied':
        return [{ height: data.applied, color: '#7b61ff', label: 'Job Applied' }];
      default: // overview
        return [
          { height: data.applied, color: '#7b61ff', label: 'Job Applied' },
          { height: data.view, color: '#ffb836', label: 'Job View' },
        ];
    }
  };

  const applicants = [
    { avatar: Avatar17, name: 'Cyndy Lillibridge', score: '90%', status: 'Shortlisted', date: '12 July, 2021', role: 'Golang Dev' },
    { avatar: Avatar17, name: 'Rodolfo Goode', score: '88%', status: 'Declined', date: '11 July, 2021', role: 'NET Dev' },
    { avatar: Avatar17, name: 'Leif Floyd', score: '68%', status: 'Hired', date: '11 July, 2021', role: 'Graphic Design' },
    { avatar: Avatar17, name: 'Eleanor Pena', score: '70%', status: 'Declined', date: '5 July, 2021', role: 'Designer' },
    { avatar: Avatar17, name: 'Floyd Miles', score: '79%', status: 'Interviewed', date: '1 July, 2021', role: 'Designer' },
  ];

  const jobUpdates = [
    { logo: nomadLogo, title: 'Social Media Assistant', company: 'Nomad', location: 'Paris, France', tags: ['Marketing', 'Design'], applied: 5, capacity: 10, type: 'Full-Time' },
    { logo: nomadLogo, title: 'Brand Designer', company: 'Nomad', location: 'Paris, France', tags: ['Business', 'Design'], applied: 5, capacity: 10, type: 'Full-Time' },
    { logo: nomadLogo, title: 'Interactive Developer', company: 'Nomad', location: 'Berlin, Germany', tags: ['Marketing', 'Design'], applied: 5, capacity: 10, type: 'Full-Time' },
    { logo: nomadLogo, title: 'Product Designer', company: 'Nomad', location: 'Berlin, Germany', tags: ['Business', 'Design'], applied: 5, capacity: 10, type: 'Full-Time' },
  ];

  return (
    <div className="bg-white" style={{ fontFamily: 'ABeeZee, sans-serif' }}>
      <div className="flex justify-between items-center text-left mb-8">
        <div>
          <h1 className="text-2xl font-normal">Good morning, Maria</h1>
          <p className="text-gray-500">Here is your job listings statistic report from July 19 - July 25.</p>
        </div>
        <div className="relative">
          <input ref={dateInputRef} type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="absolute opacity-0 w-full h-full cursor-pointer" />
          <div className="flex items-center border rounded-md px-3 py-2 cursor-pointer" onClick={() => dateInputRef.current?.click()}>
            <span>Jul 19 - Jul 25</span>
            <img src={calendarIcon} alt="calendar" className="ml-2 w-4 h-4" />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((s, i) => (
          <StatCard key={i} label={s.label} value={s.value} color={s.color} onClick={() => navigate(s.path)} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-left text-xl font-normal text-gray-800">Job statistics</h2>
              <p className="text-left text-sm text-gray-500">Showing Jobstatistic Jul 19-25</p>
            </div>
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-full">
              <button className="px-4 py-1.5 text-sm font-semibold text-blue-600 bg-white rounded-full shadow-sm">Week</button>
              <button className="px-4 py-1.5 text-sm font-semibold text-gray-600">Month</button>
              <button className="px-4 py-1.5 text-sm font-semibold text-gray-600">Year</button>
            </div>
          </div>
          <div className="flex space-x-8 border-b mb-10">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'view', label: 'Jobs View' },
              { key: 'applied', label: 'Jobs Applied' },
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
          <div className="flex-1 flex">
            <div className="flex-1 flex flex-col justify-end">
              <div className="flex h-56 items-end justify-between space-x-2">
                {hrJobStatsData.map((data) => (
                  <div key={data.day} className="flex-1 flex flex-col items-center group">
                    <div className="relative w-12">
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
                        <div className="bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
                          {selectedTab === 'overview' ? (
                            <>
                              <div className="flex items-center space-x-2 text-left"><span className="w-2 h-2" style={{backgroundColor: '#7b61ff'}}></span><span>Job Applied: {data.applied}</span></div>
                              <div className="flex items-center space-x-2 text-left"><span className="w-2 h-2" style={{backgroundColor: '#ffb836'}}></span><span>Job View: {data.view}</span></div>
                            </>
                          ) : selectedTab === 'applied' ? (
                            <span>Job Applied: {data.applied}</span>
                          ) : (
                            <span>Job View: {data.view}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col-reverse rounded-md overflow-hidden transition-transform transform hover:scale-105 hover:brightness-110">
                        {getSegments(data).map((seg, idx) => (
                          <div
                            key={idx}
                            style={{
                              height: `${animateBars ? seg.height * 2.2 : 0}px`,
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
                  <div className="w-3 h-3 rounded-sm bg-[#ffb836] mr-2"></div>
                  <span className="text-sm text-gray-600">Job View</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-sm bg-[#7b61ff] mr-2"></div>
                  <span className="text-sm text-gray-600">Job Applied</span>
                </div>
              </div>
            </div>
            <div className="w-56 ml-8 space-y-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-left">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-medium text-gray-500">Job Views</h3>
                  <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  </div>
                </div>
                <p className="text-3xl font-semibold text-gray-800">{jobViewsCount}</p>
                <p className="text-sm text-green-600 flex items-center">
                  This Week
                  <span className="ml-1">6.4%</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 text-left">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-sm font-medium text-gray-500">Job Applied</h3>
                   <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                </div>
                <p className="text-3xl font-semibold text-gray-800">{jobAppliedCount}</p>
                <p className="text-sm text-red-600 flex items-center">
                  This Week
                  <span className="ml-1">0.5%</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </p>
              </div>
        </div>
          </div>
        </div>

        <div className="space-y-6 flex flex-col">
          <div className="bg-white p-6 rounded-lg border border-gray-200 flex-1 flex flex-col justify-center">
            <h2 className="text-left text-xl font-normal text-gray-800 mb-4">Job Open</h2>
            <div className="flex items-baseline">
              <AnimatedNumber value={12} className="text-7xl font-semibold text-gray-800" />
              <p className="text-xl text-gray-500 ml-4">Jobs Opened</p>
      </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200 flex-1 flex flex-col justify-center">
            <h2 className="text-left text-xl font-normal text-gray-800 mb-4">Applicants Summary</h2>
            <div className="flex items-baseline">
              <AnimatedNumber value={67} className="text-7xl font-semibold text-gray-800" />
              <p className="text-xl text-gray-500 ml-4">Applicants</p>
            </div>
            <div className="flex w-full h-4 rounded-full overflow-hidden my-4">
              {[
                { value: 45, color: '#7b61ff' },
                { value: 22, color: '#56cdad' },
                { value: 28, color: '#26a4ff' },
                { value: 30, color: '#ffb836' },
              ].map((seg, idx) => {
                const total = 45 + 22 + 28 + 30;
                const percent = (seg.value / total) * 100;
                return <div key={idx} style={{ width: animateProgress ? `${percent}%` : 0, backgroundColor: seg.color, transition: 'width 0.8s ease' }} />;
              })}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600">
                {[
                  { label: 'Full Time', value: 45, color: '#7b61ff' },
                  { label: 'Internship', value: 30, color: '#ffb836' },
                  { label: 'Part-Time', value: 22, color: '#56cdad' },
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

      <div className="mt-8 bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-normal text-gray-800">Total Applicants : 19</h2>
          <button className="font-semibold flex items-center text-[#007BFF]">
            View All
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
        </div>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                {['Full Name', 'Score', 'Hiring Stage', 'Applied Date', 'Job Role', 'Action'].map(head => (
                  <th key={head} className="py-3 px-4 text-sm font-medium text-gray-500">{head} <svg className="inline w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path></svg></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {applicants.map((applicant, index) => (
                <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer">
                  <td className="py-3 px-4 flex items-center"><img src={applicant.avatar} alt="avatar" className="w-8 h-8 rounded-full mr-3" /> {applicant.name}</td>
                  <td className="py-3 px-4">{applicant.score}</td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                      applicant.status === 'Shortlisted' ? 'bg-blue-100 text-blue-600' :
                      applicant.status === 'Hired' ? 'bg-green-100 text-green-600' :
                      applicant.status === 'Declined' ? 'bg-red-100 text-red-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>{applicant.status}</span>
                  </td>
                  <td className="py-3 px-4">{applicant.date}</td>
                  <td className="py-3 px-4">{applicant.role}</td>
                  <td className="py-3 px-4">
                    <button className="text-[#007BFF] bg-[#007BFF]/10 px-3 py-1 rounded-md">See Application</button>
                    <button className="ml-2 text-gray-500">...</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-normal text-gray-800">Job Updates</h2>
          <button className="font-semibold flex items-center text-[#007BFF]">
            View All
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {jobUpdates.map((job, index) => (
            <div key={index} className="border rounded-lg p-4 text-left flex flex-col bg-white transition transform hover:-translate-y-1 hover:shadow-md cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                <img src={job.logo} alt="company logo" className="w-12 h-12" />
                <span className="text-xs font-semibold px-3 py-1 rounded-full text-[#56CDAD] bg-[#E4F5F1]" style={{ color: '#56CDAD', backgroundColor: '#E4F5F1' }}>{job.type}</span>
              </div>
              <h3 className="font-semibold text-lg text-gray-800">{job.title}</h3>
              <div className="text-sm text-gray-500 mb-3">
                <span>{job.company}</span> • <span>{job.location}</span>
              </div>
              <div className="flex space-x-2 mb-4">
                {job.tags.map(tag => {
                  const tagStyle = {
                    Marketing: 'text-yellow-600 border border-yellow-400',
                    Design: 'text-blue-600 border border-blue-400',
                    Business: 'text-blue-600 border border-blue-400',
                  }[tag] || 'text-gray-600 border border-gray-300';
                  return <span key={tag} className={`text-xs font-medium px-2 py-1 rounded-full ${tagStyle}`}>{tag}</span>
                })}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-auto">
                <div className="h-1.5 rounded-full" style={{ backgroundColor: '#56CDAD', width: `${(job.applied / job.capacity) * 100}%` }}></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">{job.applied} applied of {job.capacity} capacity</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HrDashboard; 