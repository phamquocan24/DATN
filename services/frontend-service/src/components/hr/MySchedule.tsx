import React, { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiPlus, FiEdit, FiCheck } from 'react-icons/fi';
import hrApi from '../../services/hrApi';

const MiniCalendar = () => {
    const [date, setDate] = useState(new Date());
    const month = date.toLocaleString('default', { month: 'long' }).toUpperCase();
    const year = date.getFullYear();

    const getDaysInMonth = () => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const dateInMonth = new Date(year, month, 1);
        const days = [];
        while (dateInMonth.getMonth() === month) {
            days.push(new Date(dateInMonth));
            dateInMonth.setDate(dateInMonth.getDate() + 1);
        }
        return days;
    };

    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const days = getDaysInMonth();
    
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-sm">{month} {year}</h3>
                <div className="flex gap-2">
                    <button onClick={() => setDate(new Date(date.setMonth(date.getMonth() - 1)))}><FiChevronLeft size={16}/></button>
                    <button onClick={() => setDate(new Date(date.setMonth(date.getMonth() + 1)))}><FiChevronRight size={16}/></button>
                </div>
            </div>
            <div className="grid grid-cols-7 text-center text-xs text-gray-400">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="py-2">{day}</div>)}
            </div>
            <div className="grid grid-cols-7 text-center text-sm">
                {Array(firstDayOfMonth).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
                {days.map(day => {
                    const today = new Date();
                    const isToday = day.toDateString() === today.toDateString();
                    return (
                        <div key={day.toString()} className={`py-1 ${isToday ? 'bg-[#007BFF] text-white rounded-full' : ''}`}>
                        {day.getDate()}
                    </div>
                    );
                })}
            </div>
        </div>
    );
}

interface Interview {
  history_id: string;
  application_id: string;
  scheduled_at: string;
  interview_notes: string;
  interview_status: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string;
  job_title: string;
  job_id: string;
  employment_type: string;
  company_name: string;
  candidate_avatar: string;
  match_score: number;
}

