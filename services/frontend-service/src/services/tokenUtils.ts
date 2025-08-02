// Token utility functions
export interface DecodedToken {
  user_id: string;
  email: string;
  role: string;
  full_name?: string;
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

// Clear all auth-related data from localStorage
export function clearAuthData(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('refreshToken');
} 