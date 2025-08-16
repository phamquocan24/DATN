// Utility function to get admin user info from props or localStorage
export const getAdminUserInfo = (currentUser?: any) => {
  // First try to use passed currentUser prop
  if (currentUser) {
    return currentUser;
  }

  // Fallback to localStorage
  try {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const user = JSON.parse(savedUser);

      return user;
    }
  } catch (error) {
    console.error('Error parsing saved user from localStorage in adminUserInfo:', error);
  }

  return null;
};

// Get user display info with fallbacks
export const getAdminDisplayInfo = (currentUser?: any) => {
  const userInfo = getAdminUserInfo(currentUser);
  
  return {
    fullName: userInfo?.full_name || userInfo?.displayName || userInfo?.name || 'System Administrator',
    email: userInfo?.email || 'admin@topcv.com',
    role: userInfo?.role || 'ADMIN', // Keep for internal use
    avatar: userInfo?.photoURL || userInfo?.profile_image_url || null
  };
};