const MySchedule: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({
    scheduled_at: '',
    change_reason: ''
  });
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [createEventData, setCreateEventData] = useState({
    title: '',
    scheduled_date: '',
    notes: '',
    category: 'Interview Schedule'
  });
  const [categories, setCategories] = useState<Record<string, boolean>>({
    'Interview Schedule': true,
    'Internal Meeting': true,
    'Team Schedule': false,
    'My Task': false,
    'Reminders': false
  });
  const [viewMode, setViewMode] = useState<'Day' | 'Week' | 'Month'>('Week');

  const timeSlots = ['GMT -07', ...Array.from({ length: 12 }, (_, i) => `${i + 1} AM`), ...Array.from({ length: 11 }, (_, i) => `${i + 1} PM`), '12 AM'];
  
  // Generate current week days
  const getWeekDays = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(startOfWeek);
      currentDay.setDate(startOfWeek.getDate() + i);
      const today = new Date();
      
      week.push({
        day: currentDay.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        date: currentDay.getDate(),
        fullDate: currentDay,
        isToday: currentDay.toDateString() === today.toDateString(),
        isHoliday: false // You can implement holiday logic here
      });
    }
    return week;
  };

  const weekDays = getWeekDays(currentDate);

  // Get date range based on view mode
  const getDateRange = () => {
    if (viewMode === 'Day') {
      const start = new Date(currentDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(currentDate);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    } else if (viewMode === 'Week') {
      const start = new Date(currentDate);
      start.setDate(currentDate.getDate() - currentDate.getDay());
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    } else { // Month
      const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
  };

  // Fetch scheduled interviews
  const fetchInterviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get date range based on current view mode
      const { start, end } = getDateRange();

      const response = await hrApi.getScheduledInterviews({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        limit: 200
      });

      if (response.success) {
        setInterviews(response.data);
      } else {
        setError('Failed to load interviews');
      }
    } catch (err: any) {
      console.error('Error fetching interviews:', err);
      setError('Failed to load interviews');
    } finally {
      setLoading(false);
    }
  };

  // Navigate date based on view mode
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'Day') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    } else if (viewMode === 'Week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (viewMode === 'Month') {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    }
    
    setCurrentDate(newDate);
  };

  // Get display title based on view mode
  const getDisplayTitle = () => {
    if (viewMode === 'Day') {
      return currentDate.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }).toUpperCase();
    } else if (viewMode === 'Week') {
      return currentDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      }).toUpperCase();
    } else { // Month
      return currentDate.toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      }).toUpperCase();
    }
  };

  // Convert interview time to calendar position
  const getInterviewPosition = (interview: Interview) => {
    const scheduledDate = new Date(interview.scheduled_at);
    const hour = scheduledDate.getHours();
    const minute = scheduledDate.getMinutes();
    
    if (viewMode === 'Day') {
      return {
        dayIndex: 0, // Single day view
        top: (hour + minute / 60) * 4, // 4rem per hour
        height: 2 // Default 2 hours
      };
    } else if (viewMode === 'Week') {
      return {
        dayIndex: scheduledDate.getDay(),
        top: (hour + minute / 60) * 4, // 4rem per hour
        height: 2 // Default 2 hours
      };
    } else { // Month view
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const dayOfMonth = scheduledDate.getDate();
      const weekIndex = Math.floor((dayOfMonth + firstDayOfMonth.getDay() - 1) / 7);
      const dayInWeek = (dayOfMonth + firstDayOfMonth.getDay() - 1) % 7;
      
      return {
        dayIndex: dayInWeek,
        weekIndex: weekIndex,
        top: 0, // No time slots in month view
        height: 1
      };
    }
  };

  // Generate calendar structure based on view mode
  const getCalendarStructure = () => {
    if (viewMode === 'Day') {
      const today = new Date(currentDate);
      return {
        columns: 1,
        headers: [today.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }).toUpperCase()],
        showTimeSlots: true
      };
    } else if (viewMode === 'Week') {
      return {
        columns: 7,
        headers: weekDays.map(d => `${d.day} ${d.date}`),
        showTimeSlots: true
      };
    } else { // Month
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();
      
      // Generate all days for the month grid
      const monthDays = [];
      
      // Previous month days (to fill the grid)
      const prevMonth = new Date(year, month - 1, 0);
      for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        monthDays.push({
          date: prevMonth.getDate() - i,
          isCurrentMonth: false,
          isToday: false
        });
      }
      
      // Current month days
      const today = new Date();
      for (let i = 1; i <= daysInMonth; i++) {
        const dayDate = new Date(year, month, i);
        monthDays.push({
          date: i,
          isCurrentMonth: true,
          isToday: dayDate.toDateString() === today.toDateString()
        });
      }
      
      // Next month days (to complete the grid)
      const totalCells = Math.ceil(monthDays.length / 7) * 7;
      for (let i = 1; monthDays.length < totalCells; i++) {
        monthDays.push({
          date: i,
          isCurrentMonth: false,
          isToday: false
        });
      }
      
      return {
        columns: 7,
        headers: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
        showTimeSlots: false,
        monthDays: monthDays,
        weeks: Math.ceil(monthDays.length / 7)
      };
    }
  };

  const calendarStructure = getCalendarStructure();

  // Handle interview actions
  const handleViewDetails = (interview: Interview) => {
    setSelectedInterview(interview);
    setShowDetailModal(true);
  };

  const handleReschedule = (interview: Interview) => {
    setSelectedInterview(interview);
    setRescheduleData({
      scheduled_at: interview.scheduled_at,
      change_reason: ''
    });
    setShowRescheduleModal(true);
  };

  const handleMarkCompleted = async (interview: Interview) => {
    try {
      await hrApi.updateInterview(interview.history_id, {
        status: 'COMPLETED',
        change_reason: 'Interview completed successfully'
      });
      fetchInterviews(); // Refresh data
    } catch (err) {
      console.error('Error marking interview as completed:', err);
      alert('Failed to mark interview as completed');
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!selectedInterview || !rescheduleData.scheduled_at) return;
    
    try {
      await hrApi.updateInterview(selectedInterview.history_id, {
        scheduled_at: rescheduleData.scheduled_at,
        change_reason: rescheduleData.change_reason || 'Interview rescheduled',
        status: 'RESCHEDULED'
      });
      setShowRescheduleModal(false);
      setSelectedInterview(null);
      fetchInterviews(); // Refresh data
    } catch (err) {
      console.error('Error rescheduling interview:', err);
      alert('Failed to reschedule interview');
    }
  };

  const handleCreateEvent = () => {
    setCreateEventData({
      title: '',
      scheduled_date: '',
      notes: '',
      category: 'Interview Schedule'
    });
    setShowCreateEventModal(true);
  };

  const handleCreateEventSubmit = async () => {
    if (!createEventData.title || !createEventData.scheduled_date) {
      alert('Please fill in title and date');
      return;
    }
    
    try {
      // For now, just close the modal (you can add API call here later)
      alert(`Event "${createEventData.title}" created successfully!`);
      setShowCreateEventModal(false);
      setCreateEventData({
        title: '',
        scheduled_date: '',
        notes: '',
        category: 'Interview Schedule'
      });
      // fetchInterviews(); // Refresh data when you have API
    } catch (err) {
      console.error('Error creating event:', err);
      alert('Failed to create event');
    }
  };

  const handleCategoryToggle = (categoryName: string) => {
    setCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  // Fetch interviews when component mounts, date changes, or view mode changes
  useEffect(() => {
    fetchInterviews();
  }, [currentDate, viewMode]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'INTERVIEWED': return 'bg-blue-500';
      case 'COMPLETED': return 'bg-green-500';
      case 'RESCHEDULED': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex gap-6 text-gray-800 text-left">
      {/* Left Sidebar */}
      <div className="w-72 flex-shrink-0 space-y-6">
        <button 
          onClick={handleCreateEvent}
          className="w-full border border-[#007BFF] text-[#007BFF] font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-50"
        >
          <FiPlus/> Create Event
        </button>
        <div className="bg-white p-4 rounded-lg border">
          <MiniCalendar />
        </div>
        <div className="bg-white p-4 rounded-lg border">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Categories</h3>
                <button className="text-[#007BFF] text-sm font-semibold">+ Add Category</button>
            </div>
            <div className="space-y-3">
                {Object.entries(categories).map(([categoryName, isChecked]) => (
                  <div key={categoryName} className="flex items-center">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => handleCategoryToggle(categoryName)}
                        className="sr-only"
                        id={`category-${categoryName}`}
                      />
                      <div 
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${
                          isChecked 
                            ? categoryName === 'Interview Schedule' 
                              ? 'bg-[#007BFF] border-[#007BFF]' 
                              : categoryName === 'Internal Meeting'
                                ? 'bg-green-500 border-green-500'
                                : 'bg-gray-500 border-gray-500'
                            : 'border-gray-300 bg-white'
                        }`}
                        onClick={() => handleCategoryToggle(categoryName)}
                      >
                        {isChecked && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <label 
                      htmlFor={`category-${categoryName}`}
                      className="ml-2 text-sm cursor-pointer"
                    >
                      {categoryName}
                    </label>
                  </div>
                ))}
            </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">My Schedule</h1>
            <button 
              onClick={() => setCurrentDate(new Date())}
              className="border rounded-lg px-4 py-2 text-sm font-semibold bg-white shadow-sm hover:bg-gray-50"
            >
              Today
            </button>
        </div>
        <div className="bg-white p-4 rounded-lg border">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigateDate('prev')}><FiChevronLeft/></button>
                    <h2 className="font-semibold">{getDisplayTitle()}</h2>
                    <button onClick={() => navigateDate('next')}><FiChevronRight/></button>
                </div>
                <div className="flex border rounded-lg text-sm font-semibold">
                    <button 
                        className={`px-4 py-1.5 ${viewMode === 'Day' ? 'bg-gray-100' : ''}`}
                        onClick={() => setViewMode('Day')}
                    >
                        Day
                    </button>
                    <button 
                        className={`px-4 py-1.5 border-l border-r ${viewMode === 'Week' ? 'bg-gray-100' : ''}`}
                        onClick={() => setViewMode('Week')}
                    >
                        Week
                    </button>
                    <button 
                        className={`px-4 py-1.5 ${viewMode === 'Month' ? 'bg-gray-100' : ''}`}
                        onClick={() => setViewMode('Month')}
                    >
                        Month
                    </button>
                </div>
            </div>
            {/* Calendar Headers */}
            {viewMode === 'Day' && (
                <div className="grid grid-cols-2">
                    <div className="col-span-1"></div>
                    <div className="col-span-1 grid grid-cols-1 text-center text-sm font-semibold text-gray-600">
                        <div className="p-2">
                            {calendarStructure.headers[0]}
                        </div>
                    </div>
                </div>
            )}
            
            {viewMode === 'Week' && (
                <div className="grid grid-cols-8">
                    <div className="col-span-1"></div>
                    <div className="col-span-7 grid grid-cols-7 text-center text-sm font-semibold text-gray-600">
                        {calendarStructure.headers.map((header, index) => {
                            const dayInfo = weekDays[index];
                            return (
                                <div key={header} className={`p-2 ${dayInfo?.isToday ? 'bg-blue-100 rounded-lg text-[#007BFF]' : ''} ${dayInfo?.isHoliday ? 'bg-red-100 rounded-lg text-red-500' : ''}`}>
                                    {header}
                                    {dayInfo?.isHoliday && <p className="text-xs">Holiday</p>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
            
            {viewMode === 'Month' && (
                <div className="grid grid-cols-7 text-center text-sm font-semibold text-gray-600">
                    {calendarStructure.headers.map((header) => (
                        <div key={header} className="p-2">
                            {header}
                        </div>
                    ))}
                </div>
            )}
            <div className="h-[70vh] overflow-y-auto relative">
                {loading && (
                  <div className="flex justify-center items-center h-full">
                    <div className="text-gray-500">Loading interviews...</div>
                  </div>
                )}
                
                {error && (
                  <div className="flex justify-center items-center h-full">
                    <div className="text-red-500">{error}</div>
                  </div>
                )}
                
                                {!loading && !error && (
                  <>
                    {/* Day View */}
                    {viewMode === 'Day' && (
                      <>
                        <div className="grid grid-cols-2">
                            <div className="col-span-1 text-xs text-gray-500 text-right pr-2">
                                {timeSlots.map(time => <div key={time} className="h-16 border-t pt-1">{time}</div>)}
                            </div>
                            <div className="col-span-1 grid grid-cols-1">
                                <div className="border-l">
                                    {timeSlots.map(time => <div key={time} className="h-16 border-t"></div>)}
                                </div>
                            </div>
                        </div>
                      </>
                    )}

                    {/* Week View */}
                    {viewMode === 'Week' && (
                      <>
                        <div className="grid grid-cols-8">
                            <div className="col-span-1 text-xs text-gray-500 text-right pr-2">
                                {timeSlots.map(time => <div key={time} className="h-16 border-t pt-1">{time}</div>)}
                            </div>
                            <div className="col-span-7 grid grid-cols-7">
                                {[...Array(7)].map((_, i) => 
                                    <div key={i} className="border-l">
                                        {timeSlots.map(time => <div key={time} className="h-16 border-t"></div>)}
                                    </div>
                                )}
                            </div>
                        </div>
                      </>
                    )}
                        
                    {/* Interview Events for Day & Week */}
                    {(viewMode === 'Day' || viewMode === 'Week') && interviews.map(interview => {
                      const position = getInterviewPosition(interview);
                      const scheduledDate = new Date(interview.scheduled_at);
                      
                      return (
                        <div 
                          key={interview.history_id} 
                          className={`absolute text-white p-2 rounded-lg text-xs cursor-pointer hover:opacity-90 ${getStatusColor(interview.interview_status)}`} 
                          style={{ 
                            top: `${position.top}rem`, 
                            height: `${position.height * 4}rem`,
                            left: viewMode === 'Day' 
                              ? 'calc(50% + 1rem)' 
                              : `calc(12.5% + ${position.dayIndex * 12.5}%)`,
                            width: viewMode === 'Day' ? 'calc(50% - 2rem)' : '12.5%',
                          }}
                          onClick={() => handleViewDetails(interview)}
                        >
                          <div className="font-semibold text-xs mb-1">
                            {interview.candidate_name}
                          </div>
                          <div className="text-xs opacity-90 mb-1">
                            {interview.job_title}
                          </div>
                          <div className="text-xs opacity-80">
                            {scheduledDate.toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            })}
                          </div>
                          {interview.candidate_avatar && (
                            <div className="flex mt-1">
                              <img 
                                src={interview.candidate_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(interview.candidate_name)}&background=random`} 
                                className="w-5 h-5 rounded-full border border-white" 
                                alt={interview.candidate_name}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Month view */}
                    {viewMode === 'Month' && calendarStructure.monthDays && (
                      <div className="grid grid-cols-7 gap-1">
                        {calendarStructure.monthDays.map((day, index) => {
                          const dayInterviews = interviews.filter(interview => {
                            const interviewDate = new Date(interview.scheduled_at);
                            return interviewDate.getDate() === day.date && 
                                   interviewDate.getMonth() === currentDate.getMonth() && 
                                   day.isCurrentMonth;
                          });

                          return (
                            <div 
                              key={index} 
                              className={`min-h-[120px] border border-gray-200 p-1 ${
                                day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                              } ${day.isToday ? 'bg-blue-50 border-blue-200' : ''}`}
                            >
                              <div className={`text-sm font-medium mb-1 ${
                                day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                              } ${day.isToday ? 'text-blue-600' : ''}`}>
                                {day.date}
                              </div>
                              
                              {/* Events in this day */}
                              <div className="space-y-1">
                                {dayInterviews.slice(0, 3).map(interview => (
                                  <div 
                                    key={interview.history_id}
                                    className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${getStatusColor(interview.interview_status)}`}
                                    onClick={() => handleViewDetails(interview)}
                                  >
                                    <div className="text-white font-medium truncate">
                                      {interview.candidate_name}
                                    </div>
                                    <div className="text-white opacity-90 truncate">
                                      {new Date(interview.scheduled_at).toLocaleTimeString('en-US', { 
                                        hour: 'numeric', 
                                        minute: '2-digit',
                                        hour12: true 
                                      })}
                                    </div>
                                  </div>
                                ))}
                                
                                {/* Show count if more than 3 events */}
                                {dayInterviews.length > 3 && (
                                  <div className="text-xs text-gray-500 font-medium">
                                    +{dayInterviews.length - 3} more
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
            </div>
        </div>
      </div>

      {/* Interview Detail Modal */}
      {showDetailModal && selectedInterview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Interview Details</h3>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img 
                  src={selectedInterview.candidate_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedInterview.candidate_name)}&background=random`}
                  className="w-12 h-12 rounded-full"
                  alt={selectedInterview.candidate_name}
                />
                <div>
                  <h4 className="font-semibold">{selectedInterview.candidate_name}</h4>
                  <p className="text-sm text-gray-600">{selectedInterview.candidate_email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Job Position:</span>
                  <p>{selectedInterview.job_title}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Employment Type:</span>
                  <p>{selectedInterview.employment_type}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Scheduled Date:</span>
                  <p>{new Date(selectedInterview.scheduled_at).toLocaleString()}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Status:</span>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedInterview.interview_status).replace('bg-', 'bg-').replace('-500', '-100')} ${getStatusColor(selectedInterview.interview_status).replace('bg-', 'text-').replace('-500', '-700')}`}>
                    {selectedInterview.interview_status}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Match Score:</span>
                  <p>{selectedInterview.match_score ? `${Math.round(selectedInterview.match_score)}%` : 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Phone:</span>
                  <p>{selectedInterview.candidate_phone || 'N/A'}</p>
                </div>
              </div>
              
              {selectedInterview.interview_notes && (
                <div>
                  <span className="font-medium text-gray-700">Notes:</span>
                  <p className="text-sm mt-1">{selectedInterview.interview_notes}</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => handleReschedule(selectedInterview)}
                className="flex items-center gap-2 px-4 py-2 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50"
              >
                <FiEdit size={16} /> Reschedule
              </button>
              <button 
                onClick={() => handleMarkCompleted(selectedInterview)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                <FiCheck size={16} /> Mark Completed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && selectedInterview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Reschedule Interview</h3>
              <button 
                onClick={() => setShowRescheduleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={rescheduleData.scheduled_at.slice(0, 16)}
                  onChange={(e) => setRescheduleData({
                    ...rescheduleData,
                    scheduled_at: e.target.value + ':00.000Z'
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason for Rescheduling
                </label>
                <textarea
                  value={rescheduleData.change_reason}
                  onChange={(e) => setRescheduleData({
                    ...rescheduleData,
                    change_reason: e.target.value
                  })}
                  placeholder="Please provide a reason for rescheduling..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowRescheduleModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleRescheduleSubmit}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Create New Event</h3>
              <button 
                onClick={() => setShowCreateEventModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Title*
                </label>
                <input
                  type="text"
                  value={createEventData.title}
                  onChange={(e) => setCreateEventData({
                    ...createEventData,
                    title: e.target.value
                  })}
                  placeholder="Enter event title..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  value={createEventData.category}
                  onChange={(e) => setCreateEventData({
                    ...createEventData,
                    category: e.target.value
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                >
                  {Object.keys(categories).map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date & Time*
                </label>
                <input
                  type="datetime-local"
                  value={createEventData.scheduled_date}
                  onChange={(e) => setCreateEventData({
                    ...createEventData,
                    scheduled_date: e.target.value
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={createEventData.notes}
                  onChange={(e) => setCreateEventData({
                    ...createEventData,
                    notes: e.target.value
                  })}
                  placeholder="Add event notes..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setShowCreateEventModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateEventSubmit}
                disabled={!createEventData.title || !createEventData.scheduled_date}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Create Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MySchedule; 