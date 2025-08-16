import React, { useState, useEffect } from 'react';
import { CVExtractResponse } from '../../services/cvApi';
import candidateApi from '../../services/candidateApi';

interface ProfileSuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  extractedData: CVExtractResponse;
  onApplyChanges: (selectedFields: string[]) => void;
}

interface SuggestionItem {
  field: string;
  currentValue: string;
  suggestedValue: string;
  reason: string;
  selected: boolean;
}

export const ProfileSuggestionsModal: React.FC<ProfileSuggestionsModalProps> = ({
  isOpen,
  onClose,
  extractedData,
  onApplyChanges
}) => {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentProfile, setCurrentProfile] = useState<any>(null);

  useEffect(() => {
    if (isOpen && extractedData) {
      loadProfileAndGenerateSuggestions();
    }
  }, [isOpen, extractedData]);

  const loadProfileAndGenerateSuggestions = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get current profile
      const profileResponse = await candidateApi.getProfile();
      let profile = null;
      
      if (profileResponse?.success && profileResponse?.data) {
        profile = profileResponse.data;
      } else if (profileResponse?.data) {
        profile = profileResponse.data;
      }
      
      setCurrentProfile(profile);
      
      // Generate suggestions by comparing CV data with current profile
      const generatedSuggestions = generateSuggestions(extractedData, profile);
      setSuggestions(generatedSuggestions);
      
    } catch (err: any) {
      console.error('Failed to load profile for suggestions:', err);
      setError('Failed to load current profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSuggestions = (cvData: CVExtractResponse, profile: any): SuggestionItem[] => {
    const suggestions: SuggestionItem[] = [];

    // Check full name
    if (cvData.full_name && cvData.full_name !== profile?.full_name) {
      suggestions.push({
        field: 'full_name',
        currentValue: profile?.full_name || 'Not set',
        suggestedValue: cvData.full_name,
        reason: 'Update your name from CV',
        selected: true
      });
    }

    // Check phone
    if (cvData.phone && cvData.phone !== profile?.phone) {
      suggestions.push({
        field: 'phone',
        currentValue: profile?.phone || 'Not set',
        suggestedValue: cvData.phone,
        reason: 'Update your phone number from CV',
        selected: true
      });
    }

    // Check bio/objective
    if (cvData.objective && (!profile?.bio || profile.bio.length < cvData.objective.length)) {
      suggestions.push({
        field: 'bio',
        currentValue: profile?.bio || 'Not set',
        suggestedValue: cvData.objective,
        reason: 'Update your bio with career objective from CV',
        selected: true
      });
    }

    // Check current job title
    if (cvData.experience && cvData.experience.length > 0) {
      const latestJob = cvData.experience.sort((a, b) => 
        new Date(b.end_date || '9999-12-31').getTime() - new Date(a.end_date || '9999-12-31').getTime()
      )[0];
      
      if (latestJob.position && latestJob.position !== profile?.candidate_profile?.current_job_title) {
        suggestions.push({
          field: 'current_job_title',
          currentValue: profile?.candidate_profile?.current_job_title || 'Not set',
          suggestedValue: latestJob.position,
          reason: 'Update current job title from latest experience in CV',
          selected: true
        });
      }

      if (latestJob.company && latestJob.company !== profile?.candidate_profile?.current_company) {
        suggestions.push({
          field: 'current_company',
          currentValue: profile?.candidate_profile?.current_company || 'Not set',
          suggestedValue: latestJob.company,
          reason: 'Update current company from latest experience in CV',
          selected: true
        });
      }
    }

    // Check education level
    if (cvData.education && cvData.education.length > 0) {
      const highestEducation = cvData.education.reduce((highest, current) => {
        const educationLevels = ['High School', 'Associate', 'Bachelor', 'Master', 'PhD', 'Doctorate'];
        const currentLevel = educationLevels.findIndex(level => 
          current.degree.toLowerCase().includes(level.toLowerCase())
        );
        const highestLevel = educationLevels.findIndex(level => 
          highest.degree.toLowerCase().includes(level.toLowerCase())
        );
        return currentLevel > highestLevel ? current : highest;
      });

      if (highestEducation.degree && highestEducation.degree !== profile?.candidate_profile?.education_level) {
        suggestions.push({
          field: 'education_level',
          currentValue: profile?.candidate_profile?.education_level || 'Not set',
          suggestedValue: highestEducation.degree,
          reason: 'Update education level from highest degree in CV',
          selected: true
        });
      }
    }

    // Check years of experience
    if (cvData.experience && cvData.experience.length > 0) {
      const experienceYears = calculateExperienceYears(cvData.experience);
      if (experienceYears !== profile?.candidate_profile?.years_experience) {
        suggestions.push({
          field: 'years_experience',
          currentValue: profile?.candidate_profile?.years_experience?.toString() || 'Not set',
          suggestedValue: experienceYears.toString(),
          reason: 'Update years of experience calculated from CV work history',
          selected: true
        });
      }
    }

    return suggestions;
  };

  const calculateExperienceYears = (experiences: any[]): number => {
    let totalMonths = 0;
    
    experiences.forEach(exp => {
      const startDate = new Date(exp.start_date);
      const endDate = exp.end_date && exp.end_date.toLowerCase() !== 'present' 
        ? new Date(exp.end_date) 
        : new Date();
      
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                      (endDate.getMonth() - startDate.getMonth());
        totalMonths += Math.max(0, months);
      }
    });
    
    return Math.round(totalMonths / 12);
  };

  const toggleSuggestion = (index: number) => {
    setSuggestions(prev => 
      prev.map((suggestion, i) => 
        i === index ? { ...suggestion, selected: !suggestion.selected } : suggestion
      )
    );
  };

  const handleApplyChanges = () => {
    const selectedFields = suggestions
      .filter(suggestion => suggestion.selected)
      .map(suggestion => suggestion.field);
    
    onApplyChanges(selectedFields);
  };

  const getSelectedSuggestions = () => suggestions.filter(s => s.selected);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Profile Update Suggestions</h2>
            <p className="text-gray-600 text-sm">Review suggestions to update your profile based on CV data</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <svg className="animate-spin -ml-1 mr-3 h-10 w-10 text-[#007BFF] mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-lg font-medium text-gray-600">Analyzing CV data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">Error Loading Suggestions</p>
              <p className="text-gray-600">{error}</p>
              <button
                onClick={loadProfileAndGenerateSuggestions}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-green-500 mb-4">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">Your Profile is Up to Date!</p>
              <p className="text-gray-600">No updates needed based on your CV data.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  Found {suggestions.length} suggestion{suggestions.length > 1 ? 's' : ''} to improve your profile.
                  Select the ones you want to apply:
                </p>
              </div>

              {suggestions.map((suggestion, index) => (
                <div 
                  key={index}
                  className={`border rounded-lg p-4 transition-all ${
                    suggestion.selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={suggestion.selected}
                      onChange={() => toggleSuggestion(index)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-900">
                          {suggestion.field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </h3>
                        <span className="text-xs text-gray-500">{suggestion.reason}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Current</label>
                          <div className="p-2 bg-gray-100 rounded text-sm text-gray-700">
                            {suggestion.currentValue || 'Not set'}
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">Suggested</label>
                          <div className="p-2 bg-green-100 border border-green-200 rounded text-sm text-gray-700">
                            {suggestion.suggestedValue}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {suggestions.length > 0 && !isLoading && !error && (
          <div className="flex justify-between items-center p-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {getSelectedSuggestions().length} of {suggestions.length} suggestions selected
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyChanges}
                disabled={getSelectedSuggestions().length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Apply {getSelectedSuggestions().length} Changes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSuggestionsModal;
