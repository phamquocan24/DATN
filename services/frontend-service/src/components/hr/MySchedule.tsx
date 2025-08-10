import React, { useState } from 'react';
import { FiChevronLeft, FiChevronRight, FiPlus } from 'react-icons/fi';

const MiniCalendar = () => {
    const [date, setDate] = useState(new Date(2021, 10, 24));
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
                {days.map(day => (
                    <div key={day.toString()} className={`py-1 ${day.getDate() === 24 ? 'bg-[#007BFF] text-white rounded-full' : ''}`}>
                        {day.getDate()}
                    </div>
                ))}
            </div>
        </div>
    );
}

const MySchedule: React.FC = () => {
  const timeSlots = ['GMT -07', ...Array.from({ length: 12 }, (_, i) => `${i + 1} AM`), ...Array.from({ length: 11 }, (_, i) => `${i + 1} PM`), '12 AM'];
  const weekDays = [
      { day: 'SUN', date: 23, isToday: false, isHoliday: false },
      { day: 'MON', date: 24, isToday: true, isHoliday: false },
      { day: 'TUE', date: 25, isToday: false, isHoliday: false },
      { day: 'WED', date: 26, isToday: false, isHoliday: false },
      { day: 'THU', date: 27, isToday: false, isHoliday: true },
      { day: 'FRI', date: 28, isToday: false, isHoliday: false },
      { day: 'SAT', date: 29, isToday: false, isHoliday: false },
  ]
  const events = [
      { start: 2, end: 5, dayIndex: 1, title: 'Interview session with Kathryn Murphy', color: 'bg-[#007BFF]', avatars: ['https://i.pravatar.cc/24?u=1','https://i.pravatar.cc/24?u=2'] },
      { start: 8, end: 9, dayIndex: 1, title: 'Interview sess...', color: 'bg-blue-400' },
      { start: 9, end: 10, dayIndex: 3, title: 'Meeting with s...', color: 'bg-green-400' },
  ]

  return (
    <div className="flex gap-6 text-gray-800 text-left">
      {/* Left Sidebar */}
      <div className="w-72 flex-shrink-0 space-y-6">
        <button className="w-full border border-[#007BFF] text-[#007BFF] font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-50">
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
                <div className="flex items-center"><input type="checkbox" defaultChecked className="form-checkbox h-4 w-4 text-[#007BFF] rounded" /> <span className="ml-2">Interview Schedule</span></div>
                <div className="flex items-center"><input type="checkbox" defaultChecked className="form-checkbox h-4 w-4 text-green-500 rounded" /> <span className="ml-2">Internal Meeting</span></div>
                <div className="flex items-center"><input type="checkbox" className="form-checkbox h-4 w-4" /> <span className="ml-2">Team Schedule</span></div>
                <div className="flex items-center"><input type="checkbox" className="form-checkbox h-4 w-4" /> <span className="ml-2">My Task</span></div>
                <div className="flex items-center"><input type="checkbox" className="form-checkbox h-4 w-4" /> <span className="ml-2">Reminders</span></div>
            </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">My Schedule</h1>
            <button className="border rounded-lg px-4 py-2 text-sm font-semibold bg-white shadow-sm">Today</button>
        </div>
        <div className="bg-white p-4 rounded-lg border">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <button><FiChevronLeft/></button>
                    <h2 className="font-semibold">NOVEMBER 2021</h2>
                    <button><FiChevronRight/></button>
                </div>
                <div className="flex border rounded-lg text-sm font-semibold">
                    <button className="px-4 py-1.5">Day</button>
                    <button className="px-4 py-1.5 bg-gray-100 border-l border-r">Week</button>
                    <button className="px-4 py-1.5">Month</button>
                </div>
            </div>
            <div className="grid grid-cols-8">
                <div className="col-span-1"></div>
                <div className="col-span-7 grid grid-cols-7 text-center text-sm font-semibold text-gray-600">
                    {weekDays.map(d => (
                        <div key={d.day} className={`p-2 ${d.isToday ? 'bg-blue-100 rounded-lg text-[#007BFF]' : ''} ${d.isHoliday ? 'bg-red-100 rounded-lg text-red-500' : ''}`}>
                            {d.day} {d.date}
                            {d.isHoliday && <p className="text-xs">Holiday</p>}
                        </div>
                    ))}
                </div>
            </div>
            <div className="h-[70vh] overflow-y-auto relative">
                <div className="grid grid-cols-8">
                    <div className="col-span-1 text-xs text-gray-500 text-right pr-2">
                        {timeSlots.map(time => <div key={time} className="h-16 border-t pt-1">{time}</div>)}
                    </div>
                    <div className="col-span-7 grid grid-cols-7">
                        {[...Array(7)].map((_, i) => <div key={i} className="border-l">{timeSlots.map(time => <div key={time} className="h-16 border-t"></div>)}</div>)}
                    </div>
                </div>
                {/* Events */}
                {events.map(event => (
                    <div key={event.title} className={`absolute text-white p-2 rounded-lg text-xs ${event.color}`} style={{ 
                        top: `${event.start * 4}rem`, 
                        height: `${(event.end - event.start) * 4}rem`,
                        left: `calc(12.5% + ${event.dayIndex * 12.5}%)`,
                        width: '12.5%',
                    }}>
                        {event.title}
                        <p>{event.start}:00 - {event.end}:00 AM</p>
                        {event.avatars && <div className="flex mt-1">{event.avatars.map(av => <img key={av} src={av} className="w-6 h-6 rounded-full border-2 border-white -ml-2" />)}</div>}
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default MySchedule; 