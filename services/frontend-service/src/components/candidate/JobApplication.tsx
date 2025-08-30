import { useState, useEffect } from 'react';
import candidateApi from '../../services/candidateApi';

interface JobApplicationProps {
  isOpen: boolean;
  onClose: () => void;
  onResumeClick?: () => void;
  job: {
    job_id: string; // Primary ID (UUID from database)
    id?: number | string; // Fallback for legacy data
    title: string;
    company: string;
    location: string;
    type: string;
    logo: string;
    logoColor: string;
  };
}

export const JobApplication: React.FC<JobApplicationProps> = ({ isOpen, onClose, onResumeClick, job }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    coverLetter: '',
    resumeFile: null as File | null
  });

  const [characterCount, setCharacterCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [availableCVs, setAvailableCVs] = useState<any[]>([]);
  const [selectedCVId, setSelectedCVId] = useState<string>('');
  const [loadingCVs, setLoadingCVs] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const maxCharacters = 500;

  // Load available CVs and user profile when component opens
  useEffect(() => {
    if (isOpen) {
      loadAvailableCVs();
      loadUserProfile();
    }
  }, [isOpen]);

  const loadAvailableCVs = async () => {
    setLoadingCVs(true);
    try {
      const response = await candidateApi.getMyCVs();
      if (response.success && response.data) {
        setAvailableCVs(response.data);
      }
    } catch (error) {
      console.error('Error loading CVs:', error);
      // Don't show error for CV loading failure
    } finally {
      setLoadingCVs(false);
    }
  };

  const loadUserProfile = async () => {
    setLoadingProfile(true);
    try {
      const response = await candidateApi.getProfile();
      if (response.success && response.data) {
        const profile = response.data;
        // Auto-populate form fields with profile data
        setFormData(prev => ({
          ...prev,
          fullName: profile.full_name || prev.fullName,
          email: profile.email || prev.email,
          phone: profile.phone || profile.phone_number || prev.phone,
        }));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Don't show error to user, just continue without auto-fill
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'coverLetter') {
      if (value.length <= maxCharacters) {
        setFormData(prev => ({ ...prev, [field]: value }));
        setCharacterCount(value.length);
      }
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Get the correct job ID - prioritize job_id, fallback to id
      console.log('=== DEBUG JobApplication Submit ===');
      console.log('Job object:', job);
      console.log('job.job_id:', job.job_id);
      console.log('job.id:', job.id);
      
      const jobId = job.job_id || (job.id ? job.id.toString() : null);
      console.log('Final jobId:', jobId);
      
      if (!jobId) {
        setSubmitError('Invalid job ID - no valid ID found in job object');
        console.error('Job object:', job);
        return;
      }
      
      // Get AI match score if CV is selected
      let aiMatchScore = null;
      if (selectedCVId) {
        try {
          const matchResponse = await candidateApi.calculateMatchScore(selectedCVId, jobId);
          if (matchResponse.success && matchResponse.data) {
            aiMatchScore = matchResponse.data.match_score;
          }
        } catch (error) {
          console.warn('Failed to calculate AI match score:', error);
          // Continue without AI match score
        }
      }

      // Prepare application data according to business-service API
      const applicationData = {
        job_id: jobId,
        cv_id: selectedCVId || undefined,
        cover_letter: formData.coverLetter || undefined,
        ai_match_score: aiMatchScore,
        source: 'DIRECT' as const
      };

      console.log('Submitting application:', applicationData);

      // Submit application using the API
      const response = await candidateApi.createApplication(applicationData);
      
      if (response.success) {
        alert('Application submitted successfully!');
        onClose();
        
        // Reset form
        setFormData({
          fullName: '',
          email: '',
          phone: '',
          coverLetter: '',
          resumeFile: null
        });
        setSelectedCVId('');
        setCharacterCount(0);
      } else {
        setSubmitError(response.message || 'Failed to submit application');
      }
    } catch (error: any) {
      console.error('Error submitting application:', error);
      
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already applied')) {
        setSubmitError('You have already applied for this job');
      } else if (error.response?.status === 401) {
        setSubmitError('Please log in to submit an application');
      } else {
        setSubmitError(error.response?.data?.message || 'Failed to submit application. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
          <div className="bg-white px-6 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${job.logoColor}`}>
                  {job.logo}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                  <p className="text-sm text-gray-500">{job.company} • {job.location} • {job.type}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Submit your application</h4>
                <p className="text-sm text-gray-600 mb-6">
                  The following is required and will only be shared with {job.company}
                </p>
                
                {/* Error Display */}
                {submitError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-800">{submitError}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Full name
                </label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder={loadingProfile ? "Loading profile..." : "Enter your fullname"}
                  disabled={loadingProfile}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#007BFF] focus:border-[#007BFF] disabled:bg-gray-50"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder={loadingProfile ? "Loading profile..." : "Enter your email address"}
                  disabled={loadingProfile}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#007BFF] focus:border-[#007BFF] disabled:bg-gray-50"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone number
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder={loadingProfile ? "Loading profile..." : "Enter your phone number"}
                  disabled={loadingProfile}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#007BFF] focus:border-[#007BFF] disabled:bg-gray-50"
                />
              </div>

              {/* Cover Letter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Letter (Optional)
                </label>
                <div className="relative">
                  <textarea
                    value={formData.coverLetter}
                    onChange={(e) => handleInputChange('coverLetter', e.target.value)}
                    placeholder="Add a cover letter to enhance your application"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#007BFF] focus:border-[#007BFF] resize-none"
                  />
                  
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Maximum {maxCharacters} characters</span>
                    <span>{characterCount} / {maxCharacters}</span>
                  </div>
                </div>
              </div>

              {/* CV Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select CV (Optional)
                </label>
                <p className="text-sm text-gray-600 mb-3">Choose from your uploaded CVs</p>
                
                {loadingCVs ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50">
                    <span className="text-gray-500">Loading CVs...</span>
                  </div>
                ) : availableCVs.length > 0 ? (
                  <select
                    value={selectedCVId}
                    onChange={(e) => setSelectedCVId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#007BFF] focus:border-[#007BFF]"
                  >
                    <option value="">No CV selected</option>
                    {availableCVs.map((cv) => (
                      <option key={cv.cv_id || cv.id} value={cv.cv_id || cv.id}>
                        {cv.original_name || cv.name || cv.file_name || `CV ${cv.cv_id || cv.id}`}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-yellow-50 border-yellow-200">
                    <div className="flex items-center text-yellow-800">
                      <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">No CVs available</span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      You need to upload a CV first before applying to jobs.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        if (onResumeClick) {
                          onResumeClick();
                          onClose();
                        } else {
                          window.open('/resume', '_blank');
                        }
                      }}
                      className="mt-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded text-sm transition-colors"
                    >
                      Go to Resume
                    </button>
                  </div>
                )}
                

              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#007BFF] text-white py-3 px-4 rounded-lg font-medium hover:bg-[#0056b3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>

              {/* Terms */}
              <div className="text-xs text-gray-500 text-center">
                By sending the request you can confirm that you accept our{' '}
                <a href="#" className="text-[#007BFF] hover:text-[#007BFF]">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-[#007BFF] hover:text-[#007BFF]">Privacy Policy</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobApplication; 