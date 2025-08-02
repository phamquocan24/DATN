import apiClient from './api';

// Schedule API Service
export const scheduleApi = {
  // Get calendar events
  getEvents: async (startDate?: string, endDate?: string, type?: string) => {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (type) params.type = type;
    
    const response = await apiClient.get('/schedule/events', { params });
    return response.data;
  },

  // Create new event
  createEvent: async (eventData: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    type: 'interview' | 'meeting' | 'deadline' | 'other';
    participants?: string[];
    location?: string;
    isOnline?: boolean;
    meetingLink?: string;
    applicationId?: string;
    jobId?: string;
  }) => {
    const response = await apiClient.post('/schedule/events', eventData);
    return response.data;
  },

  // Update event
  updateEvent: async (eventId: string, eventData: any) => {
    const response = await apiClient.put(`/schedule/events/${eventId}`, eventData);
    return response.data;
  },

  // Delete event
  deleteEvent: async (eventId: string) => {
    const response = await apiClient.delete(`/schedule/events/${eventId}`);
    return response.data;
  },

  // Get event by ID
  getEvent: async (eventId: string) => {
    const response = await apiClient.get(`/schedule/events/${eventId}`);
    return response.data;
  },

  // Schedule interview
  scheduleInterview: async (interviewData: {
    applicationId: string;
    startTime: string;
    endTime: string;
    type: 'phone' | 'video' | 'in-person';
    interviewers: string[];
    location?: string;
    meetingLink?: string;
    notes?: string;
  }) => {
    const response = await apiClient.post('/schedule/interviews', interviewData);
    return response.data;
  },

  // Get interviews
  getInterviews: async (filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    applicationId?: string;
  }) => {
    const response = await apiClient.get('/schedule/interviews', { params: filters });
    return response.data;
  },

  // Update interview status
  updateInterviewStatus: async (interviewId: string, status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled', notes?: string) => {
    const response = await apiClient.put(`/schedule/interviews/${interviewId}/status`, { status, notes });
    return response.data;
  },

  // Reschedule interview
  rescheduleInterview: async (interviewId: string, newStartTime: string, newEndTime: string, reason?: string) => {
    const response = await apiClient.put(`/schedule/interviews/${interviewId}/reschedule`, {
      newStartTime,
      newEndTime,
      reason
    });
    return response.data;
  },

  // Get available time slots
  getAvailableSlots: async (participantIds: string[], date: string, duration = 60) => {
    const response = await apiClient.get('/schedule/available-slots', {
      params: { participantIds: participantIds.join(','), date, duration }
    });
    return response.data;
  },

  // Set availability
  setAvailability: async (availabilityData: {
    date: string;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
    recurring?: 'daily' | 'weekly' | 'none';
  }) => {
    const response = await apiClient.post('/schedule/availability', availabilityData);
    return response.data;
  },

  // Get my availability
  getMyAvailability: async (startDate?: string, endDate?: string) => {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await apiClient.get('/schedule/my-availability', { params });
    return response.data;
  },

  // Send calendar invite
  sendCalendarInvite: async (eventId: string, emails: string[]) => {
    const response = await apiClient.post(`/schedule/events/${eventId}/invite`, { emails });
    return response.data;
  },

  // Get upcoming events
  getUpcomingEvents: async (limit = 10) => {
    const response = await apiClient.get('/schedule/upcoming', { params: { limit } });
    return response.data;
  },

  // Mark event as attended
  markAttended: async (eventId: string, attended: boolean, notes?: string) => {
    const response = await apiClient.put(`/schedule/events/${eventId}/attendance`, { attended, notes });
    return response.data;
  }
};

export default scheduleApi; 