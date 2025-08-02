import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiFilter, FiMoreHorizontal, FiChevronDown } from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import AdminCreateUserForm from './AdminCreateUserForm';
import AvatarImg from '../../assets/Avatar17.png';
import BellIcon from '../../assets/bell-outlined.png';
import NotificationPanel from './NotificationPanelAdmin';
import adminApi from '../../services/adminApi';

interface AccountItem {
  id: number;
  fullName: string;
  email: string;
  status: 'Active' | 'Locked';
  type: 'HR' | 'Candidate';
}

const AdminAccountsList = () => {
  const [viewMode, setViewMode] = useState<'pipeline' | 'table'>('table');
  const [notifOpen, setNotifOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for custom dropdown
  const [accountsPerPage, setAccountsPerPage] = useState(10);
  const [isPageSelectOpen, setIsPageSelectOpen] = useState(false);
  const pageOptions = [10, 20, 30];
  const pageSelectRef = useRef<HTMLDivElement>(null);

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const usersData = await adminApi.getAllUsers();
      
      // Transform API data to match component interface
      const transformedAccounts = usersData.map((user: any) => ({
        id: user.id || user._id,
        fullName: user.name || `${user.firstName} ${user.lastName}` || 'Unknown User',
        email: user.email,
        status: user.status === 'active' ? 'Active' : 'Locked',
        type: user.role === 'hr' ? 'HR' : 'Candidate'
      }));
      
      setAccounts(transformedAccounts);
      setError(null);
    } catch (err) {
      setError('Failed to load accounts.');
      console.error('Error fetching accounts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pageSelectRef.current && !pageSelectRef.current.contains(event.target as Node)) {
        setIsPageSelectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [pageSelectRef]);
  
  const handleDelete = async (e: React.MouseEvent, userId: number) => {
    e.stopPropagation(); // Prevent navigation
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        await adminApi.deleteUser(userId.toString());
        // Refresh the list after deletion
        fetchAccounts();
      } catch (err) {
        console.error(`Failed to delete user ${userId}`, err);
        // Optionally show an error message to the admin
        alert('Failed to delete account.');
      }
    }
  };

  const handleUserCreated = (newUser: any) => {
    // Refresh the accounts list to include the new user
    fetchAccounts();
  };

  return (
    <AdminLayout>
    <div className="p-8">
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
          <button onClick={() => setNotifOpen(!notifOpen)} className="relative focus:outline-none">
            <img src={BellIcon} alt="Notifications" className="w-5 h-5" />
            {hasUnread && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />}
          </button>

          {/* Add account button */}
          <button 
            onClick={() => setIsCreateUserOpen(true)}
            className="text-white flex items-center px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors" 
            style={{backgroundColor:'#007BFF'}}
          >
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

      {/* Controls (Total Accounts + Search / Filter / Toggle) */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        {/* Total Accounts */}
        <h1 className="text-2xl font-medium text-gray-900 whitespace-nowrap">Total Accounts : {accounts.length}</h1>

        {/* Right Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search */}
          <div className="relative w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, email"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Filter */}
          <button className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 whitespace-nowrap">
            <FiFilter className="text-gray-600" />
            <span>Filter</span>
          </button>

          {/* View Toggle Wrapper */}
          <div className="flex bg-indigo-50 p-1 rounded-full">
            <button 
              className={`px-4 py-2 rounded-full text-sm font-semibold ${viewMode === 'pipeline' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-white/50'}`}
              onClick={() => setViewMode('pipeline')}
            >
              Pipeline View
            </button>
            <button 
              className={`px-4 py-2 rounded-full text-sm font-semibold ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-white/50'}`}
              onClick={() => setViewMode('table')}
            >
              Table View
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="w-6 p-4">
                <input type="checkbox" className="rounded border-gray-300" />
              </th>
              <th className="px-4 py-4 text-left font-medium text-gray-600">Full Name <FiChevronDown className="inline-block ml-1 text-gray-400" /></th>
              <th className="px-4 py-4 text-left font-medium text-gray-600">Email <FiChevronDown className="inline-block ml-1 text-gray-400" /></th>
              <th className="px-4 py-4 text-left font-medium text-gray-600">Status <FiChevronDown className="inline-block ml-1 text-gray-400" /></th>
              <th className="px-4 py-4 text-left font-medium text-gray-600">Type <FiChevronDown className="inline-block ml-1 text-gray-400" /></th>
              <th className="px-4 py-4 text-left font-medium text-gray-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center p-4">Loading accounts...</td></tr>
            ) : error ? (
              <tr><td colSpan={6} className="text-center p-4 text-red-500">{error}</td></tr>
            ) : accounts.map((account) => (
              <tr key={account.id} className="border-b border-gray-200 hover:bg-blue-50 cursor-pointer transition-colors" onClick={() => {
                const path = account.type === 'Candidate' ? `/admin/candidates/${account.id}` : `/admin/hr/${account.id}`;
                navigate(path);
              }}>
                <td className="p-4">
                  <input type="checkbox" className="rounded border-gray-300" />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <img src={`https://i.pravatar.cc/40?u=${account.id}`} alt={account.fullName} className="w-10 h-10 rounded-full" />
                    <span className="font-medium">{account.fullName}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-gray-600">{account.email}</td>
                <td className="px-4 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    account.status === 'Active' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {account.status}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    account.type === 'HR'
                      ? 'bg-yellow-100 text-yellow-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {account.type}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => handleDelete(e, account.id)}
                      className="px-3 py-1 text-sm border border-red-500 text-red-500 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                    <button className="px-3 py-1 text-sm border border-blue-500 text-blue-500 rounded hover:bg-blue-50" onClick={(e) => {e.stopPropagation(); const path = account.type === 'Candidate' ? `/admin/candidates/${account.id}` : `/admin/hr/${account.id}`; navigate(path);}}>
                      Account Details
                    </button>
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <FiMoreHorizontal className="text-gray-600" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination */}
        <div className="px-4 py-4 flex items-center justify-between border-t border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">View</span>
            <div ref={pageSelectRef} className="relative inline-block">
              {/* Custom Select Button */}
              <button
                onClick={() => setIsPageSelectOpen(!isPageSelectOpen)}
                className="flex items-center justify-between w-16 border border-gray-300 rounded px-2 py-0.5 bg-white focus:outline-none focus:border-[#007BFF]"
              >
                <span>{accountsPerPage}</span>
                <FiChevronDown className="text-gray-500" />
              </button>

              {/* Custom Dropdown Options */}
              {isPageSelectOpen && (
                <div className="absolute bottom-full mb-1 w-16 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  {pageOptions.map((option) => (
                    <div
                      key={option}
                      onClick={() => {
                        setAccountsPerPage(option);
                        setIsPageSelectOpen(false);
                      }}
                      className="px-2 py-0.5 text-center cursor-pointer hover:bg-[#007BFF] hover:text-white"
                    >
                      {option}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <span className="text-gray-600 whitespace-nowrap">Accounts per page</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="min-w-[32px] h-8 px-2 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50">
              &lt;
            </button>
            <button className="min-w-[32px] h-8 px-2 flex items-center justify-center bg-[#007BFF] text-white rounded">
              1
            </button>
            <button className="min-w-[32px] h-8 px-2 flex items-center justify-center border border-[#007BFF] text-[#007BFF] rounded hover:bg-blue-50">
              2
            </button>
            <button className="min-w-[32px] h-8 px-2 flex items-center justify-center border border-[#007BFF] text-[#007BFF] rounded hover:bg-blue-50">
              3
            </button>
            <button className="min-w-[32px] h-8 px-2 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-50">
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Create User Form Modal */}
    <AdminCreateUserForm
      isOpen={isCreateUserOpen}
      onClose={() => setIsCreateUserOpen(false)}
      onUserCreated={handleUserCreated}
    />
    </AdminLayout>
  );
};

export default AdminAccountsList; 