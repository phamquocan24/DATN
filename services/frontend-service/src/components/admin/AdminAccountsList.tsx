import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiMoreHorizontal, FiChevronDown } from 'react-icons/fi';
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
    setCurrentPage(1);
  }, [debouncedSearchQuery, roleFilter, statusFilter]);

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
    <div className="p-8">
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

      {/* Controls (Total Accounts + Search / Filter / Toggle) */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        {/* Total Accounts */}
        <h1 className="text-2xl font-medium text-gray-900 whitespace-nowrap">
          Total Accounts : {pagination ? pagination.total : accounts.length}
        </h1>

        {/* Right Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Search */}
          <div className="relative w-64">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search name, email"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 min-w-[140px]"
          >
            <option value="all">All Roles</option>
            <option value="candidate">Candidate</option>
            <option value="recruiter">HR</option>
            <option value="admin">Admin</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Locked</option>
          </select>


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
              <th className="px-6 py-4 text-left font-medium text-gray-600 w-1/4">Full Name <FiChevronDown className="inline-block ml-1 text-gray-400" /></th>
              <th className="px-6 py-4 text-left font-medium text-gray-600 w-1/4">Email <FiChevronDown className="inline-block ml-1 text-gray-400" /></th>
              <th className="px-6 py-4 text-left font-medium text-gray-600 w-1/6">Status <FiChevronDown className="inline-block ml-1 text-gray-400" /></th>
              <th className="px-6 py-4 text-left font-medium text-gray-600 w-1/6">Type <FiChevronDown className="inline-block ml-1 text-gray-400" /></th>
              <th className="px-6 py-4 text-left font-medium text-gray-600 w-1/6">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="text-center p-4">Loading accounts...</td></tr>
            ) : error ? (
              <tr><td colSpan={6} className="text-center p-4 text-red-500">{error}</td></tr>
            ) : accounts.map((account) => (
              <tr key={account.id} className={`border-b border-gray-200 hover:bg-blue-50 cursor-pointer transition-colors ${account.status === 'Locked' ? 'bg-red-50 opacity-75' : ''}`} onClick={() => {
                const path = account.type === 'Candidate' ? `/admin/candidates/${account.id}` : 
                             account.type === 'Admin' ? `/admin/admins/${account.id}` :
                             `/admin/hr/${account.id}`;
                navigate(path);
              }}>
                <td className="p-4">
                  <input type="checkbox" className="rounded border-gray-300" />
                </td>
                <td className="px-6 py-4 text-left">
                  <div className="flex items-center gap-3">
                    <img src={`https://i.pravatar.cc/40?u=${account.id}`} alt={account.fullName} className="w-10 h-10 rounded-full" />
                    <span className="font-medium text-left">{account.fullName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-left text-gray-600">{account.email}</td>
                <td className="px-6 py-4 text-left">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    account.status === 'Active' 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-red-100 text-red-600'
                  }`}>
                    {account.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-left">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    account.type === 'HR'
                      ? 'bg-yellow-100 text-yellow-600'
                      : account.type === 'Admin'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {account.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-left">
                  <div className="flex items-center gap-2">
                    {account.status === 'Active' ? (
                      <button 
                        onClick={(e) => handleDeactivate(e, account.id, account.email)}
                        className="px-3 py-1 text-sm border border-orange-500 text-orange-500 rounded hover:bg-orange-50"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Processing...' : 'Deactivate'}
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => handleReactivate(e, account.id, account.email)}
                        className="px-3 py-1 text-sm border border-green-500 text-green-500 rounded hover:bg-green-50"
                        disabled={isLoading}
                      >
                        {isLoading ? 'Processing...' : 'Reactivate'}
                      </button>
                    )}
                    <button className="px-3 py-1 text-sm border border-blue-500 text-blue-500 rounded hover:bg-blue-50" onClick={(e) => {
                      e.stopPropagation(); 
                      const path = account.type === 'Candidate' ? `/admin/candidates/${account.id}` : 
                                   account.type === 'Admin' ? `/admin/admins/${account.id}` :
                                   `/admin/hr/${account.id}`; 
                      navigate(path);
                    }}>
                      Details
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
            {/* Previous Button */}
            <button 
              onClick={goToPreviousPage}
              disabled={!pagination?.hasPrev}
              className={`min-w-[32px] h-8 px-2 flex items-center justify-center border rounded ${
                pagination?.hasPrev 
                  ? 'border-gray-300 hover:bg-gray-50 cursor-pointer' 
                  : 'border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              &lt;
            </button>
            
            {/* Page Numbers */}
            {getPageNumbers().map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`min-w-[32px] h-8 px-2 flex items-center justify-center rounded ${
                  currentPage === page
                    ? 'bg-[#007BFF] text-white'
                    : 'border border-[#007BFF] text-[#007BFF] hover:bg-blue-50'
                }`}
              >
                {page}
              </button>
            ))}
            
            {/* Next Button */}
            <button 
              onClick={goToNextPage}
              disabled={!pagination?.hasNext}
              className={`min-w-[32px] h-8 px-2 flex items-center justify-center border rounded ${
                pagination?.hasNext 
                  ? 'border-gray-300 hover:bg-gray-50 cursor-pointer' 
                  : 'border-gray-200 text-gray-400 cursor-not-allowed'
              }`}
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