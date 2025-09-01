import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AvatarImg from '../../assets/Avatar17.png';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../common/Toast';
import authService from '../../services/authService';
import api from '../../services/api';

interface AdminHeaderDropdownProps {
  currentUser?: any;
  onLogout?: () => void;
}

// Get Admin display info with fallbacks
const getAdminDisplayInfo = (currentUser?: any) => {
  return {
    fullName: currentUser?.full_name || currentUser?.displayName || currentUser?.name || 'System Administrator',
    email: currentUser?.email || 'admin@topcv.com',
    role: currentUser?.role || 'ADMIN',
    avatar: currentUser?.photoURL || currentUser?.profile_image_url || null
  };
};

const AdminHeaderDropdown: React.FC<AdminHeaderDropdownProps> = ({ currentUser, onLogout }) => {
  const navigate = useNavigate();
  const { toastState, showToast, hideToast } = useToast();
  const adminInfo = getAdminDisplayInfo(currentUser);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Logout function
  const handleLogout = async () => {
    if (onLogout) {
      // Use the provided logout handler (from App.tsx)
      onLogout();
    } else {
      // Fallback: Complete logout process
      try {
        // Call authService logout which clears all auth data
        await authService.logout();
        
        // Additional cleanup
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
        
        showToast('Logout completed', 'info');
        navigate('/', { replace: true });
      } catch (error) {
        console.error('Logout error:', error);
        // Even if logout API fails, still clear local data
        localStorage.clear(); // Clear all localStorage as fallback
        delete api.defaults.headers.common['Authorization'];
        showToast('Logout completed', 'info');
        navigate('/', { replace: true });
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
        className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
      >
        <img 
          src={adminInfo.avatar || AvatarImg} 
          alt="Avatar" 
          className="w-10 h-10 rounded-full object-cover border border-gray-200" 
          onError={(e) => {
            (e.target as HTMLImageElement).src = AvatarImg;
          }}
        />
        <div className="text-left">
          <p className="text-sm font-semibold text-gray-800">{adminInfo.fullName}</p>
          <p className="text-xs text-gray-500">{adminInfo.email}</p>
        </div>
        <svg className={`w-4 h-4 text-gray-500 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isProfileMenuOpen && (
        <div 
          className="absolute top-full left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 animate-in fade-in slide-in-from-top-2 duration-200"
          onMouseLeave={() => setIsProfileMenuOpen(false)}
        >
          <div className="py-2">
            <div className="px-4 py-2 border-b text-left">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {adminInfo.fullName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {adminInfo.email}
              </p>
            </div>
            <button
              onClick={() => { navigate('/admin/settings'); setIsProfileMenuOpen(false); }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Settings
            </button>
            <button
              onClick={() => { handleLogout(); setIsProfileMenuOpen(false); }}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </div>
      )}
      
      {/* Toast Notification */}
      <Toast toastState={toastState} onClose={hideToast} />
    </div>
  );
};

export default AdminHeaderDropdown;