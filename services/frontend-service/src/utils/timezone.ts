/**
 * Timezone utilities for Vietnam Standard Time (UTC+7)
 */

// Set default timezone for the application
export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Format date to Vietnam timezone
 */
export const formatToVietnamTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleString('vi-VN', {
    timeZone: VIETNAM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

/**
 * Format date to Vietnam date only
 */
export const formatToVietnamDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('vi-VN', {
    timeZone: VIETNAM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * Format date to Vietnam time only
 */
export const formatToVietnamTimeOnly = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleTimeString('vi-VN', {
    timeZone: VIETNAM_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * Get current time in Vietnam timezone
 */
export const getCurrentVietnamTime = (): Date => {
  return new Date(new Date().toLocaleString("en-US", {timeZone: VIETNAM_TIMEZONE}));
};

/**
 * Convert UTC date to Vietnam timezone
 */
export const utcToVietnam = (utcDate: Date | string): Date => {
  const dateObj = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return new Date(dateObj.toLocaleString("en-US", {timeZone: VIETNAM_TIMEZONE}));
};

/**
 * Format relative time in Vietnamese
 */
export const formatRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = getCurrentVietnamTime();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Vừa xong';
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  
  return formatToVietnamDate(dateObj);
};

/**
 * Check if date is today in Vietnam timezone
 */
export const isToday = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = getCurrentVietnamTime();
  
  return dateObj.toDateString() === today.toDateString();
};

/**
 * Format for datetime-local input (Vietnam timezone)
 */
export const formatForDateTimeInput = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const vietnamDate = utcToVietnam(dateObj);
  
  const year = vietnamDate.getFullYear();
  const month = String(vietnamDate.getMonth() + 1).padStart(2, '0');
  const day = String(vietnamDate.getDate()).padStart(2, '0');
  const hours = String(vietnamDate.getHours()).padStart(2, '0');
  const minutes = String(vietnamDate.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Parse datetime-local input to UTC (from Vietnam timezone)
 */
export const parseDateTimeInput = (dateTimeString: string): Date => {
  // Assume input is in Vietnam timezone, convert to UTC
  const localDate = new Date(dateTimeString);
  const utcTime = localDate.getTime() - (7 * 60 * 60 * 1000); // Subtract 7 hours
  return new Date(utcTime);
};
