import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import UserIcon from '../../assets/user-outlined.png';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../common/Toast';
import authService from '../../services/authService';
import api from '../../services/api';

interface HrHeaderDropdownProps {
  currentUser?: any;
  onLogout?: () => void;
}

// Get HR display info with fallbacks
const getHrDisplayInfo = (currentUser?: any) => {
  return {
    fullName: currentUser?.full_name || currentUser?.displayName || currentUser?.name || 'HR Manager',
    email: currentUser?.email || 'hr@topcv.com',
    role: currentUser?.role || 'RECRUITER',
    avatar: currentUser?.photoURL || currentUser?.profile_image_url || null
  };
};

const HrHeaderDropdown: React.FC<HrHeaderDropdownProps> = ({ currentUser, onLogout }) => {
  const navigate = useNavigate();
  const { toastState, showToast, hideToast } = useToast();
  const hrInfo = getHrDisplayInfo(currentUser);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Logout function
  const handleLogout = () => {
    if (onLogout) {
      // Use the provided logout handler (from App.tsx)
      onLogout();
    } else {
      // Fallback: Clear local state and storage immediately
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
      
      // Call logout API in background
      authService.logout().catch(error => {
        showToast('Logout completed', 'info');
      });
      
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
        className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
      >
        <div className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-200">
          {hrInfo.avatar ? (
            <img 
              src={hrInfo.avatar} 
              alt="Avatar" 
              className="w-full h-full rounded-full object-cover" 
              onError={(e) => {
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = `<img src="${UserIcon}" alt="HR" class="w-6 h-6" />`;
                }
              }}
            />
          ) : (
            <img src={UserIcon} alt="HR" className="w-6 h-6" />
          )}
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-gray-800">{hrInfo.fullName}</p>
          <p className="text-xs text-gray-500">{hrInfo.email}</p>
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
                {hrInfo.fullName}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {hrInfo.email}
              </p>
            </div>
            <button
              onClick={() => { navigate('/hr/settings'); setIsProfileMenuOpen(false); }}
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

export default HrHeaderDropdown;