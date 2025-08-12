import { useState, useEffect } from 'react';
import { Footer } from './Footer';
import GroupUnderline from '../../assets/Group.png';
import { EnhanceResumeModal } from './EnhanceResumeModal';
import aiApi from '../../services/aiApi';
import cvApi from '../../services/cvApi';
import type { CV } from '../../services/cvApi';

interface ResumeCardData {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  isPrimary: boolean;
  createdAt: string;
  extractedData?: any;
  file?: File;
}

export const Resume: React.FC = () => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [matchScore, setMatchScore] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isEnhanceModalOpen, setIsEnhanceModalOpen] = useState(false);
  const [selectedResume, setSelectedResume] = useState<ResumeCardData | null>(null);
  
  const [cvs, setCvs] = useState<CV[]>([]);
  const [isLoadingCvs, setIsLoadingCvs] = useState(true);
  const [cvsError, setCvsError] = useState<string | null>(null);

  // States from EnhanceResume
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [extractedCvData, setExtractedCvData] = useState<any>(null);

  const fetchCVs = async () => {
    try {
      setIsLoadingCvs(true);
      setCvsError(null);
      
      // Debug: Check if user is authenticated
      const token = localStorage.getItem('token');
      console.log('Auth token exists:', !!token);
      
      const response = await cvApi.getMyCVs({ page: 1, limit: 20 });
      setCvs(response.data);
      
    } catch (err: any) {
      console.error('Fetch CVs Error:', err);
      let errorMessage = 'Failed to load CVs. ';
      
      if (err.response?.status === 401 || err.response?.data?.error?.code === 'MISSING_TOKEN') {
        errorMessage += 'Please log in to access your CVs.';
        // Optionally redirect to login after a delay
        setTimeout(() => {
          if (window.location.pathname.includes('/resume')) {
            window.location.href = '/login';
          }
        }, 3000);
      } else if (err.response?.status === 403) {
        errorMessage += 'You do not have permission to access CVs.';
      } else if (err.response?.status >= 500) {
        errorMessage += 'Server error. Please try again later.';
      } else if (err.code === 'NETWORK_ERROR' || !err.response) {
        errorMessage += 'Network error. Please check your connection and try again.';
      } else {
        errorMessage += 'Please try again later.';
      }
      
      setCvsError(errorMessage);
    } finally {
      setIsLoadingCvs(false);
    }
  };

  useEffect(() => {
    fetchCVs();
  }, []);

  const handleOpenEnhanceModal = (cv: CV) => {
    const resumeData: ResumeCardData = {
      id: cv.cv_id,
      title: cv.cv_title,
      fileName: cv.cv_file_name,
      fileSize: cv.cv_file_size || 0,
      fileType: cv.cv_file_type || 'pdf',
      isPrimary: cv.is_primary || false,
      createdAt: cv.created_at,
      extractedData: extractedCvData,
      file: uploadedFile || undefined
    };
    setSelectedResume(resumeData);
    setIsEnhanceModalOpen(true);
  };

  const handleCloseEnhanceModal = () => {
    setIsEnhanceModalOpen(false);
    setSelectedResume(null);
  };

  const handleDeleteCV = async (cvId: string) => {
    if (!confirm('Are you sure you want to delete this CV? This action cannot be undone.')) {
      return;
    }

    try {
      await cvApi.deleteCV(cvId);
      
      // Refresh CV list
      await fetchCVs();
      
      setSuggestion('CV deleted successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuggestion(null);
      }, 3000);
    } catch (error: any) {
      console.error('Delete CV error:', error);
      setError(error.response?.data?.error || error.message || 'Failed to delete CV');
    }
  };

  const handleDownloadCV = (cv: CV) => {
    // Open CV file in new tab for download
    window.open(cv.cv_file_url, '_blank');
  };

  const handleSetPrimaryCV = async (cvId: string) => {
    try {
      await cvApi.updateCV(cvId, { is_primary: true });
      
      // Refresh CV list
      await fetchCVs();
      
      setSuggestion('Primary CV updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuggestion(null);
      }, 3000);
    } catch (error: any) {
      console.error('Set primary CV error:', error);
      setError(error.response?.data?.error || error.message || 'Failed to set primary CV');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf' && file.size <= 5 * 1024 * 1024) {
      setUploadedFile(file);
      setError(null);
      // Automatically submit after a file is selected
      handleSubmit(file);
    } else {
      alert('Please select a PDF file under 5MB');
      setError('Please select a PDF file under 5MB');
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'application/pdf' && file.size <= 5 * 1024 * 1024) {
      setUploadedFile(file);
       setError(null);
      // Automatically submit after a file is dropped
      handleSubmit(file);
    } else {
      alert('Please select a PDF file under 5MB');
      setError('Please select a PDF file under 5MB');
    }
  };

  const handleSubmit = async (file: File) => {
    if (!file) {
      setError('Please select a CV file to upload.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuggestion(null);
    setExtractedCvData(null);

    try {
      // Step 1: Extract CV data using AI service (parallel with file upload)
      console.log('Starting CV processing...');
      
      let extractedData = null;
      let fileData = null;
      
      // Run AI extraction and file upload in parallel for better performance
      const [extractResponse, uploadResponse] = await Promise.allSettled([
        aiApi.extractCv(file),
        cvApi.uploadFile(file)
      ]);
      
      // Handle AI extraction result
      if (extractResponse.status === 'fulfilled') {
        try {
          extractedData = typeof extractResponse.value.data === 'string' 
            ? JSON.parse(extractResponse.value.data) 
            : extractResponse.value.data;
          setExtractedCvData(extractedData);
          console.log('CV extraction successful:', extractedData);
        } catch (parseError) {
          console.error('Error parsing extracted CV data:', parseError);
          extractedData = extractResponse.value.data;
        }
      } else {
        console.warn('CV extraction failed:', extractResponse.reason);
        // Continue without extraction data
      }
      
      // Handle file upload result
      if (uploadResponse.status === 'fulfilled') {
        fileData = uploadResponse.value;
        console.log('File upload successful:', fileData);
      } else {
        console.error('File upload failed:', uploadResponse.reason);
        throw new Error('Failed to upload CV file. Please try again.');
      }

      // Step 2: Create CV entry in the system
      const cvTitle = extractedData?.personal_info?.name 
        ? `${extractedData.personal_info.name} - CV`
        : `CV - ${new Date().toLocaleDateString()}`;
        
      const cvData = {
        cv_title: cvTitle,
        cv_file_url: fileData.data.url,
        cv_file_name: fileData.data.fileName,
        cv_file_size: fileData.data.fileSize,
        cv_file_type: fileData.data.fileType,
        is_primary: cvs.length === 0 // Set as primary if it's the first CV
      };

      console.log('Creating CV entry:', cvData);
      await cvApi.createCV(cvData);
      
      // Step 3: Refresh CV list
      await fetchCVs();
      
      // Success message
      let successMessage = 'CV uploaded successfully! ';
      
      if (extractedData) {
        successMessage += `\n\nKey information extracted:
- Name: ${extractedData?.personal_info?.name || 'N/A'}
- Email: ${extractedData?.personal_info?.email || 'N/A'}
- Phone: ${extractedData?.personal_info?.phone || 'N/A'}
- Skills: ${extractedData?.skills?.length ? extractedData.skills.slice(0, 3).join(', ') + (extractedData.skills.length > 3 ? '...' : '') : 'N/A'}

Your CV is now ready for enhancement. Click "Enhance CV" to get AI-powered improvement suggestions.`;
      } else {
        successMessage += '\n\nYour CV has been uploaded and is available in your CV list. AI extraction was not available, but you can still use the enhancement features.';
      }
      
      setSuggestion(successMessage);

    } catch (err: any) {
      console.error('CV processing error:', err);
      let errorMessage = 'An error occurred while processing the CV.';
      
      if (err.response?.status === 401 || err.response?.data?.error?.code === 'MISSING_TOKEN') {
        errorMessage = 'Authentication required. Please log in again.';
        setTimeout(() => {
          if (window.location.pathname.includes('/resume')) {
            window.location.href = '/login';
          }
        }, 3000);
      } else if (err.response?.status === 403) {
        errorMessage = 'You do not have permission to upload CVs.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const CVCard = ({ cv }: { cv: CV }) => {
    const [showActions, setShowActions] = useState(false);

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString();
    };

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:border-[#007BFF]/30 transition-all duration-200 group text-left">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{cv.cv_title}</h3>
              <p className="text-sm text-gray-500">{cv.cv_file_name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {cv.is_primary && (
              <span className="text-[#007BFF] text-xs bg-blue-100 px-2 py-1 rounded-full font-medium">
                Primary
              </span>
            )}
            <div className="relative">
              <button 
                onClick={() => setShowActions(!showActions)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              
              {showActions && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                  <button
                    onClick={() => {
                      handleDownloadCV(cv);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                  </button>
                  
                  {!cv.is_primary && (
                    <button
                      onClick={() => {
                        handleSetPrimaryCV(cv.cv_id);
                        setShowActions(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      Set as Primary
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      handleDeleteCV(cv.cv_id);
                      setShowActions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-red-50 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-4 space-y-1">
          <p>File size: {formatFileSize(cv.cv_file_size || 0)}</p>
          <p>Type: {cv.cv_file_type?.toUpperCase() || 'PDF'}</p>
          <p>Uploaded: {formatDate(cv.created_at)}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 text-xs rounded-full font-medium bg-green-100 text-green-700">
              Active
            </span>
          </div>
          
          <button 
            onClick={() => handleOpenEnhanceModal(cv)}
            className="bg-[#007BFF] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0056b3] transition-colors flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Enhance CV
          </button>
        </div>
        
        {/* Close dropdown when clicking outside */}
        {showActions && (
          <div 
            className="fixed inset-0 z-0" 
            onClick={() => setShowActions(false)}
          />
        )}
      </div>
    );
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
            {/* Title */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Build your <span className="text-[#007BFF] relative inline-block">
                  dream resume
                  <img 
                    src={GroupUnderline} 
                    alt="underline" 
                    className="absolute -bottom-6 left-0 w-full h-6 object-contain transform scale-125"
                  />
                </span>
              </h1>
              <p className="text-gray-600 mt-4">
                Custom the dream resumes you dream work for
              </p>
            </div>

            {/* Search Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 mb-6">
              <div className="flex flex-col md:flex-row gap-2">
                <div className="flex-1 flex items-center px-4 py-3">
                  <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    placeholder="Resume name or keyword"
                    className="flex-1 outline-none text-gray-700 placeholder-gray-400"
                  />
                </div>
                <div className="w-px bg-gray-200 hidden md:block"></div>
                <div className="flex-1 flex items-center px-4 py-3">
                  <svg className="w-5 h-5 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <input
                    type="text"
                    value={matchScore}
                    onChange={(e) => setMatchScore(e.target.value)}
                    placeholder="Match score"
                    className="flex-1 outline-none text-gray-700 placeholder-gray-400"
                  />
                </div>
                <button className="bg-[#007BFF] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#0056b3] transition-colors">
                  Search
                </button>
              </div>
            </div>

            {/* Popular Suggestions */}
            <div className="text-left text-sm text-gray-600">
              <span className="mr-2">Popular:</span>
              <span className="text-gray-800">Twitter, Microsoft, Apple, Facebook</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-left">
          {/* All Your Resumes Section */}
          <div className="mb-16">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">All Your Resumes</h2>
              <p className="text-gray-600">
                Based on your profile, company preferences, and recent activity
              </p>
            </div>

            {isLoadingCvs ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#007BFF] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your CVs...</p>
              </div>
            ) : cvsError ? (
              <div className="text-center text-red-500 py-8">
                <svg className="w-12 h-12 mx-auto mb-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-lg font-medium mb-2">Failed to load CVs</p>
                <p className="text-gray-600 mb-4">{cvsError}</p>
                <div className="space-x-3">
                  {cvsError.includes('log in') ? (
                    <button 
                      onClick={() => window.location.href = '/login'}
                      className="px-4 py-2 bg-[#007BFF] text-white rounded-lg hover:bg-[#0056b3] font-medium"
                    >
                      Go to Login
                    </button>
                  ) : (
                    <button 
                      onClick={fetchCVs}
                      disabled={isLoadingCvs}
                      className="px-4 py-2 bg-[#007BFF] text-white rounded-lg hover:bg-[#0056b3] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoadingCvs ? 'Loading...' : 'Try again'}
                    </button>
                  )}
                </div>
              </div>
            ) : cvs.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-medium text-gray-700 mb-2">No CVs found</p>
                <p className="text-gray-500">Upload your first CV using the section below to get started.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cvs.map((cv) => (
                  <CVCard key={cv.cv_id} cv={cv} />
                ))}
              </div>
            )}
          </div>

          {/* Add Your Resumes Section */}
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Add Your Resumes</h2>
              <p className="text-gray-600">
                Based on your profile, company preferences, and recent activity
              </p>
            </div>

            <div 
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#007BFF]/40 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <div className="mx-auto w-16 h-16 bg-[#007BFF]/10 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[#007BFF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              
              {isLoading ? (
                <div>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007BFF] mx-auto mb-2"></div>
                  <p className="text-gray-600 font-medium mb-2">Processing CV...</p>
                  <p className="text-gray-500 text-sm">Extracting information and uploading...</p>
                </div>
              ) : uploadedFile ? (
                <div>
                  <p className="text-green-600 font-medium mb-2">
                    File processed successfully!
                  </p>
                  <p className="text-gray-600 text-sm">
                    {uploadedFile.name} ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-gray-600 font-medium mb-2">
                    Click to replace or drag and drop
                  </p>
                  <p className="text-gray-500 text-sm">
                    A file pdf max size 5MB
                  </p>
                </div>
              )}
              {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
              
              <input
                id="file-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
            {suggestion && (
                <div className="mt-10 p-6 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-green-800 mb-2">Success!</h3>
                          <button
                            onClick={() => setSuggestion(null)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="text-green-700 whitespace-pre-wrap text-sm">{suggestion}</div>
                      </div>
                    </div>
                </div>
            )}
            
            {error && (
                <div className="mt-10 p-6 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.98-.833-2.75 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-red-800 mb-2">Error</h3>
                          <button
                            onClick={() => setError(null)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <div className="text-red-700 text-sm">{error}</div>
                      </div>
                    </div>
                </div>
            )}
          </div>
        </div>
      </div>
      
      <Footer />

      {selectedResume && (
        <EnhanceResumeModal
          isOpen={isEnhanceModalOpen}
          onClose={handleCloseEnhanceModal}
          resume={selectedResume}
        />
      )}
    </>
  );
};

export default Resume;
