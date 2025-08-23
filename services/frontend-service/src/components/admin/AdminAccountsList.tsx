import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiChevronDown } from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import AdminCreateUserForm from './AdminCreateUserForm';

import BellIcon from '../../assets/bell-outlined.png';
import NotificationPanel from './NotificationPanelAdmin';
import adminApi from '../../services/adminApi';
import AdminHeaderDropdown from './AdminHeaderDropdown';

interface AccountItem {
  id: number;
  fullName: string;
  email: string;
  status: 'Active' | 'Locked';
  type: 'HR' | 'Candidate' | 'Admin';
}

interface AdminAccountsListProps {
  currentUser?: any;
}

const AdminAccountsList: React.FC<AdminAccountsListProps> = ({ currentUser }) => {
  

  const [notifOpen, setNotifOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null);
  
  // State for custom dropdown
  const [accountsPerPage, setAccountsPerPage] = useState(10);
  const [isPageSelectOpen, setIsPageSelectOpen] = useState(false);
  const pageOptions = [10, 20, 50, 100];
  const pageSelectRef = useRef<HTMLDivElement>(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // State for filter dropdowns
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  
  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: 'candidate', label: 'Candidate' },
    { value: 'recruiter', label: 'HR' },
    { value: 'admin', label: 'Admin' }
  ];
  
  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Locked' }
  ];
  
  // Modal states
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{id: number, email: string} | null>(null);
  const [deactivationReason, setDeactivationReason] = useState('');

  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      // Build API parameters
      const params: any = {
        page: currentPage,
        limit: accountsPerPage,
        order_by: 'created_at',
        direction: 'DESC'
      };
      
      if (debouncedSearchQuery.trim()) {
        params.search = debouncedSearchQuery.trim();
      }
      
      if (roleFilter !== 'all') {
        params.role = roleFilter.toUpperCase();
      }
      
      if (statusFilter !== 'all') {
        params.is_active = statusFilter === 'active';
      }
      
      console.log('Fetching accounts with params:', params); // Debug log
      const apiResponse = await adminApi.getAllUsers(params);
      console.log('API Response:', apiResponse); // Debug log
      
      const usersData = apiResponse.data || apiResponse;
      const paginationData = apiResponse.pagination;
      
      // Ensure usersData is an array
      if (!Array.isArray(usersData)) {
        console.error('Users data is not an array:', usersData);
        setError('Invalid data format received.');
        setAccounts([]);
        setPagination(null);
        return;
      }
      
      // Transform API data to match component interface
      const transformedAccounts = usersData.map((user: any) => ({
        id: user.user_id || user.id || user._id,
        fullName: user.full_name || user.name || user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
        email: user.email || 'No email',
        status: (user.is_active === false || user.status === 'inactive') ? 'Locked' as const : 'Active' as const,
        type: (user.role === 'RECRUITER' || user.role === 'HR' || user.role === 'hr') ? 'HR' as const : 
              (user.role === 'ADMIN') ? 'Admin' as const : 'Candidate' as const
      }));
      
      console.log('Transformed accounts:', transformedAccounts); // Debug log
      setAccounts(transformedAccounts);
      setPagination(paginationData);
      setError(null);
    } catch (err) {
      setError('Failed to load accounts.');
      console.error('Error fetching accounts:', err);
      setAccounts([]); // Set empty array on error
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce search query
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchAccounts();
  }, [currentPage, accountsPerPage, debouncedSearchQuery, roleFilter, statusFilter]);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchQuery, roleFilter, statusFilter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pageSelectRef.current && !pageSelectRef.current.contains(event.target as Node)) {
        setIsPageSelectOpen(false);
      }
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [pageSelectRef, roleDropdownRef, statusDropdownRef]);
  
  const handleDeactivate = (e: React.MouseEvent, userId: number, userEmail: string) => {
    e.stopPropagation(); // Prevent navigation
    setSelectedUser({ id: userId, email: userEmail });
    setShowDeactivateModal(true);
  };

  const confirmDeactivation = async () => {
    if (!selectedUser || !deactivationReason.trim()) {
      alert('Reason is required to deactivate an account.');
      return;
    }

    try {
      setIsLoading(true);
      const response = await adminApi.deactivateUser(selectedUser.id.toString(), deactivationReason.trim());
      
      console.log('Deactivation response:', response);
      
      // Close modal and reset
      setShowDeactivateModal(false);
      setSelectedUser(null);
      setDeactivationReason('');
      
      // Refresh the list after deactivation
      await fetchAccounts();
      
      // Show success message with details
      alert(`SUCCESS\n\nAccount deactivated successfully!\n\nUser: ${selectedUser.email}\nStatus: Inactive\nTime: ${new Date().toLocaleString()}`);
      
    } catch (err: any) {
      console.error(`Failed to deactivate user ${selectedUser.id}`, err);
      
      // Better error handling with specific messages
      const errorMessage = err?.response?.data?.error || err?.response?.data?.message || err.message || 'Unknown error occurred';
      alert(`DEACTIVATION FAILED\n\nUser: ${selectedUser.email}\nError: ${errorMessage}\n\nPlease try again or contact support.`);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelDeactivation = () => {
    setShowDeactivateModal(false);
    setSelectedUser(null);
    setDeactivationReason('');
  };

  // Pagination navigation functions
  const goToPage = (page: number) => {
    if (page >= 1 && page <= (pagination?.totalPages || 1)) {
      setCurrentPage(page);
    }
  };

  const goToPreviousPage = () => {
    if (pagination?.hasPrev) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (pagination?.hasNext) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    if (!pagination) return [1];
    
    const { totalPages } = pagination;
    const pages: number[] = [];
    
    if (totalPages <= 5) {
      // Show all pages if total is 5 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      let start = Math.max(1, currentPage - 2);
      let end = Math.min(totalPages, currentPage + 2);
      
      // Adjust if we're near the beginning or end
      if (currentPage <= 3) {
        end = 5;
      }
      if (currentPage >= totalPages - 2) {
        start = totalPages - 4;
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const handleReactivate = async (e: React.MouseEvent, userId: number, userEmail: string) => {
    e.stopPropagation(); // Prevent navigation
    
    if (window.confirm(`CONFIRM REACTIVATION\n\nAccount: ${userEmail}\n\nThis action will:\n• Enable user login\n• Restore account access\n• Log this action for audit\n\nProceed with reactivation?`)) {
      try {
        setIsLoading(true);
        const response = await adminApi.updateUserStatus(userId.toString(), true, 'Account reactivated by admin');
        
        console.log('Reactivation response:', response);
        
        // Refresh the list after reactivation
        await fetchAccounts();
        
        // Show success message with details
        alert(`SUCCESS\n\nAccount reactivated successfully!\n\nUser: ${userEmail}\nStatus: Active\nTime: ${new Date().toLocaleString()}`);
        
      } catch (err: any) {
        console.error(`Failed to reactivate user ${userId}`, err);
        
        // Better error handling with specific messages
        const errorMessage = err?.response?.data?.error || err?.response?.data?.message || err.message || 'Unknown error occurred';
        alert(`REACTIVATION FAILED\n\nUser: ${userEmail}\nError: ${errorMessage}\n\nPlease try again or contact support.`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleUserCreated = () => {
    // Refresh the accounts list to include the new user
    fetchAccounts();
  };

  return (
    <AdminLayout>
    <div className="p-8 bg-white">
      {/* Top Admin Bar */}
      <div className="flex items-center justify-between mb-6">
        {/* User Info */}
        <AdminHeaderDropdown currentUser={currentUser} />

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

      {/* Sub-header for List View */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-left">
          <h1 className="text-2xl font-semibold text-gray-800">Accounts</h1>
          <p className="text-gray-600">Manage user accounts and their permissions.</p>
        </div>
      </div>

      {/* Tabs and Table */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button className="py-4 px-1 border-b-2 border-[#007BFF] text-[#007BFF] font-medium text-sm">Accounts</button>
        </nav>
      </div>
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Table content and search controls */}
        <div className="p-6">
          <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-200">
            <div className="text-lg font-semibold text-gray-800 text-left">Total Accounts: {pagination ? pagination.total : accounts.length}</div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search name, email" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300" 
                />
              </div>
              <div ref={roleDropdownRef} className="relative inline-block">
                <button
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  className="flex items-center justify-between w-32 px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-[#007BFF]"
                >
                  <span>{roleOptions.find(option => option.value === roleFilter)?.label}</span>
                  <FiChevronDown className="text-gray-500" />
                </button>
                {isRoleDropdownOpen && (
                  <div className="absolute top-full mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    {roleOptions.map((option) => (
                      <div
                        key={option.value}
                        onClick={() => {
                          setRoleFilter(option.value);
                          setIsRoleDropdownOpen(false);
                        }}
                        className="px-4 py-2 text-left cursor-pointer hover:bg-[#007BFF] hover:text-white transition-colors"
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div ref={statusDropdownRef} className="relative inline-block">
                <button
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className="flex items-center justify-between w-32 px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-[#007BFF]"
                >
                  <span>{statusOptions.find(option => option.value === statusFilter)?.label}</span>
                  <FiChevronDown className="text-gray-500" />
                </button>
                {isStatusDropdownOpen && (
                  <div className="absolute top-full mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    {statusOptions.map((option) => (
                      <div
                        key={option.value}
                        onClick={() => {
                          setStatusFilter(option.value);
                          setIsStatusDropdownOpen(false);
                        }}
                        className="px-4 py-2 text-left cursor-pointer hover:bg-[#007BFF] hover:text-white transition-colors"
                      >
                        {option.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-500 text-sm">
                <th className="pb-4 font-semibold">Full Name <FiChevronDown className="inline-block" /></th>
                <th className="pb-4 font-semibold">Email <FiChevronDown className="inline-block" /></th>
                <th className="pb-4 font-semibold">Status <FiChevronDown className="inline-block" /></th>
                <th className="pb-4 font-semibold">Type <FiChevronDown className="inline-block" /></th>
                <th className="pb-4 font-semibold text-left w-48">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="text-center p-4">Loading accounts...</td></tr>
              ) : error ? (
                <tr><td colSpan={5} className="text-center p-4 text-red-500">{error}</td></tr>
              ) : accounts.map((account) => (
                <tr 
                  key={account.id} 
                  className="border-t border-gray-100 hover:bg-blue-50 hover:rounded-md cursor-pointer transition-colors"
                  onClick={() => {
                    const path = account.type === 'Candidate' ? `/admin/candidates/${account.id}` : 
                                 account.type === 'Admin' ? `/admin/admins/${account.id}` :
                                 `/admin/hr/${account.id}`;
                    navigate(path);
                  }}
                >
                  <td className="py-4 font-medium">
                    <div className="flex items-center gap-3">
                      <img src={`https://i.pravatar.cc/40?u=${account.id}`} alt={account.fullName} className="w-10 h-10 rounded-full" />
                      <span>{account.fullName}</span>
                    </div>
                  </td>
                  <td className="py-4 text-gray-500">{account.email}</td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-sm border ${
                      account.status === 'Active' 
                        ? 'border-green-500 text-green-500 bg-green-50' 
                        : 'border-red-500 text-red-500 bg-red-50'
                    }`}>
                      {account.status}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-sm border ${
                      account.type === 'HR'
                        ? 'border-yellow-500 text-yellow-500 bg-yellow-50'
                        : account.type === 'Admin'
                        ? 'border-red-500 text-red-500 bg-red-50'
                        : 'border-blue-500 text-blue-500 bg-blue-50'
                    }`}>
                      {account.type}
                    </span>
                  </td>
                  <td className="py-4 text-left w-48">
                    <div className="flex items-center space-x-2 justify-start">
                      {account.status === 'Active' ? (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeactivate(e, account.id, account.email);
                          }}
                          className="px-3 py-1 rounded-full text-sm border border-red-500 text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Processing...' : 'Deactivate'}
                        </button>
                      ) : (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReactivate(e, account.id, account.email);
                          }}
                          className="px-3 py-1 rounded-full text-sm border border-green-500 text-green-500 bg-green-50 hover:bg-green-100 transition-colors"
                          disabled={isLoading}
                        >
                          {isLoading ? 'Processing...' : 'Reactivate'}
                        </button>
                      )}
                      <button 
                        className="px-3 py-1 rounded-full text-sm border border-[#007BFF] text-[#007BFF] bg-blue-50 hover:bg-blue-100 transition-colors" 
                        onClick={(e) => {
                          e.stopPropagation(); 
                          const path = account.type === 'Candidate' ? `/admin/candidates/${account.id}` : 
                                       account.type === 'Admin' ? `/admin/admins/${account.id}` :
                                       `/admin/hr/${account.id}`; 
                          navigate(path);
                        }}
                      >
                        Details
                      </button>
                    </div>
                  </td>
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
              <button
                onClick={() => setIsPageSelectOpen(!isPageSelectOpen)}
                className="flex items-center justify-between w-16 border border-gray-300 rounded px-2 py-0.5 bg-white focus:outline-none focus:border-[#007BFF]"
              >
                <span>{accountsPerPage}</span>
                <FiChevronDown className="text-gray-500" />
              </button>
              {isPageSelectOpen && (
                <div className="absolute bottom-full mb-1 w-16 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  {pageOptions.map((option) => (
                    <div
                      key={option}
                      onClick={() => {
                        setAccountsPerPage(option);
                        setCurrentPage(1);
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
            <button
              disabled={currentPage === 1}
              onClick={() => goToPreviousPage()}
              className={`min-w-[32px] h-8 px-2 flex items-center justify-center border rounded ${currentPage === 1 ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 hover:bg-gray-50'}`}
            >
              &lt;
            </button>
            {getPageNumbers().map((page) => (
              <button
                key={page}
                className={`min-w-[32px] h-8 px-2 flex items-center justify-center rounded ${
                  currentPage === page
                    ? 'bg-[#007BFF] text-white'
                    : 'border border-transparent text-[#007BFF] hover:bg-blue-50'
                }`}
                onClick={() => goToPage(page)}
              >
                {page}
              </button>
            ))}
            <button
              disabled={currentPage === (pagination?.totalPages || 1)}
              onClick={() => goToNextPage()}
              className={`min-w-[32px] h-8 px-2 flex items-center justify-center border rounded ${currentPage === (pagination?.totalPages || 1) ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-300 hover:bg-gray-50'}`}
            >
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

    {/* Deactivate User Modal */}
    {showDeactivateModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
              <span className="text-orange-600 text-lg">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-left">Deactivate Account</h3>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2 text-left">
              You are about to deactivate the following account:
            </p>
            <div className="bg-gray-50 p-3 rounded border">
              <p className="font-medium text-gray-900 text-left">{selectedUser?.email}</p>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="deactivationReason" className="block text-sm font-medium text-gray-700 mb-2 text-left">
              Reason for deactivation <span className="text-red-500">*</span>
            </label>
            <textarea
              id="deactivationReason"
              value={deactivationReason}
              onChange={(e) => setDeactivationReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-left"
              rows={3}
              placeholder="Please provide a reason for deactivating this account..."
              disabled={isLoading}
            />
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-4">
            <p className="text-sm text-orange-800 text-left">
              <strong>This action will:</strong>
            </p>
            <ul className="text-sm text-orange-700 mt-1 list-disc list-inside text-left">
              <li>Disable user login access</li>
              <li>Restrict account functionality</li>
              <li>Log this action for audit purposes</li>
            </ul>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={cancelDeactivation}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={confirmDeactivation}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-600 border border-transparent rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading || !deactivationReason.trim()}
            >
              {isLoading ? 'Deactivating...' : 'Deactivate Account'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Create User Modal */}
    <AdminCreateUserForm
      isOpen={isCreateUserOpen}
      onClose={() => setIsCreateUserOpen(false)}
      onUserCreated={handleUserCreated}
    />
    </AdminLayout>
  );
};

export default AdminAccountsList; 