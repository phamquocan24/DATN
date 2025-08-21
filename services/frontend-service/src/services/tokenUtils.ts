// Token utility functions
export interface DecodedToken {
  user_id: string;
  email: string;
  role: string;
  full_name?: string;
  candidate_profile_id?: string;
  company_id?: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

// Decode JWT token without verification (client-side only)
export function decodeToken(token: string): DecodedToken | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload));
    return decoded as DecodedToken;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

// Check if token is expired
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded) {
    return true;
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
}

// Check if token is valid (exists and not expired)
export function isTokenValid(token: string | null): boolean {
  if (!token) {
    return false;
  }
  
  return !isTokenExpired(token);
}

// Get time until token expires (in seconds)
export function getTokenTimeToExpiry(token: string): number {
  const decoded = decodeToken(token);
  if (!decoded) {
    return 0;
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  return Math.max(0, decoded.exp - currentTime);
}

// Get candidate profile ID from token
export function getCandidateProfileId(): string | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  
  const decoded = decodeToken(token);
  return decoded?.candidate_profile_id || null;
}

// Get company ID from token or user data
export function getCompanyId(): string | null {
  // First try to get from token
  const token = localStorage.getItem('token');
  if (token) {
    const decoded = decodeToken(token);
    if (decoded?.company_id) {
      return decoded.company_id;
    }
  }
  
  // Fallback: try to get from user data in localStorage
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      // Check various possible fields where company_id might be stored
      return user?.company_id || 
             user?.recruiter_profile?.company_id || 
             user?.profile?.company_id ||
             null;
    }
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
  }
  
  return null;
}

// Clear all auth-related data from localStorage
export function clearAuthData(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('refreshToken');
} 