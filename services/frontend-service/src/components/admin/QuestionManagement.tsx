import React, { useState, useRef } from 'react';
import AdminLayout from './AdminLayout';
import { FiSearch, FiFilter, FiMoreHorizontal, FiChevronDown } from 'react-icons/fi';
import AvatarImg from '../../assets/Avatar17.png'; 
import BellIcon from '../../assets/bell-outlined.png';
import NotificationPanel from './NotificationPanelAdmin';
import SchemeIcon from '../../assets/scheme.png';
import QuestionDetails from './QuestionDetails'; // Import the new component

interface QuestionItem {
  id: number;
  position: string;
  createdBy: 'HR';
  fullName: string;
  contents: string;
  status: 'Opening' | 'Closed';
  created: string;
  due: string;
}

const QuestionManagement: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [notifOpen, setNotifOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [selectedDate, setSelectedDate] = useState('2023-07-19');
  const dateInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedQuestionSet, setSelectedQuestionSet] = useState<QuestionItem | null>(null);


  const openDatePicker = () => {
    dateInputRef.current?.showPicker?.();
    dateInputRef.current?.click();
  };
  
  const [isPageSelectOpen, setIsPageSelectOpen] = useState(false);
  const pageOptions = [10, 20, 30];
  const pageSelectRef = useRef<HTMLDivElement>(null);


  const questions: QuestionItem[] = [
    { id: 1, position: 'Social Media Assistant', createdBy: 'HR', fullName: 'Jerome Bell', contents: 'Basic Programming', status: 'Closed', created: '2025-06-08', due: '2025-06-08' },
    { id: 2, position: 'Senior Designer', createdBy: 'HR', fullName: 'Jerome Bell', contents: 'Situational Handling', status: 'Opening', created: '2025-06-08', due: '2025-06-08' },
    { id: 3, position: 'Visual Designer', createdBy: 'HR', fullName: 'Jerome Bell', contents: 'OOP Polymorphism', status: 'Opening', created: '2025-06-08', due: '2025-06-08' },
    { id: 4, position: 'Data Science', createdBy: 'HR', fullName: 'Jerome Bell', contents: 'Database Design', status: 'Closed', created: '2025-06-08', due: '2025-06-08' },
    { id: 5, position: 'Kotlin Developer', createdBy: 'HR', fullName: 'Jerome Bell', contents: 'Optimization Algorithms', status: 'Closed', created: '2025-06-08', due: '2025-06-08' },
    { id: 6, position: 'Data Science', createdBy: 'HR', fullName: 'Jerome Bell', contents: 'Data Visualization', status: 'Opening', created: '2025-06-08', due: '2025-06-08' },
    { id: 7, position: 'React Developer', createdBy: 'HR', fullName: 'Jerome Bell', contents: 'Performance Optimization', status: 'Closed', created: '2025-06-08', due: '2025-06-08' },
  ];

  const handleQuestionSetClick = (questionSet: QuestionItem) => {
    setSelectedQuestionSet(questionSet);
  };

  const handleBackToList = () => {
    setSelectedQuestionSet(null);
  };


  return (
    <AdminLayout>
      <div className="p-8 bg-white text-left">
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
                <img src={AvatarImg} alt="Avatar" className="w-10 h-10 rounded-full" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-800">Maria Kelly</p>
                  <p className="text-xs text-gray-500">MariaKelly@email.com</p>
                </div>
                <FiChevronDown className="h-4 w-4 text-gray-500" />
            </div>
            <div className="flex items-center space-x-6 relative">
                <button onClick={() => setNotifOpen(!notifOpen)} className="relative focus:outline-none">
                    <img src={BellIcon} alt="Notifications" className="w-5 h-5" />
                    {hasUnread && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />}
                </button>
                <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} position="header" onMarkAllAsRead={() => setHasUnread(false)} />
            </div>
        </div>
        <div className="border-t border-gray-200 mb-6"></div>

        {selectedQuestionSet ? (
          <QuestionDetails questionSet={selectedQuestionSet} onBack={handleBackToList} />
        ) : (
          <>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="text-left">
                <h1 className="text-2xl font-semibold text-gray-800">Question Management</h1>
                <p className="text-gray-600">Here is your Q&A from July 19 - July 25.</p>
              </div>
              <div className="relative">
                <input
                  ref={dateInputRef}
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div 
                  className="flex items-center pl-4 pr-10 py-2 w-48 text-left text-gray-700 border rounded-md bg-white select-none cursor-pointer" 
                  onClick={openDatePicker}
                >
                  <span>{new Date(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(new Date(selectedDate).getTime() + 6 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { day: 'numeric' })}</span>
                  <img src={SchemeIcon} alt="calendar" onClick={openDatePicker} className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 cursor-pointer" />
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
              <nav className="flex space-x-8">
                <button className="py-4 px-1 border-b-2 font-medium text-sm border-[#007BFF] text-[#007BFF]">
                  Questions
                </button>
              </nav>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
                  <div className="text-lg font-semibold text-gray-800 text-left">Total Questions: {questions.length}</div>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input type="text" placeholder="Search roles, contents" className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300" />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg">
                      <FiFilter />
                      <span>Filter</span>
                    </button>
                  </div>
                </div>

                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-500 text-sm">
                      {['Positions', 'Created by', 'Full name', 'Contents', 'Statuses', 'Created', 'Due'].map(header => (
                        <th key={header} className="pb-4 font-medium">
                          {header} <FiChevronDown className="inline-block" />
                        </th>
                      ))}
                      <th className="pb-4 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((q) => (
                      <tr 
                        key={q.id} 
                        className="border-t border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors"
                        onClick={() => handleQuestionSetClick(q)}
                      >
                        <td className="py-4 font-medium">{q.position}</td>
                        <td className="py-4">
                          <span className="px-3 py-1 rounded-full text-sm border bg-yellow-100 text-yellow-800">{q.createdBy}</span>
                        </td>
                        <td className="py-4 text-gray-700">{q.fullName}</td>
                        <td className="py-4 text-gray-700">{q.contents}</td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-sm border ${ q.status === 'Opening' ? 'border-green-400 bg-green-50 text-green-700' : 'border-red-400 bg-red-50 text-red-700' }`}>
                            {q.status}
                          </span>
                        </td>
                        <td className="py-4 text-gray-500">{q.created}</td>
                        <td className="py-4 text-gray-500">{q.due}</td>
                        <td className="py-4 text-right"><button className="text-gray-400 hover:text-gray-600"><FiMoreHorizontal /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">View</span>
                  <div ref={pageSelectRef} className="relative inline-block">
                    <button onClick={() => setIsPageSelectOpen(!isPageSelectOpen)} className="flex items-center justify-between w-16 border border-gray-300 rounded px-2 py-0.5 bg-white focus:outline-none focus:border-[#007BFF]">
                      <span>{itemsPerPage}</span>
                      <FiChevronDown className="text-gray-500" />
                    </button>
                    {isPageSelectOpen && (
                      <div className="absolute bottom-full mb-1 w-16 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                        {pageOptions.map((option) => (
                          <div key={option} onClick={() => { setItemsPerPage(option); setIsPageSelectOpen(false); }} className="px-2 py-0.5 text-center cursor-pointer hover:bg-[#007BFF] hover:text-white">{option}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-gray-600 whitespace-nowrap">Questions per page</span>
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

export default QuestionManagement; 